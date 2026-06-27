const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { User, AuditLog } = require('../models');
const { validatePassword } = require('../middleware/security/password.validator');
const notificationService = require('./notification.service');
const emailService = require('./email.service');

const createToken = (userId) => jwt.sign({ userId }, config.jwtSecret, { expiresIn: config.jwtExpiresIn, algorithm: 'HS256' });
const createRefreshToken = (userId) => jwt.sign({ userId }, config.jwtSecret, { expiresIn: config.refreshTokenExpiresIn, algorithm: 'HS256' });

const { normalizeCambodiaPhone, phoneSearchVariants } = require('../utils/phone');

const loginOtpEnabled = typeof process.env.LOGIN_OTP_ENABLED !== 'undefined'
  ? process.env.LOGIN_OTP_ENABLED === 'true'
  : (process.env.NODE_ENV !== 'production');
const phoneOtpEnabled = (process.env.PHONE_OTP_ENABLED === 'true') && !!process.env.SMS_PROVIDER;

const normalizeIdentifier = (identifier) => identifier?.toString().trim().toLowerCase();
const findUserByIdentifier = async (identifier) => {
  if (!identifier) return null;
  const normalized = normalizeIdentifier(identifier);
  if (normalized.includes('@')) {
    return User.findOne({ email: normalized });
  }

  // Treat as phone identifier: search by multiple variants for backward compatibility
  const variants = phoneSearchVariants(identifier);
  if (variants.length === 0) return null;
  const or = variants.map((p) => ({ phoneNumber: p }));
  return User.findOne({ $or: or });
};

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const sendEmailVerificationCodeEmail = async (user, code) => {
  const message = `Welcome to Konpuk! Your email verification code is ${code}. It expires in 5 minutes. Do not share this code with anyone.`;
  await emailService.sendEmail({
    to: user.email,
    subject: 'Konpuk email verification code',
    text: message,
    html: `<p>${message}</p>`
  });
};

const sendLoginOtpEmail = async (user, code) => {
  if (!user.email) {
    const error = new Error('Email is not configured for this account.');
    error.statusCode = 400;
    throw error;
  }
  const message = `Your Konpuk login verification code is ${code}. It expires in 5 minutes. Do not share this code with anyone.`;
  await emailService.sendEmail({
    to: user.email,
    subject: 'Konpuk login verification code',
    text: message,
    html: `<p>${message}</p>`
  });
};

const sendLoginOtpNotification = async (user, code) => {
  if (user.email) {
    return sendLoginOtpEmail(user, code);
  }
  if (user.phoneNumber && phoneOtpEnabled) {
    const smsService = require('./sms.service');
    const message = `Your Konpuk login verification code is ${code}. It expires in 5 minutes. Do not share this code with anyone.`;
    await smsService.sendSms(user.phoneNumber, message);
    return;
  }
  const error = new Error('No contact method available for login verification.');
  error.statusCode = 400;
  throw error;
};

const registerUser = async ({ email, password, displayName, phoneNumber, location }) => {
  const normalizedEmail = email?.trim() ? normalizeIdentifier(email) : undefined;
  if (normalizedEmail) {
    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) {
      const error = new Error('Email already registered');
      error.statusCode = 409;
      throw error;
    }
  }

  const normalizedPhone = phoneNumber ? normalizeCambodiaPhone(phoneNumber) : undefined;
  if (!normalizedPhone) {
    const error = new Error('Phone number is required');
    error.statusCode = 400;
    throw error;
  }

  const existingPhone = await User.findOne({ phoneNumber: normalizedPhone });
  if (existingPhone) {
    const error = new Error('Phone number already registered');
    error.statusCode = 409;
    throw error;
  }

  if (!validatePassword(password)) {
    const error = new Error('Password must be at least 8 characters');
    error.statusCode = 400;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const normalizedDisplayName = displayName?.trim() || normalizedPhone;
  const userData = {
    passwordHash,
    displayName: normalizedDisplayName,
    phoneNumber: normalizedPhone,
    location,
    role: 'seller',
    emailVerified: false,
    phoneVerified: false,
    sellerVerificationStatus: 'unverified'
  };
  if (normalizedEmail) {
    userData.email = normalizedEmail;
  }
  const user = await User.create(userData);

  if (normalizedEmail) {
    const now = new Date();
    const otp = generateOtp();
    user.emailVerificationHash = await bcrypt.hash(otp, 12);
    user.emailVerificationExpiresAt = new Date(now.getTime() + 5 * 60 * 1000);
    user.emailVerificationRequestedAt = now;
    user.emailVerificationAttempts = 0;
    await user.save();

    await sendEmailVerificationCodeEmail(user, otp);

    return {
      requiresEmailVerification: true,
      identifier: user.email,
      expiresIn: 300,
      resendCooldownSeconds: 60
    };
  }

  const accessToken = createToken(user.id);
  const refreshToken = createRefreshToken(user.id);
  user.refreshTokens.push(refreshToken);
  user.lastLoginAt = new Date();
  await user.save();

  // Audit admin OTP login
  try {
    if (user.role === 'admin') {
      await AuditLog.create({
        admin: user._id,
        report: null,
        action: 'admin.login',
        targetType: 'user',
        targetId: user._id,
        details: 'Admin login via OTP'
      });
    }
  } catch (e) {
    console.warn('AuditLog create failed', e && e.message);
  }

  // Create an audit log entry for admin logins
  try {
    if (user.role === 'admin') {
      await AuditLog.create({
        admin: user._id,
        report: null,
        action: 'admin.login',
        targetType: 'user',
        targetId: user._id,
        details: 'Admin login'
      });
    }
  } catch (e) {
    // don't block login on audit failures
    console.warn('AuditLog create failed', e && e.message);
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      verified: user.verified,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      sellerVerificationStatus: user.sellerVerificationStatus
    },
    accessToken,
    authToken: accessToken,
    refreshToken
  };
};

const sendPasswordResetOtpEmail = async (user, code) => {
  const message = `Your Konpuk password reset code is ${code}. It expires in 5 minutes. Do not share this code with anyone.`;
  await emailService.sendEmail({
    to: user.email,
    subject: 'Konpuk password reset code',
    text: message,
    html: `<p>${message}</p>`
  });
};

const loginUser = async (identifier, password, options = {}) => {
  const user = await findUserByIdentifier(identifier);
  if (!user || !user.isActive) {
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    throw error;
  }

  // Require email verification for accounts that have an email address registered.
  if (user.email && !user.emailVerified) {
    const error = new Error('Email not verified. Please verify your email before logging in.');
    error.statusCode = 403;
    throw error;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    throw error;
  }

  // Default to OTP if not explicitly disabled
  const useOtp = options.useOtp !== false;
  const requestLoginOtp = useOtp && loginOtpEnabled && !!(user.email || user.phoneNumber);

  if (requestLoginOtp) {
    const now = new Date();
    if (user.loginOtpRequestedAt && now.getTime() - user.loginOtpRequestedAt.getTime() < 60 * 1000) {
      const wait = 60 - Math.floor((now.getTime() - user.loginOtpRequestedAt.getTime()) / 1000);
      const error = new Error(`Please wait ${wait} seconds before requesting another verification code.`);
      error.statusCode = 429;
      throw error;
    }

    const otp = generateOtp();
    user.loginOtpHash = await bcrypt.hash(otp, 12);
    user.loginOtpExpiresAt = new Date(now.getTime() + 5 * 60 * 1000);
    user.loginOtpRequestedAt = now;
    user.loginOtpAttempts = 0;
    await user.save();

    await sendLoginOtpNotification(user, otp);

    return {
      requiresOtp: true,
      expiresIn: 300,
      resendCooldownSeconds: 60
    };
  }

  const accessToken = createToken(user.id);
  const refreshToken = createRefreshToken(user.id);
  user.refreshTokens.push(refreshToken);
  user.lastLoginAt = new Date();
  await user.save();

  return {
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      verified: user.verified,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      sellerVerificationStatus: user.sellerVerificationStatus
    },
    accessToken,
    authToken: accessToken,
    refreshToken
  };
};

const verifyLoginOtp = async (identifier, code) => {
  const user = await findUserByIdentifier(identifier);
  if (!user || !user.isActive) {
    const error = new Error('Invalid verification request');
    error.statusCode = 401;
    throw error;
  }

  if (!user.loginOtpHash || !user.loginOtpExpiresAt || new Date() > user.loginOtpExpiresAt) {
    user.loginOtpHash = undefined;
    user.loginOtpExpiresAt = undefined;
    user.loginOtpRequestedAt = undefined;
    user.loginOtpAttempts = 0;
    await user.save();

    const error = new Error('Verification code expired. Please request a new code.');
    error.statusCode = 401;
    throw error;
  }

  if (user.loginOtpAttempts >= 5) {
    const error = new Error('Too many invalid attempts. Please request a new code.');
    error.statusCode = 429;
    throw error;
  }

  const validOtp = await bcrypt.compare(code, user.loginOtpHash);
  if (!validOtp) {
    user.loginOtpAttempts = (user.loginOtpAttempts || 0) + 1;
    await user.save();
    const error = new Error('Invalid verification code');
    error.statusCode = 401;
    throw error;
  }

  user.loginOtpHash = undefined;
  user.loginOtpExpiresAt = undefined;
  user.loginOtpRequestedAt = undefined;
  user.loginOtpAttempts = 0;

  const accessToken = createToken(user.id);
  const refreshToken = createRefreshToken(user.id);
  user.refreshTokens.push(refreshToken);
  user.lastLoginAt = new Date();
  await user.save();

  return {
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      verified: user.verified,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      sellerVerificationStatus: user.sellerVerificationStatus
    },
    accessToken,
    authToken: accessToken,
    refreshToken
  };
};

const resendLoginOtp = async (identifier) => {
  const user = await findUserByIdentifier(identifier);
  if (!user || !user.isActive) {
    const error = new Error('Email or phone not found in our system');
    error.statusCode = 401;
    throw error;
  }

  const now = new Date();
  if (user.loginOtpRequestedAt && now.getTime() - user.loginOtpRequestedAt.getTime() < 60 * 1000) {
    const wait = 60 - Math.floor((now.getTime() - user.loginOtpRequestedAt.getTime()) / 1000);
    const error = new Error(`Please wait ${wait} seconds before resending the code.`);
    error.statusCode = 429;
    throw error;
  }

  if (!user.loginOtpHash || !user.loginOtpExpiresAt) {
    const error = new Error('No pending verification request found. Please login again.');
    error.statusCode = 400;
    throw error;
  }

  const otp = generateOtp();
  user.loginOtpHash = await bcrypt.hash(otp, 12);
  user.loginOtpExpiresAt = new Date(now.getTime() + 5 * 60 * 1000);
  user.loginOtpRequestedAt = now;
  user.loginOtpAttempts = 0;
  await user.save();

  await sendLoginOtpEmail(user, otp);

  return {
    expiresIn: 300,
    resendCooldownSeconds: 60
  };
};

// Deprecated local helper replaced by shared phone utils

const requestPhoneOtp = async (phoneNumber) => {
  if (!phoneOtpEnabled) {
    const error = new Error('Phone OTP is disabled');
    error.statusCode = 501;
    throw error;
  }
  if (!phoneNumber) {
    const error = new Error('Phone number is required');
    error.statusCode = 400;
    throw error;
  }

  const variants = phoneSearchVariants(phoneNumber);
  if (!variants || variants.length === 0) {
    const error = new Error('Invalid phone number');
    error.statusCode = 400;
    throw error;
  }

  let user = await User.findOne({ $or: variants.map((p) => ({ phoneNumber: p })) });

  if (!user) {
    // Optionally allow registration via phone if configured
    if (process.env.ALLOW_PHONE_REGISTRATION === 'true') {
      const normalizedStored = normalizeCambodiaPhone(phoneNumber);
      user = await User.create({ email: `${normalizedStored}@phone.local`, passwordHash: await bcrypt.hash(Math.random().toString(36).slice(2), 12), displayName: normalizedStored, phoneNumber: normalizedStored, emailVerified: false });
    } else {
      const error = new Error('Phone number is not registered');
      error.statusCode = 404;
      throw error;
    }
  }

  const now = new Date();
  if (user.loginOtpRequestedAt && now.getTime() - user.loginOtpRequestedAt.getTime() < 60 * 1000) {
    const wait = 60 - Math.floor((now.getTime() - user.loginOtpRequestedAt.getTime()) / 1000);
    const error = new Error(`Please wait ${wait} seconds before requesting another verification code.`);
    error.statusCode = 429;
    throw error;
  }

  const otp = generateOtp();
  user.loginOtpHash = await bcrypt.hash(otp, 12);
  user.loginOtpExpiresAt = new Date(now.getTime() + 5 * 60 * 1000);
  user.loginOtpRequestedAt = now;
  user.loginOtpAttempts = 0;
  await user.save();

  // send via SMS service
  try {
    const smsService = require('./sms.service');
    const display = `+${digits}`.replace(/^\+?/, '+');
    const message = `Your Konpuk login code is ${otp}. It expires in 5 minutes.`;
    await smsService.sendSms(display, message);
  } catch (e) {
    // swallow send errors but log
    console.warn('SMS send failed', e && e.message);
  }

  return { requiresOtp: true, expiresIn: 300, resendCooldownSeconds: 60 };
};

const resendPhoneOtp = async (phoneNumber) => {
  if (!phoneOtpEnabled) {
    const error = new Error('Phone OTP is disabled');
    error.statusCode = 501;
    throw error;
  }
  if (!phoneNumber) {
    const error = new Error('Phone number is required');
    error.statusCode = 400;
    throw error;
  }

  const variants = phoneSearchVariants(phoneNumber);
  if (!variants || variants.length === 0) {
    const error = new Error('Invalid phone number');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findOne({ $or: variants.map((p) => ({ phoneNumber: p })) });
  if (!user || !user.isActive) {
    const error = new Error('Phone number is not registered');
    error.statusCode = 404;
    throw error;
  }

  const now = new Date();
  if (user.loginOtpRequestedAt && now.getTime() - user.loginOtpRequestedAt.getTime() < 60 * 1000) {
    const wait = 60 - Math.floor((now.getTime() - user.loginOtpRequestedAt.getTime()) / 1000);
    const error = new Error(`Please wait ${wait} seconds before requesting another code.`);
    error.statusCode = 429;
    throw error;
  }

  if (!user.loginOtpHash || !user.loginOtpExpiresAt) {
    const error = new Error('No pending verification request. Please request a new code.');
    error.statusCode = 400;
    throw error;
  }

  const otp = generateOtp();
  user.loginOtpHash = await bcrypt.hash(otp, 12);
  user.loginOtpExpiresAt = new Date(now.getTime() + 5 * 60 * 1000);
  user.loginOtpRequestedAt = now;
  user.loginOtpAttempts = 0;
  await user.save();

  try {
    const smsService = require('./sms.service');
    const display = user.phoneNumber;
    const message = `Your Konpuk login code is ${otp}. It expires in 5 minutes.`;
    await smsService.sendSms(display, message);
  } catch (e) {
    console.warn('SMS send failed', e && e.message);
  }

  return {
    expiresIn: 300,
    resendCooldownSeconds: 60
  };
};

const verifyPhoneOtp = async (phoneNumber, code) => {
  if (!phoneOtpEnabled) {
    const error = new Error('Phone OTP is disabled');
    error.statusCode = 501;
    throw error;
  }
  const variants = phoneSearchVariants(phoneNumber);
  if (!variants || variants.length === 0) {
    const error = new Error('Invalid phone number');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findOne({ $or: variants.map((p) => ({ phoneNumber: p })) });
  if (!user || !user.isActive) {
    const error = new Error('Phone number is not registered or account is inactive');
    error.statusCode = 401;
    throw error;
  }

  if (!user.loginOtpHash || !user.loginOtpExpiresAt || new Date() > user.loginOtpExpiresAt) {
    user.loginOtpHash = undefined;
    user.loginOtpExpiresAt = undefined;
    user.loginOtpRequestedAt = undefined;
    user.loginOtpAttempts = 0;
    await user.save();

    const error = new Error('Verification code expired. Please request a new code.');
    error.statusCode = 401;
    throw error;
  }

  if (user.loginOtpAttempts >= 5) {
    const error = new Error('Too many invalid attempts. Please request a new code.');
    error.statusCode = 429;
    throw error;
  }

  const validOtp = await bcrypt.compare(code, user.loginOtpHash);
  if (!validOtp) {
    user.loginOtpAttempts = (user.loginOtpAttempts || 0) + 1;
    await user.save();
    const error = new Error('Invalid verification code');
    error.statusCode = 401;
    throw error;
  }

  user.loginOtpHash = undefined;
  user.loginOtpExpiresAt = undefined;
  user.loginOtpRequestedAt = undefined;
  user.loginOtpAttempts = 0;

  const accessToken = createToken(user.id);
  const refreshToken = createRefreshToken(user.id);
  user.refreshTokens.push(refreshToken);
  user.lastLoginAt = new Date();
  await user.save();

  return {
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      verified: user.verified,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      sellerVerificationStatus: user.sellerVerificationStatus
    },
    accessToken,
    authToken: accessToken,
    refreshToken
  };
};

const verifyEmail = async (identifier, code) => {
  const user = await findUserByIdentifier(identifier);
  if (!user || !user.isActive) {
    const error = new Error('Invalid verification request');
    error.statusCode = 401;
    throw error;
  }

  if (user.emailVerified) {
    return { verified: true };
  }

  const isExpired = !user.emailVerificationHash || !user.emailVerificationExpiresAt || new Date() > user.emailVerificationExpiresAt;

  if (isExpired) {
    user.emailVerificationHash = undefined;
    user.emailVerificationExpiresAt = undefined;
    user.emailVerificationRequestedAt = undefined;
    user.emailVerificationAttempts = 0;
    await user.save();

    const error = new Error('Verification code expired. Please request a new code.');
    error.statusCode = 401;
    throw error;
  }

  if (user.emailVerificationAttempts >= 5) {
    const error = new Error('Too many invalid attempts. Please request a new code.');
    error.statusCode = 429;
    throw error;
  }

  const validOtp = await bcrypt.compare(code, user.emailVerificationHash);
  if (!validOtp) {
    user.emailVerificationAttempts = (user.emailVerificationAttempts || 0) + 1;
    await user.save();
    const error = new Error('Invalid verification code');
    error.statusCode = 401;
    throw error;
  }

  user.emailVerified = true;
  user.emailVerificationHash = undefined;
  user.emailVerificationExpiresAt = undefined;
  user.emailVerificationRequestedAt = undefined;
  user.emailVerificationAttempts = 0;
  await user.save();

  return { verified: true };
};

const resendEmailVerification = async (identifier) => {
  const user = await findUserByIdentifier(identifier);
  if (!user || !user.isActive) {
    const error = new Error('Email or phone not found in our system');
    error.statusCode = 401;
    throw error;
  }

  if (user.emailVerified) {
    const error = new Error('Email is already verified.');
    error.statusCode = 400;
    throw error;
  }

  const now = new Date();
  if (user.emailVerificationRequestedAt && now.getTime() - user.emailVerificationRequestedAt.getTime() < 60 * 1000) {
    const wait = 60 - Math.floor((now.getTime() - user.emailVerificationRequestedAt.getTime()) / 1000);
    const error = new Error(`Please wait ${wait} seconds before resending the code.`);
    error.statusCode = 429;
    throw error;
  }

  const otp = generateOtp();
  user.emailVerificationHash = await bcrypt.hash(otp, 12);
  user.emailVerificationExpiresAt = new Date(now.getTime() + 5 * 60 * 1000);
  user.emailVerificationRequestedAt = now;
  user.emailVerificationAttempts = 0;
  await user.save();

  await sendEmailVerificationCodeEmail(user, otp);

  return {
    expiresIn: 300,
    resendCooldownSeconds: 60
  };
};

const requestPasswordReset = async (identifier) => {
  const user = await findUserByIdentifier(identifier);
  if (!user || !user.isActive) {
    const error = new Error('Invalid password reset request');
    error.statusCode = 401;
    throw error;
  }

  const now = new Date();
  if (user.passwordResetRequestedAt && now.getTime() - user.passwordResetRequestedAt.getTime() < 60 * 1000) {
    const wait = 60 - Math.floor((now.getTime() - user.passwordResetRequestedAt.getTime()) / 1000);
    const error = new Error(`Please wait ${wait} seconds before requesting another password reset.`);
    error.statusCode = 429;
    throw error;
  }

  const otp = generateOtp();
  user.passwordResetOtpHash = await bcrypt.hash(otp, 12);
  user.passwordResetOtpExpiresAt = new Date(now.getTime() + 5 * 60 * 1000);
  user.passwordResetRequestedAt = now;
  user.passwordResetAttempts = 0;
  await user.save();

  await sendPasswordResetOtpEmail(user, otp);

  return {
    expiresIn: 300,
    resendCooldownSeconds: 60
  };
};

const verifyPasswordResetOtp = async (identifier, code) => {
  const user = await findUserByIdentifier(identifier);
  if (!user || !user.isActive) {
    const error = new Error('Invalid password reset request');
    error.statusCode = 401;
    throw error;
  }

  if (!user.passwordResetOtpHash || !user.passwordResetOtpExpiresAt || new Date() > user.passwordResetOtpExpiresAt) {
    user.passwordResetOtpHash = undefined;
    user.passwordResetOtpExpiresAt = undefined;
    user.passwordResetRequestedAt = undefined;
    user.passwordResetAttempts = 0;
    await user.save();

    const error = new Error('Reset code expired. Please request a new code.');
    error.statusCode = 401;
    throw error;
  }

  if (user.passwordResetAttempts >= 5) {
    const error = new Error('Too many invalid attempts. Please request a new code.');
    error.statusCode = 429;
    throw error;
  }

  const validOtp = await bcrypt.compare(code, user.passwordResetOtpHash);
  if (!validOtp) {
    user.passwordResetAttempts = (user.passwordResetAttempts || 0) + 1;
    await user.save();
    const error = new Error('Invalid reset code');
    error.statusCode = 401;
    throw error;
  }

  return { valid: true };
};

const resetPassword = async (identifier, code, newPassword) => {
  const user = await findUserByIdentifier(identifier);
  if (!user || !user.isActive) {
    const error = new Error('Invalid password reset request');
    error.statusCode = 401;
    throw error;
  }

  if (!user.passwordResetOtpHash || !user.passwordResetOtpExpiresAt || new Date() > user.passwordResetOtpExpiresAt) {
    user.passwordResetOtpHash = undefined;
    user.passwordResetOtpExpiresAt = undefined;
    user.passwordResetRequestedAt = undefined;
    user.passwordResetAttempts = 0;
    await user.save();

    const error = new Error('Reset code expired. Please request a new code.');
    error.statusCode = 401;
    throw error;
  }

  if (user.passwordResetAttempts >= 5) {
    const error = new Error('Too many invalid attempts. Please request a new code.');
    error.statusCode = 429;
    throw error;
  }

  const validOtp = await bcrypt.compare(code, user.passwordResetOtpHash);
  if (!validOtp) {
    user.passwordResetAttempts = (user.passwordResetAttempts || 0) + 1;
    await user.save();
    const error = new Error('Invalid reset code');
    error.statusCode = 401;
    throw error;
  }

  if (!validatePassword(newPassword)) {
    const error = new Error('Password must be at least 8 characters');
    error.statusCode = 400;
    throw error;
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  user.passwordHash = passwordHash;
  user.passwordResetOtpHash = undefined;
  user.passwordResetOtpExpiresAt = undefined;
  user.passwordResetRequestedAt = undefined;
  user.passwordResetAttempts = 0;
  user.refreshTokens = [];
  await user.save();

  return { success: true };
};

const resendPasswordResetOtp = async (identifier) => {
  const user = await findUserByIdentifier(identifier);
  if (!user || !user.isActive) {
    const error = new Error('Invalid password reset request');
    error.statusCode = 401;
    throw error;
  }

  const now = new Date();
  if (user.passwordResetRequestedAt && now.getTime() - user.passwordResetRequestedAt.getTime() < 60 * 1000) {
    const wait = 60 - Math.floor((now.getTime() - user.passwordResetRequestedAt.getTime()) / 1000);
    const error = new Error(`Please wait ${wait} seconds before resending the code.`);
    error.statusCode = 429;
    throw error;
  }

  const otp = generateOtp();
  user.passwordResetOtpHash = await bcrypt.hash(otp, 12);
  user.passwordResetOtpExpiresAt = new Date(now.getTime() + 5 * 60 * 1000);
  user.passwordResetRequestedAt = now;
  user.passwordResetAttempts = 0;
  await user.save();

  await sendPasswordResetOtpEmail(user, otp);

  return {
    expiresIn: 300,
    resendCooldownSeconds: 60
  };
};

const refreshToken = async (token) => {
  if (!token) {
    const error = new Error('Refresh token is required');
    error.statusCode = 400;
    throw error;
  }

  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch (err) {
    const error = new Error('Invalid refresh token');
    error.statusCode = 401;
    throw error;
  }

  const user = await User.findById(payload.userId);
  if (!user || !user.refreshTokens.includes(token)) {
    const error = new Error('Refresh token is not valid');
    error.statusCode = 401;
    throw error;
  }

  const accessToken = createToken(user.id);
  const newRefreshToken = createRefreshToken(user.id);
  user.refreshTokens = user.refreshTokens.filter((item) => item !== token);
  user.refreshTokens.push(newRefreshToken);
  await user.save();

  return { accessToken, authToken: accessToken, refreshToken: newRefreshToken };
};

const logoutUser = async (userId, token) => {
  const user = await User.findById(userId);
  if (!user) return;
  if (token) {
    user.refreshTokens = user.refreshTokens.filter((refreshToken) => refreshToken !== token);
  } else {
    user.refreshTokens = [];
  }
  await user.save();
};

const updateProfile = async (userId, updates) => {
  const allowed = ['displayName', 'bio', 'location', 'profileImageUrl', 'phoneNumber', 'avatar', 'coverImage', 'telegram', 'facebook'];
  const sanitized = allowed.reduce((acc, key) => {
    if (updates[key] !== undefined) acc[key] = updates[key];
    return acc;
  }, {});

  // Normalize phone number when provided
  if (sanitized.phoneNumber) {
    const normalizedPhone = normalizeCambodiaPhone(sanitized.phoneNumber);
    if (normalizedPhone) sanitized.phoneNumber = normalizedPhone;
    else delete sanitized.phoneNumber;
  }

  const uploadDataUrl = async (value, folder) => {
    if (!value || typeof value !== 'string' || !value.startsWith('data:')) return value;
    try {
      const cloudinary = require('../config/cloudinary');
      const uploadResult = await cloudinary.uploader.upload(value, { folder: `${require('../config').cloudinary.folder}/${folder}` });
      return uploadResult?.secure_url || undefined;
    } catch (err) {
      return undefined;
    }
  };

  if (sanitized.profileImageUrl) {
    const url = await uploadDataUrl(sanitized.profileImageUrl, 'profiles');
    if (url) sanitized.profileImageUrl = url;
    else delete sanitized.profileImageUrl;
  }
  if (sanitized.avatar) {
    const url = await uploadDataUrl(sanitized.avatar, 'profiles/avatars');
    if (url) sanitized.avatar = url;
    else delete sanitized.avatar;
  }
  if (sanitized.coverImage) {
    const url = await uploadDataUrl(sanitized.coverImage, 'profiles/covers');
    if (url) sanitized.coverImage = url;
    else delete sanitized.coverImage;
  }

  const user = await User.findByIdAndUpdate(userId, sanitized, { new: true, runValidators: true }).select('-passwordHash -refreshTokens');
  return user;
};

const requestVerification = async (userId, details) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  if (user.verified) {
    const error = new Error('Seller is already verified');
    error.statusCode = 400;
    throw error;
  }

  user.verificationStatus = 'pending';
  user.verificationRequestedAt = new Date();
  user.verificationMessage = details || '';
  await user.save();

  await notificationService.addNotification(user._id, {
    type: 'verification',
    title: 'Verification request submitted',
    message: 'Your seller verification request has been sent for review.',
    link: '/profile'
  });

  return user;
};

const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    const error = new Error('Current password is incorrect');
    error.statusCode = 401;
    throw error;
  }

  if (!validatePassword(newPassword)) {
    const error = new Error('New password must be at least 8 characters');
    error.statusCode = 400;
    throw error;
  }

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  await user.save();

  return { success: true };
};

module.exports = {
  registerUser,
  loginUser,
  verifyLoginOtp,
  resendLoginOtp,
  verifyEmail,
  resendEmailVerification,
  requestPasswordReset,
  verifyPasswordResetOtp,
  resetPassword,
  resendPasswordResetOtp,
  requestPhoneOtp,
  resendPhoneOtp,
  verifyPhoneOtp,
  refreshToken,
  logoutUser,
  updateProfile,
  requestVerification,
  changePassword
};

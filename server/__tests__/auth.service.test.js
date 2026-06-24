const { strict: assert } = require('node:assert');
const { describe, it, before, beforeEach, after } = require('node:test');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

let authService;
let User;
let mongod;

before(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.LOGIN_OTP_ENABLED = 'false';
  process.env.SMS_PROVIDER = '';

  const connectDatabase = require('../config/database');
  await connectDatabase();
  ({ User } = require('../models'));
  authService = require('../services/auth.service');
});

after(async () => {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('auth.service loginUser', () => {
  it('returns tokens for email-verified accounts with password login', async () => {
    const password = 'Password123!';
    const passwordHash = await bcrypt.hash(password, 12);
    await User.create({
      email: 'verified@example.com',
      passwordHash,
      displayName: 'Verified User',
      role: 'user',
      emailVerified: true
    });

    const result = await authService.loginUser('verified@example.com', password);

    assert.ok(result.accessToken, 'accessToken should be present');
    assert.ok(result.refreshToken, 'refreshToken should be present');
    assert.equal(result.user.email, 'verified@example.com');
    assert.equal(result.user.emailVerified, true);
  });

  it('returns tokens for phone-only accounts with password login', async () => {
    const password = 'PhonePass123!';
    const passwordHash = await bcrypt.hash(password, 12);
    await User.create({
      phoneNumber: '+85512345678',
      passwordHash,
      displayName: 'Phone User',
      role: 'user',
      emailVerified: false
    });

    const result = await authService.loginUser('+85512345678', password);

    assert.ok(result.accessToken, 'accessToken should be present');
    assert.ok(result.refreshToken, 'refreshToken should be present');
    assert.equal(result.user.phoneVerified, false);
    assert.equal(result.user.emailVerified, false);
  });

  it('does not request OTP for phone password login when useOtp is explicitly false', async () => {
    process.env.LOGIN_OTP_ENABLED = 'true';
    try {
      const password = 'PhonePass123!';
      const passwordHash = await bcrypt.hash(password, 12);
      const user = await User.create({
        phoneNumber: '+85598765432',
        passwordHash,
        displayName: 'No OTP Phone User',
        role: 'user',
        emailVerified: false
      });

      const result = await authService.loginUser('+85598765432', password, { useOtp: false });

      assert.ok(result.accessToken, 'accessToken should be present');
      assert.ok(result.refreshToken, 'refreshToken should be present');
      const storedUser = await User.findById(user.id);
      assert.equal(storedUser.loginOtpHash, undefined);
      assert.equal(storedUser.loginOtpRequestedAt, undefined);
    } finally {
      process.env.LOGIN_OTP_ENABLED = 'false';
    }
  });

  it('bypasses OTP when LOGIN_OTP_ENABLED is false even if useOtp is requested', async () => {
    const password = 'Password123!';
    const passwordHash = await bcrypt.hash(password, 12);
    await User.create({
      email: 'otp-request@example.com',
      passwordHash,
      displayName: 'OTP Request User',
      role: 'user',
      emailVerified: true
    });

    const result = await authService.loginUser('otp-request@example.com', password, { useOtp: true });

    assert.ok(result.accessToken, 'accessToken should be present');
    assert.ok(result.refreshToken, 'refreshToken should be present');
    assert.equal(result.user.email, 'otp-request@example.com');
    assert.equal(result.user.emailVerified, true);
  });

  it('requires email verification for email accounts with emailVerified=false', async () => {
    const password = 'Password123!';
    const passwordHash = await bcrypt.hash(password, 12);
    await User.create({
      email: 'unverified@example.com',
      passwordHash,
      displayName: 'Unverified User',
      role: 'user',
      emailVerified: false
    });

    await assert.rejects(
      async () => {
        await authService.loginUser('unverified@example.com', password);
      },
      {
        message: 'Email not verified. Please verify your email before logging in.',
        statusCode: 403
      }
    );
  });
});

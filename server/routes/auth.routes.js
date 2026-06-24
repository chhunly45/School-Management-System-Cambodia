const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');
const validate = require('../middleware/validation.middleware');

const rateLimit = require('express-rate-limit');
const router = express.Router();

const phoneOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many OTP requests, please try again later.' },
  keyGenerator: (req) => {
    // use phone number if available, otherwise IP
    return (req.body && req.body.phoneNumber) ? `phone:${req.body.phoneNumber}` : req.ip;
  }
});

const phoneOtpEnabled = (process.env.PHONE_OTP_ENABLED === 'true') && !!process.env.SMS_PROVIDER;

const ensurePhoneOtpEnabled = (req, res, next) => {
  if (!phoneOtpEnabled) return res.status(501).json({ success: false, message: 'Phone OTP is disabled' });
  next();
};

router.post(
  '/register',
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Valid email is required'),
  body('phoneNumber').notEmpty().withMessage('Phone number is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must have at least 8 characters'),
  body('displayName').notEmpty().withMessage('Display name is required'),
  validate,
  authController.register
);

router.post(
  '/login',
  body('identifier').notEmpty().withMessage('Email or phone is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
  authController.login
);

router.post(
  '/login/verify',
  body('identifier').notEmpty().withMessage('Email or phone is required'),
  body('code').isLength({ min: 6, max: 6 }).withMessage('Verification code must be 6 digits'),
  validate,
  authController.verifyLoginOtp
);

router.post(
  '/login/resend',
  body('identifier').notEmpty().withMessage('Email or phone is required'),
  validate,
  authController.resendLoginOtp
);

router.post(
  '/phone/request-otp',
  phoneOtpLimiter,
  ensurePhoneOtpEnabled,
  body('phoneNumber').notEmpty().withMessage('Phone number is required'),
  validate,
  authController.requestPhoneOtp
);

router.post(
  '/phone/resend-otp',
  phoneOtpLimiter,
  ensurePhoneOtpEnabled,
  body('phoneNumber').notEmpty().withMessage('Phone number is required'),
  validate,
  authController.resendPhoneOtp
);

router.post(
  '/phone/verify-otp',
  ensurePhoneOtpEnabled,
  body('phoneNumber').notEmpty().withMessage('Phone number is required'),
  body('code').isLength({ min: 6, max: 6 }).withMessage('Verification code must be 6 digits'),
  validate,
  authController.verifyPhoneOtp
);

router.post(
  '/register/verify',
  body('identifier').notEmpty().withMessage('Email or phone is required'),
  body('code').isLength({ min: 6, max: 6 }).withMessage('Verification code must be 6 digits'),
  validate,
  authController.verifyEmail
);

router.post(
  '/register/verify/resend',
  body('identifier').notEmpty().withMessage('Email or phone is required'),
  validate,
  authController.resendEmailVerification
);

router.post(
  '/password-reset/request',
  body('identifier').notEmpty().withMessage('Email or phone is required'),
  validate,
  authController.requestPasswordReset
);

router.post(
  '/password-reset/verify',
  body('identifier').notEmpty().withMessage('Email or phone is required'),
  body('code').isLength({ min: 6, max: 6 }).withMessage('Reset code must be 6 digits'),
  validate,
  authController.verifyPasswordResetOtp
);

router.post(
  '/password-reset/confirm',
  body('identifier').notEmpty().withMessage('Email or phone is required'),
  body('code').isLength({ min: 6, max: 6 }).withMessage('Reset code must be 6 digits'),
  body('password').isLength({ min: 8 }).withMessage('Password must have at least 8 characters'),
  validate,
  authController.resetPassword
);

router.post(
  '/password-reset/resend',
  body('identifier').notEmpty().withMessage('Email or phone is required'),
  validate,
  authController.resendPasswordResetOtp
);

router.post('/refresh', authController.refreshToken);
router.post('/logout', authMiddleware, authController.logout);
router.get('/me', authMiddleware, authController.getProfile);
router.put('/me', authMiddleware, authController.updateProfile);
router.post(
  '/change-password',
  authMiddleware,
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must have at least 8 characters'),
  validate,
  authController.changePassword
);
router.post('/verification-request', authMiddleware, body('details').optional().trim().isString(), validate, authController.requestVerification);

module.exports = router;

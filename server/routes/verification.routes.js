const express = require('express');
const { body } = require('express-validator');
const verificationController = require('../controllers/verification.controller');
const authMiddleware = require('../middleware/auth.middleware');
const validate = require('../middleware/validation.middleware');

const router = express.Router();

router.post(
  '/request',
  authMiddleware,
  body('idCardImage').notEmpty().withMessage('ID card image is required'),
  body('selfieImage').notEmpty().withMessage('Selfie image is required'),
  body('businessDocument').optional().isString(),
  body('details').optional().trim().isString(),
  validate,
  verificationController.requestVerification
);

router.get('/status', authMiddleware, verificationController.getVerificationStatus);

module.exports = router;

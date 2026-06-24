const express = require('express');
const { body, param, query } = require('express-validator');
const certificateController = require('../controllers/certificate.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const validate = require('../middleware/validation.middleware');

const router = express.Router();
const adminOnly = [authMiddleware, roleMiddleware(['admin'])];

router.get(
  '/',
  adminOnly,
  query('search').optional().trim().isString(),
  query('status').optional().isIn(['draft', 'issued', 'revoked']),
  query('certificateType').optional().isIn(['graduation', 'achievement', 'attendance', 'honor']),
  query('academicYear').optional().trim().isString(),
  query('studentId').optional().isMongoId(),
  query('page').optional().isInt({ min: 1 }),
  query('perPage').optional().isInt({ min: 1 }),
  validate,
  certificateController.listCertificates
);

router.get(
  '/:id',
  adminOnly,
  param('id').isMongoId(),
  validate,
  certificateController.getCertificate
);

router.post(
  '/',
  adminOnly,
  body('certificateNumber').notEmpty().trim().isString(),
  body('studentId').notEmpty().isMongoId(),
  body('studentName').notEmpty().trim().isString(),
  body('className').notEmpty().trim().isString(),
  body('certificateType').isIn(['graduation', 'achievement', 'attendance', 'honor']),
  body('issueDate').isISO8601(),
  body('academicYear').notEmpty().trim().isString(),
  body('issuedBy').optional().trim().isString(),
  body('remarks').optional().trim().isString(),
  body('status').isIn(['draft', 'issued', 'revoked']),
  validate,
  certificateController.createCertificate
);

router.put(
  '/:id',
  adminOnly,
  param('id').isMongoId(),
  body('certificateNumber').notEmpty().trim().isString(),
  body('studentId').notEmpty().isMongoId(),
  body('studentName').notEmpty().trim().isString(),
  body('className').notEmpty().trim().isString(),
  body('certificateType').isIn(['graduation', 'achievement', 'attendance', 'honor']),
  body('issueDate').isISO8601(),
  body('academicYear').notEmpty().trim().isString(),
  body('issuedBy').optional().trim().isString(),
  body('remarks').optional().trim().isString(),
  body('status').isIn(['draft', 'issued', 'revoked']),
  validate,
  certificateController.updateCertificate
);

router.delete(
  '/:id',
  adminOnly,
  param('id').isMongoId(),
  validate,
  certificateController.deleteCertificate
);

module.exports = router;

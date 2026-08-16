const express = require('express');
const { body } = require('express-validator');
const schoolSettingController = require('../controllers/schoolSetting.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const validate = require('../middleware/validation.middleware');

const router = express.Router();
const adminOnly = [authMiddleware, roleMiddleware(['admin'])];
const supportedCurrencyValidator = body('supportedCurrencies').optional().custom((value) => {
  const items = Array.isArray(value) ? value : [value];
  const allowed = new Set(['USD', 'KHR']);
  return items.every((item) => allowed.has(String(item).trim().toUpperCase()));
});
const employeeRolesValidator = body('employeeRoles').optional().custom((value) => {
  const items = Array.isArray(value) ? value : String(value || '').split(',');
  return items
    .map((item) => String(item).trim())
    .filter(Boolean)
    .length > 0;
});

const baseValidators = [
  body('schoolName').optional().trim().isString(),
  body('logo').optional().trim().isString(),
  body('address').optional().trim().isString(),
  body('phone').optional().trim().isString(),
  body('email').optional().trim().isEmail(),
  body('currentAcademicYearId').optional().isMongoId(),
  body('defaultCurrency').optional().isIn(['USD', 'KHR']),
  supportedCurrencyValidator,
  body('exchangeRateUsdToKhr').optional().isFloat({ min: 0 }),
  body('receiptPrefix').optional().trim().isString(),
  body('nextReceiptNumber').optional().isInt({ min: 1 }),
  body('monthlyDueDay').optional().isInt({ min: 1, max: 31 }),
  body('gracePeriodDays').optional().isInt({ min: 0, max: 365 }),
  employeeRolesValidator,
  body('footerText').optional().trim().isString(),
  body('principalName').optional().trim().isString(),
  body('qrCodeEnabled').optional().isBoolean().toBoolean(),
  body('attendanceEnabled').optional().isBoolean().toBoolean(),
  body('attendanceQrEnabled').optional().isBoolean().toBoolean(),
  body('attendanceGpsEnabled').optional().isBoolean().toBoolean(),
  body('attendanceSchoolLatitude').optional({ nullable: true }).isFloat({ min: -90, max: 90 }).toFloat(),
  body('attendanceSchoolLongitude').optional({ nullable: true }).isFloat({ min: -180, max: 180 }).toFloat(),
  body('attendanceAllowedRadius').optional().isFloat({ min: 1 }).toFloat(),
  body('attendanceStart').optional().matches(/^([01]\d|2[0-3]):[0-5]\d$/),
  body('attendanceEnd').optional().matches(/^([01]\d|2[0-3]):[0-5]\d$/)
];

router.get('/', adminOnly, validate, schoolSettingController.getSchoolSettings);

router.post('/', adminOnly, ...baseValidators, validate, schoolSettingController.createSchoolSettings);

router.put('/', adminOnly, ...baseValidators, validate, schoolSettingController.updateSchoolSettings);

router.delete('/', adminOnly, validate, schoolSettingController.deleteSchoolSettings);

module.exports = router;
module.exports.baseValidators = baseValidators;
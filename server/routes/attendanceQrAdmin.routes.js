const express = require('express');
const { body } = require('express-validator');
const controller = require('../controllers/attendanceQrAdmin.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const validate = require('../middleware/validation.middleware');

const router = express.Router();
const adminOnly = [authMiddleware, roleMiddleware(['admin'])];

const expiryValidator = body('expiresInSeconds').optional().isInt({ min: 30, max: 86400 }).toInt();
const sessionValidator = body('sessionType').optional().isIn(['morning', 'afternoon', 'evening']);

router.get('/', adminOnly, validate, controller.getCurrent);
router.post('/generate', adminOnly, expiryValidator, sessionValidator, validate, controller.generate);
router.post('/rotate', adminOnly, expiryValidator, sessionValidator, validate, controller.rotate);
router.post('/revoke', adminOnly, validate, controller.revoke);

module.exports = router;
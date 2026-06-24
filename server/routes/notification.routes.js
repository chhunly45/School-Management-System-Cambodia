const express = require('express');
const { param, query } = require('express-validator');
const notificationController = require('../controllers/notification.controller');
const authMiddleware = require('../middleware/auth.middleware');
const validate = require('../middleware/validation.middleware');

const router = express.Router();

router.use(authMiddleware);
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],
  validate,
  notificationController.getNotifications
);
router.get('/count', notificationController.getNotificationCount);
router.patch('/read-all', notificationController.markAllNotificationsRead);
router.patch('/:id/read', param('id').isMongoId().withMessage('Valid notification id is required'), validate, notificationController.markNotificationRead);

module.exports = router;

const express = require('express');
const { body, param } = require('express-validator');
const chatController = require('../controllers/chat.controller');
const authMiddleware = require('../middleware/auth.middleware');
const validate = require('../middleware/validation.middleware');
const rateLimit = require('express-rate-limit');

const router = express.Router();

router.use(authMiddleware);

const messagingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // allow 20 messaging actions per minute per user
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req.user ? `user:${req.user.id}` : req.ip),
  message: { success: false, message: 'Too many messages, please slow down.' }
});

router.get('/', chatController.listChats);
router.get('/:id', param('id').isMongoId(), validate, chatController.getChat);
router.post(
  '/',
  messagingLimiter,
  body('productId').isMongoId().withMessage('Valid product ID is required'),
  body('message').optional().isString().trim(),
  validate,
  chatController.createChat
);
router.post('/:id/messages', messagingLimiter, param('id').isMongoId(), body('message').notEmpty().withMessage('Message text is required'), validate, chatController.sendMessage);
router.patch('/:id/read', param('id').isMongoId(), validate, chatController.markAsRead);

module.exports = router;

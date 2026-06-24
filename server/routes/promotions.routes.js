const express = require('express');
const { body } = require('express-validator');
const promotionController = require('../controllers/promotion.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const validate = require('../middleware/validation.middleware');

const router = express.Router();
router.use(authMiddleware, roleMiddleware(['seller']));

router.get('/plans', promotionController.getPromotionPlans);
router.post(
  '/purchase',
  body('productId').isMongoId().withMessage('Valid product id is required'),
  body('planId').isIn(['3_days', '7_days', '30_days']).withMessage('Invalid promotion plan'),
  validate,
  promotionController.purchasePromotion
);
router.get('/', promotionController.getSellerPromotions);

module.exports = router;

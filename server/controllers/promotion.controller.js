const promotionService = require('../services/promotion.service');

const getPromotionPlans = async (req, res, next) => {
  try {
    const plans = await promotionService.getPromotionPlans();
    res.json({ success: true, data: plans });
  } catch (error) {
    next(error);
  }
};

const purchasePromotion = async (req, res, next) => {
  try {
    const promotion = await promotionService.purchasePromotion(req.user.id, req.body.productId, req.body.planId);
    res.status(201).json({ success: true, data: promotion });
  } catch (error) {
    next(error);
  }
};

const getSellerPromotions = async (req, res, next) => {
  try {
    const promotions = await promotionService.listSellerPromotions(req.user.id);
    res.json({ success: true, data: promotions });
  } catch (error) {
    next(error);
  }
};

const listPromotions = async (req, res, next) => {
  try {
    const promotions = await promotionService.listPromotions(req.query);
    res.json({ success: true, data: promotions });
  } catch (error) {
    next(error);
  }
};

const getPromotionMetrics = async (req, res, next) => {
  try {
    const metrics = await promotionService.getPromotionMetrics();
    res.json({ success: true, data: metrics });
  } catch (error) {
    next(error);
  }
};

const approvePromotion = async (req, res, next) => {
  try {
    const promotion = await promotionService.approvePromotion(req.params.id, req.user.id);
    res.json({ success: true, data: promotion });
  } catch (error) {
    next(error);
  }
};

const rejectPromotion = async (req, res, next) => {
  try {
    const promotion = await promotionService.rejectPromotion(req.params.id, req.user.id, req.body.reason);
    res.json({ success: true, data: promotion });
  } catch (error) {
    next(error);
  }
};

const extendPromotion = async (req, res, next) => {
  try {
    const promotion = await promotionService.extendPromotion(req.params.id, Number(req.body.extraDays), req.user.id);
    res.json({ success: true, data: promotion });
  } catch (error) {
    next(error);
  }
};

const cancelPromotion = async (req, res, next) => {
  try {
    const promotion = await promotionService.cancelPromotion(req.params.id, req.user.id);
    res.json({ success: true, data: promotion });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPromotionPlans,
  purchasePromotion,
  getSellerPromotions,
  listPromotions,
  getPromotionMetrics,
  approvePromotion,
  rejectPromotion,
  extendPromotion,
  cancelPromotion
};

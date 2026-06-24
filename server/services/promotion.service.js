const mongoose = require('mongoose');
const { Promotion, Product, User } = require('../models');
const notificationService = require('./notification.service');

const promotionPlans = [
  { id: '3_days', label: '3 Days Featured', durationDays: 3, price: 20000, currency: 'KHR' },
  { id: '7_days', label: '7 Days Featured', durationDays: 7, price: 40000, currency: 'KHR' },
  { id: '30_days', label: '30 Days Featured', durationDays: 30, price: 120000, currency: 'KHR' }
];

const getPlanById = (planId) => promotionPlans.find((plan) => plan.id === planId);

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const getPromotionPlans = async () => promotionPlans;

const computeEndDate = (startDate, durationDays) => new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

const expirePromotions = async () => {
  const now = new Date();
  const promotions = await Promotion.find({ status: 'active', endDate: { $lte: now } }).populate('product').populate('seller');
  if (!promotions.length) return;

  await Promise.all(promotions.map(async (promotion) => {
    promotion.status = 'expired';
    await promotion.save();

    if (promotion.product && promotion.product.featuredPromotion && promotion.product.featuredPromotion.toString() === promotion._id.toString()) {
      promotion.product.featured = false;
      promotion.product.isFeatured = false;
      promotion.product.featuredPromotion = null;
      promotion.product.featuredAt = null;
      await promotion.product.save();
    }

    if (promotion.seller) {
      await notificationService.addNotification(promotion.seller, {
        type: 'promotion_expired',
        title: 'Featured promotion expired',
        message: `Your featured placement for "${promotion.product?.title || 'your product'}" has expired.`,
        link: promotion.product ? `/products/${promotion.product.slug}` : '/seller/promotions'
      });
    }
  }));
};

const notifyExpiringSoon = async () => {
  const now = new Date();
  const soon = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const promotions = await Promotion.find({ status: 'active', endDate: { $gt: now, $lte: soon }, expiringSoonNotified: false }).populate('product').populate('seller');
  if (!promotions.length) return;

  await Promise.all(promotions.map(async (promotion) => {
    promotion.expiringSoonNotified = true;
    await promotion.save();

    if (promotion.seller) {
      await notificationService.addNotification(promotion.seller, {
        type: 'promotion_expiring',
        title: 'Promotion expiring soon',
        message: `Your featured placement for "${promotion.product?.title || 'your product'}" will expire on ${promotion.endDate?.toLocaleDateString()}.`,
        link: promotion.product ? `/products/${promotion.product.slug}` : '/seller/promotions'
      });
    }
  }));
};

const processPromotionState = async () => {
  try {
    await expirePromotions();
    await notifyExpiringSoon();
  } catch (error) {
    console.error('Promotion lifecycle cleanup failed:', error);
  }
};

let promotionSchedulerStarted = false;

const startPromotionScheduler = () => {
  if (promotionSchedulerStarted) return;
  promotionSchedulerStarted = true;
  processPromotionState();
  setInterval(processPromotionState, 30 * 60 * 1000);
};

const ensurePromotionState = async () => {
  await processPromotionState();
};

const purchasePromotion = async (sellerId, productId, planId) => {
  if (!isObjectId(productId)) {
    const error = new Error('Invalid product id');
    error.statusCode = 400;
    throw error;
  }

  const plan = getPlanById(planId);
  if (!plan) {
    const error = new Error('Invalid promotion plan');
    error.statusCode = 400;
    throw error;
  }

  const product = await Product.findById(productId);
  if (!product) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }

  if (product.seller.toString() !== sellerId.toString()) {
    const error = new Error('Permission denied');
    error.statusCode = 403;
    throw error;
  }

  if (['sold', 'archived', 'flagged'].includes(product.status)) {
    const error = new Error('Cannot promote this product');
    error.statusCode = 400;
    throw error;
  }

  const existing = await Promotion.findOne({
    product: productId,
    status: { $in: ['pending', 'active'] }
  });

  if (existing) {
    const error = new Error('A promotion is already pending or active for this product');
    error.statusCode = 400;
    throw error;
  }

  const promotion = await Promotion.create({
    seller: sellerId,
    product: productId,
    plan: plan.id,
    durationDays: plan.durationDays,
    price: plan.price,
    currency: plan.currency
  });

  return promotion;
};

const listSellerPromotions = async (sellerId) => {
  await ensurePromotionState();
  return Promotion.find({ seller: sellerId })
    .populate('product', 'title slug status')
    .populate('seller', 'displayName email')
    .sort({ createdAt: -1 })
    .lean();
};

const listPromotions = async ({ status, seller, product, page = 1, limit = 25 }) => {
  await ensurePromotionState();

  const query = {};
  if (status) query.status = status;
  if (seller && isObjectId(seller)) query.seller = seller;
  if (product && isObjectId(product)) query.product = product;

  const skip = (Number(page) - 1) * Number(limit);
  const items = await Promotion.find(query)
    .populate('product', 'title slug status')
    .populate('seller', 'displayName email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .lean();

  const total = await Promotion.countDocuments(query);
  return { items, meta: { page: Number(page), limit: Number(limit), total } };
};

const getPromotionMetrics = async () => {
  await ensurePromotionState();

  const activePromotions = await Promotion.countDocuments({ status: 'active' });
  const expiredPromotions = await Promotion.countDocuments({ status: 'expired' });
  const revenueResult = await Promotion.aggregate([
    { $match: { status: { $in: ['active', 'expired'] } } },
    { $group: { _id: null, total: { $sum: '$price' } } }
  ]);

  return {
    activePromotions,
    expiredPromotions,
    revenueFromPromotions: (revenueResult[0] && revenueResult[0].total) || 0
  };
};

const approvePromotion = async (promotionId, adminId) => {
  if (!isObjectId(promotionId)) {
    const error = new Error('Invalid promotion id');
    error.statusCode = 400;
    throw error;
  }

  const promotion = await Promotion.findById(promotionId).populate('product').populate('seller');
  if (!promotion) {
    const error = new Error('Promotion not found');
    error.statusCode = 404;
    throw error;
  }

  if (promotion.status !== 'pending') {
    const error = new Error('Only pending promotions can be approved');
    error.statusCode = 400;
    throw error;
  }

  const now = new Date();
  promotion.status = 'active';
  promotion.approvedBy = adminId;
  promotion.approvedAt = now;
  promotion.startDate = now;
  promotion.endDate = computeEndDate(now, promotion.durationDays);
  promotion.expiringSoonNotified = false;
  await promotion.save();

  if (promotion.product) {
    promotion.product.featured = true;
    promotion.product.isFeatured = true;
    promotion.product.featuredAt = now;
    promotion.product.featuredPromotion = promotion._id;
    await promotion.product.save();
  }

  if (promotion.seller) {
    await notificationService.addNotification(promotion.seller, {
      type: 'promotion_approved',
      title: 'Featured promotion approved',
      message: `Your featured placement for "${promotion.product?.title || 'your product'}" has been approved. It will run until ${promotion.endDate?.toLocaleDateString()}.`,
      link: promotion.product ? `/products/${promotion.product.slug}` : '/seller/promotions'
    });
  }

  return promotion;
};

const rejectPromotion = async (promotionId, adminId, reason) => {
  if (!isObjectId(promotionId)) {
    const error = new Error('Invalid promotion id');
    error.statusCode = 400;
    throw error;
  }

  const promotion = await Promotion.findById(promotionId).populate('product').populate('seller');
  if (!promotion) {
    const error = new Error('Promotion not found');
    error.statusCode = 404;
    throw error;
  }

  if (promotion.status !== 'pending') {
    const error = new Error('Only pending promotions can be rejected');
    error.statusCode = 400;
    throw error;
  }

  promotion.status = 'rejected';
  promotion.rejectedBy = adminId;
  promotion.rejectedAt = new Date();
  promotion.rejectionReason = reason || 'Rejected by admin';
  await promotion.save();

  if (promotion.seller) {
    await notificationService.addNotification(promotion.seller, {
      type: 'promotion_rejected',
      title: 'Featured promotion rejected',
      message: `Your featured placement for "${promotion.product?.title || 'your product'}" was rejected. ${promotion.rejectionReason}`,
      link: promotion.product ? `/products/${promotion.product.slug}` : '/seller/promotions'
    });
  }

  return promotion;
};

const extendPromotion = async (promotionId, extraDays, adminId) => {
  if (!isObjectId(promotionId)) {
    const error = new Error('Invalid promotion id');
    error.statusCode = 400;
    throw error;
  }

  if (extraDays <= 0) {
    const error = new Error('Extra days must be greater than zero');
    error.statusCode = 400;
    throw error;
  }

  const promotion = await Promotion.findById(promotionId).populate('product').populate('seller');
  if (!promotion) {
    const error = new Error('Promotion not found');
    error.statusCode = 404;
    throw error;
  }

  if (!['active', 'expired'].includes(promotion.status)) {
    const error = new Error('Only active or expired promotions can be extended');
    error.statusCode = 400;
    throw error;
  }

  const now = new Date();
  const baseline = promotion.endDate && promotion.endDate > now ? promotion.endDate : now;
  promotion.endDate = computeEndDate(baseline, extraDays);
  promotion.status = 'active';
  promotion.approvedBy = adminId;
  promotion.approvedAt = promotion.approvedAt || now;
  promotion.expiringSoonNotified = false;
  await promotion.save();

  if (promotion.product) {
    promotion.product.featured = true;
    promotion.product.isFeatured = true;
    promotion.product.featuredAt = now;
    promotion.product.featuredPromotion = promotion._id;
    await promotion.product.save();
  }

  if (promotion.seller) {
    await notificationService.addNotification(promotion.seller, {
      type: 'promotion_extended',
      title: 'Featured promotion extended',
      message: `Your featured placement for "${promotion.product?.title || 'your product'}" has been extended until ${promotion.endDate?.toLocaleDateString()}.`,
      link: promotion.product ? `/products/${promotion.product.slug}` : '/seller/promotions'
    });
  }

  return promotion;
};

const cancelPromotion = async (promotionId, adminId) => {
  if (!isObjectId(promotionId)) {
    const error = new Error('Invalid promotion id');
    error.statusCode = 400;
    throw error;
  }

  const promotion = await Promotion.findById(promotionId).populate('product').populate('seller');
  if (!promotion) {
    const error = new Error('Promotion not found');
    error.statusCode = 404;
    throw error;
  }

  if (promotion.status === 'cancelled') {
    const error = new Error('Promotion is already cancelled');
    error.statusCode = 400;
    throw error;
  }

  promotion.status = 'cancelled';
  promotion.cancelledAt = new Date();
  await promotion.save();

  if (promotion.product && promotion.product.featuredPromotion && promotion.product.featuredPromotion.toString() === promotion._id.toString()) {
    promotion.product.featured = false;
    promotion.product.isFeatured = false;
    promotion.product.featuredPromotion = null;
    promotion.product.featuredAt = null;
    await promotion.product.save();
  }

  if (promotion.seller) {
    await notificationService.addNotification(promotion.seller, {
      type: 'promotion_cancelled',
      title: 'Featured promotion cancelled',
      message: `Your featured placement for "${promotion.product?.title || 'your product'}" has been cancelled by the admin team.`,
      link: promotion.product ? `/products/${promotion.product.slug}` : '/seller/promotions'
    });
  }

  return promotion;
};

module.exports = {
  getPromotionPlans,
  purchasePromotion,
  listSellerPromotions,
  listPromotions,
  getPromotionMetrics,
  approvePromotion,
  rejectPromotion,
  extendPromotion,
  cancelPromotion,
  startPromotionScheduler,
  ensurePromotionState
};

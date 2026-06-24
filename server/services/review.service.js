const mongoose = require('mongoose');
const { Review, User, Product } = require('../models');

const createReview = async ({ sellerId, reviewerId, productId, rating, comment }) => {
  if (!mongoose.Types.ObjectId.isValid(sellerId)) {
    const error = new Error('Invalid seller identifier');
    error.statusCode = 400;
    throw error;
  }
  if (!mongoose.Types.ObjectId.isValid(reviewerId)) {
    const error = new Error('Invalid reviewer identifier');
    error.statusCode = 400;
    throw error;
  }
  if (sellerId.toString() === reviewerId.toString()) {
    const error = new Error('You cannot review yourself');
    error.statusCode = 400;
    throw error;
  }

  const seller = await User.findById(sellerId);
  if (!seller || !seller.isActive) {
    const error = new Error('Seller not found');
    error.statusCode = 404;
    throw error;
  }

  if (productId) {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      const error = new Error('Invalid product identifier');
      error.statusCode = 400;
      throw error;
    }
    const product = await Product.findById(productId).select('seller');
    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }
    if (product.seller?.toString() !== sellerId.toString()) {
      const error = new Error('Product does not belong to the reviewed seller');
      error.statusCode = 400;
      throw error;
    }
  }

  const existing = await Review.findOne({ seller: sellerId, reviewer: reviewerId });
  if (existing) {
    const error = new Error('You have already reviewed this seller');
    error.statusCode = 400;
    throw error;
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    const error = new Error('Rating must be an integer between 1 and 5');
    error.statusCode = 400;
    throw error;
  }

  const review = await Review.create({
    seller: sellerId,
    reviewer: reviewerId,
    product: productId,
    rating,
    comment: comment?.trim() || ''
  });

  return review;
};

const getSellerReviewSummary = async (sellerId) => {
  if (!mongoose.Types.ObjectId.isValid(sellerId)) {
    return { totalReviews: 0, avgRating: 0 };
  }

  const result = await Review.aggregate([
    { $match: { seller: new mongoose.Types.ObjectId(sellerId) } },
    {
      $group: {
        _id: null,
        avgRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  if (!result.length) {
    return { totalReviews: 0, avgRating: 0 };
  }

  return {
    totalReviews: result[0].totalReviews,
    avgRating: Number(result[0].avgRating.toFixed(2))
  };
};

const getSellerReviews = async (sellerId, { page = 1, limit = 12 } = {}) => {
  if (!mongoose.Types.ObjectId.isValid(sellerId)) {
    const error = new Error('Invalid seller identifier');
    error.statusCode = 400;
    throw error;
  }

  const skip = (Number(page) - 1) * Number(limit);
  const query = { seller: sellerId };
  const [items, total, summary] = await Promise.all([
    Review.find(query)
      .populate('reviewer', 'displayName avatar profileImageUrl')
      .populate('product', 'title slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Review.countDocuments(query),
    getSellerReviewSummary(sellerId)
  ]);

  return {
    items,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total
    },
    summary
  };
};

const deleteReview = async (reviewId) => {
  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    const error = new Error('Invalid review identifier');
    error.statusCode = 400;
    throw error;
  }

  const review = await Review.findById(reviewId);
  if (!review) {
    const error = new Error('Review not found');
    error.statusCode = 404;
    throw error;
  }

  await review.deleteOne();
  return review;
};

module.exports = {
  createReview,
  getSellerReviewSummary,
  getSellerReviews,
  deleteReview
};

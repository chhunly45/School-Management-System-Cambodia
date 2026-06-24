const reviewService = require('../services/review.service');
const User = require('../models/User');

const createReview = async (req, res, next) => {
  try {
    const { seller, product, rating, comment } = req.body;
    const review = await reviewService.createReview({
      sellerId: seller,
      reviewerId: req.user.id,
      productId: product,
      rating: Number(rating),
      comment
    });
    res.status(201).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};

const getSellerReviews = async (req, res, next) => {
  try {
    const { page, perPage } = req.query;
    const result = await reviewService.getSellerReviews(req.params.sellerId, {
      page: page ? Number(page) : 1,
      limit: perPage ? Number(perPage) : 12
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  getSellerReviews
};

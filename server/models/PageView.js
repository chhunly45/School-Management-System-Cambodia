const mongoose = require('mongoose');

const pageViewSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    pageType: {
      type: String,
      enum: ['homepage', 'product', 'category', 'seller_profile', 'search_results', 'other'],
      required: true,
      index: true
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      index: true
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      index: true
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    searchQuery: String,
    referer: String,
    userAgent: String,
    ipAddress: String,
    country: String,
    city: String,
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
      expires: 7776000 // 90 days TTL
    }
  },
  {
    timestamps: true
  }
);

// Compound index for efficient queries
pageViewSchema.index({ createdAt: 1, pageType: 1 });
pageViewSchema.index({ sessionId: 1, createdAt: -1 });

module.exports = mongoose.model('PageView', pageViewSchema);

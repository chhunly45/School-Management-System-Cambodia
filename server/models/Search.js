const mongoose = require('mongoose');

const searchSchema = new mongoose.Schema(
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
    query: {
      type: String,
      required: true,
      index: true
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      index: true
    },
    location: String,
    resultCount: {
      type: Number,
      default: 0
    },
    filters: {
      minPrice: Number,
      maxPrice: Number,
      condition: String
    },
    userAgent: String,
    ipAddress: String,
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

// Index for efficient aggregation
searchSchema.index({ createdAt: 1, query: 1 });
searchSchema.index({ query: 1, resultCount: 1 });

module.exports = mongoose.model('Search', searchSchema);

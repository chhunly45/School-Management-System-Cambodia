const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    ipAddress: String,
    country: String,
    city: String,
    deviceType: {
      type: String,
      enum: ['mobile', 'tablet', 'desktop'],
      default: 'desktop'
    },
    browserName: String,
    browserVersion: String,
    isReturning: {
      type: Boolean,
      default: false
    },
    lastVisit: {
      type: Date,
      default: Date.now
    },
    visitCount: {
      type: Number,
      default: 1
    },
    pageViews: {
      type: Number,
      default: 0
    },
    totalTimeOnSite: {
      type: Number,
      default: 0 // in seconds
    },
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

visitorSchema.index({ createdAt: 1 });
visitorSchema.index({ ipAddress: 1, createdAt: -1 });

module.exports = mongoose.model('Visitor', visitorSchema);

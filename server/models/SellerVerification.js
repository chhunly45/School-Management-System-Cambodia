const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const SellerVerificationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    idCardImage: {
      type: String,
      required: true,
      trim: true
    },
    selfieImage: {
      type: String,
      required: true,
      trim: true
    },
    businessDocument: {
      type: String,
      trim: true,
      default: null
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

SellerVerificationSchema.index({ userId: 1, status: 1 });

module.exports = model('SellerVerification', SellerVerificationSchema);

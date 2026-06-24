const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const UserSchema = new Schema({
  email: { type: String, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  phoneNumber: { type: String, trim: true, unique: true, sparse: true },
  displayName: { type: String, required: true, trim: true },
  role: { type: String, enum: ['user', 'seller', 'admin', 'moderator'], default: 'user' },
  profileImageUrl: { type: String, trim: true },
  avatar: { type: String, trim: true },
  coverImage: { type: String, trim: true },
  telegram: { type: String, trim: true },
  facebook: { type: String, trim: true },
  bio: { type: String, trim: true },
  location: { type: String, trim: true },
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
  sellerVerificationStatus: { type: String, enum: ['unverified', 'verified', 'rejected'], default: 'unverified' },
  emailVerificationHash: { type: String, trim: true },
  emailVerificationExpiresAt: { type: Date },
  emailVerificationRequestedAt: { type: Date },
  emailVerificationAttempts: { type: Number, default: 0 },
  passwordResetOtpHash: { type: String, trim: true },
  passwordResetOtpExpiresAt: { type: Date },
  passwordResetRequestedAt: { type: Date },
  passwordResetAttempts: { type: Number, default: 0 },
  verified: { type: Boolean, default: false },
  verificationStatus: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },
  verificationRequestedAt: { type: Date },
  verificationMessage: { type: String, trim: true },
  loginOtpHash: { type: String, trim: true },
  loginOtpExpiresAt: { type: Date },
  loginOtpRequestedAt: { type: Date },
  loginOtpAttempts: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  lastLoginAt: { type: Date },
  refreshTokens: [{ type: String }],
  notifications: [
    {
      type: { type: String, default: 'info' },
      title: { type: String, required: true, trim: true },
      message: { type: String, default: '', trim: true },
      link: { type: String, trim: true },
      read: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  preferences: {
    language: { type: String, default: 'km' },
    notifications: { type: Boolean, default: true }
  }
}, {
  timestamps: true
});

UserSchema.index({ email: 1 }, { unique: true, sparse: true });
UserSchema.index({ phoneNumber: 1 }, { unique: true, sparse: true });
UserSchema.index({ displayName: 'text', bio: 'text', location: 'text' });

module.exports = model('User', UserSchema);

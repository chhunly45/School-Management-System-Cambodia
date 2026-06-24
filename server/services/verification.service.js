const { User, SellerVerification } = require('../models');
const notificationService = require('./notification.service');

const createSellerVerificationRequest = async (userId, payload) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  if (user.verified || user.sellerVerificationStatus === 'verified' || user.verificationStatus === 'approved') {
    const error = new Error('Seller is already verified');
    error.statusCode = 400;
    throw error;
  }

  const pendingRequest = await SellerVerification.findOne({ userId, status: 'pending' });
  if (pendingRequest) {
    const error = new Error('A verification request is already pending');
    error.statusCode = 400;
    throw error;
  }

  const verification = await SellerVerification.create({
    userId,
    idCardImage: payload.idCardImage,
    selfieImage: payload.selfieImage,
    businessDocument: payload.businessDocument || null,
    status: 'pending'
  });

  user.verificationStatus = 'pending';
  user.verificationRequestedAt = new Date();
  if (payload.details) {
    user.verificationMessage = payload.details;
  }
  await user.save();

  await notificationService.addNotification(userId, {
    type: 'verification',
    title: 'Verification request submitted',
    message: 'Your seller verification request has been sent for review.',
    link: '/profile'
  });

  return verification;
};

const getSellerVerificationStatus = async (userId) => {
  const verification = await SellerVerification.findOne({ userId }).sort({ createdAt: -1 }).lean();
  const user = await User.findById(userId).select('sellerVerificationStatus verificationStatus verified').lean();
  return {
    verification,
    user
  };
};

const reviewSellerVerification = async (verificationId, adminId, updates) => {
  const verification = await SellerVerification.findById(verificationId);
  if (!verification) {
    const error = new Error('Verification request not found');
    error.statusCode = 404;
    throw error;
  }

  if (!['approved', 'rejected'].includes(updates.status)) {
    const error = new Error('Invalid verification status');
    error.statusCode = 400;
    throw error;
  }

  verification.status = updates.status;
  verification.reviewedBy = adminId;
  verification.reviewedAt = new Date();
  await verification.save();

  const user = await User.findById(verification.userId);
  if (!user) {
    const error = new Error('Associated user not found');
    error.statusCode = 404;
    throw error;
  }

  if (updates.status === 'approved') {
    user.sellerVerificationStatus = 'verified';
    user.verified = true;
    user.verificationStatus = 'approved';
  } else {
    user.sellerVerificationStatus = 'rejected';
    user.verified = false;
    user.verificationStatus = 'rejected';
  }

  await user.save();

  await notificationService.addNotification(user._id, {
    type: 'verification',
    title: updates.status === 'approved' ? 'Seller verification approved' : 'Seller verification rejected',
    message:
      updates.status === 'approved'
        ? 'Your seller verification has been approved.'
        : 'Your seller verification has been rejected.',
    link: '/profile'
  });

  return verification;
};

module.exports = {
  createSellerVerificationRequest,
  getSellerVerificationStatus,
  reviewSellerVerification
};

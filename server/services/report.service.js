const { Report, Product, User } = require('../models');
const notificationService = require('./notification.service');

const createReport = async ({ reporterId, targetType, targetId, reason, details }) => {
  const allowedTypes = ['product', 'user'];
  if (!allowedTypes.includes(targetType)) {
    const error = new Error('Report target must be product or user');
    error.statusCode = 400;
    throw error;
  }

  const reporter = await User.findById(reporterId);
  if (!reporter) {
    const error = new Error('Reporter not found');
    error.statusCode = 404;
    throw error;
  }

  if (targetType === 'product') {
    const product = await Product.findById(targetId);
    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }

    if (product.seller.toString() === reporterId.toString()) {
      const error = new Error('Cannot report your own listing');
      error.statusCode = 403;
      throw error;
    }

    const report = await Report.create({ reporter: reporterId, targetType, targetId, reason, details });
    if (product.status === 'published') {
      product.status = 'flagged';
      await product.save();
    }

    await notificationService.addNotification(product.seller, {
      type: 'report',
      title: 'Your listing has been reported',
      message: `A report was submitted for ${product.title}. The listing is under review.`,
      link: `/products/${product.slug}`
    });

    return report;
  }

  if (targetType === 'user') {
    const targetUser = await User.findById(targetId);
    if (!targetUser) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    if (targetUser.id === reporterId.toString()) {
      const error = new Error('Cannot report yourself');
      error.statusCode = 403;
      throw error;
    }

    const report = await Report.create({ reporter: reporterId, targetType, targetId, reason, details });
    await notificationService.addNotification(targetUser._id, {
      type: 'report',
      title: 'You have been reported',
      message: 'A seller report was submitted and is under review.',
      link: `/profile`
    });
    return report;
  }
};

const listUserReports = async (userId) => {
  const reports = await Report.find({ reporter: userId })
    .populate('reporter', 'displayName email')
    .sort({ createdAt: -1 })
    .lean();
  return reports;
};

module.exports = {
  createReport,
  listUserReports
};

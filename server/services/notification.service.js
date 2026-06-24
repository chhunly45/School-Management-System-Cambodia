const { User, Product } = require('../models');

const PRODUCT_ID_LINK_RE = /^\/products\/([0-9a-fA-F]{24})$/;

let notificationIo = null;

const setIo = (io) => {
  notificationIo = io;
};

const addNotification = async (userId, notification) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const nextNotification = {
    type: notification.type || 'info',
    title: notification.title || 'Notification',
    message: notification.message || '',
    link: notification.link || null,
    read: false,
    createdAt: new Date()
  };

  user.notifications = user.notifications || [];
  user.notifications.unshift(nextNotification);
  if (user.notifications.length > 100) {
    user.notifications = user.notifications.slice(0, 100);
  }

  await user.save();

  if (notificationIo) {
    notificationIo.to(`user:${userId}`).emit('new_notification', nextNotification.toObject ? nextNotification.toObject() : nextNotification);
  }

  return nextNotification;
};

const getNotifications = async (userId, page = 1, limit = 25) => {
  const user = await User.findById(userId).select('notifications');
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const notifications = (user.notifications || []).slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const pageNumber = Number(page) >= 1 ? Number(page) : 1;
  const pageLimit = Number(limit) >= 1 ? Math.min(Number(limit), 100) : 25;
  const startIndex = (pageNumber - 1) * pageLimit;
  const paginated = notifications.slice(startIndex, startIndex + pageLimit);

  const oldProductIds = [];
  paginated.forEach((notification) => {
    if (typeof notification.link === 'string') {
      const match = PRODUCT_ID_LINK_RE.exec(notification.link);
      if (match) {
        oldProductIds.push(match[1]);
      }
    }
  });

  if (oldProductIds.length > 0) {
    const products = await Product.find({ _id: { $in: oldProductIds } }).select('slug');
    const slugById = products.reduce((map, product) => {
      map[product._id.toString()] = product.slug;
      return map;
    }, {});

    paginated.forEach((notification) => {
      if (typeof notification.link === 'string') {
        const match = PRODUCT_ID_LINK_RE.exec(notification.link);
        if (match) {
          const slug = slugById[match[1]];
          if (slug) {
            notification.link = `/products/${slug}`;
          }
        }
      }
    });
  }

  return {
    items: paginated,
    meta: {
      total: notifications.length,
      page: pageNumber,
      limit: pageLimit,
      pages: Math.max(1, Math.ceil(notifications.length / pageLimit))
    }
  };
};

const getUnreadCount = async (userId) => {
  const user = await User.findById(userId).select('notifications');
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  return (user.notifications || []).filter((notification) => !notification.read).length;
};

const markAsRead = async (userId, notificationId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const notification = user.notifications.id(notificationId);
  if (!notification) {
    const error = new Error('Notification not found');
    error.statusCode = 404;
    throw error;
  }

  notification.read = true;
  await user.save();
  return notification;
};

const markAllAsRead = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  let updated = false;
  (user.notifications || []).forEach((notification) => {
    if (!notification.read) {
      notification.read = true;
      updated = true;
    }
  });

  if (updated) {
    await user.save();
  }

  return {
    total: (user.notifications || []).length,
    unreadCount: (user.notifications || []).filter((n) => !n.read).length
  };
};

module.exports = {
  setIo,
  addNotification,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead
};

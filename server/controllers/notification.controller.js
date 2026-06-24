const notificationService = require('../services/notification.service');

const getNotifications = async (req, res, next) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 25;
    const notifications = await notificationService.getNotifications(req.user.id, page, limit);
    res.json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
};

const getNotificationCount = async (req, res, next) => {
  try {
    const count = await notificationService.getUnreadCount(req.user.id);
    res.json({ success: true, data: { count } });
  } catch (error) {
    next(error);
  }
};

const markNotificationRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markAsRead(req.user.id, req.params.id);
    res.json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};

const markAllNotificationsRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAllAsRead(req.user.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  getNotificationCount,
  markNotificationRead,
  markAllNotificationsRead
};

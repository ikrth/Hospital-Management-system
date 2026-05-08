const Notification = require('../models/Notification');
const { sendSuccess, sendError } = require('../utils/responseHelper');

exports.getNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const skip = (page - 1) * limit;

    const filter = { recipient: req.user.id };
    if (req.query.unread === 'true') filter.isRead = false;

    const [total, notifications] = await Promise.all([
      Notification.countDocuments(filter),
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ]);

    return sendSuccess(res, {
      notifications,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user.id,
      isRead: false,
    });
    return sendSuccess(res, { count });
  } catch (err) {
    next(err);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { isRead: true },
      { new: true }
    );
    if (!notification) return sendError(res, 'Notification not found', 404);
    return sendSuccess(res, notification, 'Marked as read');
  } catch (err) {
    next(err);
  }
};

exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { isRead: true }
    );
    return sendSuccess(res, null, 'All marked as read');
  } catch (err) {
    next(err);
  }
};

exports.deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user.id,
    });
    if (!notification) return sendError(res, 'Notification not found', 404);
    return sendSuccess(res, null, 'Notification deleted');
  } catch (err) {
    next(err);
  }
};

const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Create a single notification
 */
exports.createNotification = async (recipientId, type, title, message, relatedId = null, relatedModel = null) => {
  try {
    const notification = await Notification.create({
      recipient: recipientId,
      type,
      title,
      message,
      relatedId,
      relatedModel,
    });
    return notification;
  } catch (err) {
    console.error('Error creating notification:', err);
  }
};

/**
 * Create notifications for multiple recipients (e.g. all admins)
 */
exports.createBulkNotifications = async (recipientIds, type, title, message, relatedId = null, relatedModel = null) => {
  try {
    const notifications = recipientIds.map((id) => ({
      recipient: id,
      type,
      title,
      message,
      relatedId,
      relatedModel,
    }));
    await Notification.insertMany(notifications);
  } catch (err) {
    console.error('Error creating bulk notifications:', err);
  }
};

/**
 * Notify all admins
 */
exports.notifyAdmins = async (type, title, message, relatedId = null, relatedModel = null) => {
  try {
    const admins = await User.find({ role: 'admin' }, '_id');
    const adminIds = admins.map((a) => a._id);
    if (adminIds.length > 0) {
      await this.createBulkNotifications(adminIds, type, title, message, relatedId, relatedModel);
    }
  } catch (err) {
    console.error('Error notifying admins:', err);
  }
};

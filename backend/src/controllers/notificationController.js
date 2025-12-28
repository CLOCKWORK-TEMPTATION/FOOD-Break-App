const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');

/**
 * Notification Controller
 * معالجات الإشعارات
 */

// الحصول على إشعارات المستخدم
exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page, limit, unreadOnly } = req.query;

    const result = await notificationService.getUserNotifications(userId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      unreadOnly: unreadOnly === 'true'
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error getting notifications:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
};

// تحديد إشعار كمقروء
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const notification = await notificationService.markAsRead(id, userId);

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
};

// تحديد جميع الإشعارات كمقروءة
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await notificationService.markAllAsRead(userId);

    res.json({
      success: true,
      data: { count: result.count }
    });
  } catch (error) {
    logger.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
};

// حذف إشعار
exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await notificationService.deleteNotification(id, userId);

    res.json({
      success: true,
      message: 'تم حذف الإشعار بنجاح'
    });
  } catch (error) {
    logger.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
};

// إرسال تذكير يدوي (Admin only)
exports.sendManualReminder = async (req, res) => {
  try {
    const { projectId } = req.body;

    const result = await notificationService.sendHalfHourlyReminders(projectId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error sending manual reminder:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
};

// إرسال إشعار عام (Admin/Producer only)
exports.sendBroadcast = async (req, res) => {
  try {
    const { title, message, type, targetUsers, projectId } = req.body;

    const result = await notificationService.sendBroadcastNotification({
      title,
      message,
      type: type || 'GENERAL',
      targetUsers,
      projectId,
      senderId: req.user.id
    });

    res.json({
      success: true,
      data: result,
      message: 'تم إرسال الإشعار بنجاح'
    });
  } catch (error) {
    logger.error('Error sending broadcast notification:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
};

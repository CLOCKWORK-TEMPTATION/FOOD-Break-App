const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');

/**
 * Notification Controller - متحكم الإشعارات العربي
 * معالجات الإشعارات مع دعم التعريب الكامل
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
      error: { 
        code: 'NOTIFICATIONS_FETCH_FAILED',
        message: req.t('notifications.fetchFailed') 
      }
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
      data: notification,
      message: req.t('notifications.markedAsRead')
    });
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: { 
        code: 'MARK_READ_FAILED',
        message: req.t('notifications.markReadFailed') 
      }
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
      data: { count: result.count },
      message: req.t('notifications.allMarkedAsRead')
    });
  } catch (error) {
    logger.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      error: { 
        code: 'MARK_ALL_READ_FAILED',
        message: req.t('notifications.markAllReadFailed') 
      }
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
      message: req.t('notifications.deleted')
    });
  } catch (error) {
    logger.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      error: { 
        code: 'DELETE_FAILED',
        message: req.t('notifications.deleteFailed') 
      }
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
      error: { 
        code: 'REMINDER_SEND_FAILED',
        message: req.t('notifications.reminderSendFailed') 
      }
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
      message: req.t('notifications.broadcastSent')
    });
  } catch (error) {
    logger.error('Error sending broadcast notification:', error);
    res.status(500).json({
      success: false,
      error: { 
        code: 'BROADCAST_SEND_FAILED',
        message: req.t('notifications.broadcastSendFailed') 
      }
    });
  }
};

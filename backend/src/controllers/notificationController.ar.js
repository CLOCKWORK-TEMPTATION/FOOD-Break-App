const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');

/**
 * متحكم الإشعارات - Notification Controller
 * معالجات الإشعارات مع دعم التعريب الكامل والتوقيت العربي/الهجري
 */

// أنواع الإشعارات بالعربية
const NOTIFICATION_TYPES_AR = {
  ORDER_CONFIRMED: 'تأكيد الطلب',
  ORDER_READY: 'الطلب جاهز',
  ORDER_DELIVERED: 'تم التوصيل',
  EXCEPTION_APPROVED: 'تمت الموافقة على الاستثناء',
  REMINDER: 'تذكير',
  SYSTEM: 'إشعار النظام',
  BUDGET_WARNING: 'تحذير الميزانية',
  BUDGET_EXCEEDED: 'تجاوز الميزانية'
};

// تحويل التاريخ للعربي
const toArabicDate = (date) => {
  const arabicDays = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const arabicMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const d = new Date(date);
  return `${arabicDays[d.getDay()]} ${d.getDate()} ${arabicMonths[d.getMonth()]} ${d.getFullYear()}`;
};

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

    const localizedResult = {
      ...result,
      notifications: result.notifications?.map(n => ({
        ...n,
        typeAr: NOTIFICATION_TYPES_AR[n.type] || n.type,
        createdAtAr: toArabicDate(n.createdAt)
      }))
    };

    res.json({
      success: true,
      data: localizedResult,
      message: 'تم جلب الإشعارات بنجاح'
    });
  } catch (error) {
    logger.error('خطأ في جلب الإشعارات:', error);
    res.status(500).json({
      success: false,
      error: { 
        code: 'NOTIFICATIONS_FETCH_FAILED',
        message: 'فشل جلب الإشعارات'
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
      data: {
        ...notification,
        typeAr: NOTIFICATION_TYPES_AR[notification.type] || notification.type,
        readAtAr: toArabicDate(notification.readAt)
      },
      message: 'تم تحديد الإشعار كمقروء'
    });
  } catch (error) {
    logger.error('خطأ في تحديد الإشعار كمقروء:', error);
    res.status(500).json({
      success: false,
      error: { 
        code: 'MARK_READ_FAILED',
        message: 'فشل تحديد الإشعار كمقروء'
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
      message: `تم تحديد ${result.count} إشعار كمقروء`
    });
  } catch (error) {
    logger.error('خطأ في تحديد جميع الإشعارات كمقروءة:', error);
    res.status(500).json({
      success: false,
      error: { 
        code: 'MARK_ALL_READ_FAILED',
        message: 'فشل تحديد جميع الإشعارات كمقروءة'
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
      message: 'تم حذف الإشعار بنجاح'
    });
  } catch (error) {
    logger.error('خطأ في حذف الإشعار:', error);
    res.status(500).json({
      success: false,
      error: { 
        code: 'DELETE_FAILED',
        message: 'فشل حذف الإشعار'
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
      data: result,
      message: `تم إرسال ${result.sent || 0} تذكير بنجاح`
    });
  } catch (error) {
    logger.error('خطأ في إرسال التذكير:', error);
    res.status(500).json({
      success: false,
      error: { 
        code: 'REMINDER_SEND_FAILED',
        message: 'فشل إرسال التذكير'
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
      type: type || 'SYSTEM',
      targetUsers,
      projectId,
      senderId: req.user.id
    });

    res.json({
      success: true,
      data: {
        ...result,
        sentAtAr: toArabicDate(new Date())
      },
      message: `تم إرسال الإشعار إلى ${result.recipientsCount || 0} مستخدم`
    });
  } catch (error) {
    logger.error('خطأ في إرسال الإشعار العام:', error);
    res.status(500).json({
      success: false,
      error: { 
        code: 'BROADCAST_SEND_FAILED',
        message: 'فشل إرسال الإشعار العام'
      }
    });
  }
};

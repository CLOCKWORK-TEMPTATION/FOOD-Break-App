const notificationService = require('../services/notificationService');

/**
 * Notification Controller
 * إدارة endpoints الإشعارات
 */
const notificationController = {
  /**
   * GET /api/notifications
   * الحصول على إشعارات المستخدم
   */
  getUserNotifications: async (req, res) => {
    try {
      const userId = req.user.id; // من middleware المصادقة
      const { page = 1, limit = 20, unreadOnly = false } = req.query;

      const result = await notificationService.getUserNotifications(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
        unreadOnly: unreadOnly === 'true'
      });

      res.json({
        success: true,
        data: result.notifications,
        unreadCount: result.unreadCount,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('❌ خطأ في جلب الإشعارات:', error);
      res.status(500).json({
        success: false,
        error: 'فشل في جلب الإشعارات',
        message: error.message
      });
    }
  },

  /**
   * GET /api/notifications/unread-count
   * الحصول على عدد الإشعارات غير المقروءة
   */
  getUnreadCount: async (req, res) => {
    try {
      const userId = req.user.id;

      const result = await notificationService.getUserNotifications(userId, {
        page: 1,
        limit: 1
      });

      res.json({
        success: true,
        unreadCount: result.unreadCount
      });
    } catch (error) {
      console.error('❌ خطأ في جلب عدد الإشعارات:', error);
      res.status(500).json({
        success: false,
        error: 'فشل في جلب عدد الإشعارات',
        message: error.message
      });
    }
  },

  /**
   * PUT /api/notifications/:id/read
   * تحديد إشعار كمقروء
   */
  markAsRead: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await notificationService.markAsRead(id, userId);

      if (result.count === 0) {
        return res.status(404).json({
          success: false,
          error: 'الإشعار غير موجود أو غير مصرح لك بالوصول إليه'
        });
      }

      res.json({
        success: true,
        message: 'تم تحديد الإشعار كمقروء'
      });
    } catch (error) {
      console.error('❌ خطأ في تحديد الإشعار كمقروء:', error);
      res.status(500).json({
        success: false,
        error: 'فشل في تحديد الإشعار كمقروء',
        message: error.message
      });
    }
  },

  /**
   * PUT /api/notifications/mark-all-read
   * تحديد جميع الإشعارات كمقروءة
   */
  markAllAsRead: async (req, res) => {
    try {
      const userId = req.user.id;

      const result = await notificationService.markAllAsRead(userId);

      res.json({
        success: true,
        message: `تم تحديد ${result.count} إشعار كمقروء`,
        count: result.count
      });
    } catch (error) {
      console.error('❌ خطأ في تحديد جميع الإشعارات كمقروءة:', error);
      res.status(500).json({
        success: false,
        error: 'فشل في تحديد جميع الإشعارات كمقروءة',
        message: error.message
      });
    }
  },

  /**
   * DELETE /api/notifications/:id
   * حذف إشعار
   */
  deleteNotification: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await notificationService.deleteNotification(id, userId);

      if (result.count === 0) {
        return res.status(404).json({
          success: false,
          error: 'الإشعار غير موجود أو غير مصرح لك بحذفه'
        });
      }

      res.json({
        success: true,
        message: 'تم حذف الإشعار بنجاح'
      });
    } catch (error) {
      console.error('❌ خطأ في حذف الإشعار:', error);
      res.status(500).json({
        success: false,
        error: 'فشل في حذف الإشعار',
        message: error.message
      });
    }
  },

  /**
   * POST /api/notifications/send
   * إرسال إشعار عام (للمسؤولين)
   */
  sendBroadcast: async (req, res) => {
    try {
      const { recipients, type, title, message } = req.body;
      
      // هنا يجب تنفيذ منطق الإرسال للمجموعات
      // This is a placeholder for the actual broadcast logic
      
      res.json({
        success: true,
        data: {
          sent: 1, // Mock count
          message: 'تم جدولة الإشعار للإرسال'
        }
      });
    } catch (error) {
      console.error('❌ خطأ في إرسال الإشعار:', error);
      res.status(500).json({
        success: false,
        error: 'فشل في إرسال الإشعار',
        message: error.message
      });
    }
  },

  /**
   * POST /api/notifications/test/push
   * اختبار إرسال إشعار فوري (للتطوير فقط)
   */
  testPushNotification: async (req, res) => {
    try {
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({
          success: false,
          error: 'هذه الخاصية متاحة فقط في بيئة التطوير'
        });
      }

      const userId = req.user.id;
      const { title, message } = req.body;

      const user = await require('@prisma/client').PrismaClient.prototype.user.findUnique({
        where: { id: userId }
      });

      const notification = {
        type: 'SYSTEM',
        title: title || 'إشعار تجريبي',
        message: message || 'هذا إشعار تجريبي من النظام',
        data: { test: true }
      };

      const result = await notificationService.sendPushNotification(user, notification);

      res.json({
        success: true,
        message: 'تم إرسال الإشعار التجريبي',
        result
      });
    } catch (error) {
      console.error('❌ خطأ في إرسال الإشعار التجريبي:', error);
      res.status(500).json({
        success: false,
        error: 'فشل في إرسال الإشعار التجريبي',
        message: error.message
      });
    }
  },

  /**
   * POST /api/notifications/test/sms
   * اختبار إرسال رسالة نصية (للتطوير فقط)
   */
  testSMSNotification: async (req, res) => {
    try {
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({
          success: false,
          error: 'هذه الخاصية متاحة فقط في بيئة التطوير'
        });
      }

      const { phoneNumber, message } = req.body;

      if (!phoneNumber) {
        return res.status(400).json({
          success: false,
          error: 'رقم الهاتف مطلوب'
        });
      }

      const result = await notificationService.sendSMSNotification(
        phoneNumber,
        message || 'رسالة تجريبية من BreakApp'
      );

      res.json({
        success: true,
        message: 'تم إرسال الرسالة النصية التجريبية',
        result
      });
    } catch (error) {
      console.error('❌ خطأ في إرسال الرسالة التجريبية:', error);
      res.status(500).json({
        success: false,
        error: 'فشل في إرسال الرسالة التجريبية',
        message: error.message
      });
    }
  },

  /**
   * POST /api/notifications/test/email
   * اختبار إرسال بريد إلكتروني (للتطوير فقط)
   */
  testEmailNotification: async (req, res) => {
    try {
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({
          success: false,
          error: 'هذه الخاصية متاحة فقط في بيئة التطوير'
        });
      }

      const { email, title, message } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'البريد الإلكتروني مطلوب'
        });
      }

      const notification = {
        title: title || 'بريد تجريبي',
        message: message || 'هذا بريد إلكتروني تجريبي من BreakApp',
        data: { test: true }
      };

      const result = await notificationService.sendEmailNotification(email, notification);

      res.json({
        success: true,
        message: 'تم إرسال البريد الإلكتروني التجريبي',
        result
      });
    } catch (error) {
      console.error('❌ خطأ في إرسال البريد التجريبي:', error);
      res.status(500).json({
        success: false,
        error: 'فشل في إرسال البريد التجريبي',
        message: error.message
      });
    }
  }
};

module.exports = notificationController;

const nodemailer = require('nodemailer');
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient();

/**
 * خدمة الإشعارات المتكاملة
 * تدعم: Push Notifications (FCM), SMS (Twilio), Email (SMTP)
 */
class NotificationService {
  constructor() {
    this.emailTransporter = this.initializeEmailTransporter();
    this.smsConfig = this.initializeSMSConfig();
    this.pushConfig = this.initializePushConfig();
  }

  // ============================================
  // إعداد الخدمات (Initialization)
  // ============================================

  /**
   * إعداد خدمة البريد الإلكتروني (SMTP)
   */
  initializeEmailTransporter() {
    if (process.env.SMTP_ENABLED !== 'true') {
      console.warn('⚠️ SMTP غير مفعل');
      return null;
    }

    try {
      return nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    } catch (error) {
      console.error('❌ خطأ في إعداد SMTP:', error.message);
      return null;
    }
  }

  /**
   * إعداد خدمة الرسائل القصيرة (Twilio SMS)
   */
  initializeSMSConfig() {
    return {
      enabled: process.env.SMS_ENABLED === 'true',
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER,
      apiUrl: 'https://api.twilio.com/2010-04-01'
    };
  }

  /**
   * إعداد الإشعارات الفورية (Firebase Cloud Messaging)
   */
  initializePushConfig() {
    return {
      enabled: process.env.PUSH_NOTIFICATIONS_ENABLED === 'true',
      serverKey: process.env.FCM_SERVER_KEY,
      projectId: process.env.FCM_PROJECT_ID,
      apiUrl: 'https://fcm.googleapis.com/fcm/send'
    };
  }

  // ============================================
  // إشعارات الطلبات (Order Notifications)
  // ============================================

  /**
   * إرسال إشعار تأكيد الطلب
   */
  async sendOrderConfirmation(orderData) {
    try {
      const notification = {
        type: 'ORDER_CONFIRMED',
        title: 'تم تأكيد طلبك ✓',
        message: `تم تأكيد طلبك رقم ${orderData.id.substring(0, 8)} من مطعم ${orderData.restaurant?.name || 'المطعم'}`,
        userId: orderData.userId,
        data: {
          orderId: orderData.id,
          restaurantName: orderData.restaurant?.name,
          totalAmount: orderData.totalAmount,
          estimatedTime: orderData.estimatedTime
        }
      };

      await this.saveNotification(notification);

      // إرسال عبر جميع القنوات
      const user = await prisma.user.findUnique({ where: { id: orderData.userId } });
      if (user) {
        await Promise.allSettled([
          this.sendPushNotification(user, notification),
          this.sendSMSNotification(user.phoneNumber, notification.message),
          this.sendEmailNotification(user.email, notification)
        ]);
      }

      return notification;
    } catch (error) {
      console.error('❌ خطأ في إرسال إشعار تأكيد الطلب:', error);
      throw new Error(`خطأ في إرسال إشعار تأكيد الطلب: ${error.message}`);
    }
  }

  /**
   * إرسال إشعار تحديث حالة الطلب (Task 21)
   */
  async sendOrderStatusUpdate(orderId, newStatus, additionalData = {}) {
    try {
      // جلب بيانات الطلب
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: true,
          restaurant: true
        }
      });

      if (!order) {
        throw new Error('الطلب غير موجود');
      }

      const statusMessages = {
        PENDING: 'طلبك قيد المراجعة ⏳',
        CONFIRMED: 'تم تأكيد طلبك ✓',
        PREPARING: 'جاري تحضير طلبك 👨‍🍳',
        OUT_FOR_DELIVERY: 'طلبك في الطريق إليك 🚗',
        DELIVERED: 'تم تسليم طلبك بنجاح ✓',
        CANCELLED: 'تم إلغاء طلبك ✗'
      };

      const statusDescriptions = {
        PENDING: 'سيتم تأكيد طلبك قريباً',
        CONFIRMED: 'بدأ المطعم في استلام طلبك',
        PREPARING: `${order.restaurant?.name || 'المطعم'} يحضر طلبك الآن`,
        OUT_FOR_DELIVERY: 'المندوب في الطريق إليك، الوصول المتوقع خلال دقائق',
        DELIVERED: 'نتمنى أن تستمتع بوجبتك!',
        CANCELLED: 'تم إلغاء الطلب بنجاح'
      };

      const notification = {
        type: 'ORDER_STATUS_UPDATE',
        title: statusMessages[newStatus] || 'تحديث حالة الطلب',
        message: statusDescriptions[newStatus] || 'تم تحديث حالة طلبك',
        userId: order.userId,
        data: {
          orderId: order.id,
          newStatus,
          previousStatus: order.status,
          restaurantName: order.restaurant?.name,
          totalAmount: order.totalAmount,
          updatedAt: new Date().toISOString(),
          ...additionalData
        }
      };

      await this.saveNotification(notification);

      // إرسال عبر جميع القنوات
      await Promise.allSettled([
        this.sendPushNotification(order.user, notification),
        this.sendSMSNotification(order.user.phoneNumber, notification.title),
        this.sendEmailNotification(order.user.email, notification)
      ]);

      return notification;
    } catch (error) {
      console.error('❌ خطأ في إرسال إشعار تحديث الحالة:', error);
      throw new Error(`خطأ في إرسال إشعار تحديث الحالة: ${error.message}`);
    }
  }

  /**
   * إرسال تذكير بموعد الطلب (Half-hourly reminders)
   */
  async sendOrderReminder(projectId) {
    try {
      // الحصول على جميع أعضاء المشروع
      const project = await prisma.project.findUnique({
        where: { id: projectId }
      });

      if (!project) {
        throw new Error('المشروع غير موجود');
      }

      // البحث عن المستخدمين الذين لم يقدموا طلبات اليوم
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // جلب جميع المستخدمين
      const allUsers = await prisma.user.findMany({
        where: { isActive: true }
      });

      const usersWithOrders = await prisma.order.findMany({
        where: {
          projectId,
          createdAt: {
            gte: today,
            lt: tomorrow
          }
        },
        select: { userId: true }
      });

      const userIdsWithOrders = new Set(usersWithOrders.map(o => o.userId));
      const usersWithoutOrders = allUsers.filter(u => !userIdsWithOrders.has(u.id));

      const notifications = [];

      for (const user of usersWithoutOrders) {
        const notification = {
          type: 'REMINDER',
          title: '⏰ تذكير: لم تقدم طلبك بعد',
          message: `مرحباً ${user.firstName}، لا تنس تقديم طلب الطعام لليوم. الوقت ينفد!`,
          userId: user.id,
          data: {
            projectId,
            projectName: project.name,
            deadline: new Date(Date.now() + 60 * 60 * 1000).toISOString()
          }
        };

        await this.saveNotification(notification);

        // إرسال عبر جميع القنوات
        await Promise.allSettled([
          this.sendPushNotification(user, notification),
          this.sendSMSNotification(user.phoneNumber, notification.message)
        ]);

        notifications.push(notification);
      }

      console.log(`✓ تم إرسال ${notifications.length} تذكير`);
      return notifications;
    } catch (error) {
      console.error('❌ خطأ في إرسال تذكير الطلبات:', error);
      throw new Error(`خطأ في إرسال تذكير الطلبات: ${error.message}`);
    }
  }

  /**
   * إرسال إشعار تتبع GPS
   */
  async sendDeliveryLocationUpdate(orderData, locationData) {
    try {
      const notification = {
        type: 'DELIVERY_LOCATION_UPDATE',
        title: '📍 تحديث موقع التوصيل',
        message: `المندوب على بعد ${locationData.distanceKm} كم من موقعك`,
        userId: orderData.userId,
        data: {
          orderId: orderData.id,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          distanceKm: locationData.distanceKm,
          estimatedArrival: locationData.estimatedArrival
        }
      };

      await this.saveNotification(notification);

      const user = await prisma.user.findUnique({ where: { id: orderData.userId } });
      if (user) {
        await this.sendPushNotification(user, notification);
      }

      return notification;
    } catch (error) {
      console.error('❌ خطأ في إرسال تحديث الموقع:', error);
      throw new Error(`خطأ في إرسال تحديث الموقع: ${error.message}`);
    }
  }

  /**
   * إرسال إشعار إجمالي الطلبات للفريق (Task 18)
   */
  async sendOrderAggregationNotification(projectId, aggregationData) {
    try {
      // إرسال للمنتجين والإداريين
      const admins = await prisma.user.findMany({
        where: {
          role: { in: ['PRODUCER', 'ADMIN'] },
          isActive: true
        }
      });

      const notifications = [];

      for (const admin of admins) {
        const notification = {
          type: 'SYSTEM',
          title: '📊 تجميع طلبات الفريق',
          message: `تم تجميع ${aggregationData.totalOrders} طلب للمشروع بإجمالي ${aggregationData.totalAmount} ريال`,
          userId: admin.id,
          data: {
            projectId,
            totalOrders: aggregationData.totalOrders,
            totalAmount: aggregationData.totalAmount,
            aggregatedItems: aggregationData.items,
            generatedAt: new Date().toISOString()
          }
        };

        await this.saveNotification(notification);
        await this.sendPushNotification(admin, notification);
        notifications.push(notification);
      }

      return notifications;
    } catch (error) {
      console.error('❌ خطأ في إرسال إشعار التجميع:', error);
      throw new Error(`خطأ في إرسال إشعار التجميع: ${error.message}`);
    }
  }

  // ============================================
  // قنوات الإرسال (Channels)
  // ============================================

  /**
   * إرسال إشعار فوري عبر Firebase Cloud Messaging
   */
  async sendPushNotification(user, notificationData) {
    try {
      if (!this.pushConfig.enabled || !this.pushConfig.serverKey) {
        console.warn('⚠️ Push notifications غير مفعلة');
        return { sent: false, reason: 'Push notifications disabled' };
      }

      // في حالة عدم وجود device token للمستخدم
      if (!user.fcmToken && !user.deviceToken) {
        console.log(`⚠️ لا يوجد FCM token للمستخدم ${user.id}`);
        return { sent: false, reason: 'No FCM token' };
      }

      const fcmPayload = {
        to: user.fcmToken || user.deviceToken,
        notification: {
          title: notificationData.title,
          body: notificationData.message,
          sound: 'default',
          priority: 'high',
          badge: '1'
        },
        data: {
          type: notificationData.type,
          ...notificationData.data
        }
      };

      const response = await axios.post(
        this.pushConfig.apiUrl,
        fcmPayload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `key=${this.pushConfig.serverKey}`
          }
        }
      );

      console.log(`✓ إشعار فوري تم إرساله للمستخدم ${user.id}`);
      return { sent: true, messageId: response.data.message_id };
    } catch (error) {
      console.error('❌ خطأ في إرسال الإشعار الفوري:', error.message);
      return { sent: false, error: error.message };
    }
  }

  /**
   * إرسال رسالة نصية قصيرة عبر Twilio SMS
   */
  async sendSMSNotification(phoneNumber, message) {
    try {
      if (!this.smsConfig.enabled || !this.smsConfig.accountSid) {
        console.warn('⚠️ SMS غير مفعل');
        return { sent: false, reason: 'SMS disabled' };
      }

      if (!phoneNumber) {
        console.log('⚠️ لا يوجد رقم هاتف');
        return { sent: false, reason: 'No phone number' };
      }

      // إعداد Basic Auth لـ Twilio
      const auth = Buffer.from(`${this.smsConfig.accountSid}:${this.smsConfig.authToken}`).toString('base64');

      const response = await axios.post(
        `${this.smsConfig.apiUrl}/Accounts/${this.smsConfig.accountSid}/Messages.json`,
        new URLSearchParams({
          To: phoneNumber,
          From: this.smsConfig.phoneNumber,
          Body: message
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${auth}`
          }
        }
      );

      console.log(`✓ رسالة SMS تم إرسالها إلى ${phoneNumber}`);
      return { sent: true, sid: response.data.sid };
    } catch (error) {
      console.error('❌ خطأ في إرسال SMS:', error.response?.data || error.message);
      return { sent: false, error: error.message };
    }
  }

  /**
   * إرسال إشعار بالبريد الإلكتروني
   */
  async sendEmailNotification(email, notificationData) {
    try {
      if (!this.emailTransporter) {
        console.warn('⚠️ Email غير مفعل');
        return { sent: false, reason: 'Email transporter not configured' };
      }

      if (!email) {
        console.log('⚠️ لا يوجد بريد إلكتروني');
        return { sent: false, reason: 'No email address' };
      }

      const mailOptions = {
        from: process.env.SMTP_FROM || 'BreakApp <noreply@breakapp.com>',
        to: email,
        subject: notificationData.title,
        html: this.generateEmailTemplate(notificationData)
      };

      const result = await this.emailTransporter.sendMail(mailOptions);
      console.log(`✓ بريد إلكتروني تم إرساله إلى ${email}`);

      return { sent: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ خطأ في إرسال البريد الإلكتروني:', error.message);
      return { sent: false, error: error.message };
    }
  }

  // ============================================
  // إدارة الإشعارات (Management)
  // ============================================

  /**
   * حفظ الإشعار في قاعدة البيانات
   */
  async saveNotification(notificationData) {
    try {
      const notification = await prisma.notification.create({
        data: {
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.message,
          userId: notificationData.userId,
          data: notificationData.data || {},
          isRead: false
        }
      });

      return notification;
    } catch (error) {
      console.error('❌ خطأ في حفظ الإشعار:', error);
      throw new Error(`خطأ في حفظ الإشعار: ${error.message}`);
    }
  }

  /**
   * الحصول على إشعارات المستخدم
   */
  async getUserNotifications(userId, options = {}) {
    try {
      const { page = 1, limit = 20, unreadOnly = false } = options;
      const skip = (page - 1) * limit;

      const where = { userId };
      if (unreadOnly) {
        where.isRead = false;
      }

      const notifications = await prisma.notification.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      });

      const total = await prisma.notification.count({ where });
      const unreadCount = await prisma.notification.count({
        where: { userId, isRead: false }
      });

      return {
        notifications,
        unreadCount,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('❌ خطأ في جلب الإشعارات:', error);
      throw new Error(`خطأ في جلب الإشعارات: ${error.message}`);
    }
  }

  /**
   * تحديد الإشعار كمقروء
   */
  async markAsRead(notificationId, userId) {
    try {
      const notification = await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId: userId
        },
        data: {
          isRead: true
        }
      });

      return notification;
    } catch (error) {
      console.error('❌ خطأ في تحديد الإشعار كمقروء:', error);
      throw new Error(`خطأ في تحديد الإشعار كمقروء: ${error.message}`);
    }
  }

  /**
   * تحديد جميع الإشعارات كمقروءة
   */
  async markAllAsRead(userId) {
    try {
      const result = await prisma.notification.updateMany({
        where: {
          userId: userId,
          isRead: false
        },
        data: {
          isRead: true
        }
      });

      return result;
    } catch (error) {
      console.error('❌ خطأ في تحديد جميع الإشعارات كمقروءة:', error);
      throw new Error(`خطأ في تحديد جميع الإشعارات كمقروءة: ${error.message}`);
    }
  }

  /**
   * حذف إشعار
   */
  async deleteNotification(notificationId, userId) {
    try {
      const notification = await prisma.notification.deleteMany({
        where: {
          id: notificationId,
          userId: userId
        }
      });

      return notification;
    } catch (error) {
      console.error('❌ خطأ في حذف الإشعار:', error);
      throw new Error(`خطأ في حذف الإشعار: ${error.message}`);
    }
  }

  // ============================================
  // قوالب وتنسيقات (Templates)
  // ============================================

  /**
   * توليد قالب البريد الإلكتروني
   */
  generateEmailTemplate(notificationData) {
    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${notificationData.title}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #f0f0f0;
          }
          .logo {
            font-size: 32px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 10px;
          }
          .title {
            color: #2c3e50;
            font-size: 24px;
            margin-bottom: 10px;
          }
          .message {
            color: #34495e;
            font-size: 16px;
            line-height: 1.8;
            margin-bottom: 20px;
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 8px;
          }
          .data-section {
            margin: 20px 0;
            padding: 15px;
            background-color: #fff;
            border-left: 4px solid #3498db;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #f0f0f0;
            color: #7f8c8d;
            font-size: 14px;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #3498db;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🍽️ BreakApp</div>
            <h1 class="title">${notificationData.title}</h1>
          </div>
          <div class="message">
            <p>${notificationData.message}</p>
          </div>
          ${notificationData.data ? `
          <div class="data-section">
            <strong>التفاصيل:</strong>
            <pre>${JSON.stringify(notificationData.data, null, 2)}</pre>
          </div>
          ` : ''}
          <div class="footer">
            <p><strong>تطبيق BreakApp</strong></p>
            <p>إدارة الطعام للفرق الإنتاجية</p>
            <p style="font-size: 12px; color: #95a5a6; margin-top: 10px;">
              هذه رسالة تلقائية، الرجاء عدم الرد على هذا البريد
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new NotificationService();

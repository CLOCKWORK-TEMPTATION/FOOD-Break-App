const nodemailer = require('nodemailer');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class NotificationService {
  constructor() {
    this.emailTransporter = this.initializeEmailTransporter();
    this.pushNotificationConfig = this.initializePushNotifications();
  }

  // إعداد خدمة البريد الإلكتروني
  initializeEmailTransporter() {
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  // إعداد الإشعارات الفورية
  initializePushNotifications() {
    // يمكن إضافة Firebase Cloud Messaging أو خدمة أخرى
    return {
      enabled: process.env.PUSH_NOTIFICATIONS_ENABLED === 'true',
      serverKey: process.env.FCM_SERVER_KEY
    };
  }

  // إرسال إشعار تأكيد الطلب
  async sendOrderConfirmation(orderData) {
    try {
      const notification = {
        type: 'ORDER_CONFIRMATION',
        title: 'تم تأكيد طلبك',
        message: `تم تأكيد طلبك رقم ${orderData.id} من مطعم ${orderData.restaurant.name}`,
        userId: orderData.userId,
        orderId: orderData.id,
        data: {
          orderId: orderData.id,
          restaurantName: orderData.restaurant.name,
          totalAmount: orderData.totalAmount,
          estimatedDelivery: orderData.estimatedDelivery
        }
      };

      await this.saveNotification(notification);
      await this.sendPushNotification(orderData.userId, notification);
      await this.sendEmailNotification(orderData.user.email, notification);

      return notification;
    } catch (error) {
      throw new Error(`خطأ في إرسال إشعار تأكيد الطلب: ${error.message}`);
    }
  }

  // إرسال إشعار تحديث حالة الطلب
  async sendOrderStatusUpdate(orderData, newStatus) {
    try {
      const statusMessages = {
        CONFIRMED: 'تم تأكيد طلبك',
        PREPARING: 'جاري تحضير طلبك',
        READY: 'طلبك جاهز للاستلام',
        OUT_FOR_DELIVERY: 'طلبك في الطريق إليك',
        DELIVERED: 'تم تسليم طلبك بنجاح',
        CANCELLED: 'تم إلغاء طلبك'
      };

      const notification = {
        type: 'ORDER_STATUS_UPDATE',
        title: 'تحديث حالة الطلب',
        message: statusMessages[newStatus] || 'تم تحديث حالة طلبك',
        userId: orderData.userId,
        orderId: orderData.id,
        data: {
          orderId: orderData.id,
          newStatus,
          restaurantName: orderData.restaurant.name,
          updatedAt: new Date().toISOString()
        }
      };

      await this.saveNotification(notification);
      await this.sendPushNotification(orderData.userId, notification);

      return notification;
    } catch (error) {
      throw new Error(`خطأ في إرسال إشعار تحديث الحالة: ${error.message}`);
    }
  }

  // إرسال تذكير بموعد الطلب
  async sendOrderReminder(projectId) {
    try {
      // الحصول على جميع أعضاء المشروع الذين لم يقدموا طلبات
      const projectMembers = await prisma.projectMember.findMany({
        where: { projectId },
        include: { user: true }
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const notifications = [];

      for (const member of projectMembers) {
        // التحقق من وجود طلب لليوم
        const existingOrder = await prisma.order.findFirst({
          where: {
            userId: member.userId,
            projectId,
            createdAt: {
              gte: today
            }
          }
        });

        if (!existingOrder) {
          const notification = {
            type: 'ORDER_REMINDER',
            title: 'تذكير: موعد تقديم الطلبات',
            message: 'لا تنس تقديم طلب الطعام لليوم. الموعد النهائي خلال ساعة واحدة.',
            userId: member.userId,
            projectId,
            data: {
              projectId,
              deadline: new Date(Date.now() + 60 * 60 * 1000).toISOString()
            }
          };

          await this.saveNotification(notification);
          await this.sendPushNotification(member.userId, notification);
          notifications.push(notification);
        }
      }

      return notifications;
    } catch (error) {
      throw new Error(`خطأ في إرسال تذكير الطلبات: ${error.message}`);
    }
  }

  // إرسال إشعار تتبع GPS
  async sendDeliveryLocationUpdate(orderData, locationData) {
    try {
      const notification = {
        type: 'DELIVERY_LOCATION_UPDATE',
        title: 'تحديث موقع التوصيل',
        message: `المندوب على بعد ${locationData.distanceKm} كم من موقعك`,
        userId: orderData.userId,
        orderId: orderData.id,
        data: {
          orderId: orderData.id,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          distanceKm: locationData.distanceKm,
          estimatedArrival: locationData.estimatedArrival
        }
      };

      await this.saveNotification(notification);
      await this.sendPushNotification(orderData.userId, notification);

      return notification;
    } catch (error) {
      throw new Error(`خطأ في إرسال تحديث الموقع: ${error.message}`);
    }
  }

  // إرسال إشعار الاستثناءات
  async sendExceptionNotification(exceptionData) {
    try {
      const notification = {
        type: 'EXCEPTION_NOTIFICATION',
        title: 'طلب استثناء جديد',
        message: `تم تقديم طلب استثناء من ${exceptionData.user.name}`,
        userId: exceptionData.approvedBy || exceptionData.projectManagerId,
        data: {
          exceptionId: exceptionData.id,
          requestedBy: exceptionData.user.name,
          reason: exceptionData.reason,
          amount: exceptionData.additionalCost
        }
      };

      await this.saveNotification(notification);
      await this.sendPushNotification(notification.userId, notification);

      return notification;
    } catch (error) {
      throw new Error(`خطأ في إرسال إشعار الاستثناء: ${error.message}`);
    }
  }

  // حفظ الإشعار في قاعدة البيانات
  async saveNotification(notificationData) {
    try {
      const notification = await prisma.notification.create({
        data: {
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.message,
          userId: notificationData.userId,
          orderId: notificationData.orderId,
          projectId: notificationData.projectId,
          data: notificationData.data,
          isRead: false,
          createdAt: new Date()
        }
      });

      return notification;
    } catch (error) {
      throw new Error(`خطأ في حفظ الإشعار: ${error.message}`);
    }
  }

  // إرسال إشعار فوري (Push Notification)
  async sendPushNotification(userId, notificationData) {
    try {
      if (!this.pushNotificationConfig.enabled) {
        return { sent: false, reason: 'Push notifications disabled' };
      }

      // هنا يمكن إضافة منطق إرسال الإشعارات الفورية
      // مثل Firebase Cloud Messaging أو OneSignal
      
      console.log(`إرسال إشعار فوري للمستخدم ${userId}:`, notificationData.title);
      
      return { sent: true, userId, title: notificationData.title };
    } catch (error) {
      console.error('خطأ في إرسال الإشعار الفوري:', error);
      return { sent: false, error: error.message };
    }
  }

  // إرسال إشعار بالبريد الإلكتروني
  async sendEmailNotification(email, notificationData) {
    try {
      if (!this.emailTransporter) {
        return { sent: false, reason: 'Email transporter not configured' };
      }

      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@breakapp.com',
        to: email,
        subject: notificationData.title,
        html: this.generateEmailTemplate(notificationData)
      };

      const result = await this.emailTransporter.sendMail(mailOptions);
      
      return { sent: true, messageId: result.messageId };
    } catch (error) {
      console.error('خطأ في إرسال البريد الإلكتروني:', error);
      return { sent: false, error: error.message };
    }
  }

  // توليد قالب البريد الإلكتروني
  generateEmailTemplate(notificationData) {
    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${notificationData.title}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 30px; }
          .title { color: #2c3e50; font-size: 24px; margin-bottom: 10px; }
          .message { color: #34495e; font-size: 16px; line-height: 1.6; margin-bottom: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #7f8c8d; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="title">${notificationData.title}</h1>
          </div>
          <div class="message">
            <p>${notificationData.message}</p>
          </div>
          <div class="footer">
            <p>تطبيق BreakApp - إدارة الطعام للفرق الإنتاجية</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // الحصول على إشعارات المستخدم
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

      return {
        notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`خطأ في جلب الإشعارات: ${error.message}`);
    }
  }

  // تحديد الإشعار كمقروء
  async markAsRead(notificationId, userId) {
    try {
      const notification = await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId: userId
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      return notification;
    } catch (error) {
      throw new Error(`خطأ في تحديد الإشعار كمقروء: ${error.message}`);
    }
  }

  // ============================================
  // نظام التذكيرات النصف ساعية
  // Half-Hourly Reminder System
  // ============================================

  /**
   * إرسال تذكير نصف ساعي للمستخدم
   * @param {Object} user - بيانات المستخدم
   * @param {Object} project - بيانات المشروع
   * @param {Object} reminderMessage - رسالة التذكير
   * @param {Array} channels - قنوات الإرسال ['push', 'email', 'sms']
   * @returns {Object} حالة الإرسال
   */
  async sendHalfHourlyReminder(user, project, reminderMessage, channels = ['push']) {
    try {
      const deliveryStatus = {
        push: false,
        email: false,
        sms: false,
        overallStatus: 'FAILED'
      };

      let successCount = 0;

      // إرسال Push Notification
      if (channels.includes('push')) {
        const pushResult = await this.sendPushNotification(user.id, {
          type: 'ORDER_REMINDER',
          title: reminderMessage.title,
          message: reminderMessage.message,
          data: {
            projectId: project.id,
            projectName: project.name,
            timeRemaining: reminderMessage.timeRemaining,
            reminderType: 'HALF_HOURLY'
          }
        });

        deliveryStatus.push = pushResult.sent;
        if (pushResult.sent) successCount++;
      }

      // إرسال Email
      if (channels.includes('email') && user.email) {
        const emailResult = await this.sendReminderEmail(user.email, reminderMessage, project);
        deliveryStatus.email = emailResult.sent;
        if (emailResult.sent) successCount++;
      }

      // إرسال SMS (إذا كان متاحاً)
      if (channels.includes('sms') && user.phoneNumber) {
        const smsResult = await this.sendReminderSMS(user.phoneNumber, reminderMessage);
        deliveryStatus.sms = smsResult.sent;
        if (smsResult.sent) successCount++;
      }

      // حفظ الإشعار في قاعدة البيانات
      await this.saveNotification({
        type: 'REMINDER',
        title: reminderMessage.title,
        message: reminderMessage.message,
        userId: user.id,
        projectId: project.id,
        data: {
          projectName: project.name,
          timeRemaining: reminderMessage.timeRemaining,
          channels: channels,
          deliveryStatus: deliveryStatus
        }
      });

      // تحديد الحالة العامة
      if (successCount > 0) {
        deliveryStatus.overallStatus = successCount === channels.length ? 'SENT' : 'PARTIAL';
      }

      return deliveryStatus;
    } catch (error) {
      console.error('خطأ في إرسال التذكير النصف ساعي:', error);
      return {
        push: false,
        email: false,
        sms: false,
        overallStatus: 'FAILED',
        error: error.message
      };
    }
  }

  /**
   * إرسال بريد إلكتروني للتذكير
   */
  async sendReminderEmail(email, reminderMessage, project) {
    try {
      if (!this.emailTransporter) {
        return { sent: false, reason: 'Email transporter not configured' };
      }

      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@breakapp.com',
        to: email,
        subject: reminderMessage.title,
        html: this.generateReminderEmailTemplate(reminderMessage, project)
      };

      const result = await this.emailTransporter.sendMail(mailOptions);

      return { sent: true, messageId: result.messageId };
    } catch (error) {
      console.error('خطأ في إرسال البريد الإلكتروني للتذكير:', error);
      return { sent: false, error: error.message };
    }
  }

  /**
   * توليد قالب البريد الإلكتروني للتذكير
   */
  generateReminderEmailTemplate(reminderMessage, project) {
    const urgencyColor = reminderMessage.timeRemaining <= 15 ? '#e74c3c' :
                        reminderMessage.timeRemaining <= 30 ? '#f39c12' : '#3498db';

    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${reminderMessage.title}</title>
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
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: linear-gradient(135deg, ${urgencyColor} 0%, ${urgencyColor}dd 100%);
            border-radius: 8px;
            color: white;
          }
          .icon {
            font-size: 48px;
            margin-bottom: 10px;
          }
          .title {
            font-size: 24px;
            font-weight: bold;
            margin: 0;
          }
          .message {
            color: #2c3e50;
            font-size: 18px;
            line-height: 1.8;
            margin: 20px 0;
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 8px;
            border-right: 4px solid ${urgencyColor};
          }
          .time-remaining {
            text-align: center;
            font-size: 32px;
            font-weight: bold;
            color: ${urgencyColor};
            margin: 30px 0;
            padding: 20px;
            background-color: #fff3cd;
            border-radius: 8px;
          }
          .cta-button {
            display: block;
            width: fit-content;
            margin: 30px auto;
            padding: 15px 40px;
            background-color: ${urgencyColor};
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-size: 18px;
            font-weight: bold;
            text-align: center;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            color: #6c757d;
            font-size: 14px;
          }
          .project-info {
            background-color: #e8f5e9;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .project-name {
            font-weight: bold;
            color: #2e7d32;
            font-size: 16px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="icon">🔔</div>
            <h1 class="title">${reminderMessage.title}</h1>
          </div>

          <div class="message">
            <p>${reminderMessage.message}</p>
          </div>

          <div class="project-info">
            <div class="project-name">📋 المشروع: ${project.name}</div>
          </div>

          <div class="time-remaining">
            ⏰ ${reminderMessage.timeRemaining} دقيقة متبقية
          </div>

          <a href="${process.env.APP_URL || 'https://breakapp.com'}/orders/new?projectId=${project.id}" class="cta-button">
            قدّم طلبك الآن
          </a>

          <div class="footer">
            <p>تطبيق BreakApp - إدارة الطعام للفرق الإنتاجية</p>
            <p style="font-size: 12px; color: #adb5bd;">
              إذا كنت قد قدمت طلبك بالفعل، يرجى تجاهل هذه الرسالة.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * إرسال رسالة نصية (SMS) للتذكير
   * يمكن التكامل مع خدمات مثل Twilio أو local SMS gateway
   */
  async sendReminderSMS(phoneNumber, reminderMessage) {
    try {
      // TODO: التكامل مع خدمة SMS (Twilio, etc.)
      // هذا مثال افتراضي
      console.log(`📱 إرسال SMS إلى ${phoneNumber}: ${reminderMessage.message}`);

      // في الإنتاج، سيتم التكامل مع خدمة حقيقية
      return { sent: false, reason: 'SMS service not configured' };
    } catch (error) {
      console.error('خطأ في إرسال الرسالة النصية:', error);
      return { sent: false, error: error.message };
    }
  }

  /**
   * إرسال تذكير فوري لمشروع معين (استدعاء يدوي)
   */
  async sendImmediateProjectReminder(projectId) {
    try {
      const project = await prisma.project.findUnique({
        where: { id: projectId }
      });

      if (!project) {
        throw new Error('المشروع غير موجود');
      }

      // استدعاء خدمة التذكير
      const reminderScheduler = require('./reminderSchedulerService');
      await reminderScheduler.processProjectReminders(project, new Date());

      return { success: true, message: 'تم إرسال التذكيرات بنجاح' };
    } catch (error) {
      throw new Error(`خطأ في إرسال التذكير الفوري: ${error.message}`);
    }
  }
}

module.exports = new NotificationService();
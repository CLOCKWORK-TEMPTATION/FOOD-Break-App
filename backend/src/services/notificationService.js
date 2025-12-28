const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

let nodemailer = null;
try {
  // اختياري: لا نكسر السيرفر إذا لم تُثبت الحزمة في بيئة معينة
  nodemailer = require('nodemailer');
} catch (_) {
  nodemailer = null;
}

class NotificationService {
  constructor() {
    this.emailTransporter = this.initializeEmailTransporter();
    this.pushNotificationConfig = this.initializePushNotifications();
  }

  initializeEmailTransporter() {
    try {
      if (!nodemailer) return null;
      if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) return null;

      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    } catch (error) {
      logger.warn(`تعذر تهيئة SMTP: ${error.message}`);
      return null;
    }
  }

  initializePushNotifications() {
    // Placeholder: يمكن ربط FCM لاحقاً عبر server key + device tokens
    return {
      enabled: process.env.PUSH_NOTIFICATIONS_ENABLED === 'true',
      provider: process.env.PUSH_PROVIDER || 'NONE'
    };
  }

  /**
   * Why: توحيد mapping إلى NotificationType (enum) لمنع أخطاء Prisma runtime.
   */
  mapOrderStatusToNotificationType(orderStatus) {
    switch (orderStatus) {
      case 'CONFIRMED':
        return 'ORDER_CONFIRMED';
      case 'READY':
        return 'ORDER_READY';
      case 'DELIVERED':
        return 'ORDER_DELIVERED';
      default:
        return 'SYSTEM';
    }
  }

  async saveNotification(notificationData) {
    try {
      return await prisma.notification.create({
        data: {
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.message,
          userId: notificationData.userId,
          orderId: notificationData.orderId || null,
          projectId: notificationData.projectId || null,
          data: notificationData.data || null,
          isRead: false
        }
      });
    } catch (error) {
      throw new Error(`خطأ في حفظ الإشعار: ${error.message}`);
    }
  }

  async sendPushNotification(userId, notificationData) {
    try {
      if (!this.pushNotificationConfig.enabled) return { sent: false, reason: 'disabled' };
      logger.info({ msg: 'Push notification placeholder', userId, title: notificationData.title });
      return { sent: true };
    } catch (error) {
      logger.warn(`فشل إرسال Push: ${error.message}`);
      return { sent: false, error: error.message };
    }
  }

  async sendEmailNotification(email, notificationData) {
    try {
      if (!this.emailTransporter) return { sent: false, reason: 'smtp_not_configured' };
      if (!email) return { sent: false, reason: 'missing_email' };

      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@breakapp.com',
        to: email,
        subject: notificationData.title,
        html: this.generateEmailTemplate(notificationData)
      };

      const result = await this.emailTransporter.sendMail(mailOptions);
      return { sent: true, messageId: result.messageId };
    } catch (error) {
      logger.warn(`فشل إرسال البريد: ${error.message}`);
      return { sent: false, error: error.message };
    }
  }

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
          .title { color: #2c3e50; font-size: 22px; margin-bottom: 10px; }
          .message { color: #34495e; font-size: 16px; line-height: 1.6; }
          .footer { text-align: center; margin-top: 24px; color: #7f8c8d; font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 class="title">${notificationData.title}</h1>
          <div class="message">${notificationData.message}</div>
          <div class="footer">BreakApp</div>
        </div>
      </body>
      </html>
    `;
  }

  // ============ Phase 1: Order workflow notifications ============

  async sendOrderConfirmation(order) {
    const restaurantName = order.restaurant?.name || 'المطعم';
    const userEmail = order.user?.email;

    const payload = {
      type: 'ORDER_CONFIRMED',
      title: 'تم تأكيد طلبك',
      message: `تم استلام طلبك رقم ${order.id} من ${restaurantName}`,
      userId: order.userId,
      orderId: order.id,
      projectId: order.projectId || null,
      data: {
        orderId: order.id,
        restaurantName,
        totalAmount: order.totalAmount
      }
    };

    const saved = await this.saveNotification(payload);
    await this.sendPushNotification(order.userId, payload);
    await this.sendEmailNotification(userEmail, payload);
    return saved;
  }

  async sendOrderStatusUpdate(order, newStatus) {
    const restaurantName = order.restaurant?.name || 'المطعم';
    const type = this.mapOrderStatusToNotificationType(newStatus);

    const statusMessages = {
      CONFIRMED: 'تم تأكيد طلبك',
      PREPARING: 'جاري تحضير طلبك',
      READY: 'طلبك جاهز',
      OUT_FOR_DELIVERY: 'طلبك في الطريق إليك',
      DELIVERED: 'تم تسليم طلبك بنجاح',
      CANCELLED: 'تم إلغاء طلبك'
    };

    const payload = {
      type,
      title: 'تحديث حالة الطلب',
      message: statusMessages[newStatus] || `تم تحديث حالة طلبك إلى: ${newStatus}`,
      userId: order.userId,
      orderId: order.id,
      projectId: order.projectId || null,
      data: {
        orderId: order.id,
        newStatus,
        restaurantName
      }
    };

    const saved = await this.saveNotification(payload);
    await this.sendPushNotification(order.userId, payload);
    return saved;
  }

  // توافق مع استدعاءات workflowController القديمة
  async sendOrderStatus(order, messageOrStatus) {
    if (typeof messageOrStatus === 'string' && messageOrStatus.startsWith('تم ')) {
      const payload = {
        type: 'SYSTEM',
        title: 'تحديث',
        message: messageOrStatus,
        userId: order.userId,
        orderId: order.id,
        projectId: order.projectId || null,
        data: { orderId: order.id }
      };
      const saved = await this.saveNotification(payload);
      await this.sendPushNotification(order.userId, payload);
      return saved;
    }
    return this.sendOrderStatusUpdate(order, messageOrStatus);
  }

  async sendDeliveryNotification(order) {
    const payload = {
      type: 'ORDER_DELIVERED',
      title: 'تم تسليم الطلب',
      message: `تم تسليم طلبك رقم ${order.id}`,
      userId: order.userId,
      orderId: order.id,
      projectId: order.projectId || null,
      data: { orderId: order.id, deliveredAt: order.deliveredAt }
    };
    const saved = await this.saveNotification(payload);
    await this.sendPushNotification(order.userId, payload);
    return saved;
  }

  async notifyProducersNewOrder(order) {
    try {
      const producers = await prisma.user.findMany({
        where: { role: { in: ['PRODUCER', 'ADMIN'] }, isActive: true },
        select: { id: true }
      });

      const title = 'طلب جديد';
      const message = `تم تقديم طلب جديد للمشروع ${order.projectId || ''}`.trim();

      await Promise.all(
        producers.map((u) =>
          this.saveNotification({
            type: 'SYSTEM',
            title,
            message,
            userId: u.id,
            orderId: order.id,
            projectId: order.projectId || null,
            data: { orderId: order.id, projectId: order.projectId }
          })
        )
      );
    } catch (error) {
      logger.warn(`فشل إشعار المنتجين: ${error.message}`);
    }
  }

  async sendReminder(userId, projectId, remainingText) {
    const payload = {
      type: 'REMINDER',
      title: 'تذكير: موعد تقديم الطلبات',
      message: `الموعد النهائي لتقديم الطلبات خلال ${remainingText}`,
      userId,
      projectId,
      data: { projectId }
    };
    const saved = await this.saveNotification(payload);
    await this.sendPushNotification(userId, payload);
    return saved;
  }

  async sendOrderReminder(projectId) {
    const projectMembers = await prisma.projectMember.findMany({
      where: { projectId },
      select: { userId: true }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const notifications = [];
    for (const member of projectMembers) {
      const existingOrder = await prisma.order.findFirst({
        where: {
          userId: member.userId,
          projectId,
          createdAt: { gte: today }
        },
        select: { id: true }
      });

      if (!existingOrder) {
        notifications.push(await this.sendReminder(member.userId, projectId, 'ساعة واحدة'));
      }
    }
    return notifications;
  }

  /**
   * إشعار تحديث موقع التوصيل (DB-backed)
   * Why: نحتاج End-to-End بدون WebSocket حالياً.
   */
  async sendLocationUpdate(orderId, { latitude, longitude, etaMinutes }) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, userId: true, projectId: true }
      });
      if (!order) return null;

      const payload = {
        type: 'SYSTEM',
        title: 'تحديث موقع التوصيل',
        message: etaMinutes ? `الوقت المتوقع للوصول: ${etaMinutes} دقيقة` : 'تم تحديث موقع المندوب',
        userId: order.userId,
        orderId: order.id,
        projectId: order.projectId || null,
        data: { latitude, longitude, etaMinutes }
      };

      const saved = await this.saveNotification(payload);
      await this.sendPushNotification(order.userId, payload);
      return saved;
    } catch (error) {
      logger.warn(`فشل إشعار الموقع: ${error.message}`);
      return null;
    }
  }

  async getUserNotifications(userId, options = {}) {
    const page = Number(options.page || 1);
    const limit = Math.min(Number(options.limit || 20), 100);
    const unreadOnly = options.unreadOnly === 'true' || options.unreadOnly === true;
    const skip = (page - 1) * limit;

    const where = { userId, ...(unreadOnly ? { isRead: false } : {}) };

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.notification.count({ where })
    ]);

    return {
      notifications,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    };
  }

  async markAsRead(notificationId, userId) {
    const result = await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true, readAt: new Date() }
    });
    return result;
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
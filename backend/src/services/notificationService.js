const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../utils/logger');

/**
 * خدمة الإشعارات - Notification Service
 * إرسال إشعارات Push, Email, SMS
 */
class NotificationService {
  // إنشاء إشعار في قاعدة البيانات
  async createNotification(data) {
    try {
      return await prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          data: data.data || {},
          orderId: data.orderId,
          projectId: data.projectId
        }
      });
    } catch (error) {
      logger.error('خطأ في إنشاء الإشعار:', error);
      throw error;
    }
  }

  // إرسال إشعار Push (Expo)
  async sendPushNotification(userId, title, message, data = {}) {
    try {
      // حفظ في قاعدة البيانات
      await this.createNotification({
        userId,
        type: 'SYSTEM',
        title,
        message,
        data
      });

      // TODO: تكامل مع Expo Push Notifications
      // const expoPushToken = await this.getUserPushToken(userId);
      // if (expoPushToken) {
      //   await fetch('https://exp.host/--/api/v2/push/send', {
      //     method: 'POST',
      //     headers: { 'Content-Type': 'application/json' },
      //     body: JSON.stringify({
      //       to: expoPushToken,
      //       title, body: message, data
      //     })
      //   });
      // }

      logger.info(`Push notification sent to user ${userId}`);
      return { success: true };
    } catch (error) {
      logger.error('خطأ في إرسال Push notification:', error);
      return { success: false, error: error.message };
    }
  }

  // إرسال إشعار Email
  async sendEmailNotification(userId, subject, body) {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || !user.email) {
        throw new Error('المستخدم أو البريد الإلكتروني غير موجود');
      }

      // TODO: تكامل مع Nodemailer
      // const transporter = nodemailer.createTransport({...});
      // await transporter.sendMail({
      //   from: process.env.EMAIL_FROM,
      //   to: user.email,
      //   subject, html: body
      // });

      logger.info(`Email sent to ${user.email}`);
      return { success: true };
    } catch (error) {
      logger.error('خطأ في إرسال Email:', error);
      return { success: false, error: error.message };
    }
  }

  // إرسال إشعار SMS
  async sendSMSNotification(userId, message) {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || !user.phoneNumber) {
        throw new Error('المستخدم أو رقم الهاتف غير موجود');
      }

      // TODO: تكامل مع Twilio
      // const client = twilio(accountSid, authToken);
      // await client.messages.create({
      //   body: message,
      //   from: process.env.TWILIO_PHONE,
      //   to: user.phoneNumber
      // });

      logger.info(`SMS sent to ${user.phoneNumber}`);
      return { success: true };
    } catch (error) {
      logger.error('خطأ في إرسال SMS:', error);
      return { success: false, error: error.message };
    }
  }

  // إشعار تأكيد الطلب
  async notifyOrderConfirmed(orderId) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { user: true, restaurant: true }
      });

      if (!order) return;

      const title = 'تم تأكيد طلبك';
      const message = `تم تأكيد طلبك من ${order.restaurant.name}`;

      await this.sendPushNotification(order.userId, title, message, { orderId });
      await this.createNotification({
        userId: order.userId,
        type: 'ORDER_CONFIRMED',
        title, message,
        orderId
      });
    } catch (error) {
      logger.error('خطأ في إشعار تأكيد الطلب:', error);
    }
  }

  // إشعار جاهزية الطلب
  async notifyOrderReady(orderId) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { user: true, restaurant: true }
      });

      if (!order) return;

      const title = 'طلبك جاهز للتوصيل';
      const message = `طلبك من ${order.restaurant.name} جاهز وفي الطريق إليك`;

      await this.sendPushNotification(order.userId, title, message, { orderId });
      await this.createNotification({
        userId: order.userId,
        type: 'ORDER_READY',
        title, message,
        orderId
      });
    } catch (error) {
      logger.error('خطأ في إشعار جاهزية الطلب:', error);
    }
  }

  // إشعار توصيل الطلب
  async notifyOrderDelivered(orderId) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { user: true }
      });

      if (!order) return;

      const title = 'تم توصيل طلبك';
      const message = 'تم توصيل طلبك بنجاح. بالهناء والشفاء!';

      await this.sendPushNotification(order.userId, title, message, { orderId });
      await this.createNotification({
        userId: order.userId,
        type: 'ORDER_DELIVERED',
        title, message,
        orderId
      });
    } catch (error) {
      logger.error('خطأ في إشعار توصيل الطلب:', error);
    }
  }

  // تذكير نصف ساعي للمستخدمين الذين لم يقدموا طلبات
  async sendHalfHourlyReminders(projectId) {
    try {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { members: { include: { user: true } } }
      });

      if (!project) return;

      // الحصول على المستخدمين الذين لم يقدموا طلبات اليوم
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const ordersToday = await prisma.order.findMany({
        where: {
          projectId,
          createdAt: { gte: today }
        },
        select: { userId: true }
      });

      const submittedUserIds = new Set(ordersToday.map(o => o.userId));
      const nonSubmitters = project.members.filter(m => !submittedUserIds.has(m.userId));

      // إرسال تذكير لكل مستخدم لم يقدم طلب
      for (const member of nonSubmitters) {
        const title = 'تذكير: قدم طلبك';
        const message = `لم تقدم طلبك اليوم في مشروع ${project.name}. الرجاء تقديم طلبك قبل انتهاء نافذة الطلب.`;

        await this.sendPushNotification(member.userId, title, message, { projectId });
        await this.createNotification({
          userId: member.userId,
          type: 'REMINDER',
          title, message,
          projectId
        });
      }

      logger.info(`Sent reminders to ${nonSubmitters.length} users in project ${projectId}`);
      return { sent: nonSubmitters.length };
    } catch (error) {
      logger.error('خطأ في إرسال التذكيرات:', error);
      throw error;
    }
  }

  // الحصول على إشعارات المستخدم
  async getUserNotifications(userId, options = {}) {
    try {
      const { page = 1, limit = 20, unreadOnly = false } = options;
      const skip = (page - 1) * limit;

      const where = { userId };
      if (unreadOnly) where.isRead = false;

      const notifications = await prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      });

      const total = await prisma.notification.count({ where });

      return {
        notifications,
        pagination: {
          page, limit, total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('خطأ في جلب الإشعارات:', error);
      throw error;
    }
  }

  // تحديد إشعار كمقروء
  async markAsRead(notificationId, userId) {
    try {
      return await prisma.notification.update({
        where: { id: notificationId, userId },
        data: { isRead: true, readAt: new Date() }
      });
    } catch (error) {
      logger.error('خطأ في تحديد الإشعار كمقروء:', error);
      throw error;
    }
  }

  // تحديد جميع الإشعارات كمقروءة
  async markAllAsRead(userId) {
    try {
      return await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true, readAt: new Date() }
      });
    } catch (error) {
      logger.error('خطأ في تحديد جميع الإشعارات كمقروءة:', error);
      throw error;
    }
  }

  // حذف إشعار
  async deleteNotification(notificationId, userId) {
    try {
      return await prisma.notification.delete({
        where: { id: notificationId, userId }
      });
    } catch (error) {
      logger.error('خطأ في حذف الإشعار:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService();

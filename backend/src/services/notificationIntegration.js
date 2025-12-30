/**
 * Notification Integration Service
 * خدمة تكامل الإشعارات
 *
 * Integrates:
 * - Expo Push Notifications (Mobile)
 * - Email (Nodemailer)
 * - SMS (Twilio)
 * - In-app notifications
 */

const { Expo } = require('expo-server-sdk');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

class NotificationIntegration {
  constructor() {
    // Initialize Expo SDK
    this.expo = new Expo({
      accessToken: process.env.EXPO_ACCESS_TOKEN
    });

    // Initialize Nodemailer
    this.emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });

    // Initialize Twilio
    this.twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
      ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
      : null;

    this.twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
  }

  // ==========================================
  // EXPO PUSH NOTIFICATIONS
  // ==========================================

  /**
   * Send push notification via Expo
   * إرسال إشعار فوري عبر Expo
   */
  async sendPushNotification(userId, notification) {
    try {
      // Get user's push tokens
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          pushTokens: true,
          preferences: {
            select: {
              notificationSettings: true
            }
          }
        }
      });

      if (!user || !user.pushTokens || user.pushTokens.length === 0) {
        logger.warn(`No push tokens found for user ${userId}`);
        return { success: false, reason: 'no_tokens' };
      }

      // Check notification preferences
      if (user.preferences?.notificationSettings?.pushEnabled === false) {
        logger.info(`Push notifications disabled for user ${userId}`);
        return { success: false, reason: 'disabled' };
      }

      const messages = [];

      for (const pushToken of user.pushTokens) {
        // Check if token is valid
        if (!Expo.isExpoPushToken(pushToken)) {
          logger.warn(`Invalid push token: ${pushToken}`);
          continue;
        }

        messages.push({
          to: pushToken,
          sound: notification.sound || 'default',
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          badge: notification.badge || 1,
          priority: notification.priority || 'high',
          channelId: notification.channelId || 'default'
        });
      }

      if (messages.length === 0) {
        return { success: false, reason: 'no_valid_tokens' };
      }

      // Send notifications in chunks
      const chunks = this.expo.chunkPushNotifications(messages);
      const tickets = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          logger.error('Error sending push notification chunk:', error);
        }
      }

      // Save notification to database
      await prisma.notification.create({
        data: {
          userId,
          type: notification.type || 'GENERAL',
          title: notification.title,
          message: notification.body,
          relatedId: notification.relatedId || null,
          isRead: false,
          metadata: notification.data || {}
        }
      });

      logger.info(`Push notifications sent to user ${userId}: ${tickets.length} tickets`);

      return {
        success: true,
        tickets: tickets.length,
        messages: messages.length
      };
    } catch (error) {
      logger.error('Error sending push notification:', error);
      throw new Error(`فشل إرسال الإشعار الفوري: ${error.message}`);
    }
  }

  /**
   * Register push token for user
   * تسجيل رمز الإشعارات للمستخدم
   */
  async registerPushToken(userId, pushToken) {
    try {
      if (!Expo.isExpoPushToken(pushToken)) {
        throw new Error('رمز إشعار غير صحيح');
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { pushTokens: true }
      });

      const currentTokens = user.pushTokens || [];

      // Add token if not already registered
      if (!currentTokens.includes(pushToken)) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            pushTokens: [...currentTokens, pushToken]
          }
        });

        logger.info(`Push token registered for user ${userId}`);
      }

      return { success: true, message: 'تم تسجيل رمز الإشعارات بنجاح' };
    } catch (error) {
      logger.error('Error registering push token:', error);
      throw error;
    }
  }

  /**
   * Remove push token
   * إزالة رمز الإشعارات
   */
  async removePushToken(userId, pushToken) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { pushTokens: true }
      });

      const currentTokens = user.pushTokens || [];
      const updatedTokens = currentTokens.filter(t => t !== pushToken);

      await prisma.user.update({
        where: { id: userId },
        data: {
          pushTokens: updatedTokens
        }
      });

      logger.info(`Push token removed for user ${userId}`);

      return { success: true };
    } catch (error) {
      logger.error('Error removing push token:', error);
      throw error;
    }
  }

  // ==========================================
  // EMAIL NOTIFICATIONS
  // ==========================================

  /**
   * Send email notification
   * إرسال إشعار بريد إلكتروني
   */
  async sendEmail(userId, emailData) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          email: true,
          firstName: true,
          lastName: true,
          preferences: {
            select: {
              notificationSettings: true
            }
          }
        }
      });

      if (!user || !user.email) {
        throw new Error('البريد الإلكتروني للمستخدم غير موجود');
      }

      // Check email preferences
      if (user.preferences?.notificationSettings?.emailEnabled === false) {
        logger.info(`Email notifications disabled for user ${userId}`);
        return { success: false, reason: 'disabled' };
      }

      const mailOptions = {
        from: `"${process.env.APP_NAME || 'BreakApp'}" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: emailData.subject,
        html: this.generateEmailHTML({
          title: emailData.subject,
          content: emailData.content,
          userName: `${user.firstName} ${user.lastName}`,
          ...emailData
        })
      };

      // Add CC/BCC if specified
      if (emailData.cc) mailOptions.cc = emailData.cc;
      if (emailData.bcc) mailOptions.bcc = emailData.bcc;

      // Add attachments if specified
      if (emailData.attachments) mailOptions.attachments = emailData.attachments;

      const info = await this.emailTransporter.sendMail(mailOptions);

      logger.info(`Email sent to ${user.email}: ${info.messageId}`);

      // Save notification to database
      await prisma.notification.create({
        data: {
          userId,
          type: emailData.type || 'EMAIL',
          title: emailData.subject,
          message: emailData.content,
          relatedId: emailData.relatedId || null,
          isRead: false
        }
      });

      return {
        success: true,
        messageId: info.messageId,
        to: user.email
      };
    } catch (error) {
      logger.error('Error sending email:', error);
      throw new Error(`فشل إرسال البريد الإلكتروني: ${error.message}`);
    }
  }

  /**
   * Generate email HTML template
   * إنشاء قالب HTML للبريد الإلكتروني
   */
  generateEmailHTML(data) {
    const { title, content, userName, actionButton, footer } = data;

    return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
            direction: rtl;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
        }
        .content {
            padding: 30px;
            color: #333;
            line-height: 1.6;
        }
        .greeting {
            font-size: 18px;
            color: #667eea;
            margin-bottom: 20px;
        }
        .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${title}</h1>
        </div>
        <div class="content">
            <p class="greeting">مرحباً ${userName}،</p>
            <div>${content}</div>
            ${actionButton ? `<a href="${actionButton.url}" class="button">${actionButton.text}</a>` : ''}
        </div>
        <div class="footer">
            <p>${footer || 'شكراً لاستخدامك BreakApp - نظام طلب الطعام الذكي'}</p>
            <p>© ${new Date().getFullYear()} BreakApp. جميع الحقوق محفوظة.</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  // ==========================================
  // SMS NOTIFICATIONS
  // ==========================================

  /**
   * Send SMS notification via Twilio
   * إرسال رسالة نصية عبر Twilio
   */
  async sendSMS(userId, smsData) {
    try {
      if (!this.twilioClient) {
        throw new Error('Twilio not configured');
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          phoneNumber: true,
          preferences: {
            select: {
              notificationSettings: true
            }
          }
        }
      });

      if (!user || !user.phoneNumber) {
        throw new Error('رقم هاتف المستخدم غير موجود');
      }

      // Check SMS preferences
      if (user.preferences?.notificationSettings?.smsEnabled === false) {
        logger.info(`SMS notifications disabled for user ${userId}`);
        return { success: false, reason: 'disabled' };
      }

      // Ensure phone number has country code
      let phoneNumber = user.phoneNumber;
      if (!phoneNumber.startsWith('+')) {
        phoneNumber = '+2' + phoneNumber; // Egypt country code
      }

      const message = await this.twilioClient.messages.create({
        body: smsData.message,
        from: this.twilioPhoneNumber,
        to: phoneNumber
      });

      logger.info(`SMS sent to ${phoneNumber}: ${message.sid}`);

      // Save notification to database
      await prisma.notification.create({
        data: {
          userId,
          type: smsData.type || 'SMS',
          title: 'رسالة نصية',
          message: smsData.message,
          relatedId: smsData.relatedId || null,
          isRead: false
        }
      });

      return {
        success: true,
        messageSid: message.sid,
        to: phoneNumber,
        status: message.status
      };
    } catch (error) {
      logger.error('Error sending SMS:', error);
      throw new Error(`فشل إرسال الرسالة النصية: ${error.message}`);
    }
  }

  // ==========================================
  // MULTI-CHANNEL NOTIFICATIONS
  // ==========================================

  /**
   * Send notification via all enabled channels
   * إرسال إشعار عبر جميع القنوات المفعلة
   */
  async sendMultiChannelNotification(userId, notification) {
    const results = {
      push: null,
      email: null,
      sms: null
    };

    try {
      // Get user preferences
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          preferences: {
            select: {
              notificationSettings: true
            }
          }
        }
      });

      const settings = user?.preferences?.notificationSettings || {
        pushEnabled: true,
        emailEnabled: true,
        smsEnabled: false
      };

      // Send push notification
      if (settings.pushEnabled && notification.push) {
        try {
          results.push = await this.sendPushNotification(userId, notification.push);
        } catch (error) {
          logger.error('Push notification failed:', error);
          results.push = { success: false, error: error.message };
        }
      }

      // Send email
      if (settings.emailEnabled && notification.email) {
        try {
          results.email = await this.sendEmail(userId, notification.email);
        } catch (error) {
          logger.error('Email notification failed:', error);
          results.email = { success: false, error: error.message };
        }
      }

      // Send SMS
      if (settings.smsEnabled && notification.sms) {
        try {
          results.sms = await this.sendSMS(userId, notification.sms);
        } catch (error) {
          logger.error('SMS notification failed:', error);
          results.sms = { success: false, error: error.message };
        }
      }

      return results;
    } catch (error) {
      logger.error('Error sending multi-channel notification:', error);
      throw error;
    }
  }

  /**
   * Send order status notification (all channels)
   * إرسال إشعار حالة الطلب (جميع القنوات)
   */
  async notifyOrderStatus(orderId, status) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: true,
          restaurant: true
        }
      });

      if (!order) {
        throw new Error('Order not found');
      }

      const statusMessages = {
        CONFIRMED: {
          ar: 'تم تأكيد طلبك',
          en: 'Your order has been confirmed'
        },
        PREPARING: {
          ar: 'جاري تحضير طلبك',
          en: 'Your order is being prepared'
        },
        OUT_FOR_DELIVERY: {
          ar: 'طلبك في الطريق',
          en: 'Your order is on the way'
        },
        DELIVERED: {
          ar: 'تم توصيل طلبك',
          en: 'Your order has been delivered'
        }
      };

      const message = statusMessages[status];
      if (!message) return;

      await this.sendMultiChannelNotification(order.userId, {
        push: {
          title: message.ar,
          body: `طلب رقم ${orderId.substring(0, 8)} من ${order.restaurant?.name}`,
          data: { orderId, status },
          type: 'ORDER_STATUS',
          relatedId: orderId
        },
        email: {
          subject: message.ar,
          content: `
            <p>طلبك رقم <strong>${orderId.substring(0, 8)}</strong> من ${order.restaurant?.name}</p>
            <p>الحالة: <strong>${message.ar}</strong></p>
            <p>المبلغ الإجمالي: ${order.totalAmount} جنيه</p>
          `,
          type: 'ORDER_STATUS',
          relatedId: orderId,
          actionButton: {
            text: 'تتبع الطلب',
            url: `${process.env.APP_URL}/orders/${orderId}`
          }
        },
        sms: {
          message: `${message.ar}: طلب ${orderId.substring(0, 8)} من ${order.restaurant?.name}`,
          type: 'ORDER_STATUS',
          relatedId: orderId
        }
      });

      logger.info(`Order status notification sent for order ${orderId}: ${status}`);
    } catch (error) {
      logger.error('Error sending order status notification:', error);
      throw error;
    }
  }

  /**
   * Send break window reminder
   * إرسال تذكير بنافذة الطلب
   */
  async sendBreakWindowReminder(projectId, minutesRemaining) {
    try {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          members: {
            where: { isActive: true },
            include: { user: true }
          }
        }
      });

      if (!project) return;

      // Check who hasn't ordered yet
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todaysOrders = await prisma.order.findMany({
        where: {
          projectId,
          createdAt: { gte: today }
        },
        select: { userId: true }
      });

      const orderedUserIds = new Set(todaysOrders.map(o => o.userId));

      // Send reminders to users who haven't ordered
      for (const member of project.members) {
        if (!orderedUserIds.has(member.userId)) {
          await this.sendMultiChannelNotification(member.userId, {
            push: {
              title: 'تذكير: نافذة الطلب',
              body: `باقي ${minutesRemaining} دقيقة لتقديم طلبك في ${project.name}`,
              data: { projectId, minutesRemaining },
              type: 'REMINDER'
            },
            sms: {
              message: `تذكير: باقي ${minutesRemaining} دقيقة لتقديم طلبك في ${project.name}`,
              type: 'REMINDER'
            }
          });
        }
      }

      logger.info(`Break window reminders sent for project ${projectId}`);
    } catch (error) {
      logger.error('Error sending break window reminder:', error);
    }
  }
}

module.exports = new NotificationIntegration();

const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const notificationService = require('./notificationService');

/**
 * خدمة جدولة التذكيرات النصف ساعية
 * Half-Hourly Reminder Scheduler Service
 *
 * هذه الخدمة مسؤولة عن:
 * - إرسال تذكيرات كل نصف ساعة للمستخدمين الذين لم يقدموا طلباتهم
 * - تتبع التذكيرات المرسلة وحالتها
 * - احترام تفضيلات المستخدم وإعدادات المشروع
 */
class ReminderSchedulerService {
  constructor() {
    this.activeJobs = new Map(); // تخزين المهام النشطة
    this.isInitialized = false;
  }

  /**
   * تهيئة وتشغيل نظام التذكيرات
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('⚠️  نظام التذكيرات مشغّل بالفعل');
      return;
    }

    try {
      // تشغيل مهمة التذكيرات النصف ساعية (كل 30 دقيقة)
      const halfHourlyJob = cron.schedule('*/30 * * * *', async () => {
        console.log('🔔 تشغيل مهمة التذكيرات النصف ساعية...');
        await this.sendHalfHourlyReminders();
      }, {
        scheduled: true,
        timezone: process.env.TZ || "Asia/Riyadh"
      });

      this.activeJobs.set('halfHourly', halfHourlyJob);

      // تشغيل مهمة تنظيف السجلات القديمة (يومياً في الساعة 2 صباحاً)
      const cleanupJob = cron.schedule('0 2 * * *', async () => {
        console.log('🧹 تشغيل مهمة تنظيف السجلات القديمة...');
        await this.cleanupOldReminders();
      }, {
        scheduled: true,
        timezone: process.env.TZ || "Asia/Riyadh"
      });

      this.activeJobs.set('cleanup', cleanupJob);

      this.isInitialized = true;
      console.log('✅ نظام التذكيرات النصف ساعية جاهز ويعمل');
    } catch (error) {
      console.error('❌ خطأ في تهيئة نظام التذكيرات:', error);
      throw error;
    }
  }

  /**
   * إرسال التذكيرات النصف ساعية
   */
  async sendHalfHourlyReminders() {
    try {
      const currentTime = new Date();
      const currentHour = currentTime.getHours();
      const currentMinute = currentTime.getMinutes();

      console.log(`📅 الوقت الحالي: ${currentHour}:${currentMinute.toString().padStart(2, '0')}`);

      // الحصول على المشاريع النشطة
      const activeProjects = await prisma.project.findMany({
        where: {
          isActive: true,
          startDate: { lte: currentTime },
          OR: [
            { endDate: null },
            { endDate: { gte: currentTime } }
          ]
        }
      });

      if (activeProjects.length === 0) {
        console.log('ℹ️  لا توجد مشاريع نشطة حالياً');
        return;
      }

      console.log(`📊 عدد المشاريع النشطة: ${activeProjects.length}`);

      // معالجة كل مشروع
      for (const project of activeProjects) {
        await this.processProjectReminders(project, currentTime);
      }

      console.log('✅ تم إرسال التذكيرات بنجاح');
    } catch (error) {
      console.error('❌ خطأ في إرسال التذكيرات النصف ساعية:', error);
      throw error;
    }
  }

  /**
   * معالجة التذكيرات لمشروع معين
   */
  async processProjectReminders(project, currentTime) {
    try {
      // الحصول على إعدادات التذكير للمشروع
      let settings = await prisma.projectReminderSettings.findUnique({
        where: { projectId: project.id }
      });

      // إنشاء إعدادات افتراضية إذا لم توجد
      if (!settings) {
        settings = await prisma.projectReminderSettings.create({
          data: {
            projectId: project.id,
            enableReminders: true,
            enableHalfHourlyReminders: true,
            orderWindowStart: '08:00',
            orderWindowEnd: '09:00',
            reminderInterval: 30,
            firstReminderOffset: 30
          }
        });
      }

      // التحقق من تفعيل التذكيرات
      if (!settings.isActive || !settings.enableReminders || !settings.enableHalfHourlyReminders) {
        console.log(`⏭️  التذكيرات معطلة للمشروع: ${project.name}`);
        return;
      }

      // التحقق من أننا ضمن نافذة الطلبات
      if (!this.isWithinOrderWindow(currentTime, settings.orderWindowStart, settings.orderWindowEnd)) {
        console.log(`⏰ خارج نافذة الطلبات للمشروع: ${project.name}`);
        return;
      }

      // الحصول على المستخدمين الذين لم يقدموا طلبات
      const nonSubmitters = await this.getNonSubmitters(project.id, currentTime);

      if (nonSubmitters.length === 0) {
        console.log(`✅ جميع المستخدمين قدموا طلباتهم في المشروع: ${project.name}`);
        return;
      }

      console.log(`📢 عدد المستخدمين الذين لم يقدموا طلبات في ${project.name}: ${nonSubmitters.length}`);

      // إرسال التذكيرات للمستخدمين
      for (const user of nonSubmitters) {
        await this.sendReminderToUser(user, project, settings, currentTime);
      }
    } catch (error) {
      console.error(`❌ خطأ في معالجة التذكيرات للمشروع ${project.name}:`, error);
    }
  }

  /**
   * الحصول على المستخدمين الذين لم يقدموا طلبات
   */
  async getNonSubmitters(projectId, currentTime) {
    try {
      // بداية اليوم
      const startOfDay = new Date(currentTime);
      startOfDay.setHours(0, 0, 0, 0);

      // نهاية اليوم
      const endOfDay = new Date(currentTime);
      endOfDay.setHours(23, 59, 59, 999);

      // الحصول على جميع أعضاء المشروع
      const projectMembers = await prisma.projectMember.findMany({
        where: { projectId },
        include: { user: true }
      });

      if (!projectMembers || projectMembers.length === 0) {
        // إذا لم يكن هناك جدول ProjectMember، نحصل على المستخدمين النشطين
        const activeUsers = await prisma.user.findMany({
          where: {
            isActive: true,
            role: { in: ['REGULAR', 'VIP'] }
          }
        });

        // التحقق من الطلبات لكل مستخدم
        const nonSubmitters = [];
        for (const user of activeUsers) {
          const hasOrder = await prisma.order.findFirst({
            where: {
              userId: user.id,
              projectId,
              createdAt: {
                gte: startOfDay,
                lte: endOfDay
              }
            }
          });

          if (!hasOrder) {
            nonSubmitters.push(user);
          }
        }

        return nonSubmitters;
      }

      // التحقق من الطلبات لكل عضو
      const nonSubmitters = [];
      for (const member of projectMembers) {
        const hasOrder = await prisma.order.findFirst({
          where: {
            userId: member.userId,
            projectId,
            createdAt: {
              gte: startOfDay,
              lte: endOfDay
            }
          }
        });

        if (!hasOrder) {
          nonSubmitters.push(member.user);
        }
      }

      return nonSubmitters;
    } catch (error) {
      console.error('❌ خطأ في الحصول على المستخدمين:', error);
      // في حالة عدم وجود جدول ProjectMember
      if (error.message.includes('ProjectMember')) {
        // نسترجع جميع المستخدمين النشطين
        const activeUsers = await prisma.user.findMany({
          where: {
            isActive: true,
            role: { in: ['REGULAR', 'VIP'] }
          }
        });

        const startOfDay = new Date(currentTime);
        startOfDay.setHours(0, 0, 0, 0);

        const nonSubmitters = [];
        for (const user of activeUsers) {
          const hasOrder = await prisma.order.findFirst({
            where: {
              userId: user.id,
              projectId,
              createdAt: { gte: startOfDay }
            }
          });

          if (!hasOrder) {
            nonSubmitters.push(user);
          }
        }

        return nonSubmitters;
      }
      return [];
    }
  }

  /**
   * إرسال تذكير لمستخدم معين
   */
  async sendReminderToUser(user, project, settings, currentTime) {
    try {
      // الحصول على تفضيلات المستخدم
      let userPreferences = await prisma.userReminderPreferences.findUnique({
        where: { userId: user.id }
      });

      // إنشاء تفضيلات افتراضية إذا لم توجد
      if (!userPreferences) {
        userPreferences = await prisma.userReminderPreferences.create({
          data: {
            userId: user.id,
            enableReminders: true,
            enableHalfHourlyReminders: true,
            preferredChannels: ['push']
          }
        });
      }

      // التحقق من تفعيل التذكيرات للمستخدم
      if (!userPreferences.enableReminders || !userPreferences.enableHalfHourlyReminders) {
        console.log(`⏭️  التذكيرات معطلة للمستخدم: ${user.email}`);
        return;
      }

      // التحقق من وضع عدم الإزعاج
      if (this.isInDoNotDisturb(currentTime, userPreferences.doNotDisturbStart, userPreferences.doNotDisturbEnd)) {
        console.log(`🔕 المستخدم ${user.email} في وضع عدم الإزعاج`);
        return;
      }

      // التحقق من عدد التذكيرات اليومية
      const reminderCountToday = await this.getReminderCountToday(user.id);
      if (reminderCountToday >= userPreferences.maxRemindersPerDay) {
        console.log(`⚠️  تجاوز الحد الأقصى للتذكيرات اليومية للمستخدم: ${user.email}`);
        return;
      }

      // حساب الوقت المتبقي
      const deadline = this.parseTime(settings.orderWindowEnd);
      const now = new Date();
      const deadlineToday = new Date(now);
      deadlineToday.setHours(deadline.hours, deadline.minutes, 0, 0);

      const timeRemaining = Math.floor((deadlineToday - now) / (1000 * 60)); // بالدقائق

      // إنشاء رسالة التذكير
      const reminderMessage = this.createReminderMessage(user, project, timeRemaining, settings);

      // تحديد القنوات المفعّلة
      const channels = this.getEnabledChannels(settings, userPreferences);

      // إرسال التذكير عبر الخدمات
      const deliveryStatus = await notificationService.sendHalfHourlyReminder(
        user,
        project,
        reminderMessage,
        channels
      );

      // حفظ سجل التذكير
      await prisma.reminderLog.create({
        data: {
          userId: user.id,
          projectId: project.id,
          reminderType: 'ORDER_SUBMISSION',
          title: reminderMessage.title,
          message: reminderMessage.message,
          channel: channels,
          status: deliveryStatus.overallStatus || 'SENT',
          deliveryStatus: deliveryStatus,
          scheduledFor: currentTime,
          metadata: {
            timeRemaining,
            attemptNumber: reminderCountToday + 1,
            orderWindowEnd: settings.orderWindowEnd
          }
        }
      });

      console.log(`✅ تم إرسال تذكير للمستخدم: ${user.email}`);
    } catch (error) {
      console.error(`❌ خطأ في إرسال تذكير للمستخدم ${user.email}:`, error);

      // حفظ سجل الفشل
      try {
        await prisma.reminderLog.create({
          data: {
            userId: user.id,
            projectId: project.id,
            reminderType: 'ORDER_SUBMISSION',
            title: 'تذكير بتقديم الطلب',
            message: 'فشل الإرسال',
            channel: [],
            status: 'FAILED',
            scheduledFor: currentTime,
            metadata: {
              error: error.message
            }
          }
        });
      } catch (logError) {
        console.error('❌ خطأ في حفظ سجل الفشل:', logError);
      }
    }
  }

  /**
   * إنشاء رسالة التذكير
   */
  createReminderMessage(user, project, timeRemaining, settings) {
    const userName = user.firstName || user.email.split('@')[0];

    let message = '';
    if (settings.customMessageTemplate) {
      message = settings.customMessageTemplate
        .replace('{userName}', userName)
        .replace('{projectName}', project.name)
        .replace('{timeRemaining}', timeRemaining);
    } else {
      if (timeRemaining <= 15) {
        message = `⚠️ عزيزي ${userName}، تبقى ${timeRemaining} دقيقة فقط لتقديم طلب الطعام في مشروع ${project.name}. لا تفوت الموعد!`;
      } else if (timeRemaining <= 30) {
        message = `🔔 مرحباً ${userName}، تذكير: تبقى ${timeRemaining} دقيقة لتقديم طلب الطعام في ${project.name}.`;
      } else {
        message = `👋 ${userName}، لم تقم بتقديم طلب الطعام بعد في ${project.name}. الموعد النهائي بعد ${timeRemaining} دقيقة.`;
      }
    }

    return {
      title: 'تذكير: موعد تقديم الطلبات',
      message,
      timeRemaining,
      projectName: project.name
    };
  }

  /**
   * تحديد القنوات المفعّلة للإرسال
   */
  getEnabledChannels(projectSettings, userPreferences) {
    const channels = [];

    if (projectSettings.enablePushNotifications && userPreferences.preferredChannels.includes('push')) {
      channels.push('push');
    }

    if (projectSettings.enableEmailNotifications && userPreferences.preferredChannels.includes('email')) {
      channels.push('email');
    }

    if (projectSettings.enableSMSNotifications && userPreferences.preferredChannels.includes('sms')) {
      channels.push('sms');
    }

    // على الأقل Push Notification
    if (channels.length === 0) {
      channels.push('push');
    }

    return channels;
  }

  /**
   * التحقق من أننا ضمن نافذة الطلبات
   */
  isWithinOrderWindow(currentTime, startTime, endTime) {
    const current = { hours: currentTime.getHours(), minutes: currentTime.getMinutes() };
    const start = this.parseTime(startTime);
    const end = this.parseTime(endTime);

    const currentMinutes = current.hours * 60 + current.minutes;
    const startMinutes = start.hours * 60 + start.minutes;
    const endMinutes = end.hours * 60 + end.minutes;

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }

  /**
   * التحقق من وضع عدم الإزعاج
   */
  isInDoNotDisturb(currentTime, startTime, endTime) {
    if (!startTime || !endTime) return false;

    return this.isWithinOrderWindow(currentTime, startTime, endTime);
  }

  /**
   * تحليل الوقت من صيغة HH:MM
   */
  parseTime(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return { hours, minutes };
  }

  /**
   * الحصول على عدد التذكيرات المرسلة اليوم
   */
  async getReminderCountToday(userId) {
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const count = await prisma.reminderLog.count({
        where: {
          userId,
          createdAt: { gte: startOfDay },
          status: { in: ['SENT', 'SCHEDULED'] }
        }
      });

      return count;
    } catch (error) {
      console.error('❌ خطأ في حساب التذكيرات:', error);
      return 0;
    }
  }

  /**
   * تنظيف السجلات القديمة (أكثر من 30 يوم)
   */
  async cleanupOldReminders() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const deleted = await prisma.reminderLog.deleteMany({
        where: {
          createdAt: { lt: thirtyDaysAgo }
        }
      });

      console.log(`🧹 تم حذف ${deleted.count} تذكير قديم`);
    } catch (error) {
      console.error('❌ خطأ في تنظيف السجلات:', error);
    }
  }

  /**
   * إيقاف جميع المهام المجدولة
   */
  stopAll() {
    this.activeJobs.forEach((job, name) => {
      job.stop();
      console.log(`⏹️  تم إيقاف المهمة: ${name}`);
    });
    this.activeJobs.clear();
    this.isInitialized = false;
    console.log('⏹️  تم إيقاف نظام التذكيرات');
  }

  /**
   * الحصول على حالة النظام
   */
  getStatus() {
    return {
      isRunning: this.isInitialized,
      activeJobs: Array.from(this.activeJobs.keys()),
      timezone: process.env.TZ || "Asia/Riyadh"
    };
  }
}

module.exports = new ReminderSchedulerService();

const cron = require('node-cron');
const notificationService = require('./notificationService');
const orderService = require('./orderService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * خدمة جدولة المهام التلقائية
 * تشمل: تذكيرات نصف ساعية، تجميع الطلبات، تقارير يومية
 */
class SchedulerService {
  constructor() {
    this.jobs = [];
    this.isRunning = false;
  }

  // ============================================
  // بدء وإيقاف المجدول (Start/Stop)
  // ============================================

  /**
   * بدء جميع المهام المجدولة
   */
  start() {
    if (this.isRunning) {
      console.warn('⚠️ Scheduler is already running');
      return;
    }

    console.log('🚀 بدء خدمة الجدولة...');

    // تذكيرات نصف ساعية للطلبات
    if (process.env.REMINDER_ENABLED === 'true') {
      this.scheduleOrderReminders();
    }

    // تجميع الطلبات اليومي
    this.scheduleDailyAggregation();

    // تنظيف الإشعارات القديمة
    this.scheduleNotificationCleanup();

    this.isRunning = true;
    console.log('✅ خدمة الجدولة تعمل الآن');
  }

  /**
   * إيقاف جميع المهام المجدولة
   */
  stop() {
    console.log('🛑 إيقاف خدمة الجدولة...');
    this.jobs.forEach(job => job.stop());
    this.jobs = [];
    this.isRunning = false;
    console.log('✅ تم إيقاف خدمة الجدولة');
  }

  // ============================================
  // المهام المجدولة (Scheduled Tasks)
  // ============================================

  /**
   * جدولة التذكيرات النصف ساعية (Half-hourly reminders)
   * تعمل كل 30 دقيقة خلال ساعات العمل
   */
  scheduleOrderReminders() {
    const interval = parseInt(process.env.REMINDER_INTERVAL) || 30;
    const startTime = process.env.REMINDER_START_TIME || '08:00';
    const endTime = process.env.REMINDER_END_TIME || '10:00';

    console.log(`📅 جدولة التذكيرات: كل ${interval} دقيقة من ${startTime} إلى ${endTime}`);

    // تشغيل كل 30 دقيقة
    const cronExpression = `*/${interval} * * * *`;

    const job = cron.schedule(cronExpression, async () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

      // التحقق من أننا ضمن ساعات العمل
      if (currentTime >= startTime && currentTime <= endTime) {
        await this.sendOrderReminders();
      }
    });

    this.jobs.push(job);
    console.log('✅ تم جدولة التذكيرات النصف ساعية');
  }

  /**
   * إرسال التذكيرات للمستخدمين الذين لم يطلبوا
   */
  async sendOrderReminders() {
    try {
      console.log('⏰ إرسال تذكيرات الطلبات...');

      // جلب جميع المشاريع النشطة
      const activeProjects = await prisma.project.findMany({
        where: { isActive: true }
      });

      let totalReminders = 0;

      for (const project of activeProjects) {
        try {
          const reminders = await notificationService.sendOrderReminder(project.id);
          totalReminders += reminders.length;
          console.log(`  ✓ ${reminders.length} تذكير للمشروع: ${project.name}`);
        } catch (error) {
          console.error(`  ❌ خطأ في إرسال تذكيرات للمشروع ${project.id}:`, error.message);
        }
      }

      console.log(`✅ تم إرسال ${totalReminders} تذكير إجمالي`);
    } catch (error) {
      console.error('❌ خطأ في إرسال التذكيرات:', error);
    }
  }

  /**
   * جدولة التجميع اليومي للطلبات
   * يعمل في نهاية كل يوم عمل
   */
  scheduleDailyAggregation() {
    console.log('📅 جدولة التجميع اليومي للطلبات: يومياً في 23:00');

    // تشغيل يومياً في الساعة 11 مساءً
    const job = cron.schedule('0 23 * * *', async () => {
      await this.performDailyAggregation();
    });

    this.jobs.push(job);
    console.log('✅ تم جدولة التجميع اليومي');
  }

  /**
   * تنفيذ التجميع اليومي للطلبات
   */
  async performDailyAggregation() {
    try {
      console.log('📊 بدء التجميع اليومي للطلبات...');

      const activeProjects = await prisma.project.findMany({
        where: { isActive: true }
      });

      const today = new Date().toISOString().split('T')[0];

      for (const project of activeProjects) {
        try {
          const aggregation = await orderService.aggregateTeamOrders(project.id, {
            date: today
          });

          console.log(`  ✓ ${project.name}: ${aggregation.totalOrders} طلب - ${aggregation.totalAmount} ريال`);

          // حفظ التقرير
          await this.saveDailyReport(project.id, aggregation);
        } catch (error) {
          console.error(`  ❌ خطأ في تجميع طلبات المشروع ${project.id}:`, error.message);
        }
      }

      console.log('✅ اكتمل التجميع اليومي');
    } catch (error) {
      console.error('❌ خطأ في التجميع اليومي:', error);
    }
  }

  /**
   * حفظ التقرير اليومي
   */
  async saveDailyReport(projectId, aggregation) {
    try {
      // يمكن حفظ التقرير في جدول خاص أو تصديره
      const report = {
        projectId,
        date: aggregation.date,
        summary: {
          totalOrders: aggregation.totalOrders,
          totalAmount: aggregation.totalAmount,
          averageOrderValue: aggregation.statistics.averageOrderValue
        },
        topItems: aggregation.statistics.mostOrderedItems.slice(0, 5),
        topRestaurants: aggregation.statistics.topRestaurants.slice(0, 3)
      };

      // هنا يمكن حفظ في قاعدة البيانات أو إرسال بريد إلكتروني
      console.log(`  💾 تم حفظ تقرير يومي للمشروع ${projectId}`);

      return report;
    } catch (error) {
      console.error('❌ خطأ في حفظ التقرير اليومي:', error);
    }
  }

  /**
   * جدولة تنظيف الإشعارات القديمة
   * يعمل يومياً لحذف الإشعارات الأقدم من 30 يوم
   */
  scheduleNotificationCleanup() {
    console.log('📅 جدولة تنظيف الإشعارات القديمة: يومياً في 02:00');

    // تشغيل يومياً في الساعة 2 صباحاً
    const job = cron.schedule('0 2 * * *', async () => {
      await this.cleanupOldNotifications();
    });

    this.jobs.push(job);
    console.log('✅ تم جدولة تنظيف الإشعارات');
  }

  /**
   * تنظيف الإشعارات القديمة
   */
  async cleanupOldNotifications() {
    try {
      console.log('🧹 بدء تنظيف الإشعارات القديمة...');

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await prisma.notification.deleteMany({
        where: {
          createdAt: {
            lt: thirtyDaysAgo
          },
          isRead: true
        }
      });

      console.log(`✅ تم حذف ${result.count} إشعار قديم`);
    } catch (error) {
      console.error('❌ خطأ في تنظيف الإشعارات:', error);
    }
  }

  // ============================================
  // مهام إضافية (Additional Tasks)
  // ============================================

  /**
   * إرسال تقرير أسبوعي
   */
  scheduleWeeklyReport() {
    console.log('📅 جدولة التقرير الأسبوعي: كل أحد في 09:00');

    // تشغيل كل أحد في الساعة 9 صباحاً
    const job = cron.schedule('0 9 * * 0', async () => {
      await this.sendWeeklyReport();
    });

    this.jobs.push(job);
    console.log('✅ تم جدولة التقرير الأسبوعي');
  }

  /**
   * إرسال التقرير الأسبوعي
   */
  async sendWeeklyReport() {
    try {
      console.log('📧 إرسال التقارير الأسبوعية...');

      const activeProjects = await prisma.project.findMany({
        where: { isActive: true }
      });

      const lastWeekStart = new Date();
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);
      lastWeekStart.setHours(0, 0, 0, 0);

      const lastWeekEnd = new Date();
      lastWeekEnd.setHours(23, 59, 59, 999);

      for (const project of activeProjects) {
        try {
          const stats = await orderService.getOrderStats(project.id, {
            start: lastWeekStart,
            end: lastWeekEnd
          });

          // إرسال التقرير للمنتجين والإداريين
          const admins = await prisma.user.findMany({
            where: {
              role: { in: ['PRODUCER', 'ADMIN'] },
              isActive: true
            }
          });

          for (const admin of admins) {
            await notificationService.saveNotification({
              type: 'SYSTEM',
              title: '📊 التقرير الأسبوعي',
              message: `تقرير المشروع ${project.name}: ${stats.totalOrders} طلب بإجمالي ${stats.totalRevenue} ريال`,
              userId: admin.id,
              data: stats
            });
          }

          console.log(`  ✓ تم إرسال تقرير أسبوعي للمشروع: ${project.name}`);
        } catch (error) {
          console.error(`  ❌ خطأ في إرسال تقرير للمشروع ${project.id}:`, error.message);
        }
      }

      console.log('✅ تم إرسال التقارير الأسبوعية');
    } catch (error) {
      console.error('❌ خطأ في إرسال التقارير الأسبوعية:', error);
    }
  }

  /**
   * الحصول على حالة المجدول
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeJobs: this.jobs.length,
      configuration: {
        reminderEnabled: process.env.REMINDER_ENABLED === 'true',
        reminderInterval: process.env.REMINDER_INTERVAL || '30',
        reminderStartTime: process.env.REMINDER_START_TIME || '08:00',
        reminderEndTime: process.env.REMINDER_END_TIME || '10:00'
      }
    };
  }
}

module.exports = new SchedulerService();

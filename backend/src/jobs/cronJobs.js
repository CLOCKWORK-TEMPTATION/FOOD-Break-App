const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * Cron Jobs للتذكيرات والمراجعة الدورية
 */

// تذكير نصف ساعي للمستخدمين الذين لم يقدموا طلبات
const halfHourlyReminderJob = cron.schedule('*/30 * * * *', async () => {
  try {
    logger.info('Running half-hourly reminder job...');

    const activeProjects = await prisma.project.findMany({
      where: { isActive: true }
    });

    for (const project of activeProjects) {
      // التحقق من نافذة الطلب
      const now = new Date();
      const startDate = new Date(project.startDate);
      const orderWindowMinutes = project.orderWindow || 60;
      const windowEnd = new Date(startDate.getTime() + orderWindowMinutes * 60000);

      if (now >= startDate && now <= windowEnd) {
        await notificationService.sendHalfHourlyReminders(project.id);
      }
    }

    logger.info('Half-hourly reminder job completed');
  } catch (error) {
    logger.error('Error in half-hourly reminder job:', error);
  }
}, {
  scheduled: false
});

// مراجعة دورية للمطاعم (شهرياً)
const monthlyRestaurantReviewJob = cron.schedule('0 0 1 * *', async () => {
  try {
    logger.info('Running monthly restaurant review job...');

    const restaurants = await prisma.restaurant.findMany({
      where: { isPartner: true, isActive: true }
    });

    for (const restaurant of restaurants) {
      const lastReviewed = restaurant.lastReviewed || restaurant.createdAt;
      const daysSinceReview = Math.floor((Date.now() - new Date(lastReviewed).getTime()) / (1000 * 60 * 60 * 24));

      if (daysSinceReview >= 30) {
        // حساب متوسط التقييمات الأخيرة
        const recentReviews = await prisma.review.findMany({
          where: {
            restaurantId: restaurant.id,
            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
          }
        });

        if (recentReviews.length > 0) {
          const avgRating = recentReviews.reduce((sum, r) => sum + r.rating, 0) / recentReviews.length;

          await prisma.restaurant.update({
            where: { id: restaurant.id },
            data: {
              rating: avgRating,
              lastReviewed: new Date()
            }
          });

          logger.info(`Updated rating for restaurant ${restaurant.name}: ${avgRating.toFixed(2)}`);
        }
      }
    }

    logger.info('Monthly restaurant review job completed');
  } catch (error) {
    logger.error('Error in monthly restaurant review job:', error);
  }
}, {
  scheduled: false
});

// تنظيف الإشعارات القديمة (أسبوعياً)
const weeklyNotificationCleanupJob = cron.schedule('0 2 * * 0', async () => {
  try {
    logger.info('Running weekly notification cleanup job...');

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const deleted = await prisma.notification.deleteMany({
      where: {
        isRead: true,
        createdAt: { lt: thirtyDaysAgo }
      }
    });

    logger.info(`Deleted ${deleted.count} old notifications`);
  } catch (error) {
    logger.error('Error in notification cleanup job:', error);
  }
}, {
  scheduled: false
});

// تحديث حالة الطلبات المتأخرة
const orderStatusUpdateJob = cron.schedule('*/15 * * * *', async () => {
  try {
    const now = new Date();

    // تحديث الطلبات التي تجاوزت وقت التوصيل المقدر
    const lateOrders = await prisma.order.findMany({
      where: {
        status: 'OUT_FOR_DELIVERY',
        estimatedTime: { lt: now }
      }
    });

    for (const order of lateOrders) {
      logger.warn(`Order ${order.id} is late. Estimated: ${order.estimatedTime}`);
      // يمكن إرسال تنبيه للمستخدم أو المطعم
    }
  } catch (error) {
    logger.error('Error in order status update job:', error);
  }
}, {
  scheduled: false
});

// بدء جميع الـ Cron Jobs
const startAllJobs = () => {
  halfHourlyReminderJob.start();
  monthlyRestaurantReviewJob.start();
  weeklyNotificationCleanupJob.start();
  orderStatusUpdateJob.start();
  logger.info('All cron jobs started');
};

// إيقاف جميع الـ Cron Jobs
const stopAllJobs = () => {
  halfHourlyReminderJob.stop();
  monthlyRestaurantReviewJob.stop();
  weeklyNotificationCleanupJob.stop();
  orderStatusUpdateJob.stop();
  logger.info('All cron jobs stopped');
};

module.exports = {
  startAllJobs,
  stopAllJobs,
  halfHourlyReminderJob,
  monthlyRestaurantReviewJob,
  weeklyNotificationCleanupJob,
  orderStatusUpdateJob
};

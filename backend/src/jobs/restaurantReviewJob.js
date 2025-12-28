const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const computeCutoff = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
};

const countDueRestaurants = async (days) => {
  const cutoff = computeCutoff(days);
  const count = await prisma.restaurant.count({
    where: {
      isActive: true,
      OR: [{ lastReviewed: null }, { lastReviewed: { lt: cutoff } }]
    }
  });
  return { count, cutoff };
};

const alreadyNotifiedToday = async (title) => {
  const existing = await prisma.notification.findFirst({
    where: {
      title,
      createdAt: { gte: startOfToday() }
    },
    select: { id: true }
  });
  return Boolean(existing);
};

const notifyProducers = async (title, message, data) => {
  const users = await prisma.user.findMany({
    where: { isActive: true, role: { in: ['PRODUCER', 'ADMIN'] } },
    select: { id: true }
  });

  await Promise.all(
    users.map((u) =>
      prisma.notification.create({
        data: {
          type: 'SYSTEM',
          title,
          message,
          userId: u.id,
          data
        }
      })
    )
  );
};

/**
 * Job يومي للمراجعة الدورية (monthly/quarterly).
 * Why: تفعيل "آلية مراجعة دورية + jobs" بدون الاعتماد على تشغيل يدوي.
 */
const runRestaurantReviewJob = async () => {
  try {
    const monthlyTitle = 'مراجعة المطاعم (شهري)';
    const quarterlyTitle = 'مراجعة المطاعم (ربع سنوي)';

    if (!(await alreadyNotifiedToday(monthlyTitle))) {
      const { count, cutoff } = await countDueRestaurants(30);
      await notifyProducers(
        monthlyTitle,
        `عدد المطاعم المستحقة للمراجعة الشهرية: ${count}`,
        { frequency: 'monthly', dueCount: count, cutoff }
      );
    }

    if (!(await alreadyNotifiedToday(quarterlyTitle))) {
      const { count, cutoff } = await countDueRestaurants(90);
      await notifyProducers(
        quarterlyTitle,
        `عدد المطاعم المستحقة للمراجعة الربع سنوية: ${count}`,
        { frequency: 'quarterly', dueCount: count, cutoff }
      );
    }
  } catch (error) {
    logger.warn(`فشل Job مراجعة المطاعم: ${error.message}`);
  }
};

const startRestaurantReviewJob = () => {
  // مرة يومياً (بسيطة، ويمكن نقلها إلى cron/queue لاحقاً)
  const hours = Number(process.env.REVIEW_JOB_INTERVAL_HOURS || 24);
  const ms = Math.max(1, hours) * 60 * 60 * 1000;

  // تشغيل فوري مرة عند الإقلاع
  runRestaurantReviewJob();

  setInterval(runRestaurantReviewJob, ms);
  logger.info(`Restaurant review job scheduled every ${hours}h`);
};

module.exports = { startRestaurantReviewJob };


/**
 * خدمة المهام المجدولة (Cron Jobs)
 * Cron Job Service for Schedule Integration
 */

const cron = require('node-cron');
const scheduleIntegrationService = require('./scheduleIntegrationService');
const notificationService = require('./notificationService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * بدء جميع المهام المجدولة
 * Start all cron jobs
 */
function startCronJobs() {
  console.log('🕐 بدء تشغيل المهام المجدولة لنظام تكامل الجداول...');
  
  // فحص البريكات النشطة كل دقيقة
  startBreakMonitoringJob();
  
  // إرسال تذكيرات الطلبات كل 5 دقائق
  startOrderReminderJob();
  
  // فحص التأخيرات كل 10 دقائق
  startDelayMonitoringJob();
  
  // تنظيف البيانات القديمة يومياً
  startDataCleanupJob();
  
  console.log('✅ تم تشغيل جميع المهام المجدولة بنجاح');
}

/**
 * مهمة مراقبة البريكات النشطة
 * Break monitoring job - runs every minute
 */
function startBreakMonitoringJob() {
  cron.schedule('* * * * *', async () => {
    try {
      console.log('🔍 فحص البريكات النشطة...');
      const result = await scheduleIntegrationService.checkActiveBreaks();
      
      if (result.started > 0 || result.ended > 0) {
        console.log(`📋 تم تحديث البريكات: بدء ${result.started}، إنهاء ${result.ended}`);
      }
    } catch (error) {
      console.error('❌ خطأ في مراقبة البريكات:', error);
    }
  });
  
  console.log('📋 تم تشغيل مهمة مراقبة البريكات (كل دقيقة)');
}

/**
 * مهمة إرسال تذكيرات الطلبات
 * Order reminder job - runs every 5 minutes
 */
function startOrderReminderJob() {
  cron.schedule('*/5 * * * *', async () => {
    try {
      console.log('📢 فحص تذكيرات الطلبات...');
      await sendOrderReminders();
    } catch (error) {
      console.error('❌ خطأ في إرسال التذكيرات:', error);
    }
  });
  
  console.log('📢 تم تشغيل مهمة تذكيرات الطلبات (كل 5 دقائق)');
}

/**
 * مهمة مراقبة التأخيرات
 * Delay monitoring job - runs every 10 minutes
 */
function startDelayMonitoringJob() {
  cron.schedule('*/10 * * * *', async () => {
    try {
      console.log('⏰ فحص التأخيرات في الجداول...');
      await monitorScheduleDelays();
    } catch (error) {
      console.error('❌ خطأ في مراقبة التأخيرات:', error);
    }
  });
  
  console.log('⏰ تم تشغيل مهمة مراقبة التأخيرات (كل 10 دقائق)');
}

/**
 * مهمة تنظيف البيانات القديمة
 * Data cleanup job - runs daily at 2 AM
 */
function startDataCleanupJob() {
  cron.schedule('0 2 * * *', async () => {
    try {
      console.log('🧹 بدء تنظيف البيانات القديمة...');
      await cleanupOldData();
    } catch (error) {
      console.error('❌ خطأ في تنظيف البيانات:', error);
    }
  });
  
  console.log('🧹 تم تشغيل مهمة تنظيف البيانات (يومياً الساعة 2 صباحاً)');
}

/**
 * إرسال تذكيرات الطلبات
 * Send order reminders
 */
async function sendOrderReminders() {
  try {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    
    // البحث عن البريكات التي تحتاج تذكيرات
    const breaksNeedingReminders = await prisma.breakSchedule.findMany({
      where: {
        status: 'ACTIVE',
        isOrderWindowOpen: true,
        schedule: {
          scheduleDate: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
          }
        }
      },
      include: {
        schedule: {
          include: {
            project: {
              include: {
                members: {
                  include: {
                    user: true
                  }
                },
                scheduleSettings: true
              }
            }
          }
        }
      }
    });

    for (const breakSchedule of breaksNeedingReminders) {
      const project = breakSchedule.schedule.project;
      const settings = project.scheduleSettings;
      
      if (!settings || !settings.autoNotifyChanges) continue;

      // حساب الوقت المتبقي لإغلاق نافذة الطلب
      const orderEndTime = breakSchedule.orderWindowEnd;
      if (!orderEndTime) continue;

      const [endHours, endMinutes] = orderEndTime.split(':').map(Number);
      const endTotalMinutes = endHours * 60 + endMinutes;
      
      const [currentHours, currentMinutes] = currentTime.split(':').map(Number);
      const currentTotalMinutes = currentHours * 60 + currentMinutes;
      
      const remainingMinutes = endTotalMinutes - currentTotalMinutes;

      // إرسال تذكيرات حسب الفترات المحددة
      const reminderIntervals = settings.reminderIntervals || [30, 15, 5];
      
      for (const interval of reminderIntervals) {
        if (Math.abs(remainingMinutes - interval) <= 2) { // هامش خطأ دقيقتين
          await sendBreakReminder(breakSchedule, interval);
          break;
        }
      }
    }
  } catch (error) {
    console.error('خطأ في إرسال تذكيرات الطلبات:', error);
  }
}

/**
 * إرسال تذكير بريك محدد
 * Send specific break reminder
 */
async function sendBreakReminder(breakSchedule, minutesRemaining) {
  try {
    const members = breakSchedule.schedule.project.members;
    
    // البحث عن الأعضاء الذين لم يطلبوا بعد
    const membersWithoutOrders = [];
    
    for (const member of members) {
      const hasOrder = await prisma.order.findFirst({
        where: {
          userId: member.userId,
          projectId: breakSchedule.schedule.projectId,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      });
      
      if (!hasOrder) {
        membersWithoutOrders.push(member);
      }
    }

    // إرسال التذكيرات
    for (const member of membersWithoutOrders) {
      await notificationService.createNotification({
        userId: member.user.id,
        type: 'ORDER_REMINDER',
        title: `تذكير: ${minutesRemaining} دقيقة متبقية للطلب`,
        message: `باقي ${minutesRemaining} دقيقة لإغلاق نافذة طلب ${breakSchedule.breakName}. اطلب وجبتك الآن!`,
        data: {
          breakId: breakSchedule.id,
          scheduleId: breakSchedule.scheduleId,
          breakName: breakSchedule.breakName,
          minutesRemaining,
          orderWindowEnd: breakSchedule.orderWindowEnd
        },
        actionUrl: `/orders/new?breakId=${breakSchedule.id}`
      });
    }

    console.log(`📢 تم إرسال ${membersWithoutOrders.length} تذكير للبريك ${breakSchedule.breakName} (${minutesRemaining} دقيقة متبقية)`);
  } catch (error) {
    console.error('خطأ في إرسال تذكير البريك:', error);
  }
}

/**
 * مراقبة تأخيرات الجداول
 * Monitor schedule delays
 */
async function monitorScheduleDelays() {
  try {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    
    // البحث عن الجداول النشطة اليوم
    const activeSchedules = await prisma.shootingSchedule.findMany({
      where: {
        scheduleDate: {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
        },
        status: {
          in: ['SCHEDULED', 'IN_PROGRESS', 'ON_BREAK']
        }
      },
      include: {
        project: {
          include: {
            scheduleSettings: true,
            members: {
              include: {
                user: true
              }
            }
          }
        },
        breakSchedules: true
      }
    });

    for (const schedule of activeSchedules) {
      const settings = schedule.project.scheduleSettings;
      if (!settings || !settings.autoNotifyChanges) continue;

      const delayThreshold = settings.delayThreshold || 15; // افتراضي 15 دقيقة

      // فحص تأخير وقت الحضور
      const [callHours, callMinutes] = schedule.callTime.split(':').map(Number);
      const callTotalMinutes = callHours * 60 + callMinutes;
      
      const [currentHours, currentMinutes] = currentTime.split(':').map(Number);
      const currentTotalMinutes = currentHours * 60 + currentMinutes;
      
      const delayMinutes = currentTotalMinutes - callTotalMinutes;

      // إذا كان هناك تأخير يتجاوز الحد المسموح
      if (delayMinutes > delayThreshold && schedule.status === 'SCHEDULED') {
        await handleScheduleDelay(schedule, delayMinutes);
      }

      // فحص تأخير البريكات
      for (const breakSchedule of schedule.breakSchedules) {
        if (breakSchedule.status === 'SCHEDULED') {
          const [breakHours, breakMinutes] = breakSchedule.scheduledStart.split(':').map(Number);
          const breakTotalMinutes = breakHours * 60 + breakMinutes;
          const breakDelay = currentTotalMinutes - breakTotalMinutes;

          if (breakDelay > delayThreshold) {
            await handleBreakDelay(breakSchedule, breakDelay);
          }
        }
      }
    }
  } catch (error) {
    console.error('خطأ في مراقبة التأخيرات:', error);
  }
}

/**
 * معالجة تأخير الجدول
 * Handle schedule delay
 */
async function handleScheduleDelay(schedule, delayMinutes) {
  try {
    // تحديث حالة الجدول إلى متأخر
    await prisma.shootingSchedule.update({
      where: { id: schedule.id },
      data: {
        status: 'DELAYED',
        delayMinutes,
        delayReason: `تأخير تلقائي - ${delayMinutes} دقيقة`,
        lastUpdated: new Date()
      }
    });

    // إرسال إشعارات للطاقم
    const members = schedule.project.members;
    for (const member of members) {
      await notificationService.createNotification({
        userId: member.user.id,
        type: 'SCHEDULE_DELAY',
        title: 'تأخير في جدول التصوير',
        message: `تأخر جدول التصوير "${schedule.scheduleName}" بمقدار ${delayMinutes} دقيقة`,
        data: {
          scheduleId: schedule.id,
          delayMinutes,
          originalCallTime: schedule.callTime
        }
      });
    }

    console.log(`⏰ تم رصد تأخير في الجدول ${schedule.scheduleName}: ${delayMinutes} دقيقة`);
  } catch (error) {
    console.error('خطأ في معالجة تأخير الجدول:', error);
  }
}

/**
 * معالجة تأخير البريك
 * Handle break delay
 */
async function handleBreakDelay(breakSchedule, delayMinutes) {
  try {
    // تحديث حالة البريك إلى متأخر
    await prisma.breakSchedule.update({
      where: { id: breakSchedule.id },
      data: {
        status: 'DELAYED'
      }
    });

    console.log(`⏰ تم رصد تأخير في البريك ${breakSchedule.breakName}: ${delayMinutes} دقيقة`);
  } catch (error) {
    console.error('خطأ في معالجة تأخير البريك:', error);
  }
}

/**
 * تنظيف البيانات القديمة
 * Clean up old data
 */
async function cleanupOldData() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // حذف تاريخ المواقع القديم (أكثر من 30 يوم)
    const deletedLocationHistory = await prisma.locationHistory.deleteMany({
      where: {
        timestamp: {
          lt: thirtyDaysAgo
        }
      }
    });

    // حذف تحديثات حالة التوصيل القديمة
    const deletedStatusUpdates = await prisma.deliveryStatusUpdate.deleteMany({
      where: {
        timestamp: {
          lt: thirtyDaysAgo
        }
      }
    });

    // حذف الإشعارات القديمة المقروءة
    const deletedNotifications = await prisma.notification.deleteMany({
      where: {
        isRead: true,
        createdAt: {
          lt: thirtyDaysAgo
        }
      }
    });

    console.log(`🧹 تم تنظيف البيانات القديمة:`);
    console.log(`   - ${deletedLocationHistory.count} سجل موقع`);
    console.log(`   - ${deletedStatusUpdates.count} تحديث حالة توصيل`);
    console.log(`   - ${deletedNotifications.count} إشعار مقروء`);
  } catch (error) {
    console.error('خطأ في تنظيف البيانات القديمة:', error);
  }
}

/**
 * إيقاف جميع المهام المجدولة
 * Stop all cron jobs
 */
function stopCronJobs() {
  console.log('🛑 إيقاف جميع المهام المجدولة...');
  cron.getTasks().forEach(task => {
    task.stop();
  });
  console.log('✅ تم إيقاف جميع المهام المجدولة');
}

/**
 * الحصول على حالة المهام المجدولة
 * Get cron jobs status
 */
function getCronJobsStatus() {
  const tasks = cron.getTasks();
  return {
    totalJobs: tasks.size,
    runningJobs: Array.from(tasks.values()).filter(task => task.running).length,
    jobs: [
      {
        name: 'Break Monitoring',
        nameArabic: 'مراقبة البريكات',
        schedule: '* * * * *',
        description: 'فحص البريكات النشطة كل دقيقة'
      },
      {
        name: 'Order Reminders',
        nameArabic: 'تذكيرات الطلبات',
        schedule: '*/5 * * * *',
        description: 'إرسال تذكيرات الطلبات كل 5 دقائق'
      },
      {
        name: 'Delay Monitoring',
        nameArabic: 'مراقبة التأخيرات',
        schedule: '*/10 * * * *',
        description: 'فحص التأخيرات في الجداول كل 10 دقائق'
      },
      {
        name: 'Data Cleanup',
        nameArabic: 'تنظيف البيانات',
        schedule: '0 2 * * *',
        description: 'تنظيف البيانات القديمة يومياً الساعة 2 صباحاً'
      }
    ]
  };
}

module.exports = {
  startCronJobs,
  stopCronJobs,
  getCronJobsStatus,
  sendOrderReminders,
  monitorScheduleDelays,
  cleanupOldData
};
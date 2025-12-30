/**
 * خدمة تكامل جداول التصوير
 * Shooting Schedule Integration Service
 */

const { PrismaClient } = require('@prisma/client');
const notificationService = require('./notificationService');
const gpsTrackingService = require('./gpsTrackingService');
const prisma = new PrismaClient();

/**
 * إنشاء جدول تصوير جديد
 * Create new shooting schedule
 */
async function createShootingSchedule(projectId, scheduleData) {
  try {
    const {
      scheduleName,
      scheduleDate,
      callTime,
      wrapTime,
      location,
      coordinates,
      breakSchedules = [],
      notes,
      weatherConditions
    } = scheduleData;

    // إنشاء الجدول الرئيسي
    const schedule = await prisma.shootingSchedule.create({
      data: {
        projectId,
        scheduleName,
        scheduleDate: new Date(scheduleDate),
        callTime,
        wrapTime,
        location,
        coordinates,
        notes,
        weatherConditions,
        status: 'SCHEDULED'
      }
    });

    // إضافة جداول البريك
    if (breakSchedules.length > 0) {
      const breakData = breakSchedules.map(breakItem => ({
        scheduleId: schedule.id,
        breakType: breakItem.breakType,
        breakName: breakItem.breakName,
        scheduledStart: breakItem.scheduledStart,
        scheduledEnd: breakItem.scheduledEnd,
        orderWindowStart: breakItem.orderWindowStart,
        orderWindowEnd: breakItem.orderWindowEnd,
        status: 'SCHEDULED'
      }));

      await prisma.breakSchedule.createMany({
        data: breakData
      });
    }

    // جلب الجدول مع البريكات
    const completeSchedule = await prisma.shootingSchedule.findUnique({
      where: { id: schedule.id },
      include: {
        breakSchedules: true,
        project: {
          select: {
            name: true,
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          }
        }
      }
    });

    // إرسال إشعارات للطاقم
    await notifyScheduleCreated(completeSchedule);

    return completeSchedule;
  } catch (error) {
    console.error('خطأ في إنشاء جدول التصوير:', error);
    throw error;
  }
}

/**
 * تحديث جدول التصوير
 * Update shooting schedule
 */
async function updateShootingSchedule(scheduleId, updateData, changedBy = null) {
  try {
    // جلب الجدول الحالي
    const currentSchedule = await prisma.shootingSchedule.findUnique({
      where: { id: scheduleId },
      include: {
        breakSchedules: true,
        project: {
          include: {
            members: {
              include: {
                user: true
              }
            }
          }
        }
      }
    });

    if (!currentSchedule) {
      throw new Error('جدول التصوير غير موجود');
    }

    // تسجيل التغييرات
    const changes = [];
    
    // فحص التغييرات في الأوقات
    if (updateData.callTime && updateData.callTime !== currentSchedule.callTime) {
      changes.push({
        changeType: 'TIME_DELAY',
        changeDescription: `تغيير وقت الحضور من ${currentSchedule.callTime} إلى ${updateData.callTime}`,
        oldValue: currentSchedule.callTime,
        newValue: updateData.callTime,
        changedBy,
        changeReason: updateData.changeReason || 'تحديث الجدول'
      });
    }

    if (updateData.wrapTime && updateData.wrapTime !== currentSchedule.wrapTime) {
      changes.push({
        changeType: 'TIME_DELAY',
        changeDescription: `تغيير وقت الانتهاء من ${currentSchedule.wrapTime} إلى ${updateData.wrapTime}`,
        oldValue: currentSchedule.wrapTime,
        newValue: updateData.wrapTime,
        changedBy,
        changeReason: updateData.changeReason || 'تحديث الجدول'
      });
    }

    // حساب التأخير
    let delayMinutes = 0;
    if (updateData.delayMinutes) {
      delayMinutes = updateData.delayMinutes;
      changes.push({
        changeType: 'TIME_DELAY',
        changeDescription: `تأخير في الجدول بمقدار ${delayMinutes} دقيقة`,
        oldValue: '0',
        newValue: delayMinutes.toString(),
        changedBy,
        changeReason: updateData.delayReason || 'ظروف التصوير'
      });
    }

    // تحديث الجدول
    const updatedSchedule = await prisma.shootingSchedule.update({
      where: { id: scheduleId },
      data: {
        ...updateData,
        delayMinutes,
        lastUpdated: new Date(),
        status: delayMinutes > 0 ? 'DELAYED' : updateData.status || currentSchedule.status
      },
      include: {
        breakSchedules: true,
        project: {
          include: {
            members: {
              include: {
                user: true
              }
            }
          }
        }
      }
    });

    // حفظ التغييرات
    if (changes.length > 0) {
      await prisma.scheduleChange.createMany({
        data: changes.map(change => ({
          scheduleId,
          ...change
        }))
      });
    }

    // تحديث أوقات البريك والطلبات
    if (delayMinutes > 0) {
      await adjustBreakTimesForDelay(scheduleId, delayMinutes);
      await adjustOrderTimesForDelay(scheduleId, delayMinutes);
    }

    // إرسال إشعارات التغيير
    await notifyScheduleChanged(updatedSchedule, changes);

    return updatedSchedule;
  } catch (error) {
    console.error('خطأ في تحديث جدول التصوير:', error);
    throw error;
  }
}

/**
 * تعديل أوقات البريك عند التأخير
 * Adjust break times for delay
 */
async function adjustBreakTimesForDelay(scheduleId, delayMinutes) {
  try {
    const breakSchedules = await prisma.breakSchedule.findMany({
      where: { scheduleId }
    });

    for (const breakSchedule of breakSchedules) {
      // حساب الأوقات الجديدة
      const newStartTime = addMinutesToTime(breakSchedule.scheduledStart, delayMinutes);
      const newEndTime = addMinutesToTime(breakSchedule.scheduledEnd, delayMinutes);
      const newOrderWindowStart = breakSchedule.orderWindowStart ? 
        addMinutesToTime(breakSchedule.orderWindowStart, delayMinutes) : null;
      const newOrderWindowEnd = breakSchedule.orderWindowEnd ? 
        addMinutesToTime(breakSchedule.orderWindowEnd, delayMinutes) : null;

      // تحديث البريك
      await prisma.breakSchedule.update({
        where: { id: breakSchedule.id },
        data: {
          scheduledStart: newStartTime,
          scheduledEnd: newEndTime,
          orderWindowStart: newOrderWindowStart,
          orderWindowEnd: newOrderWindowEnd,
          status: 'DELAYED'
        }
      });
    }
  } catch (error) {
    console.error('خطأ في تعديل أوقات البريك:', error);
    throw error;
  }
}

/**
 * تعديل أوقات التوصيل عند التأخير
 * Adjust delivery times for delay
 */
async function adjustOrderTimesForDelay(scheduleId, delayMinutes) {
  try {
    // جلب الطلبات المرتبطة بهذا الجدول
    const orders = await prisma.order.findMany({
      where: {
        project: {
          shootingSchedules: {
            some: {
              id: scheduleId
            }
          }
        },
        status: {
          in: ['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY']
        }
      },
      include: {
        deliveryTracking: true
      }
    });

    for (const order of orders) {
      // تحديث وقت التوصيل المتوقع
      if (order.estimatedDelivery) {
        const newDeliveryTime = new Date(order.estimatedDelivery.getTime() + delayMinutes * 60000);
        
        await prisma.order.update({
          where: { id: order.id },
          data: {
            estimatedDelivery: newDeliveryTime
          }
        });

        // تحديث تتبع التوصيل إذا كان موجوداً
        if (order.deliveryTracking) {
          await prisma.deliveryTracking.update({
            where: { id: order.deliveryTracking.id },
            data: {
              estimatedArrival: newDeliveryTime
            }
          });
        }
      }
    }
  } catch (error) {
    console.error('خطأ في تعديل أوقات التوصيل:', error);
    throw error;
  }
}

/**
 * إضافة دقائق لوقت معين
 * Add minutes to time string
 */
function addMinutesToTime(timeString, minutes) {
  const [hours, mins] = timeString.split(':').map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMins = totalMinutes % 60;
  return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
}

/**
 * بدء بريك (فتح نافذة الطلب)
 * Start break (open order window)
 */
async function startBreak(breakId) {
  try {
    const breakSchedule = await prisma.breakSchedule.findUnique({
      where: { id: breakId },
      include: {
        schedule: {
          include: {
            project: {
              include: {
                members: {
                  include: {
                    user: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!breakSchedule) {
      throw new Error('جدول البريك غير موجود');
    }

    // تحديث حالة البريك
    const updatedBreak = await prisma.breakSchedule.update({
      where: { id: breakId },
      data: {
        status: 'ACTIVE',
        isOrderWindowOpen: true,
        actualStart: new Date().toTimeString().slice(0, 5)
      }
    });

    // إرسال إشعارات فتح نافذة الطلب
    await notifyBreakStarted(breakSchedule);

    return updatedBreak;
  } catch (error) {
    console.error('خطأ في بدء البريك:', error);
    throw error;
  }
}

/**
 * إنهاء بريك (إغلاق نافذة الطلب)
 * End break (close order window)
 */
async function endBreak(breakId) {
  try {
    const updatedBreak = await prisma.breakSchedule.update({
      where: { id: breakId },
      data: {
        status: 'COMPLETED',
        isOrderWindowOpen: false,
        actualEnd: new Date().toTimeString().slice(0, 5)
      }
    });

    return updatedBreak;
  } catch (error) {
    console.error('خطأ في إنهاء البريك:', error);
    throw error;
  }
}

/**
 * الحصول على جدول التصوير اليومي
 * Get today's shooting schedule
 */
async function getTodaySchedule(projectId) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const schedule = await prisma.shootingSchedule.findFirst({
      where: {
        projectId,
        scheduleDate: {
          gte: today,
          lt: tomorrow
        }
      },
      include: {
        breakSchedules: {
          orderBy: {
            scheduledStart: 'asc'
          }
        },
        project: {
          select: {
            name: true,
            location: true
          }
        }
      }
    });

    return schedule;
  } catch (error) {
    console.error('خطأ في جلب جدول اليوم:', error);
    throw error;
  }
}

/**
 * فحص البريكات النشطة
 * Check active breaks
 */
async function checkActiveBreaks() {
  try {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);

    // البحث عن البريكات التي يجب أن تبدأ
    const breaksToStart = await prisma.breakSchedule.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledStart: {
          lte: currentTime
        },
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
            project: true
          }
        }
      }
    });

    // بدء البريكات
    for (const breakSchedule of breaksToStart) {
      await startBreak(breakSchedule.id);
    }

    // البحث عن البريكات التي يجب أن تنتهي
    const breaksToEnd = await prisma.breakSchedule.findMany({
      where: {
        status: 'ACTIVE',
        scheduledEnd: {
          lte: currentTime
        }
      }
    });

    // إنهاء البريكات
    for (const breakSchedule of breaksToEnd) {
      await endBreak(breakSchedule.id);
    }

    return {
      started: breaksToStart.length,
      ended: breaksToEnd.length
    };
  } catch (error) {
    console.error('خطأ في فحص البريكات النشطة:', error);
    throw error;
  }
}

/**
 * إرسال إشعار إنشاء جدول جديد
 * Send schedule created notification
 */
async function notifyScheduleCreated(schedule) {
  try {
    const members = schedule.project.members;
    
    for (const member of members) {
      await notificationService.createNotification({
        userId: member.user.id,
        type: 'SCHEDULE_CREATED',
        title: 'جدول تصوير جديد',
        message: `تم إنشاء جدول تصوير جديد لمشروع ${schedule.project.name} في ${schedule.scheduleDate.toLocaleDateString('ar-EG')}`,
        data: {
          scheduleId: schedule.id,
          projectId: schedule.projectId,
          scheduleDate: schedule.scheduleDate,
          callTime: schedule.callTime
        }
      });
    }
  } catch (error) {
    console.error('خطأ في إرسال إشعارات الجدول:', error);
  }
}

/**
 * إرسال إشعار تغيير الجدول
 * Send schedule changed notification
 */
async function notifyScheduleChanged(schedule, changes) {
  try {
    const members = schedule.project.members;
    
    for (const member of members) {
      for (const change of changes) {
        await notificationService.createNotification({
          userId: member.user.id,
          type: 'SCHEDULE_CHANGED',
          title: 'تغيير في جدول التصوير',
          message: change.changeDescription,
          data: {
            scheduleId: schedule.id,
            projectId: schedule.projectId,
            changeType: change.changeType,
            oldValue: change.oldValue,
            newValue: change.newValue
          }
        });
      }
    }
  } catch (error) {
    console.error('خطأ في إرسال إشعارات التغيير:', error);
  }
}

/**
 * إرسال إشعار بدء البريك
 * Send break started notification
 */
async function notifyBreakStarted(breakSchedule) {
  try {
    const members = breakSchedule.schedule.project.members;
    
    for (const member of members) {
      await notificationService.createNotification({
        userId: member.user.id,
        type: 'BREAK_STARTED',
        title: 'بدء فترة البريك',
        message: `بدأت فترة ${breakSchedule.breakName} - يمكنك الآن طلب وجبتك`,
        data: {
          breakId: breakSchedule.id,
          scheduleId: breakSchedule.scheduleId,
          breakType: breakSchedule.breakType,
          breakName: breakSchedule.breakName
        }
      });
    }
  } catch (error) {
    console.error('خطأ في إرسال إشعارات البريك:', error);
  }
}

module.exports = {
  createShootingSchedule,
  updateShootingSchedule,
  startBreak,
  endBreak,
  getTodaySchedule,
  checkActiveBreaks,
  adjustBreakTimesForDelay,
  adjustOrderTimesForDelay
};
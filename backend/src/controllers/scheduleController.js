/**
 * تحكم جداول التصوير
 * Shooting Schedule Controller
 */

const scheduleIntegrationService = require('../services/scheduleIntegrationService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * إنشاء جدول تصوير جديد
 * Create new shooting schedule
 */
async function createSchedule(req, res) {
  try {
    const { projectId } = req.params;
    const scheduleData = req.body;

    // التحقق من صحة البيانات
    if (!scheduleData.scheduleName || !scheduleData.scheduleDate || !scheduleData.callTime) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DATA',
          message: 'البيانات المطلوبة مفقودة: اسم الجدول، تاريخ التصوير، ووقت الحضور',
          messageEn: 'Required data missing: schedule name, date, and call time'
        }
      });
    }

    // التحقق من وجود المشروع
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: 'المشروع غير موجود',
          messageEn: 'Project not found'
        }
      });
    }

    // إنشاء الجدول
    const schedule = await scheduleIntegrationService.createShootingSchedule(projectId, scheduleData);

    res.status(201).json({
      success: true,
      message: 'تم إنشاء جدول التصوير بنجاح',
      messageEn: 'Shooting schedule created successfully',
      data: schedule
    });

  } catch (error) {
    console.error('خطأ في إنشاء جدول التصوير:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SCHEDULE_CREATION_FAILED',
        message: 'فشل في إنشاء جدول التصوير',
        messageEn: 'Failed to create shooting schedule',
        details: error.message
      }
    });
  }
}

/**
 * تحديث جدول التصوير
 * Update shooting schedule
 */
async function updateSchedule(req, res) {
  try {
    const { scheduleId } = req.params;
    const updateData = req.body;
    const changedBy = req.user?.id; // من المصادقة

    const updatedSchedule = await scheduleIntegrationService.updateShootingSchedule(
      scheduleId, 
      updateData, 
      changedBy
    );

    res.json({
      success: true,
      message: 'تم تحديث جدول التصوير بنجاح',
      messageEn: 'Shooting schedule updated successfully',
      data: updatedSchedule
    });

  } catch (error) {
    console.error('خطأ في تحديث جدول التصوير:', error);
    
    if (error.message === 'جدول التصوير غير موجود') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SCHEDULE_NOT_FOUND',
          message: 'جدول التصوير غير موجود',
          messageEn: 'Shooting schedule not found'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'SCHEDULE_UPDATE_FAILED',
        message: 'فشل في تحديث جدول التصوير',
        messageEn: 'Failed to update shooting schedule',
        details: error.message
      }
    });
  }
}

/**
 * الحصول على جدول التصوير
 * Get shooting schedule
 */
async function getSchedule(req, res) {
  try {
    const { scheduleId } = req.params;

    const schedule = await prisma.shootingSchedule.findUnique({
      where: { id: scheduleId },
      include: {
        breakSchedules: {
          orderBy: {
            scheduledStart: 'asc'
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            nameArabic: true,
            location: true,
            coordinates: true
          }
        },
        scheduleChanges: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 10 // آخر 10 تغييرات
        }
      }
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SCHEDULE_NOT_FOUND',
          message: 'جدول التصوير غير موجود',
          messageEn: 'Shooting schedule not found'
        }
      });
    }

    res.json({
      success: true,
      data: schedule
    });

  } catch (error) {
    console.error('خطأ في جلب جدول التصوير:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SCHEDULE_FETCH_FAILED',
        message: 'فشل في جلب جدول التصوير',
        messageEn: 'Failed to fetch shooting schedule',
        details: error.message
      }
    });
  }
}

/**
 * الحصول على جداول المشروع
 * Get project schedules
 */
async function getProjectSchedules(req, res) {
  try {
    const { projectId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    const skip = (page - 1) * limit;
    const where = { projectId };
    
    if (status) {
      where.status = status;
    }

    const [schedules, total] = await Promise.all([
      prisma.shootingSchedule.findMany({
        where,
        include: {
          breakSchedules: {
            select: {
              id: true,
              breakType: true,
              breakName: true,
              scheduledStart: true,
              scheduledEnd: true,
              status: true,
              isOrderWindowOpen: true
            }
          }
        },
        orderBy: {
          scheduleDate: 'desc'
        },
        skip,
        take: parseInt(limit)
      }),
      prisma.shootingSchedule.count({ where })
    ]);

    res.json({
      success: true,
      data: schedules,
      meta: {
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('خطأ في جلب جداول المشروع:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'PROJECT_SCHEDULES_FETCH_FAILED',
        message: 'فشل في جلب جداول المشروع',
        messageEn: 'Failed to fetch project schedules',
        details: error.message
      }
    });
  }
}

/**
 * الحصول على جدول اليوم
 * Get today's schedule
 */
async function getTodaySchedule(req, res) {
  try {
    const { projectId } = req.params;

    const schedule = await scheduleIntegrationService.getTodaySchedule(projectId);

    if (!schedule) {
      return res.json({
        success: true,
        message: 'لا يوجد جدول تصوير لليوم',
        messageEn: 'No shooting schedule for today',
        data: null
      });
    }

    res.json({
      success: true,
      data: schedule
    });

  } catch (error) {
    console.error('خطأ في جلب جدول اليوم:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'TODAY_SCHEDULE_FETCH_FAILED',
        message: 'فشل في جلب جدول اليوم',
        messageEn: 'Failed to fetch today\'s schedule',
        details: error.message
      }
    });
  }
}

/**
 * بدء بريك
 * Start break
 */
async function startBreak(req, res) {
  try {
    const { breakId } = req.params;

    const updatedBreak = await scheduleIntegrationService.startBreak(breakId);

    res.json({
      success: true,
      message: 'تم بدء فترة البريك بنجاح - يمكن للطاقم الآن طلب الوجبات',
      messageEn: 'Break started successfully - crew can now place orders',
      data: updatedBreak
    });

  } catch (error) {
    console.error('خطأ في بدء البريك:', error);
    
    if (error.message === 'جدول البريك غير موجود') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'BREAK_NOT_FOUND',
          message: 'جدول البريك غير موجود',
          messageEn: 'Break schedule not found'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'BREAK_START_FAILED',
        message: 'فشل في بدء البريك',
        messageEn: 'Failed to start break',
        details: error.message
      }
    });
  }
}

/**
 * إنهاء بريك
 * End break
 */
async function endBreak(req, res) {
  try {
    const { breakId } = req.params;

    const updatedBreak = await scheduleIntegrationService.endBreak(breakId);

    res.json({
      success: true,
      message: 'تم إنهاء فترة البريك - لا يمكن طلب المزيد من الوجبات',
      messageEn: 'Break ended - no more orders can be placed',
      data: updatedBreak
    });

  } catch (error) {
    console.error('خطأ في إنهاء البريك:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'BREAK_END_FAILED',
        message: 'فشل في إنهاء البريك',
        messageEn: 'Failed to end break',
        details: error.message
      }
    });
  }
}

/**
 * الحصول على البريكات النشطة
 * Get active breaks
 */
async function getActiveBreaks(req, res) {
  try {
    const { projectId } = req.params;

    const activeBreaks = await prisma.breakSchedule.findMany({
      where: {
        schedule: {
          projectId
        },
        status: {
          in: ['ACTIVE', 'IN_PROGRESS']
        }
      },
      include: {
        schedule: {
          select: {
            id: true,
            scheduleName: true,
            scheduleDate: true,
            project: {
              select: {
                name: true,
                nameArabic: true
              }
            }
          }
        }
      },
      orderBy: {
        scheduledStart: 'asc'
      }
    });

    res.json({
      success: true,
      data: activeBreaks
    });

  } catch (error) {
    console.error('خطأ في جلب البريكات النشطة:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ACTIVE_BREAKS_FETCH_FAILED',
        message: 'فشل في جلب البريكات النشطة',
        messageEn: 'Failed to fetch active breaks',
        details: error.message
      }
    });
  }
}

/**
 * حذف جدول التصوير
 * Delete shooting schedule
 */
async function deleteSchedule(req, res) {
  try {
    const { scheduleId } = req.params;

    // التحقق من وجود الجدول
    const schedule = await prisma.shootingSchedule.findUnique({
      where: { id: scheduleId },
      include: {
        breakSchedules: true
      }
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SCHEDULE_NOT_FOUND',
          message: 'جدول التصوير غير موجود',
          messageEn: 'Shooting schedule not found'
        }
      });
    }

    // التحقق من عدم وجود طلبات مرتبطة
    const relatedOrders = await prisma.order.count({
      where: {
        projectId: schedule.projectId,
        createdAt: {
          gte: new Date(schedule.scheduleDate.getFullYear(), schedule.scheduleDate.getMonth(), schedule.scheduleDate.getDate()),
          lt: new Date(schedule.scheduleDate.getFullYear(), schedule.scheduleDate.getMonth(), schedule.scheduleDate.getDate() + 1)
        }
      }
    });

    if (relatedOrders > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'SCHEDULE_HAS_ORDERS',
          message: 'لا يمكن حذف الجدول لوجود طلبات مرتبطة به',
          messageEn: 'Cannot delete schedule with related orders'
        }
      });
    }

    // حذف الجدول والبريكات المرتبطة
    await prisma.shootingSchedule.delete({
      where: { id: scheduleId }
    });

    res.json({
      success: true,
      message: 'تم حذف جدول التصوير بنجاح',
      messageEn: 'Shooting schedule deleted successfully'
    });

  } catch (error) {
    console.error('خطأ في حذف جدول التصوير:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SCHEDULE_DELETE_FAILED',
        message: 'فشل في حذف جدول التصوير',
        messageEn: 'Failed to delete shooting schedule',
        details: error.message
      }
    });
  }
}

module.exports = {
  createSchedule,
  updateSchedule,
  getSchedule,
  getProjectSchedules,
  getTodaySchedule,
  startBreak,
  endBreak,
  getActiveBreaks,
  deleteSchedule
};
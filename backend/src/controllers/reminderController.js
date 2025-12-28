const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const reminderScheduler = require('../services/reminderSchedulerService');
const notificationService = require('../services/notificationService');

/**
 * Reminder Controller - متحكم التذكيرات العربي
 * للتحكم في نظام التذكيرات النصف ساعية مع دعم التعريب الكامل
 */

// ============================================
// Project Reminder Settings
// ============================================

/**
 * الحصول على إعدادات التذكير لمشروع
 */
exports.getProjectReminderSettings = async (req, res) => {
  try {
    const { projectId } = req.params;

    let settings = await prisma.projectReminderSettings.findUnique({
      where: { projectId }
    });

    // إنشاء إعدادات افتراضية إذا لم توجد
    if (!settings) {
      settings = await prisma.projectReminderSettings.create({
        data: {
          projectId,
          enableReminders: true,
          enableHalfHourlyReminders: true,
          orderWindowStart: '08:00',
          orderWindowEnd: '09:00',
          reminderInterval: 30,
          firstReminderOffset: 30
        }
      });
    }

    res.json({
      success: true,
      data: settings,
      message: req.t('reminders.settingsRetrieved')
    });
  } catch (error) {
    console.error('خطأ في جلب إعدادات التذكير:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_SETTINGS_ERROR',
        message: req.t('reminders.settingsFetchFailed'),
        details: error.message
      }
    });
  }
};

/**
 * تحديث إعدادات التذكير لمشروع
 */
exports.updateProjectReminderSettings = async (req, res) => {
  try {
    const { projectId } = req.params;
    const updateData = req.body;

    const settings = await prisma.projectReminderSettings.upsert({
      where: { projectId },
      update: updateData,
      create: {
        projectId,
        ...updateData
      }
    });

    res.json({
      success: true,
      data: settings,
      message: req.t('reminders.settingsUpdated')
    });
  } catch (error) {
    console.error('خطأ في تحديث إعدادات التذكير:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_SETTINGS_ERROR',
        message: req.t('reminders.settingsUpdateFailed'),
        details: error.message
      }
    });
  }
};

// ============================================
// User Reminder Preferences
// ============================================

/**
 * الحصول على تفضيلات التذكير للمستخدم
 */
exports.getUserReminderPreferences = async (req, res) => {
  try {
    const userId = req.user.id;

    let preferences = await prisma.userReminderPreferences.findUnique({
      where: { userId }
    });

    // إنشاء تفضيلات افتراضية إذا لم توجد
    if (!preferences) {
      preferences = await prisma.userReminderPreferences.create({
        data: {
          userId,
          enableReminders: true,
          enableHalfHourlyReminders: true,
          preferredChannels: ['push'],
          maxRemindersPerDay: 10
        }
      });
    }

    res.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    console.error('خطأ في جلب تفضيلات التذكير:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_PREFERENCES_ERROR',
        message: 'فشل في جلب تفضيلات التذكير',
        details: error.message
      }
    });
  }
};

/**
 * تحديث تفضيلات التذكير للمستخدم
 */
exports.updateUserReminderPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;

    const preferences = await prisma.userReminderPreferences.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        ...updateData
      }
    });

    res.json({
      success: true,
      data: preferences,
      message: 'تم تحديث تفضيلات التذكير بنجاح'
    });
  } catch (error) {
    console.error('خطأ في تحديث تفضيلات التذكير:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_PREFERENCES_ERROR',
        message: 'فشل في تحديث تفضيلات التذكير',
        details: error.message
      }
    });
  }
};

// ============================================
// Reminder Logs
// ============================================

/**
 * الحصول على سجل التذكيرات للمستخدم
 */
exports.getUserReminderLogs = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, projectId } = req.query;
    const skip = (page - 1) * limit;

    const where = { userId };
    if (projectId) {
      where.projectId = projectId;
    }

    const logs = await prisma.reminderLog.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.reminderLog.count({ where });

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('خطأ في جلب سجل التذكيرات:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_LOGS_ERROR',
        message: 'فشل في جلب سجل التذكيرات',
        details: error.message
      }
    });
  }
};

/**
 * تحديد التذكير كمقروء
 */
exports.markReminderAsRead = async (req, res) => {
  try {
    const { reminderId } = req.params;
    const userId = req.user.id;

    const reminder = await prisma.reminderLog.updateMany({
      where: {
        id: reminderId,
        userId
      },
      data: {
        readAt: new Date()
      }
    });

    res.json({
      success: true,
      data: reminder,
      message: 'تم تحديد التذكير كمقروء'
    });
  } catch (error) {
    console.error('خطأ في تحديث حالة التذكير:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_REMINDER_ERROR',
        message: 'فشل في تحديث حالة التذكير',
        details: error.message
      }
    });
  }
};

/**
 * تسجيل إجراء على التذكير
 */
exports.recordReminderAction = async (req, res) => {
  try {
    const { reminderId } = req.params;
    const { actionType } = req.body;
    const userId = req.user.id;

    const reminder = await prisma.reminderLog.updateMany({
      where: {
        id: reminderId,
        userId
      },
      data: {
        isActedUpon: true,
        actionTakenAt: new Date(),
        actionType
      }
    });

    res.json({
      success: true,
      data: reminder,
      message: 'تم تسجيل الإجراء بنجاح'
    });
  } catch (error) {
    console.error('خطأ في تسجيل الإجراء:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'RECORD_ACTION_ERROR',
        message: 'فشل في تسجيل الإجراء',
        details: error.message
      }
    });
  }
};

// ============================================
// Manual Reminder Triggers
// ============================================

/**
 * إرسال تذكير فوري لمشروع
 * (Admin/Producer only)
 */
exports.sendImmediateReminder = async (req, res) => {
  try {
    const { projectId } = req.params;

    // التحقق من صلاحيات المستخدم
    if (!['ADMIN', 'PRODUCER'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'ليس لديك صلاحية لإرسال تذكيرات فورية'
        }
      });
    }

    const result = await notificationService.sendImmediateProjectReminder(projectId);

    res.json({
      success: true,
      data: result,
      message: 'تم إرسال التذكيرات الفورية بنجاح'
    });
  } catch (error) {
    console.error('خطأ في إرسال التذكير الفوري:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SEND_REMINDER_ERROR',
        message: 'فشل في إرسال التذكير الفوري',
        details: error.message
      }
    });
  }
};

// ============================================
// System Status
// ============================================

/**
 * الحصول على حالة نظام التذكيرات
 * (Admin only)
 */
exports.getReminderSystemStatus = async (req, res) => {
  try {
    // التحقق من صلاحيات المستخدم
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'ليس لديك صلاحية لعرض حالة النظام'
        }
      });
    }

    const status = reminderScheduler.getStatus();

    // إحصائيات إضافية
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = {
      remindersToday: await prisma.reminderLog.count({
        where: { createdAt: { gte: today } }
      }),
      remindersSent: await prisma.reminderLog.count({
        where: {
          createdAt: { gte: today },
          status: 'SENT'
        }
      }),
      remindersFailed: await prisma.reminderLog.count({
        where: {
          createdAt: { gte: today },
          status: 'FAILED'
        }
      })
    };

    res.json({
      success: true,
      data: {
        system: status,
        stats
      }
    });
  } catch (error) {
    console.error('خطأ في جلب حالة النظام:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'STATUS_ERROR',
        message: 'فشل في جلب حالة النظام',
        details: error.message
      }
    });
  }
};

// ============================================
// Statistics
// ============================================

/**
 * إحصائيات التذكيرات للمشروع
 */
exports.getProjectReminderStats = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { startDate, endDate } = req.query;

    const where = { projectId };

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const stats = await prisma.reminderLog.groupBy({
      by: ['status'],
      where,
      _count: {
        id: true
      }
    });

    const totalReminders = await prisma.reminderLog.count({ where });

    const actedUpon = await prisma.reminderLog.count({
      where: {
        ...where,
        isActedUpon: true
      }
    });

    res.json({
      success: true,
      data: {
        byStatus: stats,
        total: totalReminders,
        actedUpon,
        responseRate: totalReminders > 0 ? (actedUpon / totalReminders * 100).toFixed(2) : 0
      }
    });
  } catch (error) {
    console.error('خطأ في جلب إحصائيات التذكيرات:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'STATS_ERROR',
        message: 'فشل في جلب إحصائيات التذكيرات',
        details: error.message
      }
    });
  }
};

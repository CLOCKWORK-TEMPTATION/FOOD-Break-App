/**
 * مسارات جداول التصوير
 * Shooting Schedule Routes
 */

const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateScheduleData, validateBreakData } = require('../middleware/validation');

// Middleware للمصادقة على جميع المسارات
router.use(authenticateToken);

/**
 * مسارات الجداول الأساسية
 * Basic Schedule Routes
 */

// إنشاء جدول تصوير جديد
// POST /api/schedules/projects/:projectId
router.post('/projects/:projectId', 
  requireRole(['ADMIN', 'PRODUCER', 'MANAGER']),
  validateScheduleData,
  scheduleController.createSchedule
);

// الحصول على جداول المشروع
// GET /api/schedules/projects/:projectId
router.get('/projects/:projectId', 
  scheduleController.getProjectSchedules
);

// الحصول على جدول اليوم للمشروع
// GET /api/schedules/projects/:projectId/today
router.get('/projects/:projectId/today', 
  scheduleController.getTodaySchedule
);

// الحصول على البريكات النشطة للمشروع
// GET /api/schedules/projects/:projectId/active-breaks
router.get('/projects/:projectId/active-breaks', 
  scheduleController.getActiveBreaks
);

// الحصول على جدول محدد
// GET /api/schedules/:scheduleId
router.get('/:scheduleId', 
  scheduleController.getSchedule
);

// تحديث جدول التصوير
// PUT /api/schedules/:scheduleId
router.put('/:scheduleId', 
  requireRole(['ADMIN', 'PRODUCER', 'MANAGER']),
  scheduleController.updateSchedule
);

// حذف جدول التصوير
// DELETE /api/schedules/:scheduleId
router.delete('/:scheduleId', 
  requireRole(['ADMIN', 'PRODUCER']),
  scheduleController.deleteSchedule
);

/**
 * مسارات إدارة البريكات
 * Break Management Routes
 */

// بدء بريك (فتح نافذة الطلب)
// POST /api/schedules/breaks/:breakId/start
router.post('/breaks/:breakId/start', 
  requireRole(['ADMIN', 'PRODUCER', 'MANAGER', 'LEAD']),
  scheduleController.startBreak
);

// إنهاء بريك (إغلاق نافذة الطلب)
// POST /api/schedules/breaks/:breakId/end
router.post('/breaks/:breakId/end', 
  requireRole(['ADMIN', 'PRODUCER', 'MANAGER', 'LEAD']),
  scheduleController.endBreak
);

/**
 * مسارات التقارير والإحصائيات
 * Reports and Analytics Routes
 */

// تقرير جداول المشروع
// GET /api/schedules/projects/:projectId/report
router.get('/projects/:projectId/report', 
  requireRole(['ADMIN', 'PRODUCER', 'MANAGER']),
  async (req, res) => {
    try {
      const { projectId } = req.params;
      const { startDate, endDate } = req.query;

      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      const where = { projectId };
      
      if (startDate && endDate) {
        where.scheduleDate = {
          gte: new Date(startDate),
          lte: new Date(endDate)
        };
      }

      const schedules = await prisma.shootingSchedule.findMany({
        where,
        include: {
          breakSchedules: true,
          scheduleChanges: true,
          project: {
            select: {
              name: true,
              nameArabic: true
            }
          }
        },
        orderBy: {
          scheduleDate: 'desc'
        }
      });

      // إحصائيات
      const stats = {
        totalSchedules: schedules.length,
        completedSchedules: schedules.filter(s => s.status === 'COMPLETED').length,
        delayedSchedules: schedules.filter(s => s.status === 'DELAYED').length,
        cancelledSchedules: schedules.filter(s => s.status === 'CANCELLED').length,
        totalBreaks: schedules.reduce((sum, s) => sum + s.breakSchedules.length, 0),
        totalChanges: schedules.reduce((sum, s) => sum + s.scheduleChanges.length, 0),
        averageDelayMinutes: schedules
          .filter(s => s.delayMinutes > 0)
          .reduce((sum, s) => sum + s.delayMinutes, 0) / 
          Math.max(schedules.filter(s => s.delayMinutes > 0).length, 1)
      };

      res.json({
        success: true,
        data: {
          schedules,
          statistics: stats
        }
      });

    } catch (error) {
      console.error('خطأ في تقرير الجداول:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SCHEDULE_REPORT_FAILED',
          message: 'فشل في إنشاء تقرير الجداول',
          messageEn: 'Failed to generate schedule report',
          details: error.message
        }
      });
    }
  }
);

// إحصائيات البريكات
// GET /api/schedules/projects/:projectId/break-stats
router.get('/projects/:projectId/break-stats', 
  requireRole(['ADMIN', 'PRODUCER', 'MANAGER']),
  async (req, res) => {
    try {
      const { projectId } = req.params;
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      const breakStats = await prisma.breakSchedule.groupBy({
        by: ['breakType', 'status'],
        where: {
          schedule: {
            projectId
          }
        },
        _count: {
          id: true
        }
      });

      // تنظيم الإحصائيات
      const organizedStats = {};
      breakStats.forEach(stat => {
        if (!organizedStats[stat.breakType]) {
          organizedStats[stat.breakType] = {};
        }
        organizedStats[stat.breakType][stat.status] = stat._count.id;
      });

      res.json({
        success: true,
        data: organizedStats
      });

    } catch (error) {
      console.error('خطأ في إحصائيات البريكات:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'BREAK_STATS_FAILED',
          message: 'فشل في جلب إحصائيات البريكات',
          messageEn: 'Failed to fetch break statistics',
          details: error.message
        }
      });
    }
  }
);

/**
 * مسارات الأدوات المساعدة
 * Utility Routes
 */

// فحص البريكات النشطة (للـ Cron Jobs)
// GET /api/schedules/system/check-active-breaks
router.get('/system/check-active-breaks', 
  requireRole(['ADMIN']),
  async (req, res) => {
    try {
      const scheduleIntegrationService = require('../services/scheduleIntegrationService');
      const result = await scheduleIntegrationService.checkActiveBreaks();

      res.json({
        success: true,
        message: `تم فحص البريكات - بدء ${result.started} وإنهاء ${result.ended}`,
        messageEn: `Breaks checked - started ${result.started}, ended ${result.ended}`,
        data: result
      });

    } catch (error) {
      console.error('خطأ في فحص البريكات النشطة:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'BREAK_CHECK_FAILED',
          message: 'فشل في فحص البريكات النشطة',
          messageEn: 'Failed to check active breaks',
          details: error.message
        }
      });
    }
  }
);

// معلومات النظام
// GET /api/schedules/system/info
router.get('/system/info', 
  requireRole(['ADMIN']),
  (req, res) => {
    res.json({
      success: true,
      data: {
        systemName: 'BreakApp Schedule Integration System',
        systemNameArabic: 'نظام تكامل جداول التصوير - بريك آب',
        version: '1.0.0',
        features: {
          scheduleManagement: 'إدارة جداول التصوير',
          breakManagement: 'إدارة فترات البريك',
          delayHandling: 'معالجة التأخيرات',
          automaticNotifications: 'الإشعارات التلقائية',
          orderIntegration: 'تكامل الطلبات',
          deliveryTracking: 'تتبع التوصيل'
        },
        supportedBreakTypes: [
          'BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'TEA_BREAK', 'MEAL_BREAK'
        ],
        supportedScheduleStatuses: [
          'SCHEDULED', 'IN_PROGRESS', 'ON_BREAK', 'DELAYED', 'COMPLETED', 'CANCELLED', 'POSTPONED'
        ]
      }
    });
  }
);

module.exports = router;
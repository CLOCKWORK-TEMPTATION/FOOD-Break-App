const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminderController');
const { authenticateToken, requireAdminOrProducer } = require('../middleware/auth');

/**
 * Routes for Reminder System
 * نقاط النهاية لنظام التذكيرات النصف ساعية
 */

// ============================================
// Project Reminder Settings (Admin/Producer)
// ============================================

/**
 * GET /api/reminders/projects/:projectId/settings
 * الحصول على إعدادات التذكير للمشروع
 */
router.get(
  '/projects/:projectId/settings',
  authenticateToken,
  reminderController.getProjectReminderSettings
);

/**
 * PUT /api/reminders/projects/:projectId/settings
 * تحديث إعدادات التذكير للمشروع
 */
router.put(
  '/projects/:projectId/settings',
  authenticateToken,
  reminderController.updateProjectReminderSettings
);

// ============================================
// User Reminder Preferences
// ============================================

/**
 * GET /api/reminders/preferences
 * الحصول على تفضيلات التذكير للمستخدم الحالي
 */
router.get(
  '/preferences',
  authenticateToken,
  reminderController.getUserReminderPreferences
);

/**
 * PUT /api/reminders/preferences
 * تحديث تفضيلات التذكير للمستخدم الحالي
 */
router.put(
  '/preferences',
  authenticateToken,
  reminderController.updateUserReminderPreferences
);

// ============================================
// Reminder Logs
// ============================================

/**
 * GET /api/reminders/logs
 * الحصول على سجل التذكيرات للمستخدم الحالي
 */
router.get(
  '/logs',
  authenticateToken,
  reminderController.getUserReminderLogs
);

/**
 * PATCH /api/reminders/:reminderId/read
 * تحديد التذكير كمقروء
 */
router.patch(
  '/:reminderId/read',
  authenticateToken,
  reminderController.markReminderAsRead
);

/**
 * POST /api/reminders/:reminderId/action
 * تسجيل إجراء على التذكير
 */
router.post(
  '/:reminderId/action',
  authenticateToken,
  reminderController.recordReminderAction
);

// ============================================
// Manual Triggers (Admin/Producer)
// ============================================

/**
 * POST /api/reminders/projects/:projectId/send
 * إرسال تذكير فوري لجميع المستخدمين في المشروع
 */
router.post(
  '/projects/:projectId/send',
  authenticateToken,
  reminderController.sendImmediateReminder
);

// ============================================
// System Status & Statistics (Admin)
// ============================================

/**
 * GET /api/reminders/system/status
 * الحصول على حالة نظام التذكيرات
 */
router.get(
  '/system/status',
  authenticateToken,
  reminderController.getReminderSystemStatus
);

/**
 * GET /api/reminders/projects/:projectId/stats
 * إحصائيات التذكيرات للمشروع
 */
router.get(
  '/projects/:projectId/stats',
  authenticateToken,
  reminderController.getProjectReminderStats
);

module.exports = router;

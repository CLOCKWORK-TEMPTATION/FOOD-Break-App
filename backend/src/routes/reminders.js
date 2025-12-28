const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminderController');
const auth = require('../middleware/auth');

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
  auth.authenticate,
  reminderController.getProjectReminderSettings
);

/**
 * PUT /api/reminders/projects/:projectId/settings
 * تحديث إعدادات التذكير للمشروع
 */
router.put(
  '/projects/:projectId/settings',
  auth.authenticate,
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
  auth.authenticate,
  reminderController.getUserReminderPreferences
);

/**
 * PUT /api/reminders/preferences
 * تحديث تفضيلات التذكير للمستخدم الحالي
 */
router.put(
  '/preferences',
  auth.authenticate,
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
  auth.authenticate,
  reminderController.getUserReminderLogs
);

/**
 * PATCH /api/reminders/:reminderId/read
 * تحديد التذكير كمقروء
 */
router.patch(
  '/:reminderId/read',
  auth.authenticate,
  reminderController.markReminderAsRead
);

/**
 * POST /api/reminders/:reminderId/action
 * تسجيل إجراء على التذكير
 */
router.post(
  '/:reminderId/action',
  auth.authenticate,
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
  auth.authenticate,
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
  auth.authenticate,
  reminderController.getReminderSystemStatus
);

/**
 * GET /api/reminders/projects/:projectId/stats
 * إحصائيات التذكيرات للمشروع
 */
router.get(
  '/projects/:projectId/stats',
  auth.authenticate,
  reminderController.getProjectReminderStats
);

module.exports = router;

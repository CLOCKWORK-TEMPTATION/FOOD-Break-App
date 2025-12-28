const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

/**
 * Notification Routes
 * جميع المسارات تتطلب المصادقة
 */

// GET /api/v1/notifications - الحصول على إشعارات المستخدم
router.get('/', authenticate, notificationController.getUserNotifications);

// GET /api/v1/notifications/unread-count - عدد الإشعارات غير المقروءة
router.get('/unread-count', authenticate, notificationController.getUnreadCount);

// PUT /api/v1/notifications/:id/read - تحديد إشعار كمقروء
router.put('/:id/read', authenticate, notificationController.markAsRead);

// PUT /api/v1/notifications/mark-all-read - تحديد جميع الإشعارات كمقروءة
router.put('/mark-all-read', authenticate, notificationController.markAllAsRead);

// DELETE /api/v1/notifications/:id - حذف إشعار
router.delete('/:id', authenticate, notificationController.deleteNotification);

// ========================================
// Test Endpoints (Development Only)
// ========================================

// POST /api/v1/notifications/test/push - اختبار إشعار فوري
router.post('/test/push', authenticate, notificationController.testPushNotification);

// POST /api/v1/notifications/test/sms - اختبار رسالة نصية
router.post('/test/sms', authenticate, notificationController.testSMSNotification);

// POST /api/v1/notifications/test/email - اختبار بريد إلكتروني
router.post('/test/email', authenticate, notificationController.testEmailNotification);

module.exports = router;

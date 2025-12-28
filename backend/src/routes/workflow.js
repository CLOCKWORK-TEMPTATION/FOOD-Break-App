/**
 * Workflow Routes
 * جميع مسارات آلية عمل التطبيق من الطلب إلى التوصيل
 */

const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const workflowController = require('../controllers/workflowController');
const { auth, producer } = require('../middleware/auth');

/**
 * 1. التحقق من صحة رمز QR
 * POST /api/v1/workflow/validate-qr
 */
router.post('/validate-qr', [
  body('qrCode').notEmpty().withMessage('رمز QR مفقود')
], auth, workflowController.validateProjectQR);

/**
 * 2. تقديم طلب جديد
 * POST /api/v1/workflow/orders
 */
router.post('/orders', auth, [
  body('projectId').notEmpty().withMessage('معرف المشروع مفقود'),
  body('restaurantId').notEmpty().withMessage('معرف المطعم مفقود'),
  body('menuItems').isArray().notEmpty().withMessage('قائمة الطلبات مفقودة')
], workflowController.submitOrder);

/**
 * 3. تأكيد الطلب
 * PATCH /api/v1/workflow/orders/:orderId/confirm
 */
router.patch('/orders/:orderId/confirm', auth, [
  param('orderId').notEmpty().withMessage('معرف الطلب مفقود'),
  body('confirmed').isBoolean().withMessage('تأكيد مفقود')
], workflowController.confirmOrder);

/**
 * 4. جلب طلبات المستخدم
 * GET /api/v1/workflow/orders?projectId=:projectId&status=:status&page=1&limit=10
 */
router.get('/orders', auth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], workflowController.getUserOrders);

/**
 * 5. جلب الطلبات المجمعة لفريق الإنتاج
 * GET /api/v1/workflow/projects/:projectId/aggregated-orders
 */
router.get('/projects/:projectId/aggregated-orders', auth, producer, [
  param('projectId').notEmpty().withMessage('معرف المشروع مفقود')
], workflowController.getAggregatedOrders);

/**
 * 6. تحديث حالة الطلب (من قبل المطعم/المسؤول)
 * PATCH /api/v1/workflow/orders/:orderId/status
 */
router.patch('/orders/:orderId/status', auth, producer, [
  param('orderId').notEmpty().withMessage('معرف الطلب مفقود'),
  body('status').notEmpty().withMessage('الحالة مفقودة')
], workflowController.updateOrderStatus);

/**
 * 7. إرسال تذكيرات نصف ساعية
 * POST /api/v1/workflow/send-reminders
 */
router.post('/send-reminders', auth, producer, [
  body('projectId').notEmpty().withMessage('معرف المشروع مفقود')
], workflowController.sendOrderReminders);

/**
 * 8. جلب موقع التوصيل في الوقت الفعلي
 * GET /api/v1/workflow/orders/:orderId/tracking
 */
router.get('/orders/:orderId/tracking', auth, [
  param('orderId').notEmpty().withMessage('معرف الطلب مفقود')
], workflowController.getOrderTracking);

/**
 * 9. تحديث موقع التوصيل (من قبل سائق التوصيل)
 * PATCH /api/v1/workflow/orders/:orderId/location
 */
router.patch('/orders/:orderId/location', auth, [
  param('orderId').notEmpty().withMessage('معرف الطلب مفقود'),
  body('latitude').isFloat().withMessage('خط العرض غير صحيح'),
  body('longitude').isFloat().withMessage('خط الطول غير صحيح')
], workflowController.updateDeliveryLocation);

/**
 * 10. تسليم الطلب
 * PATCH /api/v1/workflow/orders/:orderId/deliver
 */
router.patch('/orders/:orderId/deliver', auth, [
  param('orderId').notEmpty().withMessage('معرف الطلب مفقود')
], workflowController.deliverOrder);

module.exports = router;
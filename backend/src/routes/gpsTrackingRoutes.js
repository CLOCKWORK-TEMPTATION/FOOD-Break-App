/**
 * GPS Tracking Routes
 * مسارات تتبع التوصيل
 */

const express = require('express');
const router = express.Router();
const gpsTrackingController = require('../controllers/gpsTrackingController');
const authMiddleware = require('../middleware/authMiddleware');
const { body, param } = require('express-validator');

// تطبيق middleware المصادقة على جميع المسارات
router.use(authMiddleware);

/**
 * POST /api/tracking/create
 * إنشاء تتبع توصيل جديد
 */
router.post('/create', [
  body('orderId').notEmpty().withMessage('رقم الطلب مطلوب'),
  body('driverInfo.name').optional().isString().withMessage('اسم السائق يجب أن يكون نص'),
  body('driverInfo.phone').optional().isMobilePhone().withMessage('رقم هاتف السائق غير صحيح'),
  body('driverInfo.vehicle').optional().isString().withMessage('معلومات المركبة يجب أن تكون نص')
], gpsTrackingController.createTracking);

/**
 * PUT /api/tracking/:id/location
 * تحديث موقع السائق
 */
router.put('/:id/location', [
  param('id').isMongoId().withMessage('معرف التتبع غير صحيح'),
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('خط العرض غير صحيح'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('خط الطول غير صحيح'),
  body('accuracy').optional().isFloat({ min: 0 }).withMessage('دقة الموقع يجب أن تكون رقم موجب'),
  body('speed').optional().isFloat({ min: 0 }).withMessage('السرعة يجب أن تكون رقم موجب'),
  body('heading').optional().isFloat({ min: 0, max: 360 }).withMessage('الاتجاه يجب أن يكون بين 0 و 360')
], gpsTrackingController.updateLocation);

/**
 * PUT /api/tracking/:id/status
 * تحديث حالة التوصيل
 */
router.put('/:id/status', [
  param('id').isMongoId().withMessage('معرف التتبع غير صحيح'),
  body('status').isIn([
    'PREPARING', 'DRIVER_ASSIGNED', 'PICKED_UP', 
    'ON_THE_WAY', 'NEARBY', 'DELIVERED', 'FAILED', 'RETURNED'
  ]).withMessage('حالة التوصيل غير صحيحة'),
  body('notes').optional().isString().withMessage('الملاحظات يجب أن تكون نص'),
  body('latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('خط العرض غير صحيح'),
  body('longitude').optional().isFloat({ min: -180, max: 180 }).withMessage('خط الطول غير صحيح')
], gpsTrackingController.updateStatus);

/**
 * GET /api/tracking/:id
 * الحصول على معلومات التتبع
 */
router.get('/:id', [
  param('id').isMongoId().withMessage('معرف التتبع غير صحيح')
], gpsTrackingController.getTracking);

/**
 * GET /api/tracking/order/:orderId
 * الحصول على تتبع التوصيل بواسطة رقم الطلب
 */
router.get('/order/:orderId', [
  param('orderId').isMongoId().withMessage('رقم الطلب غير صحيح')
], gpsTrackingController.getTrackingByOrder);

/**
 * GET /api/tracking/active
 * الحصول على جميع التوصيلات النشطة (للإدارة فقط)
 */
router.get('/active', gpsTrackingController.getActiveDeliveries);

/**
 * POST /api/tracking/:id/assign-driver
 * تعيين سائق للطلب
 */
router.post('/:id/assign-driver', [
  param('id').isMongoId().withMessage('معرف التتبع غير صحيح'),
  body('name').notEmpty().withMessage('اسم السائق مطلوب'),
  body('phone').isMobilePhone().withMessage('رقم هاتف السائق غير صحيح'),
  body('vehicle').optional().isString().withMessage('معلومات المركبة يجب أن تكون نص')
], gpsTrackingController.assignDriver);

/**
 * GET /api/tracking/:id/route
 * الحصول على مسار التوصيل (للعرض على الخريطة)
 */
router.get('/:id/route', [
  param('id').isMongoId().withMessage('معرف التتبع غير صحيح')
], gpsTrackingController.getDeliveryRoute);

/**
 * POST /api/tracking/:id/delivery-confirmation
 * تأكيد التسليم مع صورة
 */
router.post('/:id/delivery-confirmation', [
  param('id').isMongoId().withMessage('معرف التتبع غير صحيح'),
  body('recipientName').optional().isString().withMessage('اسم المستلم يجب أن يكون نص'),
  body('notes').optional().isString().withMessage('الملاحظات يجب أن تكون نص'),
  body('deliveryPhoto').optional().isURL().withMessage('رابط صورة التسليم غير صحيح'),
  body('latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('خط العرض غير صحيح'),
  body('longitude').optional().isFloat({ min: -180, max: 180 }).withMessage('خط الطول غير صحيح')
], gpsTrackingController.confirmDelivery);

module.exports = router;
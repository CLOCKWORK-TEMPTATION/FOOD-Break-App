/**
 * Emergency Routes - مسارات وضع الطوارئ
 * Feature #23: Emergency Mode
 */

const express = require('express');
const emergencyController = require('../controllers/emergencyController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { body, query, param } = require('express-validator');

const router = express.Router();

// تطبيق المصادقة على جميع المسارات
router.use(authenticateToken);

/**
 * تفعيل وضع الطوارئ
 * POST /api/emergency/activate
 */
router.post('/activate',
  authorizeRoles('ADMIN', 'PRODUCER'),
  [
    body('projectId').notEmpty().withMessage('معرف المشروع مطلوب'),
    body('emergencyType').isIn(['SCHEDULE_CHANGE', 'MEDICAL', 'WEATHER', 'TECHNICAL', 'OTHER']).withMessage('نوع الطوارئ غير صحيح'),
    body('reason').optional().isString(),
    body('estimatedDuration').optional().isInt({ min: 1 })
  ],
  validateRequest,
  emergencyController.activateEmergencyMode
);

/**
 * إنشاء طلب طوارئ
 * POST /api/emergency/orders
 */
router.post('/orders',
  [
    body('projectId').notEmpty().withMessage('معرف المشروع مطلوب'),
    body('urgencyLevel').isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).withMessage('مستوى الأولوية غير صحيح'),
    body('specialInstructions').optional().isString(),
    body('deliveryLocation').optional().isObject()
  ],
  validateRequest,
  emergencyController.createEmergencyOrder
);

/**
 * الحصول على المطاعم المتاحة للطوارئ
 * GET /api/emergency/restaurants
 */
router.get('/restaurants',
  [
    query('latitude').isFloat().withMessage('خط العرض مطلوب'),
    query('longitude').isFloat().withMessage('خط الطول مطلوب'),
    query('radius').optional().isInt({ min: 100, max: 50000 })
  ],
  validateRequest,
  emergencyController.getEmergencyRestaurants
);

/**
 * تحديث حالة طلب الطوارئ
 * PATCH /api/emergency/orders/:orderId/status
 */
router.patch('/orders/:orderId/status',
  authorizeRoles('ADMIN', 'PRODUCER', 'RESTAURANT_MANAGER'),
  [
    param('orderId').isUUID().withMessage('معرف الطلب غير صحيح'),
    body('status').isIn(['URGENT_PENDING', 'URGENT_CONFIRMED', 'URGENT_PREPARING', 'URGENT_OUT_FOR_DELIVERY', 'URGENT_DELIVERED']).withMessage('حالة الطلب غير صحيحة'),
    body('estimatedDeliveryTime').optional().isInt({ min: 1 }),
    body('notes').optional().isString()
  ],
  validateRequest,
  emergencyController.updateEmergencyOrderStatus
);

/**
 * الحصول على المخزون المُعد مسبقاً
 * GET /api/emergency/inventory
 */
router.get('/inventory',
  [
    query('projectId').notEmpty().withMessage('معرف المشروع مطلوب')
  ],
  validateRequest,
  emergencyController.getPrePreparedInventory
);

/**
 * إضافة عنصر للمخزون المُعد مسبقاً
 * POST /api/emergency/inventory
 */
router.post('/inventory',
  authorizeRoles('ADMIN', 'PRODUCER'),
  [
    body('projectId').notEmpty().withMessage('معرف المشروع مطلوب'),
    body('itemName').notEmpty().withMessage('اسم العنصر مطلوب'),
    body('quantity').isInt({ min: 1 }).withMessage('الكمية يجب أن تكون رقم موجب'),
    body('expiryDate').optional().isISO8601(),
    body('storageLocation').optional().isString()
  ],
  validateRequest,
  emergencyController.addToPrePreparedInventory
);

/**
 * إلغاء تفعيل وضع الطوارئ
 * POST /api/emergency/deactivate
 */
router.post('/deactivate',
  authorizeRoles('ADMIN', 'PRODUCER'),
  [
    body('projectId').notEmpty().withMessage('معرف المشروع مطلوب'),
    body('reason').optional().isString()
  ],
  validateRequest,
  emergencyController.deactivateEmergencyMode
);

/**
 * الحصول على تاريخ حالات الطوارئ
 * GET /api/emergency/history
 */
router.get('/history',
  authorizeRoles('ADMIN', 'PRODUCER'),
  [
    query('projectId').optional().isString(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  validateRequest,
  emergencyController.getEmergencyHistory
);

/**
 * إرسال تنبيه تغيير الجدولة
 * POST /api/emergency/schedule-change
 */
router.post('/schedule-change',
  authorizeRoles('ADMIN', 'PRODUCER'),
  [
    body('projectId').notEmpty().withMessage('معرف المشروع مطلوب'),
    body('changeType').isIn(['DELAY', 'CANCELLATION', 'TIME_CHANGE', 'LOCATION_CHANGE']).withMessage('نوع التغيير غير صحيح'),
    body('newSchedule').optional().isObject(),
    body('reason').optional().isString(),
    body('affectedMeals').optional().isArray()
  ],
  validateRequest,
  emergencyController.notifyScheduleChange
);

module.exports = router;
const express = require('express');
const { body, query } = require('express-validator');
const analyticsController = require('../controllers/analyticsController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * مسارات API للتحليلات العربية
 */

// التحقق من صحة معايير التحليلات
const analyticsValidation = [
  query('period')
    .optional()
    .isIn(['daily', 'weekly', 'monthly'])
    .withMessage('فترة غير صحيحة'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('تاريخ البداية غير صحيح'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('تاريخ النهاية غير صحيح')
];

// التحقق من صحة التحليلات المخصصة
const customAnalyticsValidation = [
  body('metrics')
    .isArray()
    .withMessage('المؤشرات يجب أن تكون مصفوفة'),
  body('filters')
    .optional()
    .isObject()
    .withMessage('المرشحات يجب أن تكون كائن'),
  body('groupBy')
    .optional()
    .isString()
    .withMessage('تجميع البيانات يجب أن يكون نص')
];

/**
 * @route GET /api/analytics
 * @desc جلب التحليلات الشاملة
 * @access Private (Admin)
 */
router.get('/', 
  authenticateToken, 
  requireAdmin, 
  analyticsValidation,
  analyticsController.getAnalytics
);

/**
 * @route GET /api/analytics/orders
 * @desc تحليلات الطلبات
 * @access Private (Admin/Restaurant Owner)
 */
router.get('/orders', 
  authenticateToken,
  analyticsValidation,
  analyticsController.getOrderAnalytics
);

/**
 * @route GET /api/analytics/revenue
 * @desc تحليلات الإيرادات
 * @access Private (Admin/Restaurant Owner)
 */
router.get('/revenue', 
  authenticateToken,
  analyticsValidation,
  analyticsController.getRevenueAnalytics
);

/**
 * @route GET /api/analytics/users
 * @desc تحليلات المستخدمين
 * @access Private (Admin)
 */
router.get('/users', 
  authenticateToken, 
  requireAdmin,
  analyticsValidation,
  analyticsController.getUserAnalytics
);

/**
 * @route GET /api/analytics/restaurants
 * @desc تحليلات المطاعم
 * @access Private (Admin)
 */
router.get('/restaurants', 
  authenticateToken, 
  requireAdmin,
  analyticsValidation,
  analyticsController.getRestaurantAnalytics
);

/**
 * @route GET /api/analytics/realtime
 * @desc التحليلات في الوقت الفعلي
 * @access Private (Admin)
 */
router.get('/realtime', 
  authenticateToken, 
  requireAdmin,
  analyticsController.getRealTimeAnalytics
);

/**
 * @route POST /api/analytics/custom
 * @desc تحليلات مخصصة
 * @access Private (Admin)
 */
router.post('/custom', 
  authenticateToken, 
  requireAdmin,
  customAnalyticsValidation,
  analyticsController.getCustomAnalytics
);

/**
 * @route POST /api/analytics/compare
 * @desc مقارنة الأداء بين فترتين
 * @access Private (Admin)
 */
router.post('/compare', 
  authenticateToken, 
  requireAdmin,
  [
    body('currentPeriod').notEmpty().withMessage('الفترة الحالية مطلوبة'),
    body('previousPeriod').notEmpty().withMessage('الفترة السابقة مطلوبة'),
    body('metrics').isArray().withMessage('المؤشرات يجب أن تكون مصفوفة')
  ],
  analyticsController.comparePerformance
);

/**
 * @route GET /api/analytics/predictions
 * @desc توقعات الأداء
 * @access Private (Admin)
 */
router.get('/predictions', 
  authenticateToken, 
  requireAdmin,
  [
    query('period').optional().isIn(['monthly', 'quarterly', 'yearly']).withMessage('فترة التوقع غير صحيحة'),
    query('metric').optional().isIn(['revenue', 'orders', 'users']).withMessage('مؤشر التوقع غير صحيح')
  ],
  analyticsController.getPerformancePredictions
);

// مسارات التصدير
/**
 * @route GET /api/analytics/export/pdf
 * @desc تصدير التحليلات كـ PDF
 * @access Private (Admin)
 */
router.get('/export/pdf', 
  authenticateToken, 
  requireAdmin,
  [
    query('period').optional().isIn(['daily', 'weekly', 'monthly']).withMessage('فترة غير صحيحة'),
    query('type').optional().isIn(['comprehensive', 'orders', 'revenue', 'users']).withMessage('نوع التقرير غير صحيح')
  ],
  analyticsController.exportAnalyticsPDF
);

/**
 * @route GET /api/analytics/export/excel
 * @desc تصدير التحليلات كـ Excel
 * @access Private (Admin)
 */
router.get('/export/excel', 
  authenticateToken, 
  requireAdmin,
  [
    query('period').optional().isIn(['daily', 'weekly', 'monthly']).withMessage('فترة غير صحيحة'),
    query('type').optional().isIn(['comprehensive', 'orders', 'revenue', 'users']).withMessage('نوع التقرير غير صحيح')
  ],
  analyticsController.exportAnalyticsExcel
);

/**
 * @route GET /api/analytics/export/csv
 * @desc تصدير التحليلات كـ CSV
 * @access Private (Admin)
 */
router.get('/export/csv', 
  authenticateToken, 
  requireAdmin,
  [
    query('period').optional().isIn(['daily', 'weekly', 'monthly']).withMessage('فترة غير صحيحة'),
    query('type').optional().isIn(['comprehensive', 'orders', 'revenue', 'users']).withMessage('نوع التقرير غير صحيح')
  ],
  analyticsController.exportAnalyticsCSV
);

module.exports = router;
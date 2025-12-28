/**
 * مسارات التقارير العربية
 * Arabic Reports Routes
 */

const express = require('express');
const router = express.Router();
const arabicReportsController = require('../controllers/arabicReportsController');
const { authenticate, authorize } = require('../middleware/auth');
const { localizationMiddleware } = require('../config/localization');

// تطبيق middleware التعريب على جميع المسارات
router.use(localizationMiddleware);

// تطبيق المصادقة على جميع المسارات
router.use(authenticate);

/**
 * تقرير الطلبات اليومية
 * GET /api/reports/daily-orders
 */
router.get('/daily-orders', 
  authorize(['ADMIN', 'PRODUCER']),
  arabicReportsController.generateDailyOrdersReport
);

/**
 * تقرير الطلبات الشهرية
 * GET /api/reports/monthly-orders
 */
router.get('/monthly-orders',
  authorize(['ADMIN', 'PRODUCER']),
  arabicReportsController.generateMonthlyOrdersReport
);

/**
 * تقرير المطاعم
 * GET /api/reports/restaurants
 */
router.get('/restaurants',
  authorize(['ADMIN']),
  arabicReportsController.generateRestaurantsReport
);

/**
 * تقرير الإحصائيات العامة
 * GET /api/reports/stats
 */
router.get('/stats',
  authorize(['ADMIN', 'PRODUCER']),
  arabicReportsController.generateStatsReport
);

/**
 * إنشاء فاتورة للطلب
 * GET /api/reports/invoice/:orderId
 */
router.get('/invoice/:orderId',
  arabicReportsController.generateInvoice
);

module.exports = router;
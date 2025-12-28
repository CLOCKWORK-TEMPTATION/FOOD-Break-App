/**
 * مسارات التنبؤ بالطلبات
 * Predictive Ordering Routes
 */

const express = require('express');
const router = express.Router();
const predictiveController = require('../controllers/predictiveController');
const { authenticate, authorize } = require('../middleware/auth');

// ==========================================
// مسارات المستخدم العادي
// ==========================================

// تحليل السلوك
router.get('/behavior/analyze', authenticate, predictiveController.analyzeMyBehavior);
router.get('/behavior', authenticate, predictiveController.getMyBehavior);

// الأنماط
router.post('/patterns/discover', authenticate, predictiveController.discoverPatterns);
router.get('/patterns', authenticate, predictiveController.getMyPatterns);
router.get('/patterns/match', authenticate, predictiveController.checkPatternMatch);

// الاقتراحات التلقائية
router.post('/suggestions/generate', authenticate, predictiveController.generateSuggestion);
router.get('/suggestions', authenticate, predictiveController.getMySuggestions);
router.post('/suggestions/:suggestionId/accept', authenticate, predictiveController.acceptSuggestion);
router.post('/suggestions/:suggestionId/reject', authenticate, predictiveController.rejectSuggestion);
router.patch('/suggestions/:suggestionId', authenticate, predictiveController.modifySuggestion);

// ==========================================
// مسارات المشرفين (ADMIN, PRODUCER)
// ==========================================

// جدولة التوصيل
router.get(
  '/delivery/schedule',
  authenticate,
  authorize(['ADMIN', 'PRODUCER']),
  predictiveController.getDeliverySchedule
);

router.post(
  '/delivery/schedule/predict',
  authenticate,
  authorize(['ADMIN', 'PRODUCER']),
  predictiveController.predictDeliverySchedule
);

router.get(
  '/delivery/peak-times',
  authenticate,
  authorize(['ADMIN', 'PRODUCER']),
  predictiveController.getPeakTimes
);

router.get(
  '/delivery/capacity',
  authenticate,
  authorize(['ADMIN', 'PRODUCER']),
  predictiveController.getCapacityRecommendations
);

router.post(
  '/delivery/optimize-routes',
  authenticate,
  authorize(['ADMIN', 'PRODUCER']),
  predictiveController.optimizeRoutes
);

// ==========================================
// مسارات توقعات الكمية (للمطاعم)
// ==========================================

router.get(
  '/forecasts/restaurant/:restaurantId',
  authenticate,
  authorize(['ADMIN', 'PRODUCER']),
  predictiveController.getQuantityForecasts
);

router.post(
  '/forecasts/restaurant/:restaurantId/generate',
  authenticate,
  authorize(['ADMIN', 'PRODUCER']),
  predictiveController.generateForecasts
);

// ==========================================
// مسارات تقارير التنبؤ (للتفاوض)
// ==========================================

router.post(
  '/reports/restaurant/:restaurantId/generate',
  authenticate,
  authorize(['ADMIN', 'PRODUCER']),
  predictiveController.generateDemandReport
);

router.get(
  '/reports/restaurant/:restaurantId',
  authenticate,
  authorize(['ADMIN', 'PRODUCER']),
  predictiveController.getRestaurantReports
);

router.post(
  '/reports/:reportId/send',
  authenticate,
  authorize(['ADMIN', 'PRODUCER']),
  predictiveController.sendReportToRestaurant
);

router.post(
  '/reports/:reportId/response',
  authenticate,
  authorize(['ADMIN', 'PRODUCER']),
  predictiveController.recordRestaurantResponse
);

router.get(
  '/reports/:reportId/compare',
  authenticate,
  authorize(['ADMIN', 'PRODUCER']),
  predictiveController.compareActualVsPredicted
);

router.get(
  '/reports/negotiations/summary',
  authenticate,
  authorize(['ADMIN', 'PRODUCER']),
  predictiveController.getNegotiationsSummary
);

module.exports = router;

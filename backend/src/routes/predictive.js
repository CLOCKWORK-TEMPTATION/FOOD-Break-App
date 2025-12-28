/**
 * مسارات التنبؤ بالطلبات
 * Predictive Ordering Routes
 */

const express = require('express');
const router = express.Router();
const predictiveController = require('../controllers/predictiveController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// ==========================================
// مسارات المستخدم العادي
// ==========================================

// تحليل السلوك
router.get('/behavior/analyze', authenticateToken, predictiveController.analyzeMyBehavior);
router.get('/behavior', authenticateToken, predictiveController.getMyBehavior);

// الأنماط
router.post('/patterns/discover', authenticateToken, predictiveController.discoverPatterns);
router.get('/patterns', authenticateToken, predictiveController.getMyPatterns);
router.get('/patterns/match', authenticateToken, predictiveController.checkPatternMatch);

// الاقتراحات التلقائية
router.post('/suggestions/generate', authenticateToken, predictiveController.generateSuggestion);
router.get('/suggestions', authenticateToken, predictiveController.getMySuggestions);
router.post('/suggestions/:suggestionId/accept', authenticateToken, predictiveController.acceptSuggestion);
router.post('/suggestions/:suggestionId/reject', authenticateToken, predictiveController.rejectSuggestion);
router.patch('/suggestions/:suggestionId', authenticateToken, predictiveController.modifySuggestion);

// ==========================================
// مسارات المشرفين (ADMIN, PRODUCER)
// ==========================================

// جدولة التوصيل
router.get(
  '/delivery/schedule',
  authenticateToken,
  authorizeRoles('ADMIN', 'PRODUCER'),
  predictiveController.getDeliverySchedule
);

router.post(
  '/delivery/schedule/predict',
  authenticateToken,
  authorizeRoles('ADMIN', 'PRODUCER'),
  predictiveController.predictDeliverySchedule
);

router.get(
  '/delivery/peak-times',
  authenticateToken,
  authorizeRoles('ADMIN', 'PRODUCER'),
  predictiveController.getPeakTimes
);

router.get(
  '/delivery/capacity',
  authenticateToken,
  authorizeRoles('ADMIN', 'PRODUCER'),
  predictiveController.getCapacityRecommendations
);

router.post(
  '/delivery/optimize-routes',
  authenticateToken,
  authorizeRoles('ADMIN', 'PRODUCER'),
  predictiveController.optimizeRoutes
);

// ==========================================
// مسارات توقعات الكمية (للمطاعم)
// ==========================================

router.get(
  '/forecasts/restaurant/:restaurantId',
  authenticateToken,
  authorizeRoles('ADMIN', 'PRODUCER'),
  predictiveController.getQuantityForecasts
);

router.post(
  '/forecasts/restaurant/:restaurantId/generate',
  authenticateToken,
  authorizeRoles('ADMIN', 'PRODUCER'),
  predictiveController.generateForecasts
);

// ==========================================
// مسارات تقارير التنبؤ (للتفاوض)
// ==========================================

router.post(
  '/reports/restaurant/:restaurantId/generate',
  authenticateToken,
  authorizeRoles('ADMIN', 'PRODUCER'),
  predictiveController.generateDemandReport
);

router.get(
  '/reports/restaurant/:restaurantId',
  authenticateToken,
  authorizeRoles('ADMIN', 'PRODUCER'),
  predictiveController.getRestaurantReports
);

router.post(
  '/reports/:reportId/send',
  authenticateToken,
  authorizeRoles('ADMIN', 'PRODUCER'),
  predictiveController.sendReportToRestaurant
);

router.post(
  '/reports/:reportId/response',
  authenticateToken,
  authorizeRoles('ADMIN', 'PRODUCER'),
  predictiveController.recordRestaurantResponse
);

router.get(
  '/reports/:reportId/compare',
  authenticateToken,
  authorizeRoles('ADMIN', 'PRODUCER'),
  predictiveController.compareActualVsPredicted
);

router.get(
  '/reports/negotiations/summary',
  authenticateToken,
  authorizeRoles('ADMIN', 'PRODUCER'),
  predictiveController.getNegotiationsSummary
);

module.exports = router;

/**
 * ML Routes - مسارات التعلم الآلي
 * Routes for ML features
 */

const express = require('express');
const router = express.Router();
const mlController = require('../controllers/mlController');
const { authenticateToken } = require('../middleware/auth');

// Note: في بيئة الإنتاج، يجب حماية مسارات التدريب بصلاحيات ADMIN فقط
// const { authorizeRoles } = require('../middleware/auth');

// ============================================
// Training Data Routes
// ============================================

/**
 * @route   POST /api/ml/training-data/collect
 * @desc    جمع بيانات التدريب
 * @access  Private (Admin only)
 */
router.post(
  '/training-data/collect',
  authenticateToken,
  // authorizeRoles(['ADMIN']), // Uncomment in production
  mlController.collectTrainingData
);

// ============================================
// Model Training Routes
// ============================================

/**
 * @route   POST /api/ml/models/train/recommendation
 * @desc    تدريب نموذج التوصيات
 * @access  Private (Admin only)
 */
router.post(
  '/models/train/recommendation',
  authenticateToken,
  // authorizeRoles(['ADMIN']),
  mlController.trainRecommendationModel
);

/**
 * @route   POST /api/ml/models/train/predictive
 * @desc    تدريب نموذج التنبؤ
 * @access  Private (Admin only)
 */
router.post(
  '/models/train/predictive',
  authenticateToken,
  // authorizeRoles(['ADMIN']),
  mlController.trainPredictiveModel
);

/**
 * @route   POST /api/ml/models/train/quality
 * @desc    تدريب نموذج الجودة
 * @access  Private (Admin only)
 */
router.post(
  '/models/train/quality',
  authenticateToken,
  // authorizeRoles(['ADMIN']),
  mlController.trainQualityModel
);

/**
 * @route   POST /api/ml/models/train/all
 * @desc    تدريب جميع النماذج
 * @access  Private (Admin only)
 */
router.post(
  '/models/train/all',
  authenticateToken,
  // authorizeRoles(['ADMIN']),
  mlController.trainAllModels
);

// ============================================
// Restaurant Discovery Routes
// ============================================

/**
 * @route   GET /api/ml/restaurants/search
 * @desc    البحث عن مطاعم جديدة
 * @access  Private (Admin/Manager)
 */
router.get(
  '/restaurants/search',
  authenticateToken,
  // authorizeRoles(['ADMIN', 'MANAGER']),
  mlController.searchNewRestaurants
);

/**
 * @route   GET /api/ml/restaurants/:restaurantId/quality
 * @desc    تحليل جودة مطعم
 * @access  Private (Admin/Manager)
 */
router.get(
  '/restaurants/:restaurantId/quality',
  authenticateToken,
  // authorizeRoles(['ADMIN', 'MANAGER']),
  mlController.analyzeRestaurantQuality
);

/**
 * @route   GET /api/ml/restaurants/suggest
 * @desc    اقتراح مطاعم جديدة
 * @access  Private (Admin/Manager)
 */
router.get(
  '/restaurants/suggest',
  authenticateToken,
  // authorizeRoles(['ADMIN', 'MANAGER']),
  mlController.suggestNewRestaurants
);

/**
 * @route   POST /api/ml/restaurants/trial
 * @desc    إنشاء سير عمل تجريبي لمطعم جديد
 * @access  Private (Admin/Manager)
 */
router.post(
  '/restaurants/trial',
  authenticateToken,
  // authorizeRoles(['ADMIN', 'MANAGER']),
  mlController.createRestaurantTrial
);

/**
 * @route   GET /api/ml/restaurants/:restaurantId/trial/evaluate
 * @desc    تقييم نتائج التجربة
 * @access  Private (Admin/Manager)
 */
router.get(
  '/restaurants/:restaurantId/trial/evaluate',
  authenticateToken,
  // authorizeRoles(['ADMIN', 'MANAGER']),
  mlController.evaluateTrialResults
);

/**
 * @route   GET /api/ml/restaurants/ratings/aggregate
 * @desc    تجميع تقييمات من منصات متعددة
 * @access  Private (Admin/Manager)
 */
router.get(
  '/restaurants/ratings/aggregate',
  authenticateToken,
  // authorizeRoles(['ADMIN', 'MANAGER']),
  mlController.aggregateRatings
);

module.exports = router;

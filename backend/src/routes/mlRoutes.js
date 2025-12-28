/**
 * ML Routes - مسارات التعلم الآلي
 * Routes for ML features
 */

const express = require('express');
const router = express.Router();
const mlController = require('../controllers/mlController');
const { authenticate } = require('../middleware/auth');

// Note: في بيئة الإنتاج، يجب حماية مسارات التدريب بصلاحيات ADMIN فقط
// const { authorize } = require('../middleware/auth');

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
  authenticate,
  // authorize(['ADMIN']), // Uncomment in production
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
  authenticate,
  // authorize(['ADMIN']),
  mlController.trainRecommendationModel
);

/**
 * @route   POST /api/ml/models/train/predictive
 * @desc    تدريب نموذج التنبؤ
 * @access  Private (Admin only)
 */
router.post(
  '/models/train/predictive',
  authenticate,
  // authorize(['ADMIN']),
  mlController.trainPredictiveModel
);

/**
 * @route   POST /api/ml/models/train/quality
 * @desc    تدريب نموذج الجودة
 * @access  Private (Admin only)
 */
router.post(
  '/models/train/quality',
  authenticate,
  // authorize(['ADMIN']),
  mlController.trainQualityModel
);

/**
 * @route   POST /api/ml/models/train/all
 * @desc    تدريب جميع النماذج
 * @access  Private (Admin only)
 */
router.post(
  '/models/train/all',
  authenticate,
  // authorize(['ADMIN']),
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
  authenticate,
  // authorize(['ADMIN', 'MANAGER']),
  mlController.searchNewRestaurants
);

/**
 * @route   GET /api/ml/restaurants/:restaurantId/quality
 * @desc    تحليل جودة مطعم
 * @access  Private (Admin/Manager)
 */
router.get(
  '/restaurants/:restaurantId/quality',
  authenticate,
  // authorize(['ADMIN', 'MANAGER']),
  mlController.analyzeRestaurantQuality
);

/**
 * @route   GET /api/ml/restaurants/suggest
 * @desc    اقتراح مطاعم جديدة
 * @access  Private (Admin/Manager)
 */
router.get(
  '/restaurants/suggest',
  authenticate,
  // authorize(['ADMIN', 'MANAGER']),
  mlController.suggestNewRestaurants
);

/**
 * @route   POST /api/ml/restaurants/trial
 * @desc    إنشاء سير عمل تجريبي لمطعم جديد
 * @access  Private (Admin/Manager)
 */
router.post(
  '/restaurants/trial',
  authenticate,
  // authorize(['ADMIN', 'MANAGER']),
  mlController.createRestaurantTrial
);

/**
 * @route   GET /api/ml/restaurants/:restaurantId/trial/evaluate
 * @desc    تقييم نتائج التجربة
 * @access  Private (Admin/Manager)
 */
router.get(
  '/restaurants/:restaurantId/trial/evaluate',
  authenticate,
  // authorize(['ADMIN', 'MANAGER']),
  mlController.evaluateTrialResults
);

/**
 * @route   GET /api/ml/restaurants/ratings/aggregate
 * @desc    تجميع تقييمات من منصات متعددة
 * @access  Private (Admin/Manager)
 */
router.get(
  '/restaurants/ratings/aggregate',
  authenticate,
  // authorize(['ADMIN', 'MANAGER']),
  mlController.aggregateRatings
);

module.exports = router;

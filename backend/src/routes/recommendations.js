const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');
const { authenticateToken } = require('../middleware/auth');

// جميع المسارات تحتاج إلى مصادقة
router.use(authenticateToken);

// الحصول على التوصيات للمستخدم
router.get('/', recommendationController.getRecommendations);

// حفظ توصية جديدة
router.post('/', [
  body('menuItemId').isUUID().withMessage('معرف العنصر مطلوب'),
  body('type').isIn(['WEATHER_BASED', 'PERSONALIZED', 'SIMILAR_ITEMS', 'DIETARY_DIVERSITY', 'TRENDING']).withMessage('نوع التوصية غير صحيح'),
  body('score').isFloat({ min: 0, max: 1 }).withMessage('النتيجة يجب أن تكون بين 0 و 1'),
  body('reason').isLength({ min: 1 }).withMessage('سبب التوصية مطلوب')
], recommendationController.saveRecommendation);

// الحصول على التوصيات المحفوظة
router.get('/saved', recommendationController.getSavedRecommendations);

// تحديث تفضيلات المستخدم
router.put('/preferences', [
  body('dietaryRestrictions').optional().isArray().withMessage('القيود الغذائية يجب أن تكون مصفوفة'),
  body('favoriteCuisines').optional().isArray().withMessage('المطابخ المفضلة يجب أن تكون مصفوفة'),
  body('spiceLevel').optional().isInt({ min: 1, max: 5 }).withMessage('مستوى التوابل يجب أن يكون بين 1 و 5'),
  body('allergies').optional().isArray().withMessage('الحساسية يجب أن تكون مصفوفة'),
  body('healthGoals').optional().isArray().withMessage('الأهداف الصحية يجب أن تكون مصفوفة')
], recommendationController.updateUserPreferences);

// الحصول على تفضيلات المستخدم
router.get('/preferences', recommendationController.getUserPreferences);

// تحليل التوصيات (للإدارة والاختبار A/B)
router.get('/analytics', recommendationController.getRecommendationAnalytics);

module.exports = router;
const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');
const { authenticateToken } = require('../middleware/auth');
const { body } = require('express-validator');

// جميع المسارات تحتاج إلى مصادقة
router.use(authenticateToken);

// الحصول على التوصيات للمستخدم
router.get('/', recommendationController.getUserRecommendations);

// الحصول على التوصيات بناءً على الطقس
router.get('/weather', recommendationController.getWeatherRecommendations);

// تسجيل تفاعل مع التوصية
router.post('/interaction', [
  body('action').isIn(['view', 'click', 'order', 'dismiss']).withMessage('نوع التفاعل غير صحيح')
], recommendationController.recordInteraction);

// الحصول على التوصيات المحفوظة
router.get('/saved', recommendationController.getSavedRecommendations);

module.exports = router;
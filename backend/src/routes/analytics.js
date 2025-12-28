const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// جميع المسارات تحتاج صلاحيات Admin/Producer
router.use(authenticateToken);
router.use(authorizeRoles(['ADMIN', 'PRODUCER']));

// إحصائيات Dashboard
router.get('/dashboard/stats', analyticsController.getDashboardStats);

// تقارير الإنفاق
router.get('/spending/:projectId', analyticsController.getSpendingReport);

// التنبؤ بالميزانية
router.get('/forecast/:projectId', analyticsController.forecastBudget);

// مقارنة المشاريع
router.post('/compare', analyticsController.compareProjects);

// تحليل الاستثناءات
router.get('/exceptions', analyticsController.analyzeExceptions);

// المطاعم الأكثر طلباً
router.get('/top-restaurants', analyticsController.getTopRestaurants);

// الأطباق الأكثر طلباً
router.get('/top-items', analyticsController.getTopMenuItems);

// تصدير التقرير
router.get('/export/:projectId', analyticsController.exportReport);

module.exports = router;

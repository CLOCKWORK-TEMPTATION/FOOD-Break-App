/**
 * Nutrition Routes
 * مسارات API الخاصة بالتغذية والتقارير الصحية
 */

const express = require('express');
const router = express.Router();
const nutritionController = require('../controllers/nutritionController');
const { authenticate, authorize } = require('../middleware/auth');

// جميع المسارات تتطلب المصادقة
router.use(authenticate);

// ===========================
// Nutrition Logs (سجلات التغذية)
// ===========================

/**
 * @route   POST /api/nutrition/log
 * @desc    تسجيل البيانات الغذائية اليومية
 * @access  Private
 */
router.post('/log', nutritionController.logNutrition);

/**
 * @route   GET /api/nutrition/today
 * @desc    الحصول على سجل التغذية اليوم
 * @access  Private
 */
router.get('/today', nutritionController.getTodayNutrition);

/**
 * @route   GET /api/nutrition/logs
 * @desc    الحصول على سجل التغذية لفترة محددة
 * @query   startDate, endDate
 * @access  Private
 */
router.get('/logs', nutritionController.getNutritionLogs);

// ===========================
// Nutrition Goals (أهداف التغذية)
// ===========================

/**
 * @route   POST /api/nutrition/goals
 * @desc    تعيين أهداف التغذية
 * @access  Private
 */
router.post('/goals', nutritionController.setGoal);

/**
 * @route   GET /api/nutrition/goals
 * @desc    الحصول على الأهداف النشطة
 * @access  Private
 */
router.get('/goals', nutritionController.getGoals);

// ===========================
// Weekly Reports (التقارير الأسبوعية)
// ===========================

/**
 * @route   POST /api/nutrition/reports/weekly
 * @desc    إنشاء تقرير أسبوعي
 * @access  Private
 */
router.post('/reports/weekly', nutritionController.generateReport);

/**
 * @route   GET /api/nutrition/reports/weekly
 * @desc    الحصول على التقارير الأسبوعية
 * @query   limit (default: 4)
 * @access  Private
 */
router.get('/reports/weekly', nutritionController.getReports);

// ===========================
// Team Challenges (التحديات الجماعية)
// ===========================

/**
 * @route   POST /api/nutrition/challenges
 * @desc    إنشاء تحدي جماعي (Admin فقط)
 * @access  Private + Admin
 */
router.post(
  '/challenges',
  authorize(['ADMIN', 'PRODUCER']),
  nutritionController.createChallenge
);

/**
 * @route   GET /api/nutrition/challenges
 * @desc    الحصول على التحديات النشطة
 * @access  Private
 */
router.get('/challenges', nutritionController.getChallenges);

/**
 * @route   GET /api/nutrition/user/challenges
 * @desc    الحصول على تحديات المستخدم
 * @access  Private
 */
router.get('/user/challenges', nutritionController.getUserChallenges);

/**
 * @route   POST /api/nutrition/challenges/:id/join
 * @desc    الانضمام لتحدي
 * @access  Private
 */
router.post('/challenges/:id/join', nutritionController.joinChallenge);

/**
 * @route   PATCH /api/nutrition/challenges/:id/progress
 * @desc    تحديث تقدم التحدي
 * @access  Private
 */
router.patch('/challenges/:id/progress', nutritionController.updateProgress);

/**
 * @route   GET /api/nutrition/challenges/:id/leaderboard
 * @desc    الحصول على لوحة الصدارة للتحدي
 * @access  Private
 */
router.get('/challenges/:id/leaderboard', nutritionController.getLeaderboard);

module.exports = router;

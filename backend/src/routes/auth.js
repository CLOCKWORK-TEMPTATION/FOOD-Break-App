const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { authLimiter } = require('../middleware/rateLimiter');

/**
 * @route   POST /api/v1/auth/register
 * @desc    تسجيل مستخدم جديد
 * @access  Public
 */
router.post('/register', authLimiter, [
  body('email')
    .isEmail()
    .withMessage('البريد الإلكتروني غير صالح')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('الاسم الأول مطلوب'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('الاسم الأخير مطلوب'),
  body('phoneNumber')
    .optional()
    .isMobilePhone()
    .withMessage('رقم الهاتف غير صالح'),
  body('role')
    .optional()
    .isIn(['REGULAR', 'VIP', 'ADMIN', 'PRODUCER'])
    .withMessage('الدور غير صالح')
], authController.register);

/**
 * @route   POST /api/v1/auth/login
 * @desc    تسجيل الدخول
 * @access  Public
 */
router.post('/login', authLimiter, [
  body('email')
    .isEmail()
    .withMessage('البريد الإلكتروني غير صالح')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('كلمة المرور مطلوبة')
], authController.login);

/**
 * @route   GET /api/v1/auth/me
 * @desc    الحصول على بيانات المستخدم الحالي
 * @access  Private
 */
router.get('/me', authenticateToken, authController.getCurrentUser);

/**
 * @route   PUT /api/v1/auth/profile
 * @desc    تحديث الملف الشخصي
 * @access  Private
 */
router.put('/profile', authenticateToken, [
  body('firstName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('الاسم الأول لا يمكن أن يكون فارغاً'),
  body('lastName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('الاسم الأخير لا يمكن أن يكون فارغاً'),
  body('phoneNumber')
    .optional()
    .isMobilePhone()
    .withMessage('رقم الهاتف غير صالح')
], authController.updateProfile);

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    تغيير كلمة المرور
 * @access  Private
 */
router.post('/change-password', authenticateToken, [
  body('currentPassword')
    .notEmpty()
    .withMessage('كلمة المرور الحالية مطلوبة'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل')
], authController.changePassword);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    تسجيل الخروج
 * @access  Private
 */
router.post('/logout', authenticateToken, authController.logout);

module.exports = router;

const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

// Security: Rate Limiting للحماية من هجمات Brute Force
// Why: منع محاولات تسجيل الدخول المتكررة
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 10, // 10 محاولات كحد أقصى
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'محاولات كثيرة جداً، يرجى المحاولة لاحقاً'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting أقل صرامة للتسجيل
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // ساعة واحدة
  max: 5, // 5 حسابات كحد أقصى
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REGISTRATIONS',
      message: 'تم إنشاء حسابات كثيرة، يرجى المحاولة لاحقاً'
    }
  }
});

/**
 * @route   POST /api/v1/auth/register
 * @desc    تسجيل مستخدم جديد
 * @access  Public
 *
 * @swagger
 * /auth/register:
 *   post:
 *     summary: تسجيل مستخدم جديد
 *     description: إنشاء حساب مستخدم جديد في النظام
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: تم إنشاء الحساب بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: البريد الإلكتروني مستخدم بالفعل
 */
router.post('/register', registerLimiter, [
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

/**
 * Admin Routes
 * مسارات لوحة التحكم الإدارية
 */

const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { adminLimiter } = require('../middleware/rateLimiter');
const adminController = require('../controllers/adminController');

// جميع المسارات تحتاج مصادقة + صلاحية Admin
router.use(adminLimiter, authenticateToken, requireAdmin);

/**
 * @route   GET /api/v1/admin/dashboard
 * @desc    الحصول على إحصائيات Dashboard
 * @access  Private (Admin only)
 */
router.get('/dashboard', adminController.getDashboardStats);

/**
 * @route   GET /api/v1/admin/users
 * @desc    الحصول على جميع المستخدمين
 * @access  Private (Admin only)
 */
router.get(
  '/users',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('رقم الصفحة غير صالح'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('حد الصفحة غير صالح'),
    query('role')
      .optional()
      .isIn(['REGULAR', 'VIP', 'ADMIN', 'PRODUCER'])
      .withMessage('الدور غير صالح'),
    query('isActive').optional().isBoolean().withMessage('الحالة غير صالحة')
  ],
  validateRequest,
  adminController.getAllUsers
);

/**
 * @route   PUT /api/v1/admin/users/:userId/role
 * @desc    تحديث دور المستخدم
 * @access  Private (Admin only)
 */
router.put(
  '/users/:userId/role',
  [
    param('userId').isUUID().withMessage('معرف المستخدم غير صالح'),
    body('role')
      .isIn(['REGULAR', 'VIP', 'ADMIN', 'PRODUCER'])
      .withMessage('الدور غير صالح')
  ],
  validateRequest,
  adminController.updateUserRole
);

/**
 * @route   PATCH /api/v1/admin/users/:userId/toggle-status
 * @desc    تفعيل/تعطيل مستخدم
 * @access  Private (Admin only)
 */
router.patch(
  '/users/:userId/toggle-status',
  [param('userId').isUUID().withMessage('معرف المستخدم غير صالح')],
  validateRequest,
  adminController.toggleUserStatus
);

/**
 * @route   GET /api/v1/admin/orders
 * @desc    الحصول على جميع الطلبات
 * @access  Private (Admin only)
 */
router.get(
  '/orders',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('رقم الصفحة غير صالح'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('حد الصفحة غير صالح'),
    query('status')
      .optional()
      .isIn(['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'])
      .withMessage('الحالة غير صالحة'),
    query('userId').optional().isUUID().withMessage('معرف المستخدم غير صالح'),
    query('restaurantId').optional().isUUID().withMessage('معرف المطعم غير صالح')
  ],
  validateRequest,
  adminController.getAllOrders
);

/**
 * @route   GET /api/v1/admin/reports/sales
 * @desc    الحصول على تقارير المبيعات
 * @access  Private (Admin only)
 */
router.get(
  '/reports/sales',
  [
    query('startDate').optional().isISO8601().withMessage('تاريخ البداية غير صالح'),
    query('endDate').optional().isISO8601().withMessage('تاريخ النهاية غير صالح'),
    query('groupBy')
      .optional()
      .isIn(['day', 'week', 'month'])
      .withMessage('نوع التجميع غير صالح')
  ],
  validateRequest,
  adminController.getSalesReports
);

module.exports = router;

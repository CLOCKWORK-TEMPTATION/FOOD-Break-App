const express = require('express');
const { body, param, query } = require('express-validator');
const costAlertController = require('../controllers/costAlertController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');

const router = express.Router();

/**
 * مسارات إدارة التنبيهات المالية والميزانيات
 */

// إنشاء ميزانية جديدة (Admin/Producer فقط)
router.post(
  '/',
  authenticate,
  authorize(['ADMIN', 'PRODUCER']),
  [
    body('name')
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('اسم الميزانية يجب أن يكون بين 3 و 100 حرف'),
    body('type')
      .isIn(['VIP', 'PRODUCER', 'DEPARTMENT', 'PROJECT'])
      .withMessage('نوع الميزانية غير صالح'),
    body('maxLimit')
      .isFloat({ min: 0.01 })
      .withMessage('الحد الأقصى للميزانية يجب أن يكون أكبر من صفر'),
    body('warningThreshold')
      .optional()
      .isFloat({ min: 0.1, max: 1.0 })
      .withMessage('حد التحذير يجب أن يكون بين 0.1 و 1.0'),
    body('targetUserId')
      .optional()
      .isUUID()
      .withMessage('معرف المستخدم غير صالح'),
    body('expiresAt')
      .optional()
      .isISO8601()
      .withMessage('تاريخ انتهاء الصلاحية غير صالح')
  ],
  validateRequest,
  costAlertController.createBudget
);

// الحصول على جميع الميزانيات
router.get(
  '/',
  authenticate,
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('رقم الصفحة يجب أن يكون أكبر من صفر'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('حد الصفحة يجب أن يكون بين 1 و 100'),
    query('type')
      .optional()
      .isIn(['VIP', 'PRODUCER', 'DEPARTMENT', 'PROJECT'])
      .withMessage('نوع الميزانية غير صالح'),
    query('isActive')
      .optional()
      .isBoolean()
      .withMessage('حالة النشاط يجب أن تكون true أو false'),
    query('targetUserId')
      .optional()
      .isUUID()
      .withMessage('معرف المستخدم غير صالح')
  ],
  validateRequest,
  costAlertController.getBudgets
);

// الحصول على ميزانية محددة
router.get(
  '/:budgetId',
  authenticate,
  [
    param('budgetId')
      .isUUID()
      .withMessage('معرف الميزانية غير صالح')
  ],
  validateRequest,
  costAlertController.getBudgetById
);

// تحديث الميزانية
router.put(
  '/:budgetId',
  authenticate,
  authorize(['ADMIN', 'PRODUCER']),
  [
    param('budgetId')
      .isUUID()
      .withMessage('معرف الميزانية غير صالح'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('اسم الميزانية يجب أن يكون بين 3 و 100 حرف'),
    body('maxLimit')
      .optional()
      .isFloat({ min: 0.01 })
      .withMessage('الحد الأقصى للميزانية يجب أن يكون أكبر من صفر'),
    body('warningThreshold')
      .optional()
      .isFloat({ min: 0.1, max: 1.0 })
      .withMessage('حد التحذير يجب أن يكون بين 0.1 و 1.0'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('حالة النشاط يجب أن تكون true أو false'),
    body('expiresAt')
      .optional()
      .isISO8601()
      .withMessage('تاريخ انتهاء الصلاحية غير صالح')
  ],
  validateRequest,
  costAlertController.updateBudget
);

// فحص الميزانية وإضافة مبلغ
router.post(
  '/:budgetId/check',
  authenticate,
  [
    param('budgetId')
      .isUUID()
      .withMessage('معرف الميزانية غير صالح'),
    body('amount')
      .isFloat({ min: 0.01 })
      .withMessage('المبلغ يجب أن يكون أكبر من صفر')
  ],
  validateRequest,
  costAlertController.checkBudget
);

// الحصول على تنبيهات الميزانية
router.get(
  '/:budgetId/alerts',
  authenticate,
  [
    param('budgetId')
      .isUUID()
      .withMessage('معرف الميزانية غير صالح'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('رقم الصفحة يجب أن يكون أكبر من صفر'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('حد الصفحة يجب أن يكون بين 1 و 100'),
    query('isResolved')
      .optional()
      .isBoolean()
      .withMessage('حالة الحل يجب أن تكون true أو false'),
    query('severity')
      .optional()
      .isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
      .withMessage('مستوى الخطورة غير صالح'),
    query('alertType')
      .optional()
      .isIn(['WARNING', 'CRITICAL', 'EXCEEDED', 'RESET'])
      .withMessage('نوع التنبيه غير صالح')
  ],
  validateRequest,
  costAlertController.getBudgetAlerts
);

// حل التنبيه
router.put(
  '/alerts/:alertId/resolve',
  authenticate,
  authorize(['ADMIN', 'PRODUCER']),
  [
    param('alertId')
      .isUUID()
      .withMessage('معرف التنبيه غير صالح')
  ],
  validateRequest,
  costAlertController.resolveAlert
);

// إنشاء ميزانية افتراضية للمستخدم
router.post(
  '/default',
  authenticate,
  authorize(['ADMIN']),
  [
    body('userId')
      .isUUID()
      .withMessage('معرف المستخدم غير صالح'),
    body('userRole')
      .isIn(['VIP', 'PRODUCER'])
      .withMessage('دور المستخدم يجب أن يكون VIP أو PRODUCER')
  ],
  validateRequest,
  costAlertController.createDefaultBudget
);

// إعادة تعيين الميزانية
router.put(
  '/:budgetId/reset',
  authenticate,
  authorize(['ADMIN', 'PRODUCER']),
  [
    param('budgetId')
      .isUUID()
      .withMessage('معرف الميزانية غير صالح')
  ],
  validateRequest,
  costAlertController.resetBudget
);

// إنشاء تقرير الميزانية
router.get(
  '/:budgetId/report',
  authenticate,
  [
    param('budgetId')
      .isUUID()
      .withMessage('معرف الميزانية غير صالح'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('تاريخ البداية غير صالح'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('تاريخ النهاية غير صالح')
  ],
  validateRequest,
  costAlertController.generateBudgetReport
);

// الحصول على إحصائيات شاملة
router.get(
  '/analytics/summary',
  authenticate,
  authorize(['ADMIN', 'PRODUCER']),
  [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('تاريخ البداية غير صالح'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('تاريخ النهاية غير صالح')
  ],
  validateRequest,
  costAlertController.getBudgetAnalytics
);

module.exports = router;
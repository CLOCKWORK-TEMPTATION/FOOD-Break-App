/**
 * Payment Routes - Updated with Prisma
 * مسارات معالجة المدفوعات والفواتير
 */

const express = require('express');
const { body, query, param } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const {
  createPaymentIntent,
  confirmPayment,
  getUserPayments,
  createInvoice,
  getUserInvoices,
  processRefund,
  handleStripeWebhook,
  getPaymentStatistics
} = require('../controllers/paymentControllerNew');

const router = express.Router();

/**
 * @route   POST /api/v1/payments/create-intent
 * @desc    إنشاء نية دفع جديدة
 * @access  Private
 */
router.post(
  '/create-intent',
  authenticate,
  [
    body('amount')
      .isFloat({ min: 0.01 })
      .withMessage('المبلغ يجب أن يكون أكبر من صفر'),
    body('currency')
      .optional()
      .isString()
      .withMessage('العملة غير صالحة'),
    body('orderId')
      .optional()
      .isUUID()
      .withMessage('معرف الطلب غير صالح')
  ],
  validateRequest,
  createPaymentIntent
);

/**
 * @route   POST /api/v1/payments/confirm
 * @desc    تأكيد الدفع
 * @access  Private
 */
router.post(
  '/confirm',
  authenticate,
  [
    body('paymentIntentId')
      .notEmpty()
      .withMessage('معرف نية الدفع مطلوب')
  ],
  validateRequest,
  confirmPayment
);

/**
 * @route   GET /api/v1/payments
 * @desc    الحصول على مدفوعات المستخدم
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('رقم الصفحة غير صالح'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('حد الصفحة غير صالح'),
    query('status')
      .optional()
      .isIn(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED'])
      .withMessage('الحالة غير صالحة'),
    query('provider')
      .optional()
      .isIn(['STRIPE', 'PAYPAL', 'APPLE_PAY', 'GOOGLE_PAY', 'CASH', 'BANK_TRANSFER'])
      .withMessage('المزود غير صالح')
  ],
  validateRequest,
  getUserPayments
);

/**
 * @route   POST /api/v1/payments/invoices
 * @desc    إنشاء فاتورة جديدة
 * @access  Private
 */
router.post(
  '/invoices',
  authenticate,
  [
    body('orderId')
      .optional()
      .isUUID()
      .withMessage('معرف الطلب غير صالح'),
    body('paymentId')
      .optional()
      .isUUID()
      .withMessage('معرف الدفع غير صالح'),
    body('notes')
      .optional()
      .isString()
      .withMessage('الملاحظات يجب أن تكون نصاً')
  ],
  validateRequest,
  createInvoice
);

/**
 * @route   GET /api/v1/payments/invoices
 * @desc    الحصول على فواتير المستخدم
 * @access  Private
 */
router.get(
  '/invoices',
  authenticate,
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('رقم الصفحة غير صالح'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('حد الصفحة غير صالح'),
    query('status')
      .optional()
      .isIn(['PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED'])
      .withMessage('الحالة غير صالحة')
  ],
  validateRequest,
  getUserInvoices
);

/**
 * @route   POST /api/v1/payments/refund
 * @desc    معالجة استرداد الأموال
 * @access  Private
 */
router.post(
  '/refund',
  authenticate,
  [
    body('paymentIntentId')
      .notEmpty()
      .withMessage('معرف نية الدفع مطلوب'),
    body('amount')
      .optional()
      .isFloat({ min: 0.01 })
      .withMessage('المبلغ غير صالح'),
    body('reason')
      .optional()
      .isString()
      .withMessage('السبب يجب أن يكون نصاً')
  ],
  validateRequest,
  processRefund
);

/**
 * @route   GET /api/v1/payments/statistics
 * @desc    الحصول على إحصائيات المدفوعات
 * @access  Private (Admin/Producer can view all)
 */
router.get(
  '/statistics',
  authenticate,
  [
    query('userId')
      .optional()
      .isUUID()
      .withMessage('معرف المستخدم غير صالح'),
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
  getPaymentStatistics
);

/**
 * @route   POST /api/v1/payments/webhook
 * @desc    معالجة Webhook من Stripe
 * @access  Public (Stripe webhook)
 */
router.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

module.exports = router;
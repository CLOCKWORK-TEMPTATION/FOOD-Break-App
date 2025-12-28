/**
 * Payment Routes
 * مسارات معالجة المدفوعات
 */

const express = require('express');
const { protect } = require('../middleware/auth');
const {
  createPaymentIntent,
  confirmPayment,
  savePaymentMethod,
  getPaymentMethods,
  deletePaymentMethod,
  createInvoice,
  getUserInvoices,
  processRefund,
  handleStripeWebhook,
} = require('../controllers/paymentController');

const router = express.Router();

// جميع المسارات تحتاج إلى مصادقة
router.use(protect);

/**
 * @route   POST /api/v1/payments/create-intent
 * @desc    إنشاء نية دفع جديدة
 * @access  Private
 */
router.post('/create-intent', createPaymentIntent);

/**
 * @route   POST /api/v1/payments/confirm
 * @desc    تأكيد الدفع
 * @access  Private
 */
router.post('/confirm', confirmPayment);

/**
 * @route   POST /api/v1/payments/save-method
 * @desc    حفظ طريقة دفع
 * @access  Private
 */
router.post('/save-method', savePaymentMethod);

/**
 * @route   GET /api/v1/payments/methods
 * @desc    الحصول على طرق الدفع المحفوظة
 * @access  Private
 */
router.get('/methods', getPaymentMethods);

/**
 * @route   DELETE /api/v1/payments/methods/:methodId
 * @desc    حذف طريقة دفع
 * @access  Private
 */
router.delete('/methods/:methodId', deletePaymentMethod);

/**
 * @route   POST /api/v1/payments/invoices
 * @desc    إنشاء فاتورة
 * @access  Private
 */
router.post('/invoices', createInvoice);

/**
 * @route   GET /api/v1/payments/invoices
 * @desc    الحصول على فواتير المستخدم
 * @access  Private
 */
router.get('/invoices', getUserInvoices);

/**
 * @route   POST /api/v1/payments/refund
 * @desc    معالجة استرداد الأموال
 * @access  Private
 */
router.post('/refund', processRefund);

module.exports = router;
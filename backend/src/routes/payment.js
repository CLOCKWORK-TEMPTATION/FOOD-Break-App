const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticateToken } = require('../middleware/auth');
const { validatePaymentRequest, validateRefundRequest } = require('../middleware/validation');
const { rateLimiter } = require('../middleware/rateLimiter');

/**
 * مسارات نظام الدفع والفواتير
 */

// تطبيق المصادقة على جميع المسارات
router.use(authenticateToken);

// تطبيق تحديد المعدل للحماية من الهجمات
router.use(rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 100 // 100 طلب كحد أقصى
}));

/**
 * طرق الدفع
 */

// الحصول على طرق الدفع المحفوظة
router.get('/methods', paymentController.getPaymentMethods);

// إضافة طريقة دفع جديدة
router.post('/methods', 
  validatePaymentRequest,
  paymentController.addPaymentMethod
);

// تحديث طريقة دفع
router.put('/methods/:methodId', 
  validatePaymentRequest,
  paymentController.updatePaymentMethod
);

// حذف طريقة دفع
router.delete('/methods/:methodId', paymentController.deletePaymentMethod);

// تعيين طريقة دفع كافتراضية
router.patch('/methods/:methodId/default', paymentController.setDefaultPaymentMethod);

/**
 * معالجة المدفوعات
 */

// معالجة دفعة جديدة
router.post('/process', 
  rateLimiter({
    windowMs: 5 * 60 * 1000, // 5 دقائق
    max: 10 // 10 محاولات دفع كحد أقصى
  }),
  paymentController.processPayment
);

// التحقق من حالة الدفع
router.get('/status/:transactionId', paymentController.getPaymentStatus);

// إعادة محاولة دفعة فاشلة
router.post('/retry/:transactionId', paymentController.retryPayment);

/**
 * الاستردادات
 */

// طلب استرداد
router.post('/refund/:paymentId', 
  validateRefundRequest,
  paymentController.refundPayment
);

// الحصول على حالة الاسترداد
router.get('/refund/status/:refundId', paymentController.getRefundStatus);

/**
 * الفواتير
 */

// الحصول على قائمة الفواتير
router.get('/invoices', paymentController.getInvoices);

// الحصول على تفاصيل فاتورة محددة
router.get('/invoices/:invoiceId', paymentController.getInvoiceDetails);

// تحميل فاتورة بصيغة PDF
router.get('/invoices/:invoiceId/download', paymentController.downloadInvoice);

// إرسال فاتورة بالبريد الإلكتروني
router.post('/invoices/:invoiceId/email', paymentController.emailInvoice);

// البحث في الفواتير
router.get('/invoices/search/:searchTerm', paymentController.searchInvoices);

/**
 * الإحصائيات والتقارير
 */

// إحصائيات الدفع
router.get('/stats', paymentController.getPaymentStats);

// إحصائيات الفواتير
router.get('/invoices/stats', paymentController.getInvoiceStats);

// تقرير المدفوعات
router.get('/reports/payments', paymentController.getPaymentReport);

// تقرير الفواتير
router.get('/reports/invoices', paymentController.getInvoiceReport);

/**
 * إعدادات الدفع
 */

// الحصول على إعدادات الدفع
router.get('/settings', paymentController.getPaymentSettings);

// تحديث إعدادات الدفع
router.put('/settings', paymentController.updatePaymentSettings);

/**
 * العملات والتحويل
 */

// الحصول على أسعار الصرف
router.get('/exchange-rates', paymentController.getExchangeRates);

// تحويل العملة
router.post('/convert-currency', paymentController.convertCurrency);

/**
 * التحقق والأمان
 */

// التحقق من صحة بيانات البطاقة
router.post('/validate-card', paymentController.validateCardData);

// التحقق من الأمان (3D Secure)
router.post('/3d-secure/verify', paymentController.verify3DSecure);

/**
 * الإشعارات
 */

// الحصول على إشعارات الدفع
router.get('/notifications', paymentController.getPaymentNotifications);

// تحديث حالة الإشعار
router.patch('/notifications/:notificationId/read', paymentController.markNotificationAsRead);

/**
 * الاشتراكات والدفع المتكرر
 */

// إنشاء اشتراك
router.post('/subscriptions', paymentController.createSubscription);

// الحصول على الاشتراكات
router.get('/subscriptions', paymentController.getSubscriptions);

// إلغاء اشتراك
router.delete('/subscriptions/:subscriptionId', paymentController.cancelSubscription);

// تحديث اشتراك
router.put('/subscriptions/:subscriptionId', paymentController.updateSubscription);

/**
 * معالجة الأخطاء
 */
router.use((error, req, res, next) => {
  console.error('خطأ في مسارات الدفع:', error);
  
  // أخطاء التحقق من صحة البيانات
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'بيانات غير صحيحة',
        details: error.details
      }
    });
  }

  // أخطاء المصادقة
  if (error.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'غير مصرح بالوصول'
      }
    });
  }

  // أخطاء تحديد المعدل
  if (error.name === 'RateLimitError') {
    return res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'تم تجاوز الحد المسموح من الطلبات'
      }
    });
  }

  // أخطاء الدفع
  if (error.name === 'PaymentError') {
    return res.status(400).json({
      success: false,
      error: {
        code: error.code || 'PAYMENT_ERROR',
        message: error.message || 'حدث خطأ في معالجة الدفع'
      }
    });
  }

  // خطأ عام
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'حدث خطأ داخلي في الخادم'
    }
  });
});

module.exports = router;
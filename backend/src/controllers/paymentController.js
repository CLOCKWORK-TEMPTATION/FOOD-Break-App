const paymentService = require('../services/paymentService');
const invoiceService = require('../services/invoiceService');
const { validatePaymentData, validateInvoiceData } = require('../utils/validation');
const { formatArabicResponse } = require('../utils/arabicFormatters');
const logger = require('../utils/logger');

/**
 * معالج طرق الدفع
 */
class PaymentController {
  /**
   * الحصول على طرق الدفع المحفوظة للمستخدم
   */
  async getPaymentMethods(req, res) {
    try {
      const userId = req.user.id;
      const methods = await paymentService.getUserPaymentMethods(userId);
      
      const arabicMethods = methods.map(method => ({
        ...method,
        name: this.translatePaymentMethodName(method.type, req.language),
        details: this.formatPaymentMethodDetails(method, req.language)
      }));

      res.json(formatArabicResponse(true, arabicMethods, {
        message: 'تم جلب طرق الدفع بنجاح'
      }));
    } catch (error) {
      logger.error('خطأ في جلب طرق الدفع:', error);
      res.status(500).json(formatArabicResponse(false, null, {
        code: 'PAYMENT_METHODS_ERROR',
        message: 'حدث خطأ في جلب طرق الدفع'
      }));
    }
  }

  /**
   * إضافة طريقة دفع جديدة
   */
  async addPaymentMethod(req, res) {
    try {
      const userId = req.user.id;
      const { type, cardNumber, expiryDate, holderName, isDefault } = req.body;

      // التحقق من صحة البيانات
      const validation = validatePaymentData({
        type,
        cardNumber,
        expiryDate,
        holderName
      });

      if (!validation.isValid) {
        return res.status(400).json(formatArabicResponse(false, null, {
          code: 'VALIDATION_ERROR',
          message: 'بيانات طريقة الدفع غير صحيحة',
          details: validation.errors
        }));
      }

      const method = await paymentService.addPaymentMethod(userId, {
        type,
        cardNumber: this.maskCardNumber(cardNumber),
        expiryDate,
        holderName,
        isDefault: isDefault || false
      });

      res.status(201).json(formatArabicResponse(true, method, {
        message: 'تم إضافة طريقة الدفع بنجاح'
      }));
    } catch (error) {
      logger.error('خطأ في إضافة طريقة الدفع:', error);
      res.status(500).json(formatArabicResponse(false, null, {
        code: 'ADD_PAYMENT_METHOD_ERROR',
        message: 'حدث خطأ في إضافة طريقة الدفع'
      }));
    }
  }

  /**
   * معالجة دفعة جديدة
   */
  async processPayment(req, res) {
    try {
      const userId = req.user.id;
      const { amount, paymentMethodId, description, orderId } = req.body;

      // التحقق من صحة البيانات
      if (!amount || amount <= 0) {
        return res.status(400).json(formatArabicResponse(false, null, {
          code: 'INVALID_AMOUNT',
          message: 'مبلغ الدفع غير صحيح'
        }));
      }

      if (!paymentMethodId) {
        return res.status(400).json(formatArabicResponse(false, null, {
          code: 'PAYMENT_METHOD_REQUIRED',
          message: 'يجب اختيار طريقة الدفع'
        }));
      }

      // التحقق من وجود طريقة الدفع
      const paymentMethod = await paymentService.getPaymentMethod(paymentMethodId, userId);
      if (!paymentMethod) {
        return res.status(404).json(formatArabicResponse(false, null, {
          code: 'PAYMENT_METHOD_NOT_FOUND',
          message: 'طريقة الدفع غير موجودة'
        }));
      }

      // معالجة الدفع
      const paymentResult = await paymentService.processPayment({
        userId,
        amount,
        paymentMethodId,
        description,
        orderId
      });

      if (paymentResult.success) {
        // إنشاء فاتورة
        const invoice = await invoiceService.createInvoice({
          userId,
          orderId: orderId || paymentResult.transactionId,
          amount: amount,
          tax: amount * 0.15, // ضريبة القيمة المضافة 15%
          total: amount * 1.15,
          paymentId: paymentResult.transactionId,
          status: 'paid'
        });

        res.json(formatArabicResponse(true, {
          payment: paymentResult,
          invoice: invoice
        }, {
          message: 'تم الدفع بنجاح'
        }));
      } else {
        res.status(400).json(formatArabicResponse(false, null, {
          code: 'PAYMENT_FAILED',
          message: paymentResult.error || 'فشل في معالجة الدفع'
        }));
      }
    } catch (error) {
      logger.error('خطأ في معالجة الدفع:', error);
      res.status(500).json(formatArabicResponse(false, null, {
        code: 'PAYMENT_PROCESSING_ERROR',
        message: 'حدث خطأ في معالجة الدفع'
      }));
    }
  }

  /**
   * الحصول على سجل الفواتير
   */
  async getInvoices(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10, status } = req.query;

      const invoices = await invoiceService.getUserInvoices(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
        status
      });

      // تنسيق الفواتير للعرض العربي
      const arabicInvoices = invoices.data.map(invoice => ({
        ...invoice,
        statusText: this.translateInvoiceStatus(invoice.status, req.language),
        formattedAmount: this.formatCurrency(invoice.amount),
        formattedTax: this.formatCurrency(invoice.tax),
        formattedTotal: this.formatCurrency(invoice.total),
        arabicDate: this.formatArabicDate(invoice.createdAt),
        arabicPaidDate: invoice.paidAt ? this.formatArabicDate(invoice.paidAt) : null
      }));

      res.json(formatArabicResponse(true, arabicInvoices, {
        message: 'تم جلب الفواتير بنجاح',
        pagination: invoices.pagination
      }));
    } catch (error) {
      logger.error('خطأ في جلب الفواتير:', error);
      res.status(500).json(formatArabicResponse(false, null, {
        code: 'INVOICES_ERROR',
        message: 'حدث خطأ في جلب الفواتير'
      }));
    }
  }

  /**
   * الحصول على تفاصيل فاتورة محددة
   */
  async getInvoiceDetails(req, res) {
    try {
      const userId = req.user.id;
      const { invoiceId } = req.params;

      const invoice = await invoiceService.getInvoiceDetails(invoiceId, userId);
      if (!invoice) {
        return res.status(404).json(formatArabicResponse(false, null, {
          code: 'INVOICE_NOT_FOUND',
          message: 'الفاتورة غير موجودة'
        }));
      }

      // تنسيق الفاتورة للعرض العربي
      const arabicInvoice = {
        ...invoice,
        statusText: this.translateInvoiceStatus(invoice.status, req.language),
        formattedAmount: this.formatCurrency(invoice.amount),
        formattedTax: this.formatCurrency(invoice.tax),
        formattedTotal: this.formatCurrency(invoice.total),
        arabicDate: this.formatArabicDate(invoice.createdAt),
        arabicPaidDate: invoice.paidAt ? this.formatArabicDate(invoice.paidAt) : null,
        items: invoice.items.map(item => ({
          ...item,
          formattedPrice: this.formatCurrency(item.price),
          formattedTotal: this.formatCurrency(item.total)
        }))
      };

      res.json(formatArabicResponse(true, arabicInvoice, {
        message: 'تم جلب تفاصيل الفاتورة بنجاح'
      }));
    } catch (error) {
      logger.error('خطأ في جلب تفاصيل الفاتورة:', error);
      res.status(500).json(formatArabicResponse(false, null, {
        code: 'INVOICE_DETAILS_ERROR',
        message: 'حدث خطأ في جلب تفاصيل الفاتورة'
      }));
    }
  }

  /**
   * تحميل فاتورة بصيغة PDF
   */
  async downloadInvoice(req, res) {
    try {
      const userId = req.user.id;
      const { invoiceId } = req.params;

      const invoice = await invoiceService.getInvoiceDetails(invoiceId, userId);
      if (!invoice) {
        return res.status(404).json(formatArabicResponse(false, null, {
          code: 'INVOICE_NOT_FOUND',
          message: 'الفاتورة غير موجودة'
        }));
      }

      // إنشاء PDF للفاتورة
      const pdfBuffer = await invoiceService.generateInvoicePDF(invoice, req.language);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="فاتورة-${invoice.orderNumber}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      logger.error('خطأ في تحميل الفاتورة:', error);
      res.status(500).json(formatArabicResponse(false, null, {
        code: 'INVOICE_DOWNLOAD_ERROR',
        message: 'حدث خطأ في تحميل الفاتورة'
      }));
    }
  }

  /**
   * استرداد دفعة
   */
  async refundPayment(req, res) {
    try {
      const userId = req.user.id;
      const { paymentId } = req.params;
      const { reason, amount } = req.body;

      const refundResult = await paymentService.refundPayment({
        paymentId,
        userId,
        reason,
        amount
      });

      if (refundResult.success) {
        // تحديث حالة الفاتورة
        await invoiceService.updateInvoiceStatus(refundResult.invoiceId, 'refunded');

        res.json(formatArabicResponse(true, refundResult, {
          message: 'تم استرداد المبلغ بنجاح'
        }));
      } else {
        res.status(400).json(formatArabicResponse(false, null, {
          code: 'REFUND_FAILED',
          message: refundResult.error || 'فشل في استرداد المبلغ'
        }));
      }
    } catch (error) {
      logger.error('خطأ في استرداد المبلغ:', error);
      res.status(500).json(formatArabicResponse(false, null, {
        code: 'REFUND_ERROR',
        message: 'حدث خطأ في استرداد المبلغ'
      }));
    }
  }

  /**
   * الحصول على إحصائيات الدفع
   */
  async getPaymentStats(req, res) {
    try {
      const userId = req.user.id;
      const { period = 'month' } = req.query;

      const stats = await paymentService.getPaymentStats(userId, period);

      const arabicStats = {
        ...stats,
        formattedTotalAmount: this.formatCurrency(stats.totalAmount),
        formattedAverageAmount: this.formatCurrency(stats.averageAmount),
        periodText: this.translatePeriod(period, req.language)
      };

      res.json(formatArabicResponse(true, arabicStats, {
        message: 'تم جلب إحصائيات الدفع بنجاح'
      }));
    } catch (error) {
      logger.error('خطأ في جلب إحصائيات الدفع:', error);
      res.status(500).json(formatArabicResponse(false, null, {
        code: 'PAYMENT_STATS_ERROR',
        message: 'حدث خطأ في جلب إحصائيات الدفع'
      }));
    }
  }

  // دوال مساعدة

  /**
   * ترجمة اسم طريقة الدفع
   */
  translatePaymentMethodName(type, language = 'ar') {
    const translations = {
      credit_card: 'بطاقة ائتمان',
      debit_card: 'بطاقة خصم',
      wallet: 'محفظة إلكترونية',
      bank_transfer: 'تحويل بنكي'
    };
    return translations[type] || type;
  }

  /**
   * تنسيق تفاصيل طريقة الدفع
   */
  formatPaymentMethodDetails(method, language = 'ar') {
    if (method.type === 'credit_card' || method.type === 'debit_card') {
      return `**** **** **** ${method.lastFourDigits}`;
    }
    return method.details || '';
  }

  /**
   * إخفاء رقم البطاقة
   */
  maskCardNumber(cardNumber) {
    if (!cardNumber) return '';
    const cleaned = cardNumber.replace(/\s/g, '');
    return cleaned.slice(-4);
  }

  /**
   * ترجمة حالة الفاتورة
   */
  translateInvoiceStatus(status, language = 'ar') {
    const translations = {
      pending: 'في الانتظار',
      paid: 'مدفوعة',
      failed: 'فشلت',
      refunded: 'مستردة',
      cancelled: 'ملغية'
    };
    return translations[status] || status;
  }

  /**
   * تنسيق العملة
   */
  formatCurrency(amount) {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount);
  }

  /**
   * تنسيق التاريخ العربي
   */
  formatArabicDate(date) {
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }

  /**
   * ترجمة فترة الإحصائيات
   */
  translatePeriod(period, language = 'ar') {
    const translations = {
      day: 'يوم',
      week: 'أسبوع',
      month: 'شهر',
      year: 'سنة'
    };
    return translations[period] || period;
  }
}

module.exports = new PaymentController();
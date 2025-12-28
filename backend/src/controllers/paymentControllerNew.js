/**
 * Payment Controller - Updated with Prisma
 * معالجة المدفوعات والفواتير باستخدام Prisma
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');
const paymentService = require('../services/paymentService');
const invoiceService = require('../services/invoiceService');
const logger = require('../utils/logger');

/**
 * إنشاء نية دفع Stripe
 */
const createPaymentIntent = async (req, res, next) => {
  try {
    const { amount, currency = 'egp', orderId } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'المبلغ غير صالح'
      });
    }

    // تحويل المبلغ إلى cents (Stripe يعمل بالـ cents)
    const amountInCents = Math.round(amount * 100);

    // إنشاء نية الدفع في Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency.toLowerCase(),
      metadata: {
        userId,
        ...(orderId && { orderId })
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // حفظ معلومات الدفع في قاعدة البيانات
    const payment = await paymentService.createPayment({
      userId,
      orderId,
      amount,
      currency: currency.toUpperCase(),
      provider: 'STRIPE',
      paymentIntentId: paymentIntent.id,
      metadata: {
        stripeCustomerId: paymentIntent.customer,
        paymentMethod: paymentIntent.payment_method
      }
    });

    logger.info(`Payment intent created: ${paymentIntent.id} for user: ${userId}`);

    res.status(201).json({
      success: true,
      message: 'تم إنشاء نية الدفع بنجاح',
      data: {
        paymentId: payment.id,
        clientSecret: paymentIntent.client_secret,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: paymentIntent.status
      }
    });
  } catch (error) {
    logger.error('Error creating payment intent:', error);
    res.status(500).json({
      success: false,
      message: 'فشل إنشاء نية الدفع',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * تأكيد الدفع
 */
const confirmPayment = async (req, res, next) => {
  try {
    const { paymentIntentId } = req.body;
    const userId = req.user.id;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'معرف نية الدفع مطلوب'
      });
    }

    // البحث عن الدفع في قاعدة البيانات
    const payment = await paymentService.findPaymentByIntentId(paymentIntentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'لم يتم العثور على معلومات الدفع'
      });
    }

    // التحقق من ملكية الدفع
    if (payment.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح لك بالوصول إلى هذا الدفع'
      });
    }

    // جلب حالة الدفع من Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // تحديث حالة الدفع في قاعدة البيانات
    let status = 'PENDING';
    if (paymentIntent.status === 'succeeded') {
      status = 'COMPLETED';
    } else if (paymentIntent.status === 'canceled') {
      status = 'CANCELLED';
    } else if (paymentIntent.status === 'requires_action') {
      status = 'PROCESSING';
    }

    const updatedPayment = await paymentService.updatePaymentStatus(
      payment.id,
      status,
      {
        ...(paymentIntent.payment_method && { paymentMethodId: paymentIntent.payment_method })
      }
    );

    logger.info(`Payment confirmed: ${paymentIntentId} - status: ${status}`);

    res.json({
      success: true,
      message: 'تم تأكيد الدفع',
      data: {
        paymentId: updatedPayment.id,
        status: updatedPayment.status,
        amount: updatedPayment.amount,
        currency: updatedPayment.currency,
        requiresAction: paymentIntent.status === 'requires_action',
        clientSecret: paymentIntent.client_secret
      }
    });
  } catch (error) {
    logger.error('Error confirming payment:', error);
    res.status(500).json({
      success: false,
      message: 'فشل تأكيد الدفع',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * الحصول على مدفوعات المستخدم
 */
const getUserPayments = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      status: req.query.status,
      provider: req.query.provider,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const result = await paymentService.getUserPayments(userId, filters);

    res.json({
      success: true,
      message: 'تم جلب المدفوعات بنجاح',
      data: result.payments,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Error getting user payments:', error);
    res.status(500).json({
      success: false,
      message: 'فشل تحميل المدفوعات',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * إنشاء فاتورة
 */
const createInvoice = async (req, res, next) => {
  try {
    const { orderId, paymentId, notes } = req.body;
    const userId = req.user.id;

    if (!orderId && !paymentId) {
      return res.status(400).json({
        success: false,
        message: 'يجب توفير معرف الطلب أو معرف الدفع'
      });
    }

    // البيانات الأساسية للفاتورة
    const invoiceData = {
      userId,
      orderId,
      paymentId,
      notes
    };

    // إذا كان هناك طلب، جلب معلوماته لحساب المبلغ
    if (orderId) {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true }
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'لم يتم العثور على الطلب'
        });
      }

      // التحقق من ملكية الطلب
      if (order.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'غير مصرح لك بإنشاء فاتورة لهذا الطلب'
        });
      }

      invoiceData.amount = order.totalAmount;
      invoiceData.items = order.items;
    }
    // إذا كان هناك دفع، جلب معلوماته
    else if (paymentId) {
      const payment = await paymentService.findPaymentByIntentId(paymentId);

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'لم يتم العثور على الدفع'
        });
      }

      invoiceData.amount = payment.amount;
      invoiceData.currency = payment.currency;
    }

    // إنشاء الفاتورة
    const invoice = await invoiceService.createInvoice(invoiceData);

    logger.info(`Invoice created: ${invoice.id} - ${invoice.invoiceNumber}`);

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الفاتورة بنجاح',
      data: invoice
    });
  } catch (error) {
    logger.error('Error creating invoice:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'فشل إنشاء الفاتورة',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * الحصول على فواتير المستخدم
 */
const getUserInvoices = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      status: req.query.status,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const result = await invoiceService.getUserInvoices(userId, filters);

    res.json({
      success: true,
      message: 'تم جلب الفواتير بنجاح',
      data: result.invoices,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Error getting user invoices:', error);
    res.status(500).json({
      success: false,
      message: 'فشل تحميل الفواتير',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * معالجة استرداد الأموال
 */
const processRefund = async (req, res, next) => {
  try {
    const { paymentIntentId, amount, reason } = req.body;
    const userId = req.user.id;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'معرف عملية الدفع مطلوب'
      });
    }

    // البحث عن الدفع
    const payment = await paymentService.findPaymentByIntentId(paymentIntentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'لم يتم العثور على عملية الدفع'
      });
    }

    // التحقق من ملكية الدفع
    if (payment.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح لك بهذه العملية'
      });
    }

    if (payment.status !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن استرداد مبلغ من عملية دفع غير مكتملة'
      });
    }

    // حساب مبلغ الاسترداد
    const refundAmount = amount || payment.amount;
    const refundAmountInCents = Math.round(refundAmount * 100);

    // إنشاء استرداد في Stripe
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: refundAmountInCents,
      reason: reason || 'requested_by_customer'
    });

    // تحديث حالة الدفع
    const updatedPayment = await paymentService.processRefund(
      payment.id,
      refundAmount,
      refund.id
    );

    logger.info(`Refund processed: ${refund.id} for payment: ${paymentIntentId}`);

    res.json({
      success: true,
      message: 'تم استرداد المبلغ بنجاح',
      data: {
        refundId: refund.id,
        amount: refund.amount / 100,
        currency: refund.currency,
        status: refund.status,
        payment: updatedPayment
      }
    });
  } catch (error) {
    logger.error('Error processing refund:', error);
    res.status(500).json({
      success: false,
      message: 'فشل معالجة الاسترداد',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * معالجة Webhook من Stripe
 */
const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    logger.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handleSuccessfulPayment(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handleFailedPayment(event.data.object);
        break;

      case 'charge.refunded':
        await handleRefund(event.data.object);
        break;

      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Error handling webhook:', error);
    res.status(500).json({ error: 'Webhook handling failed' });
  }
};

/**
 * معالجة الدفع الناجح
 */
const handleSuccessfulPayment = async (paymentIntent) => {
  try {
    const payment = await paymentService.findPaymentByIntentId(paymentIntent.id);

    if (payment) {
      await paymentService.updatePaymentStatus(payment.id, 'COMPLETED');
      logger.info(`Payment succeeded: ${paymentIntent.id}`);
    }
  } catch (error) {
    logger.error('Error handling successful payment:', error);
  }
};

/**
 * معالجة فشل الدفع
 */
const handleFailedPayment = async (paymentIntent) => {
  try {
    const payment = await paymentService.findPaymentByIntentId(paymentIntent.id);

    if (payment) {
      await paymentService.updatePaymentStatus(payment.id, 'FAILED', {
        errorMessage: paymentIntent.last_payment_error?.message
      });
      logger.info(`Payment failed: ${paymentIntent.id}`);
    }
  } catch (error) {
    logger.error('Error handling failed payment:', error);
  }
};

/**
 * معالجة الاسترداد
 */
const handleRefund = async (charge) => {
  try {
    const payment = await paymentService.findPaymentByIntentId(charge.payment_intent);

    if (payment) {
      await paymentService.processRefund(
        payment.id,
        charge.amount_refunded / 100,
        charge.id
      );
      logger.info(`Refund processed: ${charge.id}`);
    }
  } catch (error) {
    logger.error('Error handling refund:', error);
  }
};

/**
 * الحصول على إحصائيات المدفوعات
 */
const getPaymentStatistics = async (req, res) => {
  try {
    const userId = req.user.role === 'ADMIN' || req.user.role === 'PRODUCER'
      ? req.query.userId
      : req.user.id;

    const filters = {
      userId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      provider: req.query.provider,
      status: req.query.status
    };

    const stats = await paymentService.getPaymentStatistics(filters);

    res.json({
      success: true,
      message: 'تم جلب الإحصائيات بنجاح',
      data: stats
    });
  } catch (error) {
    logger.error('Error getting payment statistics:', error);
    res.status(500).json({
      success: false,
      message: 'فشل جلب الإحصائيات',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  createPaymentIntent,
  confirmPayment,
  getUserPayments,
  createInvoice,
  getUserInvoices,
  processRefund,
  handleStripeWebhook,
  getPaymentStatistics
};

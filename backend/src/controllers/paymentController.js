/**
 * Payment Controller
 * معالجة المدفوعات والفواتير
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const paypal = require('@paypal/checkout-server-sdk');
const Payment = require('../models/Payment');
const PaymentMethod = require('../models/PaymentMethod');
const Invoice = require('../models/Invoice');
const Order = require('../models/Order');
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');

// إعداد PayPal client
let paypalClient;
if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
  const environment = process.env.NODE_ENV === 'production' 
    ? new paypal.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET)
    : new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET);
  
  paypalClient = new paypal.core.PayPalHttpClient(environment);
}

/**
 * إنشاء نية دفع Stripe
 */
const createPaymentIntent = async (req, res, next) => {
  try {
    const { amount, currency = 'egp' } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
      return next(new AppError('المبلغ غير صالح', 400));
    }

    // إنشاء نية الدفع
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: currency.toLowerCase(),
      metadata: {
        userId: userId.toString(),
      },
    });

    // حفظ معلومات الدفع في قاعدة البيانات
    const payment = await Payment.create({
      userId,
      paymentIntentId: paymentIntent.id,
      amount: amount / 100, // Convert back from cents
      currency: currency.toUpperCase(),
      status: 'pending',
      provider: 'stripe',
    });

    logger.info(`Payment intent created: ${paymentIntent.id} for user: ${userId}`);

    res.status(201).json({
      success: true,
      data: {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
      },
    });
  } catch (error) {
    logger.error('Error creating payment intent:', error);
    next(new AppError('فشل إنشاء نية الدفع', 500));
  }
};

/**
 * تأكيد الدفع
 */
const confirmPayment = async (req, res, next) => {
  try {
    const { paymentMethodId, paymentIntentId } = req.body;
    const userId = req.user.id;

    if (!paymentMethodId || !paymentIntentId) {
      return next(new AppError('معلومات الدفع غير مكتملة', 400));
    }

    // تأكيد نية الدفع
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId,
    });

    // تحديث حالة الدفع في قاعدة البيانات
    const payment = await Payment.findOneAndUpdate(
      { paymentIntentId },
      {
        status: paymentIntent.status === 'succeeded' ? 'completed' : 'failed',
        paymentMethodId,
      },
      { new: true }
    );

    if (!payment) {
      return next(new AppError('لم يتم العثور على معلومات الدفع', 404));
    }

    logger.info(`Payment confirmed: ${paymentIntentId} for user: ${userId}`);

    res.json({
      success: true,
      data: {
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        requiresAction: paymentIntent.status === 'requires_action',
        clientSecret: paymentIntent.client_secret,
      },
    });
  } catch (error) {
    logger.error('Error confirming payment:', error);
    
    // تحديث حالة الدفع إلى فشل
    if (paymentIntentId) {
      await Payment.findOneAndUpdate(
        { paymentIntentId },
        { status: 'failed', error: error.message }
      );
    }

    next(new AppError('فشل تأكيد الدفع', 500));
  }
};

/**
 * حفظ طريقة دفع
 */
const savePaymentMethod = async (req, res, next) => {
  try {
    const { paymentMethodId } = req.body;
    const userId = req.user.id;

    if (!paymentMethodId) {
      return next(new AppError('معرف طريقة الدفع مطلوب', 400));
    }

    // الحصول على تفاصيل طريقة الدفع من Stripe
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    // حفظ طريقة الدفع في قاعدة البيانات
    const savedMethod = await PaymentMethod.create({
      userId,
      provider: 'stripe',
      providerMethodId: paymentMethodId,
      type: paymentMethod.type,
      last4: paymentMethod.card?.last4,
      brand: paymentMethod.card?.brand,
      expMonth: paymentMethod.card?.exp_month,
      expYear: paymentMethod.card?.exp_year,
      isDefault: false,
    });

    logger.info(`Payment method saved: ${paymentMethodId} for user: ${userId}`);

    res.status(201).json({
      success: true,
      data: {
        id: savedMethod.id,
        type: savedMethod.type,
        last4: savedMethod.last4,
        brand: savedMethod.brand,
        isDefault: savedMethod.isDefault,
      },
    });
  } catch (error) {
    logger.error('Error saving payment method:', error);
    next(new AppError('فشل حفظ طريقة الدفع', 500));
  }
};

/**
 * الحصول على طرق الدفع المحفوظة
 */
const getPaymentMethods = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const paymentMethods = await PaymentMethod.find({
      userId,
      isActive: true,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: paymentMethods.map(method => ({
        id: method.id,
        type: method.type,
        last4: method.last4,
        brand: method.brand,
        isDefault: method.isDefault,
        createdAt: method.createdAt,
      })),
    });
  } catch (error) {
    logger.error('Error getting payment methods:', error);
    next(new AppError('فشل تحميل طرق الدفع', 500));
  }
};

/**
 * حذف طريقة دفع
 */
const deletePaymentMethod = async (req, res, next) => {
  try {
    const { methodId } = req.params;
    const userId = req.user.id;

    const method = await PaymentMethod.findOneAndUpdate(
      { _id: methodId, userId },
      { isActive: false },
      { new: true }
    );

    if (!method) {
      return next(new AppError('لم يتم العثور على طريقة الدفع', 404));
    }

    // حذف طريقة الدفع من Stripe
    try {
      await stripe.paymentMethods.detach(method.providerMethodId);
    } catch (stripeError) {
      logger.warn('Error detaching payment method from Stripe:', stripeError);
    }

    logger.info(`Payment method deleted: ${methodId} for user: ${userId}`);

    res.json({
      success: true,
      message: 'تم حذف طريقة الدفع بنجاح',
    });
  } catch (error) {
    logger.error('Error deleting payment method:', error);
    next(new AppError('فشل حذف طريقة الدفع', 500));
  }
};

/**
 * إنشاء فاتورة
 */
const createInvoice = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const userId = req.user.id;

    // التحقق من وجود الطلب
    const order = await Order.findById(orderId).populate('restaurantId');
    if (!order) {
      return next(new AppError('لم يتم العثور على الطلب', 404));
    }

    // التحقق من ملكية الطلب
    if (order.userId.toString() !== userId.toString()) {
      return next(new AppError('غير مصرح لك بإنشاء فاتورة لهذا الطلب', 403));
    }

    // التحقق من وجود فاتورة سابقة
    const existingInvoice = await Invoice.findOne({ orderId });
    if (existingInvoice) {
      return next(new AppError('يوجد فاتورة بالفعل لهذا الطلب', 400));
    }

    // إنشاء الفاتورة
    const invoice = await Invoice.create({
      userId,
      orderId,
      amount: order.totalAmount,
      currency: 'EGP',
      status: 'pending',
      items: order.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.totalPrice,
      })),
      tax: order.tax || 0,
      deliveryFee: order.deliveryFee || 0,
      totalAmount: order.totalAmount,
    });

    // إنشاء PDF للفاتورة (سيتم تنفيذه لاحقاً)
    // const pdfUrl = await generateInvoicePDF(invoice);
    // invoice.pdfUrl = pdfUrl;
    // await invoice.save();

    logger.info(`Invoice created: ${invoice.id} for order: ${orderId}`);

    res.status(201).json({
      success: true,
      data: {
        id: invoice.id,
        orderId: invoice.orderId,
        amount: invoice.amount,
        currency: invoice.currency,
        status: invoice.status,
        createdAt: invoice.createdAt,
        pdfUrl: invoice.pdfUrl,
      },
    });
  } catch (error) {
    logger.error('Error creating invoice:', error);
    next(new AppError('فشل إنشاء الفاتورة', 500));
  }
};

/**
 * الحصول على فواتير المستخدم
 */
const getUserInvoices = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    const query = { userId };
    if (status) {
      query.status = status;
    }

    const invoices = await Invoice.find(query)
      .populate('orderId', 'orderNumber status')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Invoice.countDocuments(query);

    res.json({
      success: true,
      data: {
        invoices: invoices.map(invoice => ({
          id: invoice.id,
          orderId: invoice.orderId,
          amount: invoice.amount,
          currency: invoice.currency,
          status: invoice.status,
          createdAt: invoice.createdAt,
          pdfUrl: invoice.pdfUrl,
        })),
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    logger.error('Error getting user invoices:', error);
    next(new AppError('فشل تحميل الفواتير', 500));
  }
};

/**
 * معالجة استرداد الأموال
 */
const processRefund = async (req, res, next) => {
  try {
    const { paymentIntentId, amount } = req.body;
    const userId = req.user.id;

    if (!paymentIntentId) {
      return next(new AppError('معرف عملية الدفع مطلوب', 400));
    }

    // التحقق من وجود عملية الدفع
    const payment = await Payment.findOne({ paymentIntentId, userId });
    if (!payment) {
      return next(new AppError('لم يتم العثور على عملية الدفع', 404));
    }

    if (payment.status !== 'completed') {
      return next(new AppError('لا يمكن استرداد مبلغ من عملية دفع غير مكتملة', 400));
    }

    // حساب مبلغ الاسترداد
    const refundAmount = amount || payment.amount * 100; // Convert to cents

    // إنشاء استرداد في Stripe
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: refundAmount,
      reason: 'requested_by_customer',
    });

    // تحديث حالة الدفع
    payment.status = 'refunded';
    payment.refundId = refund.id;
    payment.refundAmount = refundAmount / 100;
    await payment.save();

    logger.info(`Refund processed: ${refund.id} for payment: ${paymentIntentId}`);

    res.json({
      success: true,
      data: {
        refundId: refund.id,
        amount: refund.amount / 100,
        currency: refund.currency,
        status: refund.status,
      },
    });
  } catch (error) {
    logger.error('Error processing refund:', error);
    next(new AppError('فشل معالجة الاسترداد', 500));
  }
};

/**
 * معالجة Webhook من Stripe
 */
const handleStripeWebhook = async (req, res, next) => {
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
        const paymentIntent = event.data.object;
        await handleSuccessfulPayment(paymentIntent);
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        await handleFailedPayment(failedPayment);
        break;

      case 'charge.refunded':
        const refund = event.data.object;
        await handleRefund(refund);
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
    await Payment.findOneAndUpdate(
      { paymentIntentId: paymentIntent.id },
      {
        status: 'completed',
        completedAt: new Date(),
      }
    );

    logger.info(`Payment succeeded: ${paymentIntent.id}`);
  } catch (error) {
    logger.error('Error handling successful payment:', error);
  }
};

/**
 * معالجة فشل الدفع
 */
const handleFailedPayment = async (paymentIntent) => {
  try {
    await Payment.findOneAndUpdate(
      { paymentIntentId: paymentIntent.id },
      {
        status: 'failed',
        error: paymentIntent.last_payment_error?.message,
      }
    );

    logger.info(`Payment failed: ${paymentIntent.id}`);
  } catch (error) {
    logger.error('Error handling failed payment:', error);
  }
};

/**
 * معالجة الاسترداد
 */
const handleRefund = async (refund) => {
  try {
    await Payment.findOneAndUpdate(
      { paymentIntentId: refund.payment_intent },
      {
        status: 'refunded',
        refundId: refund.id,
        refundAmount: refund.amount / 100,
      }
    );

    logger.info(`Refund processed: ${refund.id}`);
  } catch (error) {
    logger.error('Error handling refund:', error);
  }
};

module.exports = {
  createPaymentIntent,
  confirmPayment,
  savePaymentMethod,
  getPaymentMethods,
  deletePaymentMethod,
  createInvoice,
  getUserInvoices,
  processRefund,
  handleStripeWebhook,
};
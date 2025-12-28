/**
 * Payment Controller
 * معالجة المدفوعات والفواتير
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * إنشاء نية دفع Stripe
 */
const createPaymentIntent = async (req, res, next) => {
  try {
    const { amount, currency = 'egp' } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: req.t('payments.invalidAmount')
      });
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
    const payment = await prisma.payment.create({
      data: {
        userId,
        paymentIntentId: paymentIntent.id,
        amount: amount / 100, // Convert back from cents
        currency: currency.toUpperCase(),
        status: 'PENDING',
        provider: 'STRIPE',
      }
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
    res.status(500).json({
      success: false,
      error: req.t('payments.paymentIntentCreateFailed')
    });
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
      return res.status(400).json({
        success: false,
        error: req.t('payments.paymentInfoIncomplete')
      });
    }

    // تأكيد نية الدفع
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId,
    });

    // تحديث حالة الدفع في قاعدة البيانات
    const payment = await prisma.payment.updateMany({
      where: { paymentIntentId },
      data: {
        status: paymentIntent.status === 'succeeded' ? 'COMPLETED' : 'FAILED',
        paymentMethodId,
      }
    });

    if (payment.count === 0) {
      return res.status(404).json({
        success: false,
        error: req.t('payments.paymentInfoNotFound')
      });
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
    if (req.body.paymentIntentId) {
      await prisma.payment.updateMany({
        where: { paymentIntentId: req.body.paymentIntentId },
        data: { 
          status: 'FAILED', 
          errorMessage: error.message 
        }
      });
    }

    res.status(500).json({
      success: false,
      error: req.t('payments.paymentConfirmFailed')
    });
  }
};

/**
 * الحصول على فواتير المستخدم
 */
const getUserInvoices = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    const where = { userId };
    if (status) {
      where.status = status;
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        order: {
          select: { id: true, status: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: parseInt(limit)
    });

    const total = await prisma.invoice.count({ where });

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
    res.status(500).json({
      success: false,
      error: req.t('payments.invoicesFetchFailed')
    });
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
      return res.status(400).json({
        success: false,
        error: req.t('payments.paymentIntentIdRequired')
      });
    }

    // التحقق من وجود عملية الدفع
    const payment = await prisma.payment.findFirst({
      where: { 
        paymentIntentId, 
        userId 
      }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: req.t('payments.paymentNotFound')
      });
    }

    if (payment.status !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        error: req.t('payments.cannotRefundIncompletePayment')
      });
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
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'REFUNDED',
        refundId: refund.id,
        refundAmount: refundAmount / 100,
        refundedAt: new Date()
      }
    });

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
    res.status(500).json({
      success: false,
      error: req.t('payments.refundProcessFailed')
    });
  }
};

module.exports = {
  createPaymentIntent,
  confirmPayment,
  getUserInvoices,
  processRefund,
};
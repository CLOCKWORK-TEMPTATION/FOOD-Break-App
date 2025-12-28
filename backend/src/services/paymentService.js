/**
 * Payment Service - Prisma Edition
 * خدمة المدفوعات باستخدام Prisma
 */

const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * إنشاء سجل دفع جديد
 * @param {Object} paymentData - بيانات الدفع
 * @returns {Promise<Object>} - سجل الدفع المُنشأ
 */
const createPayment = async (paymentData) => {
  try {
    const {
      userId,
      orderId,
      amount,
      currency = 'EGP',
      provider = 'stripe',
      paymentIntentId,
      paymentMethodId,
      metadata = {}
    } = paymentData;

    // التحقق من صحة البيانات
    if (!userId || !amount || amount <= 0) {
      throw new Error('بيانات الدفع غير صالحة');
    }

    // إنشاء سجل الدفع
    const payment = await prisma.payment.create({
      data: {
        userId,
        orderId,
        amount: Number(amount),
        currency: currency.toUpperCase(),
        provider,
        paymentIntentId,
        paymentMethodId,
        status: 'PENDING',
        metadata
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        order: orderId ? {
          select: {
            id: true,
            totalAmount: true,
            status: true
          }
        } : false
      }
    });

    logger.info(`Payment created: ${payment.id} for user: ${userId}`);

    return payment;
  } catch (error) {
    logger.error(`Error creating payment: ${error.message}`);
    throw error;
  }
};

/**
 * تحديث حالة الدفع
 * @param {string} paymentId - معرف الدفع
 * @param {string} status - الحالة الجديدة
 * @param {Object} additionalData - بيانات إضافية
 * @returns {Promise<Object>} - سجل الدفع المُحدث
 */
const updatePaymentStatus = async (paymentId, status, additionalData = {}) => {
  try {
    const updateData = {
      status,
      ...additionalData
    };

    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: updateData,
      include: {
        user: true,
        order: true
      }
    });

    logger.info(`Payment ${paymentId} status updated to: ${status}`);

    return payment;
  } catch (error) {
    logger.error(`Error updating payment status: ${error.message}`);
    throw error;
  }
};

/**
 * البحث عن دفع بواسطة Payment Intent ID
 * @param {string} paymentIntentId - معرف نية الدفع من Stripe/PayPal
 * @returns {Promise<Object|null>} - سجل الدفع أو null
 */
const findPaymentByIntentId = async (paymentIntentId) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { paymentIntentId },
      include: {
        user: true,
        order: true
      }
    });

    return payment;
  } catch (error) {
    logger.error(`Error finding payment by intent ID: ${error.message}`);
    throw error;
  }
};

/**
 * الحصول على مدفوعات المستخدم
 * @param {string} userId - معرف المستخدم
 * @param {Object} filters - فلاتر البحث
 * @returns {Promise<Object>} - قائمة المدفوعات مع البيانات الإضافية
 */
const getUserPayments = async (userId, filters = {}) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      provider,
      startDate,
      endDate
    } = filters;

    const skip = (page - 1) * limit;

    // بناء شروط البحث
    const where = {
      userId,
      ...(status && { status }),
      ...(provider && { provider }),
      ...(startDate || endDate ? {
        createdAt: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) })
        }
      } : {})
    };

    // الحصول على المدفوعات
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              totalAmount: true,
              status: true,
              orderType: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip
      }),
      prisma.payment.count({ where })
    ]);

    return {
      payments,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    };
  } catch (error) {
    logger.error(`Error getting user payments: ${error.message}`);
    throw error;
  }
};

/**
 * معالجة استرداد الأموال
 * @param {string} paymentId - معرف الدفع
 * @param {number} refundAmount - مبلغ الاسترداد
 * @param {string} refundId - معرف الاسترداد من المزود
 * @returns {Promise<Object>} - سجل الدفع المُحدث
 */
const processRefund = async (paymentId, refundAmount, refundId) => {
  try {
    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'REFUNDED',
        refundAmount: Number(refundAmount),
        refundId,
        refundedAt: new Date()
      },
      include: {
        user: true,
        order: true
      }
    });

    logger.info(`Payment ${paymentId} refunded: ${refundAmount} ${payment.currency}`);

    return payment;
  } catch (error) {
    logger.error(`Error processing refund: ${error.message}`);
    throw error;
  }
};

/**
 * الحصول على إحصائيات الدفع
 * @param {Object} filters - فلاتر الإحصائيات
 * @returns {Promise<Object>} - إحصائيات الدفع
 */
const getPaymentStatistics = async (filters = {}) => {
  try {
    const {
      userId,
      startDate,
      endDate,
      provider,
      status
    } = filters;

    const where = {
      ...(userId && { userId }),
      ...(provider && { provider }),
      ...(status && { status }),
      ...(startDate || endDate ? {
        createdAt: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) })
        }
      } : {})
    };

    const [
      totalPayments,
      completedPayments,
      totalAmount,
      completedAmount,
      refundedAmount
    ] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.payment.aggregate({
        where,
        _sum: { amount: true }
      }),
      prisma.payment.aggregate({
        where: { ...where, status: 'COMPLETED' },
        _sum: { amount: true }
      }),
      prisma.payment.aggregate({
        where: { ...where, status: 'REFUNDED' },
        _sum: { refundAmount: true }
      })
    ]);

    return {
      totalPayments,
      completedPayments,
      totalAmount: totalAmount._sum.amount || 0,
      completedAmount: completedAmount._sum.amount || 0,
      refundedAmount: refundedAmount._sum.refundAmount || 0,
      successRate: totalPayments > 0
        ? ((completedPayments / totalPayments) * 100).toFixed(2)
        : 0
    };
  } catch (error) {
    logger.error(`Error getting payment statistics: ${error.message}`);
    throw error;
  }
};

/**
 * حذف سجل دفع (soft delete)
 * @param {string} paymentId - معرف الدفع
 * @returns {Promise<Object>} - سجل الدفع المحذوف
 */
const deletePayment = async (paymentId) => {
  try {
    const payment = await prisma.payment.delete({
      where: { id: paymentId }
    });

    logger.info(`Payment deleted: ${paymentId}`);

    return payment;
  } catch (error) {
    logger.error(`Error deleting payment: ${error.message}`);
    throw error;
  }
};

module.exports = {
  createPayment,
  updatePaymentStatus,
  findPaymentByIntentId,
  getUserPayments,
  processRefund,
  getPaymentStatistics,
  deletePayment
};

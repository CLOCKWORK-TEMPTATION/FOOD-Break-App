/**
 * Invoice Service - Prisma Edition
 * خدمة الفواتير باستخدام Prisma
 */

const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * إنشاء فاتورة جديدة
 * @param {Object} invoiceData - بيانات الفاتورة
 * @returns {Promise<Object>} - الفاتورة المُنشأة
 */
const createInvoice = async (invoiceData) => {
  try {
    const {
      userId,
      orderId,
      paymentId,
      amount,
      currency = 'EGP',
      items = [],
      tax = 0,
      discount = 0,
      notes
    } = invoiceData;

    // التحقق من صحة البيانات
    if (!userId || !amount || amount <= 0) {
      throw new Error('بيانات الفاتورة غير صالحة');
    }

    // التحقق من عدم وجود فاتورة سابقة للطلب
    if (orderId) {
      const existingInvoice = await prisma.invoice.findFirst({
        where: { orderId }
      });

      if (existingInvoice) {
        throw new Error('يوجد فاتورة بالفعل لهذا الطلب');
      }
    }

    // حساب المبلغ الإجمالي
    const subtotal = amount;
    const taxAmount = (subtotal * tax) / 100;
    const discountAmount = (subtotal * discount) / 100;
    const totalAmount = subtotal + taxAmount - discountAmount;

    // إنشاء رقم فاتورة فريد
    const invoiceNumber = await generateInvoiceNumber();

    // إنشاء الفاتورة
    const invoice = await prisma.invoice.create({
      data: {
        userId,
        orderId,
        paymentId,
        invoiceNumber,
        amount: subtotal,
        tax: taxAmount,
        discount: discountAmount,
        totalAmount,
        currency: currency.toUpperCase(),
        items,
        notes,
        status: 'PENDING'
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phoneNumber: true
          }
        },
        order: orderId ? {
          select: {
            id: true,
            totalAmount: true,
            status: true,
            orderType: true
          }
        } : false,
        payment: paymentId ? true : false
      }
    });

    logger.info(`Invoice created: ${invoice.id} - ${invoice.invoiceNumber}`);

    return invoice;
  } catch (error) {
    logger.error(`Error creating invoice: ${error.message}`);
    throw error;
  }
};

/**
 * توليد رقم فاتورة فريد
 * @returns {Promise<string>} - رقم الفاتورة
 */
const generateInvoiceNumber = async () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');

  // الحصول على عدد الفواتير هذا الشهر
  const startOfMonth = new Date(year, date.getMonth(), 1);
  const endOfMonth = new Date(year, date.getMonth() + 1, 0, 23, 59, 59);

  const count = await prisma.invoice.count({
    where: {
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth
      }
    }
  });

  const sequence = String(count + 1).padStart(4, '0');
  return `INV-${year}${month}-${sequence}`;
};

/**
 * تحديث حالة الفاتورة
 * @param {string} invoiceId - معرف الفاتورة
 * @param {string} status - الحالة الجديدة
 * @returns {Promise<Object>} - الفاتورة المُحدثة
 */
const updateInvoiceStatus = async (invoiceId, status) => {
  try {
    const updateData = { status };

    if (status === 'PAID') {
      updateData.paidAt = new Date();
    }

    const invoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: updateData,
      include: {
        user: true,
        order: true,
        payment: true
      }
    });

    logger.info(`Invoice ${invoiceId} status updated to: ${status}`);

    return invoice;
  } catch (error) {
    logger.error(`Error updating invoice status: ${error.message}`);
    throw error;
  }
};

/**
 * الحصول على فواتير المستخدم
 * @param {string} userId - معرف المستخدم
 * @param {Object} filters - فلاتر البحث
 * @returns {Promise<Object>} - قائمة الفواتير
 */
const getUserInvoices = async (userId, filters = {}) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      startDate,
      endDate
    } = filters;

    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(status && { status }),
      ...(startDate || endDate ? {
        createdAt: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) })
        }
      } : {})
    };

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              totalAmount: true,
              status: true
            }
          },
          payment: {
            select: {
              id: true,
              amount: true,
              status: true,
              provider: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip
      }),
      prisma.invoice.count({ where })
    ]);

    return {
      invoices,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    };
  } catch (error) {
    logger.error(`Error getting user invoices: ${error.message}`);
    throw error;
  }
};

/**
 * الحصول على فاتورة بواسطة المعرف
 * @param {string} invoiceId - معرف الفاتورة
 * @returns {Promise<Object>} - الفاتورة
 */
const getInvoiceById = async (invoiceId) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phoneNumber: true
          }
        },
        order: true,
        payment: true
      }
    });

    if (!invoice) {
      throw new Error('لم يتم العثور على الفاتورة');
    }

    return invoice;
  } catch (error) {
    logger.error(`Error getting invoice: ${error.message}`);
    throw error;
  }
};

/**
 * الحصول على فاتورة بواسطة رقم الفاتورة
 * @param {string} invoiceNumber - رقم الفاتورة
 * @returns {Promise<Object>} - الفاتورة
 */
const getInvoiceByNumber = async (invoiceNumber) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { invoiceNumber },
      include: {
        user: true,
        order: true,
        payment: true
      }
    });

    if (!invoice) {
      throw new Error('لم يتم العثور على الفاتورة');
    }

    return invoice;
  } catch (error) {
    logger.error(`Error getting invoice by number: ${error.message}`);
    throw error;
  }
};

/**
 * الحصول على إحصائيات الفواتير
 * @param {Object} filters - فلاتر الإحصائيات
 * @returns {Promise<Object>} - إحصائيات الفواتير
 */
const getInvoiceStatistics = async (filters = {}) => {
  try {
    const {
      userId,
      startDate,
      endDate,
      status
    } = filters;

    const where = {
      ...(userId && { userId }),
      ...(status && { status }),
      ...(startDate || endDate ? {
        createdAt: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) })
        }
      } : {})
    };

    const [
      totalInvoices,
      paidInvoices,
      totalAmount,
      paidAmount
    ] = await Promise.all([
      prisma.invoice.count({ where }),
      prisma.invoice.count({ where: { ...where, status: 'PAID' } }),
      prisma.invoice.aggregate({
        where,
        _sum: { totalAmount: true }
      }),
      prisma.invoice.aggregate({
        where: { ...where, status: 'PAID' },
        _sum: { totalAmount: true }
      })
    ]);

    return {
      totalInvoices,
      paidInvoices,
      pendingInvoices: totalInvoices - paidInvoices,
      totalAmount: totalAmount._sum.totalAmount || 0,
      paidAmount: paidAmount._sum.totalAmount || 0,
      pendingAmount: (totalAmount._sum.totalAmount || 0) - (paidAmount._sum.totalAmount || 0),
      paymentRate: totalInvoices > 0
        ? ((paidInvoices / totalInvoices) * 100).toFixed(2)
        : 0
    };
  } catch (error) {
    logger.error(`Error getting invoice statistics: ${error.message}`);
    throw error;
  }
};

/**
 * حذف فاتورة
 * @param {string} invoiceId - معرف الفاتورة
 * @returns {Promise<Object>} - الفاتورة المحذوفة
 */
const deleteInvoice = async (invoiceId) => {
  try {
    const invoice = await prisma.invoice.delete({
      where: { id: invoiceId }
    });

    logger.info(`Invoice deleted: ${invoiceId}`);

    return invoice;
  } catch (error) {
    logger.error(`Error deleting invoice: ${error.message}`);
    throw error;
  }
};

module.exports = {
  createInvoice,
  generateInvoiceNumber,
  updateInvoiceStatus,
  getUserInvoices,
  getInvoiceById,
  getInvoiceByNumber,
  getInvoiceStatistics,
  deleteInvoice
};

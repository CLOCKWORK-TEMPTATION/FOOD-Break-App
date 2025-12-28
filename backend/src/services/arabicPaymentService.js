/**
 * خدمة الدفع العربية المحسنة
 * Arabic Payment Service with Local Payment Methods Support
 */

const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * رسائل الدفع بالعربية
 */
const PAYMENT_MESSAGES = {
  // رسائل النجاح
  success: {
    paymentCreated: 'تم إنشاء عملية الدفع بنجاح',
    paymentConfirmed: 'تم تأكيد الدفع بنجاح',
    paymentCompleted: 'تمت عملية الدفع بنجاح',
    refundProcessed: 'تم استرداد المبلغ بنجاح',
    paymentMethodSaved: 'تم حفظ طريقة الدفع بنجاح',
    paymentMethodDeleted: 'تم حذف طريقة الدفع بنجاح'
  },
  // رسائل الخطأ
  errors: {
    invalidAmount: 'المبلغ غير صالح. يجب أن يكون أكبر من صفر',
    invalidCurrency: 'العملة غير مدعومة',
    paymentNotFound: 'لم يتم العثور على عملية الدفع',
    paymentAlreadyProcessed: 'تمت معالجة عملية الدفع بالفعل',
    insufficientFunds: 'الرصيد غير كافي لإتمام العملية',
    cardDeclined: 'تم رفض البطاقة. يرجى التحقق من البيانات أو استخدام بطاقة أخرى',
    cardExpired: 'انتهت صلاحية البطاقة',
    invalidCardNumber: 'رقم البطاقة غير صحيح',
    invalidCVV: 'رمز CVV غير صحيح',
    networkError: 'خطأ في الشبكة. يرجى المحاولة مرة أخرى',
    processingError: 'حدث خطأ أثناء معالجة الدفع',
    refundFailed: 'فشل في استرداد المبلغ',
    refundNotAllowed: 'لا يمكن استرداد المبلغ لهذه العملية',
    paymentMethodNotFound: 'طريقة الدفع غير موجودة',
    walletNotLinked: 'المحفظة الإلكترونية غير مرتبطة',
    otpExpired: 'انتهت صلاحية رمز التحقق',
    otpInvalid: 'رمز التحقق غير صحيح',
    dailyLimitExceeded: 'تم تجاوز الحد اليومي للمعاملات',
    monthlyLimitExceeded: 'تم تجاوز الحد الشهري للمعاملات'
  },
  // حالات الدفع
  status: {
    PENDING: 'في انتظار الدفع',
    PROCESSING: 'جاري المعالجة',
    COMPLETED: 'تم الدفع',
    FAILED: 'فشل الدفع',
    REFUNDED: 'تم الاسترداد',
    PARTIALLY_REFUNDED: 'استرداد جزئي',
    CANCELLED: 'ملغي'
  }
};

/**
 * طرق الدفع المحلية المدعومة
 */
const LOCAL_PAYMENT_METHODS = {
  // البطاقات
  CARD: {
    name: 'البطاقة البنكية',
    nameEn: 'Bank Card',
    icon: 'credit-card',
    types: ['VISA', 'MASTERCARD', 'MEEZA'],
    minAmount: 1,
    maxAmount: 100000,
    processingFee: 0.025, // 2.5%
    currency: 'EGP'
  },
  // المحافظ الإلكترونية
  VODAFONE_CASH: {
    name: 'فودافون كاش',
    nameEn: 'Vodafone Cash',
    icon: 'vodafone',
    minAmount: 1,
    maxAmount: 30000,
    processingFee: 0,
    currency: 'EGP',
    requiresOtp: true
  },
  ORANGE_MONEY: {
    name: 'أورانج موني',
    nameEn: 'Orange Money',
    icon: 'orange',
    minAmount: 1,
    maxAmount: 30000,
    processingFee: 0,
    currency: 'EGP',
    requiresOtp: true
  },
  ETISALAT_CASH: {
    name: 'اتصالات كاش',
    nameEn: 'Etisalat Cash',
    icon: 'etisalat',
    minAmount: 1,
    maxAmount: 30000,
    processingFee: 0,
    currency: 'EGP',
    requiresOtp: true
  },
  WE_PAY: {
    name: 'وي باي',
    nameEn: 'WE Pay',
    icon: 'we',
    minAmount: 1,
    maxAmount: 30000,
    processingFee: 0,
    currency: 'EGP',
    requiresOtp: true
  },
  FAWRY: {
    name: 'فوري',
    nameEn: 'Fawry',
    icon: 'fawry',
    minAmount: 1,
    maxAmount: 5000,
    processingFee: 2.5, // رسوم ثابتة
    currency: 'EGP',
    requiresReference: true
  },
  AMAN: {
    name: 'أمان',
    nameEn: 'Aman',
    icon: 'aman',
    minAmount: 1,
    maxAmount: 5000,
    processingFee: 3,
    currency: 'EGP',
    requiresReference: true
  },
  INSTAPAY: {
    name: 'إنستاباي',
    nameEn: 'InstaPay',
    icon: 'instapay',
    minAmount: 1,
    maxAmount: 50000,
    processingFee: 0,
    currency: 'EGP'
  },
  BANK_TRANSFER: {
    name: 'تحويل بنكي',
    nameEn: 'Bank Transfer',
    icon: 'bank',
    minAmount: 100,
    maxAmount: 1000000,
    processingFee: 0,
    currency: 'EGP',
    requiresConfirmation: true
  },
  CASH_ON_DELIVERY: {
    name: 'الدفع عند الاستلام',
    nameEn: 'Cash on Delivery',
    icon: 'cash',
    minAmount: 1,
    maxAmount: 5000,
    processingFee: 10,
    currency: 'EGP'
  }
};

/**
 * الحصول على طرق الدفع المتاحة
 */
const getAvailablePaymentMethods = async (amount = 0, currency = 'EGP') => {
  try {
    const availableMethods = [];

    for (const [key, method] of Object.entries(LOCAL_PAYMENT_METHODS)) {
      if (amount >= method.minAmount && amount <= method.maxAmount && method.currency === currency) {
        availableMethods.push({
          id: key,
          name: method.name,
          nameEn: method.nameEn,
          icon: method.icon,
          minAmount: method.minAmount,
          maxAmount: method.maxAmount,
          processingFee: method.processingFee,
          processingFeeType: typeof method.processingFee === 'number' && method.processingFee < 1 ? 'percentage' : 'fixed',
          requiresOtp: method.requiresOtp || false,
          requiresReference: method.requiresReference || false
        });
      }
    }

    return {
      success: true,
      data: {
        methods: availableMethods,
        currency: currency
      }
    };
  } catch (error) {
    logger.error(`خطأ في جلب طرق الدفع: ${error.message}`);
    throw error;
  }
};

/**
 * حساب رسوم المعالجة
 */
const calculateProcessingFee = (amount, paymentMethod) => {
  const method = LOCAL_PAYMENT_METHODS[paymentMethod];
  if (!method) {
    return 0;
  }

  if (method.processingFee < 1) {
    // نسبة مئوية
    return Math.round(amount * method.processingFee * 100) / 100;
  } else {
    // رسوم ثابتة
    return method.processingFee;
  }
};

/**
 * إنشاء عملية دفع جديدة بالعربية
 */
const createArabicPayment = async (paymentData) => {
  try {
    const {
      userId,
      orderId,
      amount,
      currency = 'EGP',
      paymentMethod,
      phoneNumber, // للمحافظ الإلكترونية
      cardDetails, // للبطاقات
      metadata = {}
    } = paymentData;

    // التحقق من صحة المبلغ
    if (!amount || amount <= 0) {
      return {
        success: false,
        error: PAYMENT_MESSAGES.errors.invalidAmount,
        code: 'INVALID_AMOUNT'
      };
    }

    // التحقق من طريقة الدفع
    const method = LOCAL_PAYMENT_METHODS[paymentMethod];
    if (!method) {
      return {
        success: false,
        error: 'طريقة الدفع غير مدعومة',
        code: 'INVALID_PAYMENT_METHOD'
      };
    }

    // التحقق من حدود المبلغ
    if (amount < method.minAmount || amount > method.maxAmount) {
      return {
        success: false,
        error: `المبلغ يجب أن يكون بين ${method.minAmount.toLocaleString('ar-EG')} و ${method.maxAmount.toLocaleString('ar-EG')} ${currency}`,
        code: 'AMOUNT_OUT_OF_RANGE'
      };
    }

    // حساب رسوم المعالجة
    const processingFee = calculateProcessingFee(amount, paymentMethod);
    const totalAmount = amount + processingFee;

    // إنشاء معرف فريد للدفع
    const paymentReference = generatePaymentReference();

    // إنشاء سجل الدفع
    const payment = await prisma.payment.create({
      data: {
        userId,
        orderId,
        amount: Number(amount),
        processingFee: Number(processingFee),
        totalAmount: Number(totalAmount),
        currency: currency.toUpperCase(),
        provider: paymentMethod,
        paymentReference,
        status: 'PENDING',
        metadata: {
          ...metadata,
          paymentMethodName: method.name,
          phoneNumber: phoneNumber || null,
          initiatedAt: new Date().toISOString()
        }
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
            orderNumber: true,
            totalAmount: true,
            status: true
          }
        } : false
      }
    });

    // إنشاء استجابة مناسبة لطريقة الدفع
    let paymentInstructions = {};

    if (method.requiresOtp) {
      paymentInstructions = {
        type: 'MOBILE_WALLET',
        message: `سيتم إرسال رمز تحقق إلى ${phoneNumber}`,
        nextStep: 'ENTER_OTP'
      };
    } else if (method.requiresReference) {
      paymentInstructions = {
        type: 'REFERENCE_PAYMENT',
        reference: paymentReference,
        message: `استخدم الرقم المرجعي ${paymentReference} للدفع في أي ${method.name}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 ساعة
      };
    } else if (paymentMethod === 'BANK_TRANSFER') {
      paymentInstructions = {
        type: 'BANK_TRANSFER',
        bankName: 'البنك الأهلي المصري',
        accountNumber: '1234567890',
        accountName: 'BreakApp',
        reference: paymentReference,
        message: 'يرجى إضافة الرقم المرجعي في خانة الوصف'
      };
    } else if (paymentMethod === 'CASH_ON_DELIVERY') {
      paymentInstructions = {
        type: 'COD',
        message: 'سيتم الدفع نقداً عند استلام الطلب'
      };
    }

    logger.info(`تم إنشاء عملية دفع: ${payment.id} - ${paymentMethod}`);

    return {
      success: true,
      message: PAYMENT_MESSAGES.success.paymentCreated,
      data: {
        paymentId: payment.id,
        reference: paymentReference,
        amount: amount,
        processingFee: processingFee,
        totalAmount: totalAmount,
        currency: currency,
        paymentMethod: {
          id: paymentMethod,
          name: method.name
        },
        status: 'PENDING',
        statusText: PAYMENT_MESSAGES.status.PENDING,
        instructions: paymentInstructions,
        createdAt: payment.createdAt
      }
    };
  } catch (error) {
    logger.error(`خطأ في إنشاء عملية الدفع: ${error.message}`);
    return {
      success: false,
      error: PAYMENT_MESSAGES.errors.processingError,
      code: 'PROCESSING_ERROR'
    };
  }
};

/**
 * التحقق من رمز OTP للمحافظ الإلكترونية
 */
const verifyWalletOtp = async (paymentId, otp, userId) => {
  try {
    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, userId }
    });

    if (!payment) {
      return {
        success: false,
        error: PAYMENT_MESSAGES.errors.paymentNotFound,
        code: 'PAYMENT_NOT_FOUND'
      };
    }

    if (payment.status !== 'PENDING') {
      return {
        success: false,
        error: PAYMENT_MESSAGES.errors.paymentAlreadyProcessed,
        code: 'ALREADY_PROCESSED'
      };
    }

    // في الإنتاج: التحقق من OTP مع مزود الخدمة
    // هنا نحاكي التحقق
    const isValidOtp = otp.length === 6 && /^\d+$/.test(otp);

    if (!isValidOtp) {
      return {
        success: false,
        error: PAYMENT_MESSAGES.errors.otpInvalid,
        code: 'INVALID_OTP'
      };
    }

    // تحديث حالة الدفع
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        metadata: {
          ...payment.metadata,
          otpVerifiedAt: new Date().toISOString()
        }
      }
    });

    logger.info(`تم التحقق من OTP للدفع: ${paymentId}`);

    return {
      success: true,
      message: PAYMENT_MESSAGES.success.paymentCompleted,
      data: {
        paymentId: updatedPayment.id,
        status: 'COMPLETED',
        statusText: PAYMENT_MESSAGES.status.COMPLETED,
        completedAt: updatedPayment.completedAt
      }
    };
  } catch (error) {
    logger.error(`خطأ في التحقق من OTP: ${error.message}`);
    return {
      success: false,
      error: PAYMENT_MESSAGES.errors.processingError,
      code: 'PROCESSING_ERROR'
    };
  }
};

/**
 * تأكيد الدفع المرجعي (فوري/أمان)
 */
const confirmReferencePayment = async (paymentReference) => {
  try {
    const payment = await prisma.payment.findFirst({
      where: { paymentReference }
    });

    if (!payment) {
      return {
        success: false,
        error: PAYMENT_MESSAGES.errors.paymentNotFound,
        code: 'PAYMENT_NOT_FOUND'
      };
    }

    if (payment.status !== 'PENDING') {
      return {
        success: false,
        error: PAYMENT_MESSAGES.errors.paymentAlreadyProcessed,
        code: 'ALREADY_PROCESSED'
      };
    }

    // تحديث حالة الدفع
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        metadata: {
          ...payment.metadata,
          confirmedAt: new Date().toISOString()
        }
      }
    });

    logger.info(`تم تأكيد الدفع المرجعي: ${paymentReference}`);

    return {
      success: true,
      message: PAYMENT_MESSAGES.success.paymentCompleted,
      data: {
        paymentId: updatedPayment.id,
        reference: paymentReference,
        status: 'COMPLETED',
        statusText: PAYMENT_MESSAGES.status.COMPLETED,
        amount: updatedPayment.amount,
        completedAt: updatedPayment.completedAt
      }
    };
  } catch (error) {
    logger.error(`خطأ في تأكيد الدفع المرجعي: ${error.message}`);
    return {
      success: false,
      error: PAYMENT_MESSAGES.errors.processingError,
      code: 'PROCESSING_ERROR'
    };
  }
};

/**
 * معالجة استرداد الأموال بالعربية
 */
const processArabicRefund = async (paymentId, refundAmount, userId, reason) => {
  try {
    const payment = await prisma.payment.findFirst({
      where: { id: paymentId }
    });

    if (!payment) {
      return {
        success: false,
        error: PAYMENT_MESSAGES.errors.paymentNotFound,
        code: 'PAYMENT_NOT_FOUND'
      };
    }

    if (payment.status !== 'COMPLETED') {
      return {
        success: false,
        error: PAYMENT_MESSAGES.errors.refundNotAllowed,
        code: 'REFUND_NOT_ALLOWED'
      };
    }

    const actualRefundAmount = refundAmount || payment.amount;
    const isPartialRefund = actualRefundAmount < payment.amount;

    // تحديث حالة الدفع
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: isPartialRefund ? 'PARTIALLY_REFUNDED' : 'REFUNDED',
        refundAmount: Number(actualRefundAmount),
        refundedAt: new Date(),
        metadata: {
          ...payment.metadata,
          refundReason: reason,
          refundedBy: userId,
          refundedAt: new Date().toISOString()
        }
      }
    });

    logger.info(`تم استرداد المبلغ: ${actualRefundAmount} من الدفع: ${paymentId}`);

    return {
      success: true,
      message: PAYMENT_MESSAGES.success.refundProcessed,
      data: {
        paymentId: updatedPayment.id,
        refundAmount: actualRefundAmount,
        status: updatedPayment.status,
        statusText: PAYMENT_MESSAGES.status[updatedPayment.status],
        refundedAt: updatedPayment.refundedAt
      }
    };
  } catch (error) {
    logger.error(`خطأ في استرداد المبلغ: ${error.message}`);
    return {
      success: false,
      error: PAYMENT_MESSAGES.errors.refundFailed,
      code: 'REFUND_FAILED'
    };
  }
};

/**
 * الحصول على سجل مدفوعات المستخدم بالعربية
 */
const getUserPaymentsArabic = async (userId, filters = {}) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      paymentMethod,
      startDate,
      endDate
    } = filters;

    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(status && { status }),
      ...(paymentMethod && { provider: paymentMethod }),
      ...(startDate || endDate ? {
        createdAt: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) })
        }
      } : {})
    };

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              totalAmount: true,
              status: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip
      }),
      prisma.payment.count({ where })
    ]);

    // تحويل البيانات للعربية
    const arabicPayments = payments.map(payment => ({
      id: payment.id,
      reference: payment.paymentReference,
      amount: payment.amount,
      processingFee: payment.processingFee || 0,
      totalAmount: payment.totalAmount || payment.amount,
      amountFormatted: `${payment.amount.toLocaleString('ar-EG')} ${payment.currency}`,
      currency: payment.currency,
      paymentMethod: {
        id: payment.provider,
        name: LOCAL_PAYMENT_METHODS[payment.provider]?.name || payment.provider
      },
      status: payment.status,
      statusText: PAYMENT_MESSAGES.status[payment.status] || payment.status,
      order: payment.order ? {
        id: payment.order.id,
        orderNumber: payment.order.orderNumber
      } : null,
      createdAt: payment.createdAt,
      createdAtFormatted: new Date(payment.createdAt).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      completedAt: payment.completedAt
    }));

    return {
      success: true,
      data: {
        payments: arabicPayments,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          hasMore: page * limit < total
        }
      }
    };
  } catch (error) {
    logger.error(`خطأ في جلب مدفوعات المستخدم: ${error.message}`);
    throw error;
  }
};

/**
 * توليد رقم مرجعي للدفع
 */
const generatePaymentReference = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PAY-${timestamp}-${random}`;
};

/**
 * الحصول على تفاصيل الدفع بالعربية
 */
const getPaymentDetailsArabic = async (paymentId, userId) => {
  try {
    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, userId },
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
        order: {
          include: {
            items: true
          }
        }
      }
    });

    if (!payment) {
      return {
        success: false,
        error: PAYMENT_MESSAGES.errors.paymentNotFound,
        code: 'PAYMENT_NOT_FOUND'
      };
    }

    const method = LOCAL_PAYMENT_METHODS[payment.provider];

    return {
      success: true,
      data: {
        id: payment.id,
        reference: payment.paymentReference,
        amount: payment.amount,
        processingFee: payment.processingFee || 0,
        totalAmount: payment.totalAmount || payment.amount,
        amountFormatted: `${payment.amount.toLocaleString('ar-EG')} ${payment.currency}`,
        currency: payment.currency,
        paymentMethod: {
          id: payment.provider,
          name: method?.name || payment.provider,
          icon: method?.icon
        },
        status: payment.status,
        statusText: PAYMENT_MESSAGES.status[payment.status] || payment.status,
        customer: {
          name: `${payment.user.firstName} ${payment.user.lastName}`,
          email: payment.user.email,
          phone: payment.user.phoneNumber
        },
        order: payment.order ? {
          id: payment.order.id,
          orderNumber: payment.order.orderNumber,
          items: payment.order.items
        } : null,
        createdAt: payment.createdAt,
        createdAtFormatted: new Date(payment.createdAt).toLocaleDateString('ar-EG', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        completedAt: payment.completedAt,
        refundedAt: payment.refundedAt,
        refundAmount: payment.refundAmount
      }
    };
  } catch (error) {
    logger.error(`خطأ في جلب تفاصيل الدفع: ${error.message}`);
    throw error;
  }
};

module.exports = {
  PAYMENT_MESSAGES,
  LOCAL_PAYMENT_METHODS,
  getAvailablePaymentMethods,
  calculateProcessingFee,
  createArabicPayment,
  verifyWalletOtp,
  confirmReferencePayment,
  processArabicRefund,
  getUserPaymentsArabic,
  getPaymentDetailsArabic,
  generatePaymentReference
};

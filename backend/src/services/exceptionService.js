const { PrismaClient } = require('@prisma/client');
const costAlertService = require('./costAlertService');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * خدمة الاستثناءات - التحقق من أهلية المستخدم للاستثناء
 * @param {string} userId - معرف المستخدم
 * @param {string} exceptionType - نوع الاستثناء
 * @returns {Promise<Object>} - نتيجة التحقق
 */
const checkExceptionEligibility = async (userId, exceptionType) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true }
    });

    if (!user) {
      throw new Error('المستخدم غير موجود');
    }

    // VIP والمنتجون والإداريون لديهم استثناءات غير محدودة
    if (['VIP', 'ADMIN', 'PRODUCER'].includes(user.role)) {
      return {
        eligible: true,
        unlimited: true,
        remainingQuota: null,
        message: 'استثناءات غير محدودة'
      };
    }

    // للمستخدمين العاديين: التحقق من الحصة (مرة كل 3 أسابيع)
    const threeWeeksAgo = new Date();
    threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);

    const recentExceptions = await prisma.exception.findMany({
      where: {
        userId,
        quotaUsed: true,
        createdAt: {
          gte: threeWeeksAgo
        }
      }
    });

    const hasUsedQuota = recentExceptions.length > 0;

    if (hasUsedQuota) {
      const lastException = recentExceptions[0];
      const nextAvailableDate = new Date(lastException.createdAt);
      nextAvailableDate.setDate(nextAvailableDate.getDate() + 21);

      return {
        eligible: false,
        unlimited: false,
        remainingQuota: 0,
        nextAvailableDate,
        message: `لقد استخدمت حصتك من الاستثناءات. الاستثناء القادم متاح في ${nextAvailableDate.toLocaleDateString('ar-EG')}`
      };
    }

    return {
      eligible: true,
      unlimited: false,
      remainingQuota: 1,
      message: 'يمكنك استخدام استثناء واحد'
    };
  } catch (error) {
    logger.error(`خطأ في التحقق من أهلية الاستثناء: ${error.message}`);
    throw error;
  }
};

/**
 * خدمة الاستثناءات - إنشاء استثناء جديد مع فحص الميزانية
 * @param {Object} exceptionData - بيانات الاستثناء
 * @returns {Promise<Object>} - الاستثناء المُنشأ
 */
const createException = async (exceptionData) => {
  try {
    const { userId, orderId, exceptionType, amount, approvedBy } = exceptionData;

    // التحقق من الأهلية
    const eligibility = await checkExceptionEligibility(userId, exceptionType);

    // إذا لم يكن مؤهلاً ولا يوجد موافقة خاصة
    if (!eligibility.eligible && !approvedBy) {
      throw new Error(eligibility.message);
    }

    // فحص الميزانية للمستخدمين ذوي الميزانيات
    let budgetCheck = null;
    if (eligibility.unlimited && ['VIP', 'PRODUCER'].includes(exceptionType)) {
      try {
        // البحث عن ميزانية المستخدم النشطة
        const budget = await prisma.costBudget.findFirst({
          where: {
            targetUserId: userId,
            isActive: true
          }
        });

        if (budget) {
          // فحص الميزانية وإضافة المبلغ
          budgetCheck = await costAlertService.checkBudgetAndCreateAlert(budget.id, amount);
          
          // إذا كان التنبيه حرج، منع إنشاء الاستثناء
          if (budgetCheck.alert && budgetCheck.alert.alertType === 'EXCEEDED') {
            throw new Error(`تم تجاوز الحد الأقصى للميزانية. لا يمكن إنشاء استثناء جديد: ${budgetCheck.alert.message}`);
          }
        }
      } catch (budgetError) {
        // إذا فشل فحص الميزانية، يمكن المتابعة مع التحذير
        logger.warn(`فشل في فحص الميزانية للاستثناء: ${budgetError.message}`);
      }
    }

    // إنشاء الاستثناء
    const exception = await prisma.exception.create({
      data: {
        userId,
        orderId,
        exceptionType,
        amount,
        quotaUsed: !eligibility.unlimited, // VIP لا يستخدمون الحصة
        approvedBy
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      }
    });

    logger.info(`تم إنشاء استثناء جديد: ${exception.id} للمستخدم: ${userId}`);

    return {
      exception,
      budgetCheck
    };
  } catch (error) {
    logger.error(`خطأ في إنشاء الاستثناء: ${error.message}`);
    throw error;
  }
};

/**
 * خدمة الاستثناءات - الحصول على جميع استثناءات المستخدم
 * @param {string} userId - معرف المستخدم
 * @param {Object} filters - فلاتر البحث
 * @returns {Promise<Object>} - قائمة الاستثناءات
 */
const getUserExceptions = async (userId, filters = {}) => {
  try {
    const { page = 1, limit = 20, startDate, endDate } = filters;

    const where = {
      userId,
      ...(startDate && endDate && {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      })
    };

    const exceptions = await prisma.exception.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.exception.count({ where });

    // حساب المجموع الكلي للتكلفة
    const totalCost = exceptions.reduce((sum, exc) => sum + exc.amount, 0);

    return {
      exceptions,
      summary: {
        total: exceptions.length,
        totalCost,
        byType: {
          FULL: exceptions.filter(e => e.exceptionType === 'FULL').length,
          LIMITED: exceptions.filter(e => e.exceptionType === 'LIMITED').length,
          SELF_PAID: exceptions.filter(e => e.exceptionType === 'SELF_PAID').length
        }
      },
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error(`خطأ في جلب استثناءات المستخدم: ${error.message}`);
    throw error;
  }
};

/**
 * خدمة الاستثناءات - الحصول على جميع الاستثناءات (للإداريين)
 * @param {Object} filters - فلاتر البحث
 * @returns {Promise<Object>} - قائمة الاستثناءات
 */
const getAllExceptions = async (filters = {}) => {
  try {
    const { page = 1, limit = 20, exceptionType, startDate, endDate, userId } = filters;

    const where = {
      ...(exceptionType && { exceptionType }),
      ...(userId && { userId }),
      ...(startDate && endDate && {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      })
    };

    const exceptions = await prisma.exception.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.exception.count({ where });

    // إحصائيات إجمالية
    const totalCost = exceptions.reduce((sum, exc) => sum + exc.amount, 0);
    const byType = {
      FULL: { count: 0, cost: 0 },
      LIMITED: { count: 0, cost: 0 },
      SELF_PAID: { count: 0, cost: 0 }
    };

    exceptions.forEach(exc => {
      byType[exc.exceptionType].count++;
      byType[exc.exceptionType].cost += exc.amount;
    });

    return {
      exceptions,
      summary: {
        total: exceptions.length,
        totalCost,
        byType
      },
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error(`خطأ في جلب جميع الاستثناءات: ${error.message}`);
    throw error;
  }
};

/**
 * خدمة الاستثناءات - حساب تكلفة الاستثناء
 * @param {string} exceptionType - نوع الاستثناء
 * @param {number} orderTotal - إجمالي الطلب
 * @param {number} standardMealCost - تكلفة الوجبة القياسية
 * @returns {Object} - تفاصيل التكلفة
 */
const calculateExceptionCost = (exceptionType, orderTotal, standardMealCost = 50) => {
  let costDetails = {
    exceptionType,
    total: orderTotal,
    orderTotal,
    standardMealCost,
    userPays: 0,
    companyPays: 0,
    productionPays: 0,
    difference: 0
  };

  switch (exceptionType) {
    case 'FULL':
      // الاستثناء التام: الإنتاج يدفع كل شيء
      costDetails.userPays = 0;
      costDetails.companyPays = orderTotal;
      costDetails.productionPays = orderTotal;
      break;

    case 'LIMITED':
      // الاستثناء في الحدود: المستخدم يدفع الفرق
      costDetails.difference = Math.max(0, orderTotal - standardMealCost);
      costDetails.userPays = costDetails.difference;
      costDetails.companyPays = Math.min(orderTotal, standardMealCost);
      costDetails.productionPays = Math.min(orderTotal, standardMealCost);
      break;

    case 'SELF_PAID':
      // الاستثناء المدفوع بالكامل: المستخدم يدفع كل شيء
      costDetails.userPays = orderTotal;
      costDetails.companyPays = 0;
      costDetails.productionPays = 0;
      break;

    default:
      throw new Error('نوع الاستثناء غير صالح');
  }

  return costDetails;
};

/**
 * خدمة الاستثناءات - إنشاء تقرير مالي أسبوعي
 * @param {Date} startDate - تاريخ البداية
 * @param {Date} endDate - تاريخ النهاية
 * @returns {Promise<Object>} - التقرير المالي
 */
const generateFinancialReport = async (startDate, endDate) => {
  try {
    const exceptions = await prisma.exception.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      }
    });

    // تجميع حسب المستخدم
    const byUser = exceptions.reduce((acc, exc) => {
      const userId = exc.userId;
      if (!acc[userId]) {
        acc[userId] = {
          user: exc.user,
          exceptions: [],
          totalAmount: 0,
          byType: {
            FULL: { count: 0, cost: 0 },
            LIMITED: { count: 0, cost: 0 },
            SELF_PAID: { count: 0, cost: 0 }
          }
        };
      }
      
      acc[userId].exceptions.push(exc);
      acc[userId].totalAmount += exc.amount;
      acc[userId].byType[exc.exceptionType].count++;
      acc[userId].byType[exc.exceptionType].cost += exc.amount;
      
      return acc;
    }, {});

    // إحصائيات إجمالية
    const summary = {
      period: {
        startDate,
        endDate
      },
      totalExceptions: exceptions.length,
      totalCost: exceptions.reduce((sum, exc) => sum + exc.amount, 0),
      byType: {
        FULL: { count: 0, cost: 0 },
        LIMITED: { count: 0, cost: 0 },
        SELF_PAID: { count: 0, cost: 0 }
      },
      byRole: {
        VIP: { count: 0, cost: 0 },
        REGULAR: { count: 0, cost: 0 },
        ADMIN: { count: 0, cost: 0 },
        PRODUCER: { count: 0, cost: 0 }
      }
    };

    exceptions.forEach(exc => {
      summary.byType[exc.exceptionType].count++;
      summary.byType[exc.exceptionType].cost += exc.amount;
      summary.byRole[exc.user.role].count++;
      summary.byRole[exc.user.role].cost += exc.amount;
    });

    return {
      summary,
      byUser: Object.values(byUser)
    };
  } catch (error) {
    logger.error(`خطأ في إنشاء التقرير المالي: ${error.message}`);
    throw error;
  }
};

module.exports = {
  checkExceptionEligibility,
  createException,
  getUserExceptions,
  getAllExceptions,
  calculateExceptionCost,
  generateFinancialReport
};
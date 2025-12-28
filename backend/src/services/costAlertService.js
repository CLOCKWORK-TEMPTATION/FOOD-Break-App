const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * خدمة إدارة التنبيهات المالية - إنشاء ميزانية جديدة
 * @param {Object} budgetData - بيانات الميزانية
 * @returns {Promise<Object>} - الميزانية المُنشأة
 */
const createCostBudget = async (budgetData) => {
  try {
    const { 
      name, 
      type, 
      targetUserId, 
      maxLimit, 
      warningThreshold = 0.8,
      expiresAt 
    } = budgetData;

    // التحقق من صحة البيانات
    if (!name || !type || !maxLimit) {
      throw new Error('البيانات الأساسية مطلوبة: الاسم، النوع، والحد الأقصى');
    }

    if (maxLimit <= 0) {
      throw new Error('الحد الأقصى يجب أن يكون أكبر من صفر');
    }

    if (warningThreshold < 0 || warningThreshold > 1) {
      throw new Error('حد التحذير يجب أن يكون بين 0 و 1');
    }

    // التحقق من عدم وجود ميزانية نشطة للمستخدم
    if (targetUserId) {
      const existingBudget = await prisma.costBudget.findFirst({
        where: {
          targetUserId,
          isActive: true,
          type: { in: ['VIP', 'PRODUCER'] }
        }
      });

      if (existingBudget) {
        throw new Error(`الميزانية النشطة موجودة بالفعل لهذا المستخدم: ${existingBudget.name}`);
      }
    }

    // إنشاء الميزانية
    const budget = await prisma.costBudget.create({
      data: {
        name,
        type,
        targetUserId,
        maxLimit: Number(maxLimit),
        warningThreshold: Number(warningThreshold),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        user: targetUserId ? {
          connect: { id: targetUserId }
        } : undefined
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
        },
        alerts: true
      }
    });

    logger.info(`تم إنشاء ميزانية جديدة: ${budget.id} - ${budget.name}`);

    return budget;
  } catch (error) {
    logger.error(`خطأ في إنشاء الميزانية: ${error.message}`);
    throw error;
  }
};

/**
 * خدمة إدارة التنبيهات المالية - تحديث الميزانية
 * @param {string} budgetId - معرف الميزانية
 * @param {Object} updateData - البيانات المحدثة
 * @returns {Promise<Object>} - الميزانية المحدثة
 */
const updateCostBudget = async (budgetId, updateData) => {
  try {
    const { 
      name, 
      maxLimit, 
      warningThreshold, 
      isActive,
      expiresAt 
    } = updateData;

    const budget = await prisma.costBudget.findUnique({
      where: { id: budgetId }
    });

    if (!budget) {
      throw new Error('الميزانية غير موجودة');
    }

    // التحقق من صحة البيانات
    if (maxLimit !== undefined && maxLimit <= 0) {
      throw new Error('الحد الأقصى يجب أن يكون أكبر من صفر');
    }

    if (warningThreshold !== undefined && (warningThreshold < 0 || warningThreshold > 1)) {
      throw new Error('حد التحذير يجب أن يكون بين 0 و 1');
    }

    const updatedBudget = await prisma.costBudget.update({
      where: { id: budgetId },
      data: {
        ...(name && { name }),
        ...(maxLimit !== undefined && { maxLimit: Number(maxLimit) }),
        ...(warningThreshold !== undefined && { warningThreshold: Number(warningThreshold) }),
        ...(isActive !== undefined && { isActive }),
        ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
        updatedAt: new Date()
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
        },
        alerts: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    logger.info(`تم تحديث الميزانية: ${budgetId}`);

    return updatedBudget;
  } catch (error) {
    logger.error(`خطأ في تحديث الميزانية: ${error.message}`);
    throw error;
  }
};

/**
 * خدمة إدارة التنبيهات المالية - فحص الميزانية وإنشاء التنبيهات
 * @param {string} budgetId - معرف الميزانية
 * @param {number} amount - المبلغ المراد إضافته
 * @returns {Promise<Object>} - نتيجة فحص الميزانية
 */
const checkBudgetAndCreateAlert = async (budgetId, amount) => {
  try {
    const budget = await prisma.costBudget.findUnique({
      where: { id: budgetId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    });

    if (!budget) {
      throw new Error('الميزانية غير موجودة');
    }

    if (!budget.isActive) {
      throw new Error('الميزانية غير نشطة');
    }

    if (budget.expiresAt && budget.expiresAt < new Date()) {
      throw new Error('الميزانية منتهية الصلاحية');
    }

    const newUsedAmount = budget.usedAmount + Number(amount);
    const percentage = newUsedAmount / budget.maxLimit;

    // إنشاء التنبيه إذا لزم الأمر
    let alert = null;
    let shouldCreateAlert = false;

    if (percentage >= 1.0 && budget.usedAmount < budget.maxLimit) {
      // تجاوز الحد
      shouldCreateAlert = true;
      alert = await createCostAlert({
        budgetId,
        userId: budget.targetUserId || budget.user?.id,
        alertType: 'EXCEEDED',
        severity: 'CRITICAL',
        title: 'تجاوز الحد الأقصى للميزانية',
        message: `تم تجاوز الحد الأقصى للميزانية "${budget.name}". المبلغ الحالي: ${newUsedAmount.toFixed(2)} من ${budget.maxLimit.toFixed(2)}`,
        currentAmount: newUsedAmount,
        budgetLimit: budget.maxLimit,
        percentage
      });
    } else if (percentage >= budget.warningThreshold && budget.usedAmount < (budget.maxLimit * budget.warningThreshold)) {
      // تحذير
      shouldCreateAlert = true;
      alert = await createCostAlert({
        budgetId,
        userId: budget.targetUserId || budget.user?.id,
        alertType: 'WARNING',
        severity: percentage >= 0.9 ? 'HIGH' : 'MEDIUM',
        title: 'تحذير: اقتراب من الحد الأقصى للميزانية',
        message: `الميزانية "${budget.name}" وصلت إلى ${(percentage * 100).toFixed(1)}% من الحد الأقصى. المبلغ الحالي: ${newUsedAmount.toFixed(2)} من ${budget.maxLimit.toFixed(2)}`,
        currentAmount: newUsedAmount,
        budgetLimit: budget.maxLimit,
        percentage
      });
    }

    // تحديث المبلغ المستخدم
    const updatedBudget = await prisma.costBudget.update({
      where: { id: budgetId },
      data: {
        usedAmount: newUsedAmount,
        updatedAt: new Date()
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

    return {
      budget: updatedBudget,
      alert,
      shouldCreateAlert,
      percentage,
      canProceed: true
    };
  } catch (error) {
    logger.error(`خطأ في فحص الميزانية: ${error.message}`);
    throw error;
  }
};

/**
 * خدمة إدارة التنبيهات المالية - إنشاء تنبيه
 * @param {Object} alertData - بيانات التنبيه
 * @returns {Promise<Object>} - التنبيه المُنشأ
 */
const createCostAlert = async (alertData) => {
  try {
    const {
      budgetId,
      userId,
      alertType,
      severity,
      title,
      message,
      currentAmount,
      budgetLimit,
      percentage
    } = alertData;

    // التحقق من عدم وجود تنبيه مشابه حديث
    const recentAlert = await prisma.costAlert.findFirst({
      where: {
        budgetId,
        alertType,
        isResolved: false,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // آخر 24 ساعة
        }
      }
    });

    if (recentAlert) {
      logger.info(`تم تجاهل التنبيه المتكرر: ${alertType} للميزانية ${budgetId}`);
      return recentAlert;
    }

    const alert = await prisma.costAlert.create({
      data: {
        budgetId,
        userId,
        alertType,
        severity,
        title,
        message,
        currentAmount: Number(currentAmount),
        budgetLimit: Number(budgetLimit),
        percentage: Number(percentage)
      },
      include: {
        budget: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    logger.info(`تم إنشاء تنبيه مالي: ${alert.id} - ${alert.title}`);

    // إرسال إشعار للمستخدم
    await sendBudgetNotification(alert);

    return alert;
  } catch (error) {
    logger.error(`خطأ في إنشاء التنبيه: ${error.message}`);
    throw error;
  }
};

/**
 * إرسال إشعار للميزانية
 * @param {Object} alert - بيانات التنبيه
 */
const sendBudgetNotification = async (alert) => {
  try {
    await prisma.notification.create({
      data: {
        userId: alert.userId,
        type: 'SYSTEM',
        title: alert.title,
        message: alert.message,
        data: {
          alertId: alert.id,
          budgetId: alert.budgetId,
          alertType: alert.alertType,
          severity: alert.severity
        }
      }
    });

    logger.info(`تم إرسال إشعار الميزانية للمستخدم: ${alert.userId}`);
  } catch (error) {
    logger.error(`خطأ في إرسال إشعار الميزانية: ${error.message}`);
  }
};

/**
 * خدمة إدارة التنبيهات المالية - الحصول على ميزانية محددة
 * @param {string} budgetId - معرف الميزانية
 * @returns {Promise<Object>} - الميزانية
 */
const getCostBudget = async (budgetId) => {
  try {
    const budget = await prisma.costBudget.findUnique({
      where: { id: budgetId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        },
        alerts: {
          orderBy: { createdAt: 'desc' },
          take: 10 // آخر 10 تنبيهات
        }
      }
    });

    if (!budget) {
      throw new Error('الميزانية غير موجودة');
    }

    return budget;
  } catch (error) {
    logger.error(`خطأ في جلب الميزانية: ${error.message}`);
    throw error;
  }
};

/**
 * خدمة إدارة التنبيهات المالية - الحصول على جميع الميزانيات
 * @param {Object} filters - فلاتر البحث
 * @returns {Promise<Object>} - قائمة الميزانيات
 */
const getAllCostBudgets = async (filters = {}) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      type, 
      isActive, 
      targetUserId 
    } = filters;

    const where = {
      ...(type && { type }),
      ...(isActive !== undefined && { isActive }),
      ...(targetUserId && { targetUserId })
    };

    const budgets = await prisma.costBudget.findMany({
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
        },
        alerts: {
          where: { isResolved: false },
          orderBy: { createdAt: 'desc' }
        }
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.costBudget.count({ where });

    // حساب الإحصائيات
    const stats = {
      total: budgets.length,
      active: budgets.filter(b => b.isActive).length,
      inactive: budgets.filter(b => !b.isActive).length,
      totalLimit: budgets.reduce((sum, b) => sum + b.maxLimit, 0),
      totalUsed: budgets.reduce((sum, b) => sum + b.usedAmount, 0),
      alerts: budgets.reduce((sum, b) => sum + b.alerts.length, 0)
    };

    return {
      budgets,
      stats,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error(`خطأ في جلب الميزانيات: ${error.message}`);
    throw error;
  }
};

/**
 * خدمة إدارة التنبيهات المالية - الحصول على تنبيهات الميزانية
 * @param {string} budgetId - معرف الميزانية
 * @param {Object} filters - فلاتر البحث
 * @returns {Promise<Object>} - قائمة التنبيهات
 */
const getBudgetAlerts = async (budgetId, filters = {}) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      isResolved,
      severity,
      alertType 
    } = filters;

    const where = {
      budgetId,
      ...(isResolved !== undefined && { isResolved }),
      ...(severity && { severity }),
      ...(alertType && { alertType })
    };

    const alerts = await prisma.costAlert.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.costAlert.count({ where });

    return {
      alerts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error(`خطأ في جلب تنبيهات الميزانية: ${error.message}`);
    throw error;
  }
};

/**
 * خدمة إدارة التنبيهات المالية - حل التنبيه
 * @param {string} alertId - معرف التنبيه
 * @param {string} resolvedBy - من قام بحل التنبيه
 * @returns {Promise<Object>} - التنبيه المحدث
 */
const resolveAlert = async (alertId, resolvedBy) => {
  try {
    const alert = await prisma.costAlert.findUnique({
      where: { id: alertId }
    });

    if (!alert) {
      throw new Error('التنبيه غير موجود');
    }

    if (alert.isResolved) {
      throw new Error('التنبيه محلول بالفعل');
    }

    const updatedAlert = await prisma.costAlert.update({
      where: { id: alertId },
      data: {
        isResolved: true,
        resolvedBy,
        resolvedAt: new Date()
      },
      include: {
        budget: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    logger.info(`تم حل التنبيه: ${alertId}`);

    return updatedAlert;
  } catch (error) {
    logger.error(`خطأ في حل التنبيه: ${error.message}`);
    throw error;
  }
};

/**
 * خدمة إدارة التنبيهات المالية - إنشاء ميزانية افتراضية للمستخدم
 * @param {string} userId - معرف المستخدم
 * @param {string} userRole - دور المستخدم
 * @returns {Promise<Object>} - الميزانية المُنشأة
 */
const createDefaultBudgetForUser = async (userId, userRole) => {
  try {
    const defaultLimits = {
      VIP: 1000,      // 1000 جنيه شهرياً
      PRODUCER: 500   // 500 جنيه شهرياً
    };

    if (!defaultLimits[userRole]) {
      throw new Error(`لا توجد ميزانية افتراضية لدور المستخدم: ${userRole}`);
    }

    const budgetName = `الميزانية الافتراضية - ${userRole}`;
    
    const budget = await createCostBudget({
      name: budgetName,
      type: userRole,
      targetUserId: userId,
      maxLimit: defaultLimits[userRole],
      warningThreshold: 0.8
    });

    logger.info(`تم إنشاء ميزانية افتراضية للمستخدم ${userId}: ${budget.id}`);

    return budget;
  } catch (error) {
    logger.error(`خطأ في إنشاء الميزانية الافتراضية: ${error.message}`);
    throw error;
  }
};

/**
 * خدمة إدارة التنبيهات المالية - إعادة تعيين الميزانية
 * @param {string} budgetId - معرف الميزانية
 * @param {string} resetBy - من قام بإعادة التعيين
 * @returns {Promise<Object>} - الميزانية المُحدثة
 */
const resetBudget = async (budgetId, resetBy) => {
  try {
    const budget = await prisma.costBudget.findUnique({
      where: { id: budgetId }
    });

    if (!budget) {
      throw new Error('الميزانية غير موجودة');
    }

    if (!budget.isActive) {
      throw new Error('لا يمكن إعادة تعيين ميزانية غير نشطة');
    }

    const updatedBudget = await prisma.costBudget.update({
      where: { id: budgetId },
      data: {
        usedAmount: 0,
        updatedAt: new Date()
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
        },
        alerts: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    const alertUserId = budget.targetUserId || resetBy;
    await createCostAlert({
      budgetId,
      userId: alertUserId,
      alertType: 'RESET',
      severity: 'LOW',
      title: 'تم إعادة تعيين الميزانية',
      message: `تم إعادة تعيين الميزانية "${budget.name}" بواسطة المستخدم ${resetBy}.`,
      currentAmount: 0,
      budgetLimit: budget.maxLimit,
      percentage: 0
    });

    logger.info(`تم إعادة تعيين الميزانية: ${budgetId} بواسطة ${resetBy}`);

    return updatedBudget;
  } catch (error) {
    logger.error(`خطأ في إعادة تعيين الميزانية: ${error.message}`);
    throw error;
  }
};

/**
 * إنشاء تقرير ميزانية للفترة المحددة
 * @param {string} budgetId
 * @param {string|Date} startDate
 * @param {string|Date} endDate
 * @returns {Promise<Object>}
 */
const generateBudgetReport = async (budgetId, startDate, endDate) => {
  try {
    const budget = await prisma.costBudget.findUnique({
      where: { id: budgetId },
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

    if (!budget) {
      throw new Error('الميزانية غير موجودة');
    }

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const alerts = await prisma.costAlert.findMany({
      where: {
        budgetId,
        createdAt: {
          gte: start,
          lte: end
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const percentage = budget.maxLimit > 0 ? (budget.usedAmount / budget.maxLimit) : 0;
    const alertCountsByType = alerts.reduce((acc, a) => {
      acc[a.alertType] = (acc[a.alertType] || 0) + 1;
      return acc;
    }, {});

    return {
      budget,
      period: { start, end },
      summary: {
        maxLimit: budget.maxLimit,
        usedAmount: budget.usedAmount,
        remaining: Math.max(0, budget.maxLimit - budget.usedAmount),
        percentage,
        alertsCount: alerts.length,
        alertCountsByType
      },
      alerts
    };
  } catch (error) {
    logger.error(`خطأ في إنشاء تقرير الميزانية: ${error.message}`);
    throw error;
  }
};

/**
 * تحليلات عامة للميزانيات (مستوى لوحة تحكم)
 * @param {Object} filters
 * @returns {Promise<Object>}
 */
const getBudgetAnalytics = async (filters = {}) => {
  try {
    const { type, isActive, startDate, endDate } = filters;

    const where = {
      ...(type && { type }),
      ...(isActive !== undefined && { isActive }),
      ...(startDate || endDate ? {
        createdAt: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) })
        }
      } : {})
    };

    const budgets = await prisma.costBudget.findMany({ where });
    const totals = budgets.reduce((acc, b) => {
      acc.totalLimit += b.maxLimit || 0;
      acc.totalUsed += b.usedAmount || 0;
      acc.active += b.isActive ? 1 : 0;
      acc.byType[b.type] = (acc.byType[b.type] || 0) + 1;
      return acc;
    }, { totalLimit: 0, totalUsed: 0, active: 0, byType: {} });

    const unresolvedAlerts = await prisma.costAlert.count({
      where: { isResolved: false }
    });

    return {
      totals: {
        budgets: budgets.length,
        activeBudgets: totals.active,
        inactiveBudgets: budgets.length - totals.active,
        totalLimit: totals.totalLimit,
        totalUsed: totals.totalUsed,
        overallPercentage: totals.totalLimit > 0 ? totals.totalUsed / totals.totalLimit : 0,
        byType: totals.byType
      },
      unresolvedAlerts
    };
  } catch (error) {
    logger.error(`خطأ في تحليلات الميزانية: ${error.message}`);
    throw error;
  }
};

module.exports = {
  createCostBudget,
  updateCostBudget,
  checkBudgetAndCreateAlert,
  getCostBudget,
  getAllCostBudgets,
  getBudgetAlerts,
  resolveAlert,
  createDefaultBudgetForUser,
  resetBudget,
  generateBudgetReport,
  getBudgetAnalytics
};
const costAlertService = require('../services/costAlertService');
const logger = require('../utils/logger');

/**
 * متحكم إدارة التنبيهات المالية - إنشاء ميزانية جديدة
 */
const createBudget = async (req, res) => {
  try {
    const budgetData = req.body;
    const createdBy = req.user.id;

    const budget = await costAlertService.createCostBudget(budgetData);

    logger.info(`تم إنشاء ميزانية جديدة: ${budget.id} بواسطة المستخدم: ${createdBy}`);

    res.status(201).json({
      success: true,
      message: req.t('budget.budgetCreated'),
      data: budget
    });
  } catch (error) {
    logger.error(`خطأ في إنشاء الميزانية: ${error.message}`);
    res.status(400).json({
      success: false,
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * متحكم إدارة التنبيهات المالية - الحصول على جميع الميزانيات
 */
const getBudgets = async (req, res) => {
  try {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      type: req.query.type,
      isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
      targetUserId: req.query.targetUserId
    };

    const result = await costAlertService.getAllCostBudgets(filters);

    res.json({
      success: true,
      message: req.t('budget.budgetsFetchSuccess'),
      data: result.budgets,
      stats: result.stats,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error(`خطأ في جلب الميزانيات: ${error.message}`);
    res.status(500).json({
      success: false,
      message: req.t('budget.budgetsFetchFailed'),
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * متحكم إدارة التنبيهات المالية - الحصول على ميزانية محددة
 */
const getBudgetById = async (req, res) => {
  try {
    const { budgetId } = req.params;

    const budget = await costAlertService.getCostBudget(budgetId);

    res.json({
      success: true,
      message: req.t('budget.budgetFetchSuccess'),
      data: budget
    });
  } catch (error) {
    logger.error(`خطأ في جلب الميزانية: ${error.message}`);
    res.status(404).json({
      success: false,
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * متحكم إدارة التنبيهات المالية - تحديث الميزانية
 */
const updateBudget = async (req, res) => {
  try {
    const { budgetId } = req.params;
    const updateData = req.body;
    const updatedBy = req.user.id;

    const budget = await costAlertService.updateCostBudget(budgetId, updateData);

    logger.info(`تم تحديث الميزانية: ${budgetId} بواسطة المستخدم: ${updatedBy}`);

    res.json({
      success: true,
      message: 'تم تحديث الميزانية بنجاح',
      data: budget
    });
  } catch (error) {
    logger.error(`خطأ في تحديث الميزانية: ${error.message}`);
    res.status(400).json({
      success: false,
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * متحكم إدارة التنبيهات المالية - فحص الميزانية وإضافة مبلغ
 */
const checkBudget = async (req, res) => {
  try {
    const { budgetId } = req.params;
    const { amount } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: req.t('budget.amountMustBePositive')
      });
    }

    const result = await costAlertService.checkBudgetAndCreateAlert(budgetId, amount);

    logger.info(`تم فحص الميزانية: ${budgetId} وإضافة مبلغ: ${amount}`);

    res.json({
      success: true,
      message: 'تم فحص الميزانية بنجاح',
      data: {
        budget: result.budget,
        alert: result.alert,
        shouldCreateAlert: result.shouldCreateAlert,
        percentage: result.percentage,
        canProceed: result.canProceed
      }
    });
  } catch (error) {
    logger.error(`خطأ في فحص الميزانية: ${error.message}`);
    res.status(400).json({
      success: false,
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * متحكم إدارة التنبيهات المالية - الحصول على تنبيهات الميزانية
 */
const getBudgetAlerts = async (req, res) => {
  try {
    const { budgetId } = req.params;
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      isResolved: req.query.isResolved !== undefined ? req.query.isResolved === 'true' : undefined,
      severity: req.query.severity,
      alertType: req.query.alertType
    };

    const result = await costAlertService.getBudgetAlerts(budgetId, filters);

    res.json({
      success: true,
      message: 'تم جلب تنبيهات الميزانية بنجاح',
      data: result.alerts,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error(`خطأ في جلب تنبيهات الميزانية: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب تنبيهات الميزانية',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * متحكم إدارة التنبيهات المالية - حل التنبيه
 */
const resolveAlert = async (req, res) => {
  try {
    const { alertId } = req.params;
    const resolvedBy = req.user.id;

    const alert = await costAlertService.resolveAlert(alertId, resolvedBy);

    logger.info(`تم حل التنبيه: ${alertId} بواسطة المستخدم: ${resolvedBy}`);

    res.json({
      success: true,
      message: 'تم حل التنبيه بنجاح',
      data: alert
    });
  } catch (error) {
    logger.error(`خطأ في حل التنبيه: ${error.message}`);
    res.status(400).json({
      success: false,
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * متحكم إدارة التنبيهات المالية - إنشاء ميزانية افتراضية للمستخدم
 */
const createDefaultBudget = async (req, res) => {
  try {
    const { userId, userRole } = req.body;
    const createdBy = req.user.id;

    if (!userId || !userRole) {
      return res.status(400).json({
        success: false,
        message: 'معرف المستخدم ودوره مطلوبان'
      });
    }

    const budget = await costAlertService.createDefaultBudgetForUser(userId, userRole);

    logger.info(`تم إنشاء ميزانية افتراضية للمستخدم: ${userId} بواسطة المستخدم: ${createdBy}`);

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الميزانية الافتراضية بنجاح',
      data: budget
    });
  } catch (error) {
    logger.error(`خطأ في إنشاء الميزانية الافتراضية: ${error.message}`);
    res.status(400).json({
      success: false,
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * متحكم إدارة التنبيهات المالية - إعادة تعيين الميزانية
 */
const resetBudget = async (req, res) => {
  try {
    const { budgetId } = req.params;
    const resetBy = req.user.id;

    const result = await costAlertService.resetBudget(budgetId, resetBy);

    logger.info(`تم إعادة تعيين الميزانية: ${budgetId} بواسطة المستخدم: ${resetBy}`);

    res.json({
      success: true,
      message: 'تم إعادة تعيين الميزانية بنجاح',
      data: {
        budget: result.budget,
        alert: result.alert
      }
    });
  } catch (error) {
    logger.error(`خطأ في إعادة تعيين الميزانية: ${error.message}`);
    res.status(400).json({
      success: false,
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * متحكم إدارة التنبيهات المالية - إنشاء تقرير الميزانية
 */
const generateBudgetReport = async (req, res) => {
  try {
    const { budgetId } = req.params;
    const { startDate, endDate } = req.query;

    const report = await costAlertService.generateBudgetReport(budgetId, startDate, endDate);

    res.json({
      success: true,
      message: 'تم إنشاء تقرير الميزانية بنجاح',
      data: report
    });
  } catch (error) {
    logger.error(`خطأ في إنشاء تقرير الميزانية: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في إنشاء تقرير الميزانية',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * متحكم إدارة التنبيهات المالية - الحصول على إحصائيات شاملة
 */
const getBudgetAnalytics = async (req, res) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const analytics = await costAlertService.getBudgetAnalytics(filters);

    res.json({
      success: true,
      message: 'تم جلب الإحصائيات بنجاح',
      data: analytics
    });
  } catch (error) {
    logger.error(`خطأ في جلب إحصائيات الميزانية: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب إحصائيات الميزانية',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  createBudget,
  getBudgets,
  getBudgetById,
  updateBudget,
  checkBudget,
  getBudgetAlerts,
  resolveAlert,
  createDefaultBudget,
  resetBudget,
  generateBudgetReport,
  getBudgetAnalytics
};
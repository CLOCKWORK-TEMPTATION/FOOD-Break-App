const exceptionService = require('../services/exceptionService');

/**
 * Controller - التحقق من أهلية المستخدم للاستثناء
 * GET /api/v1/exceptions/eligibility
 */
const checkEligibility = async (req, res, next) => {
  try {
    const { exceptionType } = req.query;

    if (!exceptionType) {
      return res.status(400).json({
        success: false,
        error: req.__('exceptions.exceptionTypeRequired')
      });
    }

    const result = await exceptionService.checkExceptionEligibility(
      req.user.id,
      exceptionType
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller - إنشاء استثناء جديد
 * POST /api/v1/exceptions
 */
const createException = async (req, res, next) => {
  try {
    const exceptionData = {
      ...req.body,
      userId: req.user.id
    };

    // إذا كان المستخدم Admin أو Producer، يمكنه الموافقة على الاستثناء
    if (['ADMIN', 'PRODUCER'].includes(req.user.role)) {
      exceptionData.approvedBy = req.user.id;
    }

    const exception = await exceptionService.createException(exceptionData);

    res.status(201).json({
      success: true,
      message: req.__('exceptions.exceptionCreated'),
      data: exception
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller - الحصول على استثناءات المستخدم الحالي
 * GET /api/v1/exceptions/my-exceptions
 */
const getMyExceptions = async (req, res, next) => {
  try {
    const result = await exceptionService.getUserExceptions(req.user.id, req.query);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller - الحصول على جميع الاستثناءات (للإداريين)
 * GET /api/v1/exceptions
 */
const getAllExceptions = async (req, res, next) => {
  try {
    const result = await exceptionService.getAllExceptions(req.query);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller - حساب تكلفة الاستثناء
 * POST /api/v1/exceptions/calculate-cost
 */
const calculateCost = async (req, res, next) => {
  try {
    const { exceptionType, orderTotal, standardMealCost } = req.body;

    if (!exceptionType || !orderTotal) {
      return res.status(400).json({
        success: false,
        error: req.__('exceptions.exceptionTypeAndTotalRequired')
      });
    }

    const costDetails = exceptionService.calculateExceptionCost(
      exceptionType,
      parseFloat(orderTotal),
      standardMealCost ? parseFloat(standardMealCost) : undefined
    );

    res.json({
      success: true,
      data: costDetails
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller - إنشاء تقرير مالي
 * POST /api/v1/exceptions/financial-report
 */
const generateFinancialReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: req.__('validation.dateRangeRequired')
      });
    }

    const report = await exceptionService.generateFinancialReport(
      new Date(startDate),
      new Date(endDate)
    );

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkEligibility,
  createException,
  getMyExceptions,
  getAllExceptions,
  calculateCost,
  generateFinancialReport
};
const predictiveService = require('../services/predictive');
const logger = require('../utils/logger');

/**
 * متحكم التنبؤات - Predictive Controller
 * معالجات التنبؤات والتوصيات الذكية بالعربية
 */

// الحصول على توصيات ذكية
exports.getSmartRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit } = req.query;

    const recommendations = await predictiveService.getPersonalizedRecommendations(userId, parseInt(limit) || 10);

    res.json({
      success: true,
      data: recommendations,
      message: `تم إنشاء ${recommendations.length} توصية ذكية لك`
    });
  } catch (error) {
    logger.error('خطأ في الحصول على التوصيات:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'RECOMMENDATIONS_FAILED',
        message: 'فشل الحصول على التوصيات الذكية'
      }
    });
  }
};

// التنبؤ بالطلبات القادمة
exports.predictNextOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const predictions = await predictiveService.predictUserOrders(userId);

    res.json({
      success: true,
      data: predictions,
      message: 'تم التنبؤ بطلباتك القادمة بناءً على سلوكك'
    });
  } catch (error) {
    logger.error('خطأ في التنبؤ بالطلبات:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'PREDICTION_FAILED',
        message: 'فشل التنبؤ بالطلبات القادمة'
      }
    });
  }
};

// التنبؤ بالكميات للمطاعم
exports.forecastQuantities = async (req, res) => {
  try {
    const { restaurantId, date } = req.query;

    const forecast = await predictiveService.forecastQuantities(restaurantId, date);

    res.json({
      success: true,
      data: forecast,
      message: 'تم التنبؤ بالكميات المطلوبة بنجاح'
    });
  } catch (error) {
    logger.error('خطأ في التنبؤ بالكميات:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FORECAST_FAILED',
        message: 'فشل التنبؤ بالكميات'
      }
    });
  }
};

// اقتراحات الطلب التلقائي
exports.getAutoOrderSuggestions = async (req, res) => {
  try {
    const userId = req.user.id;

    const suggestions = await predictiveService.generateAutoOrderSuggestions(userId);

    res.json({
      success: true,
      data: suggestions,
      message: 'لدينا اقتراحات طلب تلقائي بناءً على عاداتك'
    });
  } catch (error) {
    logger.error('خطأ في اقتراحات الطلب التلقائي:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'AUTO_SUGGESTIONS_FAILED',
        message: 'فشل إنشاء اقتراحات الطلب التلقائي'
      }
    });
  }
};

// تحليل سلوك المستخدم
exports.analyzeBehavior = async (req, res) => {
  try {
    const userId = req.user.id;

    const analysis = await predictiveService.analyzeUserBehavior(userId);

    res.json({
      success: true,
      data: analysis,
      message: 'تم تحليل سلوكك وعاداتك في الطلب'
    });
  } catch (error) {
    logger.error('خطأ في تحليل السلوك:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'BEHAVIOR_ANALYSIS_FAILED',
        message: 'فشل تحليل السلوك'
      }
    });
  }
};

// جدولة التوصيل الذكية
exports.optimizeDeliverySchedule = async (req, res) => {
  try {
    const { projectId, date } = req.query;

    const schedule = await predictiveService.optimizeDeliverySchedule(projectId, date);

    res.json({
      success: true,
      data: schedule,
      message: 'تم تحسين جدول التوصيل بناءً على التنبؤات'
    });
  } catch (error) {
    logger.error('خطأ في تحسين جدول التوصيل:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SCHEDULE_OPTIMIZATION_FAILED',
        message: 'فشل تحسين جدول التوصيل'
      }
    });
  }
};

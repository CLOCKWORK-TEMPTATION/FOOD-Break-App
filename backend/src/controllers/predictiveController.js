/**
 * متحكم التنبؤ بالطلبات العربي
 * Predictive Ordering Controller with Arabic localization
 */

const {
  behaviorAnalysisService,
  patternRecognitionService,
  quantityForecastService,
  autoOrderSuggestionService,
  deliverySchedulingService,
  demandForecastReportService
} = require('../services/predictive');

// ==========================================
// تحليل سلوك المستخدم
// ==========================================

/**
 * تحليل سلوك المستخدم الحالي
 */
const analyzeMyBehavior = async (req, res) => {
  try {
    const userId = req.user.id;
    const analysis = await behaviorAnalysisService.analyzeUserBehavior(userId);

    if (!analysis) {
      return res.status(200).json({
        success: true,
        data: null,
        message: req.t('predictive.noDataForAnalysis')
      });
    }

    res.json({
      success: true,
      data: analysis,
      message: req.t('predictive.analysisSuccess')
    });
  } catch (error) {
    console.error('Error analyzing behavior:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ANALYSIS_ERROR', message: req.t('predictive.analysisFailed') }
    });
  }
};

/**
 * الحصول على سلوك المستخدم المحفوظ
 */
const getMyBehavior = async (req, res) => {
  try {
    const userId = req.user.id;
    const behavior = await behaviorAnalysisService.getUserBehavior(userId);

    res.json({
      success: true,
      data: behavior
    });
  } catch (error) {
    console.error('Error getting behavior:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: 'فشل في جلب السلوك' }
    });
  }
};

// ==========================================
// التعرف على الأنماط
// ==========================================

/**
 * اكتشاف أنماط الطلب للمستخدم
 */
const discoverPatterns = async (req, res) => {
  try {
    const userId = req.user.id;
    const patterns = await patternRecognitionService.discoverPatterns(userId);

    res.json({
      success: true,
      data: {
        patterns,
        count: patterns.length
      }
    });
  } catch (error) {
    console.error('Error discovering patterns:', error);
    res.status(500).json({
      success: false,
      error: { code: 'PATTERN_ERROR', message: 'فشل في اكتشاف الأنماط' }
    });
  }
};

/**
 * الحصول على أنماط المستخدم
 */
const getMyPatterns = async (req, res) => {
  try {
    const userId = req.user.id;
    const patterns = await patternRecognitionService.getUserPatterns(userId);

    res.json({
      success: true,
      data: patterns
    });
  } catch (error) {
    console.error('Error getting patterns:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: 'فشل في جلب الأنماط' }
    });
  }
};

/**
 * التحقق من تطابق النمط مع الوقت الحالي
 */
const checkPatternMatch = async (req, res) => {
  try {
    const userId = req.user.id;
    const matches = await patternRecognitionService.checkPatternMatch(userId);

    res.json({
      success: true,
      data: {
        hasMatch: matches.length > 0,
        matches
      }
    });
  } catch (error) {
    console.error('Error checking pattern match:', error);
    res.status(500).json({
      success: false,
      error: { code: 'MATCH_ERROR', message: 'فشل في التحقق من النمط' }
    });
  }
};

// ==========================================
// اقتراحات الطلب التلقائي
// ==========================================

/**
 * إنشاء اقتراح طلب تلقائي
 */
const generateSuggestion = async (req, res) => {
  try {
    const userId = req.user.id;
    const suggestion = await autoOrderSuggestionService.generateSuggestion(userId);

    if (!suggestion) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'لا توجد اقتراحات متاحة حالياً'
      });
    }

    res.json({
      success: true,
      data: suggestion
    });
  } catch (error) {
    console.error('Error generating suggestion:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SUGGESTION_ERROR', message: 'فشل في إنشاء الاقتراح' }
    });
  }
};

/**
 * قبول اقتراح الطلب
 */
const acceptSuggestion = async (req, res) => {
  try {
    const { suggestionId } = req.params;
    const { modifications } = req.body;

    const order = await autoOrderSuggestionService.acceptSuggestion(
      suggestionId,
      modifications
    );

    res.json({
      success: true,
      data: order,
      message: 'تم إنشاء الطلب بنجاح'
    });
  } catch (error) {
    console.error('Error accepting suggestion:', error);
    res.status(400).json({
      success: false,
      error: { code: 'ACCEPT_ERROR', message: error.message }
    });
  }
};

/**
 * رفض اقتراح الطلب
 */
const rejectSuggestion = async (req, res) => {
  try {
    const { suggestionId } = req.params;
    const { reason } = req.body;

    await autoOrderSuggestionService.rejectSuggestion(suggestionId, reason);

    res.json({
      success: true,
      message: 'تم رفض الاقتراح'
    });
  } catch (error) {
    console.error('Error rejecting suggestion:', error);
    res.status(400).json({
      success: false,
      error: { code: 'REJECT_ERROR', message: error.message }
    });
  }
};

/**
 * تعديل اقتراح الطلب
 */
const modifySuggestion = async (req, res) => {
  try {
    const { suggestionId } = req.params;
    const modifications = req.body;

    const updated = await autoOrderSuggestionService.modifySuggestion(
      suggestionId,
      modifications
    );

    res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    console.error('Error modifying suggestion:', error);
    res.status(400).json({
      success: false,
      error: { code: 'MODIFY_ERROR', message: error.message }
    });
  }
};

/**
 * الحصول على اقتراحاتي
 */
const getMySuggestions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const suggestions = await autoOrderSuggestionService.getUserSuggestions(
      userId,
      status
    );

    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    console.error('Error getting suggestions:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: 'فشل في جلب الاقتراحات' }
    });
  }
};

// ==========================================
// جدولة التوصيل (للمشرفين)
// ==========================================

/**
 * الحصول على جدول التوصيل ليوم معين
 */
const getDeliverySchedule = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();

    const schedule = await deliverySchedulingService.getDaySchedule(targetDate);

    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    console.error('Error getting schedule:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SCHEDULE_ERROR', message: 'فشل في جلب الجدول' }
    });
  }
};

/**
 * التنبؤ بجدول التوصيل
 */
const predictDeliverySchedule = async (req, res) => {
  try {
    const { date } = req.body;
    const targetDate = date ? new Date(date) : new Date();

    const schedule = await deliverySchedulingService.predictDeliverySchedule(targetDate);

    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    console.error('Error predicting schedule:', error);
    res.status(500).json({
      success: false,
      error: { code: 'PREDICT_ERROR', message: 'فشل في التنبؤ بالجدول' }
    });
  }
};

/**
 * الحصول على أوقات الذروة
 */
const getPeakTimes = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();

    const peakTimes = await deliverySchedulingService.getPeakTimes(targetDate);

    res.json({
      success: true,
      data: peakTimes
    });
  } catch (error) {
    console.error('Error getting peak times:', error);
    res.status(500).json({
      success: false,
      error: { code: 'PEAK_ERROR', message: 'فشل في جلب أوقات الذروة' }
    });
  }
};

/**
 * الحصول على توصيات السعة
 */
const getCapacityRecommendations = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();

    const recommendations = await deliverySchedulingService.getCapacityRecommendations(
      targetDate
    );

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({
      success: false,
      error: { code: 'CAPACITY_ERROR', message: 'فشل في جلب التوصيات' }
    });
  }
};

/**
 * تحسين المسارات
 */
const optimizeRoutes = async (req, res) => {
  try {
    const { orders } = req.body;

    const routes = await deliverySchedulingService.optimizeRoutes(orders);

    res.json({
      success: true,
      data: routes
    });
  } catch (error) {
    console.error('Error optimizing routes:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ROUTE_ERROR', message: 'فشل في تحسين المسارات' }
    });
  }
};

// ==========================================
// توقعات الكمية (للمطاعم)
// ==========================================

/**
 * الحصول على توقعات الكمية لمطعم
 */
const getQuantityForecasts = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(start);
    end.setDate(end.getDate() + 7);

    const forecasts = await quantityForecastService.getRestaurantForecasts(
      restaurantId,
      start,
      end
    );

    res.json({
      success: true,
      data: forecasts
    });
  } catch (error) {
    console.error('Error getting forecasts:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FORECAST_ERROR', message: 'فشل في جلب التوقعات' }
    });
  }
};

/**
 * إنشاء توقعات جديدة
 */
const generateForecasts = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { date } = req.body;
    const targetDate = date ? new Date(date) : new Date();

    const forecasts = await quantityForecastService.forecastForRestaurant(
      restaurantId,
      targetDate
    );

    res.json({
      success: true,
      data: forecasts
    });
  } catch (error) {
    console.error('Error generating forecasts:', error);
    res.status(500).json({
      success: false,
      error: { code: 'GENERATE_ERROR', message: 'فشل في إنشاء التوقعات' }
    });
  }
};

// ==========================================
// تقارير التنبؤ بالطلب (للتفاوض)
// ==========================================

/**
 * إنشاء تقرير التنبؤ
 */
const generateDemandReport = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { period } = req.body;

    const report = await demandForecastReportService.generateReport(
      restaurantId,
      period || 'weekly'
    );

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({
      success: false,
      error: { code: 'REPORT_ERROR', message: 'فشل في إنشاء التقرير' }
    });
  }
};

/**
 * إرسال التقرير للمطعم
 */
const sendReportToRestaurant = async (req, res) => {
  try {
    const { reportId } = req.params;

    const result = await demandForecastReportService.sendReportToRestaurant(reportId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error sending report:', error);
    res.status(400).json({
      success: false,
      error: { code: 'SEND_ERROR', message: error.message }
    });
  }
};

/**
 * تسجيل رد المطعم
 */
const recordRestaurantResponse = async (req, res) => {
  try {
    const { reportId } = req.params;
    const response = req.body;

    const updated = await demandForecastReportService.recordRestaurantResponse(
      reportId,
      response
    );

    res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    console.error('Error recording response:', error);
    res.status(400).json({
      success: false,
      error: { code: 'RESPONSE_ERROR', message: error.message }
    });
  }
};

/**
 * الحصول على تقارير مطعم
 */
const getRestaurantReports = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { status } = req.query;

    const reports = await demandForecastReportService.getRestaurantReports(
      restaurantId,
      status
    );

    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    console.error('Error getting reports:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: 'فشل في جلب التقارير' }
    });
  }
};

/**
 * ملخص المفاوضات
 */
const getNegotiationsSummary = async (req, res) => {
  try {
    const summary = await demandForecastReportService.getNegotiationsSummary();

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error getting summary:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SUMMARY_ERROR', message: 'فشل في جلب الملخص' }
    });
  }
};

/**
 * مقارنة التوقعات بالفعليات
 */
const compareActualVsPredicted = async (req, res) => {
  try {
    const { reportId } = req.params;

    const comparison = await demandForecastReportService.compareActualVsPredicted(
      reportId
    );

    res.json({
      success: true,
      data: comparison
    });
  } catch (error) {
    console.error('Error comparing:', error);
    res.status(500).json({
      success: false,
      error: { code: 'COMPARE_ERROR', message: 'فشل في المقارنة' }
    });
  }
};

module.exports = {
  // تحليل السلوك
  analyzeMyBehavior,
  getMyBehavior,

  // الأنماط
  discoverPatterns,
  getMyPatterns,
  checkPatternMatch,

  // الاقتراحات
  generateSuggestion,
  acceptSuggestion,
  rejectSuggestion,
  modifySuggestion,
  getMySuggestions,

  // جدولة التوصيل
  getDeliverySchedule,
  predictDeliverySchedule,
  getPeakTimes,
  getCapacityRecommendations,
  optimizeRoutes,

  // توقعات الكمية
  getQuantityForecasts,
  generateForecasts,

  // تقارير التنبؤ
  generateDemandReport,
  sendReportToRestaurant,
  recordRestaurantResponse,
  getRestaurantReports,
  getNegotiationsSummary,
  compareActualVsPredicted
};

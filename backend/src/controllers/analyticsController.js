const analyticsService = require('../services/analyticsService');
const logger = require('../utils/logger');

// الحصول على إحصائيات Dashboard
exports.getDashboardStats = async (req, res) => {
  try {
    const { projectId, startDate, endDate } = req.query;
    
    const dateRange = startDate && endDate ? { start: startDate, end: endDate } : null;
    const stats = await analyticsService.getDashboardStats(projectId, dateRange);

    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Error getting dashboard stats:', error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

// تقرير الإنفاق
exports.getSpendingReport = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { period = 'daily', limit = 30 } = req.query;

    const report = await analyticsService.getSpendingReport(projectId, period, parseInt(limit));

    res.json({ success: true, data: report });
  } catch (error) {
    logger.error('Error getting spending report:', error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

// التنبؤ بالميزانية
exports.forecastBudget = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { daysAhead = 30 } = req.query;

    const forecast = await analyticsService.forecastBudget(projectId, parseInt(daysAhead));

    res.json({ success: true, data: forecast });
  } catch (error) {
    logger.error('Error forecasting budget:', error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

// مقارنة المشاريع
exports.compareProjects = async (req, res) => {
  try {
    const { projectIds, startDate, endDate } = req.body;

    if (!projectIds || !Array.isArray(projectIds)) {
      return res.status(400).json({
        success: false,
        error: { message: 'projectIds array is required' }
      });
    }

    const dateRange = startDate && endDate ? { start: startDate, end: endDate } : null;
    const comparison = await analyticsService.compareProjects(projectIds, dateRange);

    res.json({ success: true, data: comparison });
  } catch (error) {
    logger.error('Error comparing projects:', error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

// تحليل الاستثناءات
exports.analyzeExceptions = async (req, res) => {
  try {
    const { projectId, startDate, endDate } = req.query;
    
    const dateRange = startDate && endDate ? { start: startDate, end: endDate } : null;
    const analysis = await analyticsService.analyzeExceptions(projectId, dateRange);

    res.json({ success: true, data: analysis });
  } catch (error) {
    logger.error('Error analyzing exceptions:', error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

// المطاعم الأكثر طلباً
exports.getTopRestaurants = async (req, res) => {
  try {
    const { projectId, limit = 10 } = req.query;

    const topRestaurants = await analyticsService.getTopRestaurants(projectId, parseInt(limit));

    res.json({ success: true, data: topRestaurants });
  } catch (error) {
    logger.error('Error getting top restaurants:', error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

// الأطباق الأكثر طلباً
exports.getTopMenuItems = async (req, res) => {
  try {
    const { projectId, limit = 10 } = req.query;

    const topItems = await analyticsService.getTopMenuItems(projectId, parseInt(limit));

    res.json({ success: true, data: topItems });
  } catch (error) {
    logger.error('Error getting top menu items:', error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

// تصدير التقرير
exports.exportReport = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { format = 'json', startDate, endDate } = req.query;

    const dateRange = startDate && endDate ? { start: startDate, end: endDate } : null;
    const report = await analyticsService.exportReport(projectId, format, dateRange);

    res.json({ success: true, data: report });
  } catch (error) {
    logger.error('Error exporting report:', error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

const analyticsService = require('../services/analyticsService');
const { validationResult } = require('express-validator');

/**
 * تحكم في التحليلات العربية
 * يوفر إحصائيات شاملة للتطبيق
 */
class AnalyticsController {
  /**
   * جلب التحليلات العامة
   */
  async getAnalytics(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'بيانات غير صحيحة',
          errors: errors.array()
        });
      }

      const { period = 'daily', startDate, endDate } = req.query;
      
      const analytics = await analyticsService.getComprehensiveAnalytics({
        period,
        startDate,
        endDate,
        userId: req.user?.id
      });

      res.json({
        success: true,
        message: 'تم جلب التحليلات بنجاح',
        data: analytics
      });
    } catch (error) {
      console.error('خطأ في جلب التحليلات:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم أثناء جلب التحليلات',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * تحليلات الطلبات
   */
  async getOrderAnalytics(req, res) {
    try {
      const { period = 'daily', restaurantId } = req.query;
      
      const orderAnalytics = await analyticsService.getOrderAnalytics({
        period,
        restaurantId,
        userId: req.user?.id
      });

      res.json({
        success: true,
        message: 'تم جلب تحليلات الطلبات بنجاح',
        data: orderAnalytics
      });
    } catch (error) {
      console.error('خطأ في تحليلات الطلبات:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب تحليلات الطلبات'
      });
    }
  }

  /**
   * تحليلات الإيرادات
   */
  async getRevenueAnalytics(req, res) {
    try {
      const { period = 'monthly', restaurantId } = req.query;
      
      const revenueAnalytics = await analyticsService.getRevenueAnalytics({
        period,
        restaurantId,
        userId: req.user?.id
      });

      res.json({
        success: true,
        message: 'تم جلب تحليلات الإيرادات بنجاح',
        data: revenueAnalytics
      });
    } catch (error) {
      console.error('خطأ في تحليلات الإيرادات:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب تحليلات الإيرادات'
      });
    }
  }

  /**
   * تحليلات المستخدمين
   */
  async getUserAnalytics(req, res) {
    try {
      const { period = 'monthly' } = req.query;
      
      const userAnalytics = await analyticsService.getUserAnalytics({
        period,
        adminId: req.user?.id
      });

      res.json({
        success: true,
        message: 'تم جلب تحليلات المستخدمين بنجاح',
        data: userAnalytics
      });
    } catch (error) {
      console.error('خطأ في تحليلات المستخدمين:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب تحليلات المستخدمين'
      });
    }
  }

  /**
   * تحليلات المطاعم
   */
  async getRestaurantAnalytics(req, res) {
    try {
      const { period = 'monthly', category } = req.query;
      
      const restaurantAnalytics = await analyticsService.getRestaurantAnalytics({
        period,
        category,
        adminId: req.user?.id
      });

      res.json({
        success: true,
        message: 'تم جلب تحليلات المطاعم بنجاح',
        data: restaurantAnalytics
      });
    } catch (error) {
      console.error('خطأ في تحليلات المطاعم:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب تحليلات المطاعم'
      });
    }
  }

  /**
   * تصدير التحليلات كـ PDF
   */
  async exportAnalyticsPDF(req, res) {
    try {
      const { period = 'monthly', type = 'comprehensive' } = req.query;
      
      const pdfBuffer = await analyticsService.exportAnalyticsToPDF({
        period,
        type,
        userId: req.user?.id
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=analytics-${period}-${Date.now()}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error('خطأ في تصدير PDF:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في تصدير التحليلات كـ PDF'
      });
    }
  }

  /**
   * تصدير التحليلات كـ Excel
   */
  async exportAnalyticsExcel(req, res) {
    try {
      const { period = 'monthly', type = 'comprehensive' } = req.query;
      
      const excelBuffer = await analyticsService.exportAnalyticsToExcel({
        period,
        type,
        userId: req.user?.id
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=analytics-${period}-${Date.now()}.xlsx`);
      res.send(excelBuffer);
    } catch (error) {
      console.error('خطأ في تصدير Excel:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في تصدير التحليلات كـ Excel'
      });
    }
  }

  /**
   * تصدير التحليلات كـ CSV
   */
  async exportAnalyticsCSV(req, res) {
    try {
      const { period = 'monthly', type = 'comprehensive' } = req.query;
      
      const csvData = await analyticsService.exportAnalyticsToCSV({
        period,
        type,
        userId: req.user?.id
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=analytics-${period}-${Date.now()}.csv`);
      res.send('\uFEFF' + csvData); // إضافة BOM للدعم العربي
    } catch (error) {
      console.error('خطأ في تصدير CSV:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في تصدير التحليلات كـ CSV'
      });
    }
  }

  /**
   * تحليلات الأداء في الوقت الفعلي
   */
  async getRealTimeAnalytics(req, res) {
    try {
      const realTimeData = await analyticsService.getRealTimeAnalytics({
        userId: req.user?.id
      });

      res.json({
        success: true,
        message: 'تم جلب التحليلات الفورية بنجاح',
        data: realTimeData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('خطأ في التحليلات الفورية:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب التحليلات الفورية'
      });
    }
  }

  /**
   * تحليلات مخصصة
   */
  async getCustomAnalytics(req, res) {
    try {
      const { metrics, filters, groupBy } = req.body;
      
      const customAnalytics = await analyticsService.getCustomAnalytics({
        metrics,
        filters,
        groupBy,
        userId: req.user?.id
      });

      res.json({
        success: true,
        message: 'تم جلب التحليلات المخصصة بنجاح',
        data: customAnalytics
      });
    } catch (error) {
      console.error('خطأ في التحليلات المخصصة:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب التحليلات المخصصة'
      });
    }
  }

  /**
   * مقارنة الفترات
   */
  async comparePerformance(req, res) {
    try {
      const { currentPeriod, previousPeriod, metrics } = req.body;
      
      const comparison = await analyticsService.comparePerformance({
        currentPeriod,
        previousPeriod,
        metrics,
        userId: req.user?.id
      });

      res.json({
        success: true,
        message: 'تم إجراء المقارنة بنجاح',
        data: comparison
      });
    } catch (error) {
      console.error('خطأ في مقارنة الأداء:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في مقارنة الأداء'
      });
    }
  }

  /**
   * توقعات الأداء
   */
  async getPerformancePredictions(req, res) {
    try {
      const { period = 'monthly', metric = 'revenue' } = req.query;
      
      const predictions = await analyticsService.getPerformancePredictions({
        period,
        metric,
        userId: req.user?.id
      });

      res.json({
        success: true,
        message: 'تم جلب التوقعات بنجاح',
        data: predictions
      });
    } catch (error) {
      console.error('خطأ في التوقعات:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب توقعات الأداء'
      });
    }
  }
}

module.exports = new AnalyticsController();
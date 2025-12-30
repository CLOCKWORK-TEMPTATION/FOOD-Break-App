/**
 * متحكم تقارير جاهزية الإنتاج
 * Production Readiness Report Controller
 * 
 * معالجات API لإدارة تقارير جاهزية الإنتاج
 */

const productionReadinessService = require('../services/productionReadinessService');
const logger = require('../utils/logger');

/**
 * إنشاء تقرير جاهزية إنتاج جديد
 * POST /api/production-readiness/reports
 */
exports.createReport = async (req, res) => {
  try {
    const { productionData, reportDate } = req.body;

    // التحقق من المدخلات
    if (!productionData) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PRODUCTION_DATA',
          message: 'بيانات الإنتاج مطلوبة'
        }
      });
    }

    // استخدام تاريخ اليوم إذا لم يتم تحديد تاريخ
    const reportDateToUse = reportDate || new Date().toISOString();

    // إنشاء التقرير
    const result = await productionReadinessService.createReport(
      productionData,
      reportDateToUse,
      req.user?.id || null
    );

    res.status(201).json({
      success: true,
      data: result.report,
      analysis: result.analysis,
      message: 'تم إنشاء تقرير جاهزية الإنتاج بنجاح'
    });

  } catch (error) {
    logger.error('خطأ في إنشاء تقرير جاهزية الإنتاج:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'REPORT_CREATION_FAILED',
        message: 'فشل إنشاء تقرير جاهزية الإنتاج',
        details: error.message
      }
    });
  }
};

/**
 * الحصول على تقرير محدد
 * GET /api/production-readiness/reports/:reportId
 */
exports.getReport = async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await productionReadinessService.getReport(reportId);

    res.json({
      success: true,
      data: report,
      message: 'تم جلب التقرير بنجاح'
    });

  } catch (error) {
    logger.error('خطأ في جلب التقرير:', error);
    
    if (error.message === 'التقرير غير موجود') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'REPORT_NOT_FOUND',
          message: 'التقرير غير موجود'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'REPORT_FETCH_FAILED',
        message: 'فشل جلب التقرير',
        details: error.message
      }
    });
  }
};

/**
 * الحصول على نص التقرير فقط
 * GET /api/production-readiness/reports/:reportId/text
 */
exports.getReportText = async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await productionReadinessService.getReport(reportId);

    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.send(report.generatedReport);

  } catch (error) {
    logger.error('خطأ في جلب نص التقرير:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'REPORT_TEXT_FETCH_FAILED',
        message: 'فشل جلب نص التقرير'
      }
    });
  }
};

/**
 * الحصول على قائمة التقارير
 * GET /api/production-readiness/reports
 */
exports.listReports = async (req, res) => {
  try {
    const filters = {
      facilityName: req.query.facilityName,
      projectName: req.query.projectName,
      overallRating: req.query.overallRating,
      approvalStatus: req.query.approvalStatus,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0
    };

    const result = await productionReadinessService.listReports(filters);

    res.json({
      success: true,
      data: result.reports,
      pagination: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        limit: filters.limit
      },
      message: `تم جلب ${result.reports.length} تقرير بنجاح`
    });

  } catch (error) {
    logger.error('خطأ في جلب قائمة التقارير:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'REPORTS_LIST_FAILED',
        message: 'فشل جلب قائمة التقارير',
        details: error.message
      }
    });
  }
};

/**
 * تحديث حالة الموافقة على التقرير
 * PATCH /api/production-readiness/reports/:reportId/approval
 */
exports.updateApprovalStatus = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status } = req.body;

    // التحقق من الحالة المسموح بها
    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'UNDER_REVIEW'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: 'حالة غير صالحة. الحالات المسموح بها: PENDING, APPROVED, REJECTED, UNDER_REVIEW'
        }
      });
    }

    const report = await productionReadinessService.updateApprovalStatus(
      reportId,
      status,
      req.user?.id || null
    );

    res.json({
      success: true,
      data: report,
      message: `تم تحديث حالة الموافقة إلى ${status}`
    });

  } catch (error) {
    logger.error('خطأ في تحديث حالة الموافقة:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'APPROVAL_UPDATE_FAILED',
        message: 'فشل تحديث حالة الموافقة',
        details: error.message
      }
    });
  }
};

/**
 * حذف تقرير
 * DELETE /api/production-readiness/reports/:reportId
 */
exports.deleteReport = async (req, res) => {
  try {
    const { reportId } = req.params;

    await productionReadinessService.deleteReport(reportId);

    res.json({
      success: true,
      message: 'تم حذف التقرير بنجاح'
    });

  } catch (error) {
    logger.error('خطأ في حذف التقرير:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'REPORT_DELETE_FAILED',
        message: 'فشل حذف التقرير',
        details: error.message
      }
    });
  }
};

/**
 * معاينة تقرير بدون حفظ
 * POST /api/production-readiness/reports/preview
 */
exports.previewReport = async (req, res) => {
  try {
    const { productionData, reportDate } = req.body;

    if (!productionData) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PRODUCTION_DATA',
          message: 'بيانات الإنتاج مطلوبة'
        }
      });
    }

    const reportDateToUse = reportDate || new Date().toISOString();

    // تحليل البيانات فقط دون حفظ
    const analysis = productionReadinessService.analyzeProductionData(productionData);
    const reportText = productionReadinessService.generateReportText(
      productionData,
      reportDateToUse,
      analysis
    );

    res.json({
      success: true,
      data: {
        reportText,
        analysis,
        ratings: {
          equipment: analysis.equipment.rating,
          humanResources: analysis.humanResources.rating,
          materials: analysis.materials.rating,
          qualitySafety: analysis.qualitySafety.rating,
          infrastructure: analysis.infrastructure.rating,
          overall: analysis.overallRating
        }
      },
      message: 'تم إنشاء معاينة التقرير'
    });

  } catch (error) {
    logger.error('خطأ في معاينة التقرير:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'PREVIEW_FAILED',
        message: 'فشل إنشاء معاينة التقرير',
        details: error.message
      }
    });
  }
};

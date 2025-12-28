const productionService = require('../services/productionService');
const logger = require('../utils/logger');

/**
 * متحكم الإنتاج - Production Controller
 * معالجات إدارة الإنتاج والتصوير بالعربية
 */

// الحصول على جدول التصوير
exports.getShootingSchedule = async (req, res) => {
  try {
    const { projectId } = req.params;

    const schedule = await productionService.getSchedule(projectId);

    res.json({
      success: true,
      data: schedule,
      message: 'تم جلب جدول التصوير بنجاح'
    });
  } catch (error) {
    logger.error('خطأ في جلب جدول التصوير:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SCHEDULE_FETCH_FAILED',
        message: 'فشل جلب جدول التصوير'
      }
    });
  }
};

// الحصول على طاقم العمل
exports.getCrew = async (req, res) => {
  try {
    const { projectId } = req.params;

    const crew = await productionService.getCrew(projectId);

    res.json({
      success: true,
      data: crew,
      message: `تم جلب بيانات ${crew.length} عضو من طاقم العمل`
    });
  } catch (error) {
    logger.error('خطأ في جلب طاقم العمل:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CREW_FETCH_FAILED',
        message: 'فشل جلب بيانات طاقم العمل'
      }
    });
  }
};

// تحديث حالة الحضور
exports.updateAttendance = async (req, res) => {
  try {
    const { userId, status, checkInTime } = req.body;

    const attendance = await productionService.updateAttendance(userId, status, checkInTime);

    res.json({
      success: true,
      data: attendance,
      message: 'تم تحديث حالة الحضور بنجاح'
    });
  } catch (error) {
    logger.error('خطأ في تحديث الحضور:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ATTENDANCE_UPDATE_FAILED',
        message: 'فشل تحديث حالة الحضور'
      }
    });
  }
};

// الحصول على ميزانية الإنتاج
exports.getProductionBudget = async (req, res) => {
  try {
    const { projectId } = req.params;

    const budget = await productionService.getBudget(projectId);

    res.json({
      success: true,
      data: budget,
      message: 'تم جلب ميزانية الإنتاج بنجاح'
    });
  } catch (error) {
    logger.error('خطأ في جلب الميزانية:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'BUDGET_FETCH_FAILED',
        message: 'فشل جلب ميزانية الإنتاج'
      }
    });
  }
};

// تحديث جدول التصوير
exports.updateSchedule = async (req, res) => {
  try {
    const { projectId } = req.params;
    const scheduleData = req.body;

    const updated = await productionService.updateSchedule(projectId, scheduleData);

    res.json({
      success: true,
      data: updated,
      message: 'تم تحديث جدول التصوير وإرسال إشعارات للطاقم'
    });
  } catch (error) {
    logger.error('خطأ في تحديث الجدول:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SCHEDULE_UPDATE_FAILED',
        message: 'فشل تحديث جدول التصوير'
      }
    });
  }
};

// تقرير الإنتاج اليومي
exports.getDailyReport = async (req, res) => {
  try {
    const { projectId, date } = req.query;

    const report = await productionService.generateDailyReport(projectId, date);

    res.json({
      success: true,
      data: report,
      message: 'تم إنشاء تقرير الإنتاج اليومي'
    });
  } catch (error) {
    logger.error('خطأ في إنشاء التقرير:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'REPORT_GENERATION_FAILED',
        message: 'فشل إنشاء تقرير الإنتاج'
      }
    });
  }
};

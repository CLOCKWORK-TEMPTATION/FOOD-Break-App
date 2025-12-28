const projectService = require('../services/projectService');
const qrCodeService = require('../services/qrCodeService');
const logger = require('../utils/logger');

/**
 * متحكم المشاريع - Project Controller
 * معالجات إدارة المشاريع وأكواد QR بالعربية
 */

// إنشاء مشروع جديد
exports.createProject = async (req, res) => {
  try {
    const { name, location, startDate, endDate, orderWindow } = req.body;

    const project = await projectService.createProject({
      name,
      location,
      startDate,
      endDate,
      orderWindow: orderWindow || 60,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      data: project,
      message: `تم إنشاء مشروع "${name}" بنجاح`
    });
  } catch (error) {
    logger.error('خطأ في إنشاء المشروع:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'PROJECT_CREATION_FAILED',
        message: 'فشل إنشاء المشروع'
      }
    });
  }
};

// توليد QR Code للمشروع
exports.generateQRCode = async (req, res) => {
  try {
    const { projectId } = req.params;

    const qrData = await qrCodeService.generateProjectQR(projectId);

    res.json({
      success: true,
      data: qrData,
      message: 'تم توليد رمز QR للمشروع بنجاح'
    });
  } catch (error) {
    logger.error('خطأ في توليد QR:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'QR_GENERATION_FAILED',
        message: 'فشل توليد رمز QR'
      }
    });
  }
};

// التحقق من QR Code
exports.verifyQRCode = async (req, res) => {
  try {
    const { qrCode } = req.body;
    const userId = req.user.id;

    const project = await qrCodeService.verifyAndJoinProject(qrCode, userId);

    res.json({
      success: true,
      data: project,
      message: `مرحباً بك في مشروع "${project.name}"`
    });
  } catch (error) {
    logger.error('خطأ في التحقق من QR:', error);
    res.status(400).json({
      success: false,
      error: {
        code: 'QR_VERIFICATION_FAILED',
        message: 'رمز QR غير صالح أو منتهي الصلاحية'
      }
    });
  }
};

// الحصول على تفاصيل المشروع
exports.getProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await projectService.getProjectById(projectId);

    res.json({
      success: true,
      data: project,
      message: 'تم جلب تفاصيل المشروع بنجاح'
    });
  } catch (error) {
    logger.error('خطأ في جلب المشروع:', error);
    res.status(404).json({
      success: false,
      error: {
        code: 'PROJECT_NOT_FOUND',
        message: 'المشروع غير موجود'
      }
    });
  }
};

// الحصول على أعضاء المشروع
exports.getProjectMembers = async (req, res) => {
  try {
    const { projectId } = req.params;

    const members = await projectService.getProjectMembers(projectId);

    res.json({
      success: true,
      data: members,
      message: `المشروع يضم ${members.length} عضو`
    });
  } catch (error) {
    logger.error('خطأ في جلب الأعضاء:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'MEMBERS_FETCH_FAILED',
        message: 'فشل جلب أعضاء المشروع'
      }
    });
  }
};

// تحديث نافذة الطلب
exports.updateOrderWindow = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { orderWindow } = req.body;

    const project = await projectService.updateOrderWindow(projectId, orderWindow);

    res.json({
      success: true,
      data: project,
      message: `تم تحديث نافذة الطلب إلى ${orderWindow} دقيقة`
    });
  } catch (error) {
    logger.error('خطأ في تحديث نافذة الطلب:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ORDER_WINDOW_UPDATE_FAILED',
        message: 'فشل تحديث نافذة الطلب'
      }
    });
  }
};

// إغلاق المشروع
exports.closeProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await projectService.closeProject(projectId);

    res.json({
      success: true,
      data: project,
      message: 'تم إغلاق المشروع بنجاح'
    });
  } catch (error) {
    logger.error('خطأ في إغلاق المشروع:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'PROJECT_CLOSE_FAILED',
        message: 'فشل إغلاق المشروع'
      }
    });
  }
};

// تقرير المشروع
exports.getProjectReport = async (req, res) => {
  try {
    const { projectId } = req.params;

    const report = await projectService.generateProjectReport(projectId);

    res.json({
      success: true,
      data: report,
      message: 'تم إنشاء تقرير المشروع بنجاح'
    });
  } catch (error) {
    logger.error('خطأ في إنشاء التقرير:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'REPORT_GENERATION_FAILED',
        message: 'فشل إنشاء تقرير المشروع'
      }
    });
  }
};

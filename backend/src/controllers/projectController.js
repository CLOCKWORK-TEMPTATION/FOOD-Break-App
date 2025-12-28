/**
 * Project Controller
 * إدارة المشاريع وإنشاء/التحقق من QR Codes
 */

const { PrismaClient } = require('@prisma/client');
const qrCodeService = require('../services/qrCodeService');
const { validationResult } = require('express-validator');

const prisma = new PrismaClient();

/**
 * 1. إنشاء مشروع جديد مع QR Code
 * POST /api/v1/projects
 */
const createProject = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, location, latitude, longitude, startDate, endDate, orderWindow } = req.body;

    // إنشاء المشروع
    const project = await prisma.project.create({
      data: {
        name,
        location,
        latitude,
        longitude,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        orderWindow: orderWindow || 60, // افتراضي ساعة واحدة
        createdBy: req.user.id,
        projectManager: req.user.id,
        qrCode: '', // سيتم تحديثه
        qrToken: '' // سيتم تحديثه
      }
    });

    // توليد QR Code للمشروع
    const qrData = await qrCodeService.generateProjectQR({
      id: project.id,
      name: project.name
    });

    // تحديث المشروع بـ QR Code و Token
    const updatedProject = await prisma.project.update({
      where: { id: project.id },
      data: {
        qrCode: qrData.qrCode,
        qrToken: qrData.token
      }
    });

    res.status(201).json({
      success: true,
      data: {
        project: {
          id: updatedProject.id,
          name: updatedProject.name,
          location: updatedProject.location,
          startDate: updatedProject.startDate,
          endDate: updatedProject.endDate,
          orderWindow: updatedProject.orderWindow,
          qrCode: updatedProject.qrCode,
          expiresAt: qrData.expiresAt
        },
        message: req.__('projects.projectCreated')
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. الحصول على جميع المشاريع
 * GET /api/v1/projects?page=1&limit=10&isActive=true
 */
const getAllProjects = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, isActive } = req.query;

    const where = {};
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const skip = (page - 1) * limit;

    const projects = await prisma.project.findMany({
      where,
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.project.count({ where });

    res.json({
      success: true,
      data: {
        projects,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. الحصول على مشروع محدد
 * GET /api/v1/projects/:projectId
 */
const getProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: 'المشروع غير موجود'
        }
      });
    }

    res.json({
      success: true,
      data: { project }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. تحديث معلومات المشروع
 * PATCH /api/v1/projects/:projectId
 */
const updateProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { name, location, latitude, longitude, endDate, orderWindow, isActive } = req.body;

    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: 'المشروع غير موجود'
        }
      });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (location) updateData.location = location;
    if (latitude) updateData.latitude = latitude;
    if (longitude) updateData.longitude = longitude;
    if (endDate) updateData.endDate = new Date(endDate);
    if (orderWindow) updateData.orderWindow = orderWindow;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: updateData
    });

    res.json({
      success: true,
      data: {
        project: updatedProject,
        message: 'تم تحديث المشروع بنجاح'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. إعادة توليد QR Code للمشروع
 * POST /api/v1/projects/:projectId/regenerate-qr
 */
const regenerateQRCode = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: 'المشروع غير موجود'
        }
      });
    }

    // توليد QR Code جديد
    const qrData = await qrCodeService.generateProjectQR({
      id: project.id,
      name: project.name
    });

    // تحديث المشروع
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        qrCode: qrData.qrCode,
        qrToken: qrData.token
      }
    });

    res.json({
      success: true,
      data: {
        qrCode: updatedProject.qrCode,
        expiresAt: qrData.expiresAt,
        message: 'تم توليد QR Code جديد بنجاح'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 6. حذف مشروع (إلغاء تفعيل)
 * DELETE /api/v1/projects/:projectId
 */
const deleteProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: 'المشروع غير موجود'
        }
      });
    }

    // إلغاء تفعيل المشروع بدلاً من حذفه
    await prisma.project.update({
      where: { id: projectId },
      data: { isActive: false }
    });

    res.json({
      success: true,
      data: {
        message: 'تم إلغاء تفعيل المشروع بنجاح'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 7. الوصول للمشروع عبر QR Code
 * POST /api/v1/projects/access-by-qr
 */
const accessProjectByQR = async (req, res, next) => {
  try {
    const { qrToken } = req.body;

    if (!qrToken) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_QR_TOKEN',
          message: 'QR Token مطلوب'
        }
      });
    }

    // التحقق من صحة QR Code
    const validation = await qrCodeService.validateQRCode(qrToken);

    if (!validation.valid) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_QR_CODE',
          message: 'QR Code غير صحيح أو منتهي الصلاحية'
        }
      });
    }

    // جلب معلومات المشروع
    const project = await prisma.project.findUnique({
      where: { id: validation.projectId }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: 'المشروع غير موجود'
        }
      });
    }

    if (!project.isActive) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PROJECT_INACTIVE',
          message: 'المشروع غير نشط'
        }
      });
    }

    // تحديث آخر وقت وصول
    await prisma.project.update({
      where: { id: project.id },
      data: { lastAccessedAt: new Date() }
    });

    // التحقق من نافذة الطلب
    const now = new Date();
    const projectStart = new Date(project.startDate);
    const orderWindowEnd = new Date(projectStart.getTime() + project.orderWindow * 60 * 1000);
    const isOrderWindowOpen = now >= projectStart && now <= orderWindowEnd;

    res.json({
      success: true,
      data: {
        project: {
          id: project.id,
          name: project.name,
          location: project.location,
          latitude: project.latitude,
          longitude: project.longitude,
          startDate: project.startDate,
          endDate: project.endDate,
          orderWindow: project.orderWindow,
          isOrderWindowOpen,
          orderWindowEnd: orderWindowEnd
        },
        accessGranted: true,
        message: 'تم الوصول للمشروع بنجاح'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 8. التحقق من حالة نافذة الطلب
 * GET /api/v1/projects/:projectId/order-window
 */
const checkOrderWindow = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: 'المشروع غير موجود'
        }
      });
    }

    const now = new Date();
    const projectStart = new Date(project.startDate);
    const orderWindowEnd = new Date(projectStart.getTime() + project.orderWindow * 60 * 1000);

    const isOrderWindowOpen = now >= projectStart && now <= orderWindowEnd;
    const timeRemaining = isOrderWindowOpen ? Math.max(0, orderWindowEnd - now) : 0;

    res.json({
      success: true,
      data: {
        projectId: project.id,
        projectName: project.name,
        isOrderWindowOpen,
        orderWindowStart: projectStart,
        orderWindowEnd: orderWindowEnd,
        timeRemainingMs: timeRemaining,
        timeRemainingMinutes: Math.ceil(timeRemaining / (60 * 1000))
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProject,
  getAllProjects,
  getProject,
  updateProject,
  regenerateQRCode,
  deleteProject,
  accessProjectByQR,
  checkOrderWindow
};

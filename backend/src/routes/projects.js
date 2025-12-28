const express = require('express');
const crypto = require('crypto');
const { body, param, query } = require('express-validator');
const { PrismaClient } = require('@prisma/client');

const { authenticateToken, requireAdminOrProducer } = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

/**
 * @route   POST /api/v1/projects
 * @desc    إنشاء مشروع جديد (يُستخدم لتوليد QR + نافذة الطلب)
 * @access  Admin/Producer
 */
router.post(
  '/',
  authenticateToken,
  requireAdminOrProducer,
  [
    body('name').trim().notEmpty().withMessage('اسم المشروع مطلوب'),
    body('startDate').isISO8601().withMessage('startDate غير صالح'),
    body('location').optional().trim(),
    body('qrCode').optional().trim()
  ],
  async (req, res, next) => {
    try {
      const qrCode = req.body.qrCode || crypto.randomBytes(16).toString('hex');
      const project = await prisma.project.create({
        data: {
          name: req.body.name,
          startDate: new Date(req.body.startDate),
          location: req.body.location || null,
          qrCode,
          isActive: true
        }
      });
      res.status(201).json({ success: true, data: project });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/v1/projects
 * @desc    قائمة المشاريع (للمنتجين/الإدارة)
 * @access  Admin/Producer
 */
router.get(
  '/',
  authenticateToken,
  requireAdminOrProducer,
  [
    query('active').optional().isBoolean().withMessage('active غير صالح'),
    query('page').optional().isInt({ min: 1 }).withMessage('page غير صالح'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit غير صالح')
  ],
  async (req, res, next) => {
    try {
      const page = Number(req.query.page || 1);
      const limit = Math.min(Number(req.query.limit || 20), 100);
      const skip = (page - 1) * limit;
      const active = req.query.active;

      const where = {};
      if (active !== undefined) where.isActive = active === 'true' || active === true;

      const [projects, total] = await Promise.all([
        prisma.project.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
        prisma.project.count({ where })
      ]);

      res.json({
        success: true,
        data: projects,
        meta: { pagination: { page, limit, total, pages: Math.ceil(total / limit) } }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/v1/projects/:id
 * @desc    تفاصيل مشروع
 * @access  Private (عضو بالمشروع أو Admin/Producer)
 */
router.get(
  '/:id',
  authenticateToken,
  [param('id').notEmpty().withMessage('معرف المشروع مفقود')],
  async (req, res, next) => {
    try {
      const project = await prisma.project.findUnique({ where: { id: req.params.id } });
      if (!project) {
        return res.status(404).json({ success: false, error: { code: 'PROJECT_NOT_FOUND', message: 'المشروع غير موجود' } });
      }

      if (req.user.role !== 'ADMIN' && req.user.role !== 'PRODUCER') {
        const member = await prisma.projectMember.findUnique({
          where: { projectId_userId: { projectId: project.id, userId: req.user.id } },
          select: { id: true }
        });
        if (!member) {
          return res.status(403).json({ success: false, error: { code: 'ACCESS_DENIED', message: 'غير مصرح' } });
        }
      }

      res.json({ success: true, data: project });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;


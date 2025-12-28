const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * Middleware للتحقق من صحة JWT Token
 * - يقرأ التوكن من Authorization: Bearer <token>
 * - يجلب المستخدم من قاعدة البيانات (مصدر الحقيقة)
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    const token = typeof authHeader === 'string' ? authHeader.split(' ')[1] : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'رجاءً قم بتسجيل الدخول أولاً'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true
      }
    });

    if (!user) {
      return res.status(401).json({ success: false, error: 'المستخدم غير موجود' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, error: 'حساب المستخدم معطل' });
    }

    req.user = user;
    return next();
  } catch (error) {
    logger.warn(`فشل التحقق من التوكن: ${error.message}`);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, error: 'التوكن غير صحيح' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'انتهت صلاحية التوكن' });
    }
    return res.status(500).json({ success: false, error: 'خطأ في المصادقة' });
  }
};

/**
 * Middleware للتحقق من الصلاحيات حسب الدور
 * Why: توحيد منطق التفويض وتقليل التكرار عبر الـ Routes
 */
const authorizeRoles = (...roles) => {
  const allowed = roles.map(String);
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'رجاءً قم بتسجيل الدخول أولاً' });
    }
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'غير مصرح لك بالوصول إلى هذا المورد' });
    }
    return next();
  };
};

const requireAdmin = authorizeRoles('ADMIN');
const requireProducer = authorizeRoles('PRODUCER', 'ADMIN');
const requireAdminOrProducer = authorizeRoles('ADMIN', 'PRODUCER');
const vipOnly = authorizeRoles('VIP', 'ADMIN');

module.exports = {
  authenticateToken,
  authorizeRoles,
  // aliases لتوافق imports الحالية
  auth: authenticateToken,
  producer: requireProducer,
  admin: requireAdmin,
  requireAdmin,
  requireProducer,
  requireAdminOrProducer,
  vipOnly
};

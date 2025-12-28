const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Middleware للتحقق من صحة JWT Token
 * @param {Object} req - طلب Express
 * @param {Object} res - استجابة Express
 * @param {Function} next - الوظيفة التالية
 */
const authenticateToken = async (req, res, next) => {
  try {
    // استخراج التوكن من الـ Header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'رجاءً قم بتسجيل الدخول أولاً'
      });
    }

    // التحقق من صحة التوكن
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // التحقق من وجود المستخدم في قاعدة البيانات
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
      return res.status(401).json({
        success: false,
        error: 'المستخدم غير موجود'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: 'حساب المستخدم معطل'
      });
    }

    // إضافة بيانات المستخدم إلى الطلب
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'التوكن غير صحيح'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'انتهت صلاحية التوكن'
      });
    }

    res.status(500).json({
      success: false,
      error: 'خطأ في المصادقة'
    });
  }
};

/**
 * Middleware للتحقق من أن المستخدم قد سجل الدخول
 */
const auth = authenticateToken;

/**
 * Middleware للتحقق من أن المستخدم منتج أو مدير
 */
const producer = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'رجاءً قم بتسجيل الدخول أولاً'
      });
    }

    if (req.user.role !== 'PRODUCER' && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'غير مصرح لك بالوصول إلى هذا المورد'
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'خطأ في التحقق من الأذونات'
    });
  }
};

/**
 * Middleware للتحقق من أن المستخدم مدير
 */
const admin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'رجاءً قم بتسجيل الدخول أولاً'
      });
    }

    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'غير مصرح لك بالوصول إلى هذا المورد'
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'خطأ في التحقق من الأذونات'
    });
  }
};

/**
 * Middleware للتحقق من أن المستخدم VIP
 */
const vipOnly = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'رجاءً قم بتسجيل الدخول أولاً'
      });
    }

    if (req.user.role !== 'VIP' && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'هذه الميزة مخصصة للمستخدمين المميزين'
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'خطأ في التحقق من الأذونات'
    });
  }
};
        error: 'الحساب غير مفعل'
      });
    }

    // إضافة بيانات المستخدم للطلب
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'توكن غير صالح'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'انتهت صلاحية التوكن، رجاءً سجل دخول مرة أخرى'
      });
    }
    return res.status(500).json({
      success: false,
      error: 'خطأ في التحقق من الهوية'
    });
  }
};

/**
 * Middleware للتحقق من الصلاحيات
 * @param  {...string} roles - الأدوار المسموح لها
 */
const authorizeRoles = (...roles) => {
module.exports = {
  authenticateToken,
  auth,
  producer,
  admin,
  vipOnly
};

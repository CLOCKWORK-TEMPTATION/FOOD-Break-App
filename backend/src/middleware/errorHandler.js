const logger = require('../utils/logger');
const { captureException } = require('../utils/monitoring');

/**
 * Middleware لمعالجة الأخطاء المركزية
 * @param {Error} err - الخطأ
 * @param {Object} req - طلب Express
 * @param {Object} res - استجابة Express
 * @param {Function} next - الوظيفة التالية
 */
const errorHandler = (err, req, res, next) => {
  // تسجيل الخطأ
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body ? { ...req.body, password: '***', token: '***' } : undefined
  });

  // Monitoring (Sentry)
  captureException(err, {
    path: req.path,
    method: req.method,
    body: req.body ? { ...req.body, password: '***', token: '***' } : undefined
  });

  // Prisma errors
  if (err.code) {
    if (err.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: 'القيمة موجودة مسبقاً',
        field: err.meta?.target
      });
    }
    
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'السجل غير موجود'
      });
    }
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'خطأ في المصادقة'
    });
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'خطأ في الخادم';

  res.status(statusCode).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? message : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

/**
 * Middleware للتعامل مع المسارات غير الموجودة
 */
const notFound = (req, res, next) => {
  const error = new Error(`المسار غير موجود - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

module.exports = {
  errorHandler,
  notFound
};

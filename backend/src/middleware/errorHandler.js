const logger = require('../utils/logger');
const { captureException } = require('../utils/monitoring');
const {
  errorHandler: errorUtils,
  ApiError,
  NotFoundError
} = require('../utils/errors');

/**
 * تصفية البيانات الحساسة من الـ body قبل التسجيل
 * Security: منع تسريب كلمات المرور والتوكنات في السجلات
 */
const sanitizeBody = (body) => {
  if (!body || typeof body !== 'object') return body;

  const sensitiveFields = ['password', 'passwordHash', 'token', 'accessToken',
    'refreshToken', 'secret', 'apiKey', 'creditCard', 'cvv', 'ssn'];

  const sanitized = { ...body };
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  return sanitized;
};

/**
 * Middleware لمعالجة الأخطاء المركزية (محسّن)
 * Enhanced Centralized Error Handler
 * @param {Error} err - الخطأ
 * @param {Object} req - طلب Express
 * @param {Object} res - استجابة Express
 * @param {Function} next - الوظيفة التالية
 */
const errorHandler = (err, req, res, next) => {
  // Security: تصفية البيانات الحساسة قبل التسجيل
  const safeBody = sanitizeBody(req.body);

  // التعامل مع أنواع مختلفة من الأخطاء
  let error = err;

  // تحويل أخطاء Prisma
  if (err.code && err.code.startsWith('P')) {
    error = errorUtils.handlePrismaError(err);
  }

  // تحويل أخطاء JWT
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    error = errorUtils.handleJWTError(err);
  }

  // تحويل أخطاء Validation
  if (err.name === 'ValidationError' || err.errors) {
    error = errorUtils.handleValidationError(err.errors || [err]);
  }

  // التأكد من أن الخطأ من نوع ApiError
  if (!(error instanceof ApiError)) {
    error = new ApiError(
      error.message || 'خطأ في الخادم',
      error.statusCode || 500,
      error.code
    );
  }

  // إعداد السياق للتسجيل
  const context = {
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    body: process.env.NODE_ENV === 'development' ? safeBody : undefined
  };

  // تسجيل الخطأ
  errorUtils.logError(error, context);

  // Monitoring (Sentry) - بدون بيانات حساسة
  if (!error.isOperational || error.statusCode >= 500) {
    captureException(err, {
      path: req.path,
      method: req.method,
      statusCode: error.statusCode
    });
  }

  // إعداد الاستجابة
  const response = {
    success: false,
    error: {
      code: error.code,
      message: error.message
    }
  };

  // إضافة تفاصيل إضافية في بيئة التطوير
  if (process.env.NODE_ENV === 'development') {
    response.error.stack = error.stack;
    response.error.details = {
      statusCode: error.statusCode,
      isOperational: error.isOperational
    };
  }

  // إضافة معلومات إضافية لبعض أنواع الأخطاء
  if (error.errors) {
    response.error.errors = error.errors;
  }
  if (error.retryAfter) {
    response.error.retryAfter = error.retryAfter;
    res.setHeader('Retry-After', error.retryAfter);
  }
  if (error.meta) {
    response.error.meta = error.meta;
  }

  // إرسال الاستجابة
  res.status(error.statusCode).json(response);
};

/**
 * Middleware للتعامل مع المسارات غير الموجودة (محسّن)
 */
const notFound = (req, res, next) => {
  const error = new NotFoundError(`المسار غير موجود: ${req.method} ${req.originalUrl}`);
  next(error);
};

/**
 * Middleware للتعامل مع 异步 in async routes
 * Wrap async functions to catch errors
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Validation error middleware
 * Middleware للتحقق من صحة البيانات
 */
const validationError = (errors) => {
  const error = errorUtils.handleValidationError(errors);
  return error;
};

module.exports = {
  errorHandler,
  notFound,
  asyncHandler,
  validationError
};

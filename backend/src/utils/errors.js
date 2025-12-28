/**
 * Custom Error Classes
* فئات الأخطاء المخصصة
*/

/**
 * Base API Error Class
 * فئة الخطأ الأساسية للـ API
 */
class ApiError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        ...(process.env.NODE_ENV === 'development' && { stack: this.stack })
      }
    };
  }
}

/**
 * 400 Bad Request
 * خطأ في طلب العميل
 */
class BadRequestError extends ApiError {
  constructor(message = 'طلب غير صحيح', code = 'BAD_REQUEST') {
    super(message, 400, code);
  }
}

/**
 * 401 Unauthorized
 * خطأ في المصادقة
 */
class UnauthorizedError extends ApiError {
  constructor(message = 'غير مصرح', code = 'UNAUTHORIZED') {
    super(message, 401, code);
  }
}

/**
 * 403 Forbidden
 * ممنوع الوصول
 */
class ForbiddenError extends ApiError {
  constructor(message = 'ممنوع الوصول', code = 'FORBIDDEN') {
    super(message, 403, code);
  }
}

/**
 * 404 Not Found
 * المورد غير موجود
 */
class NotFoundError extends ApiError {
  constructor(message = 'المورد غير موجود', code = 'NOT_FOUND') {
    super(message, 404, code);
  }
}

/**
 * 409 Conflict
 * تعارض في البيانات
 */
class ConflictError extends ApiError {
  constructor(message = 'تعارض في البيانات', code = 'CONFLICT') {
    super(message, 409, code);
  }
}

/**
 * 422 Validation Error
 * خطأ في التحقق من البيانات
 */
class ValidationError extends ApiError {
  constructor(message = 'خطأ في التحقق', errors = []) {
    super(message, 422, 'VALIDATION_ERROR');
    this.errors = errors;
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        errors: this.errors
      }
    };
  }
}

/**
 * 429 Too Many Requests
 * طلبات كثيرة جداً
 */
class RateLimitError extends ApiError {
  constructor(message = 'طلبات كثيرة جداً', retryAfter = 60) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.retryAfter = retryAfter;
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        retryAfter: this.retryAfter
      }
    };
  }
}

/**
 * 500 Internal Server Error
 * خطأ في الخادم
 */
class InternalServerError extends ApiError {
  constructor(message = 'خطأ في الخادم', code = 'INTERNAL_ERROR') {
    super(message, 500, code);
    this.isOperational = false;
  }
}

/**
 * 503 Service Unavailable
 * الخدمة غير متاحة
 */
class ServiceUnavailableError extends ApiError {
  constructor(message = 'الخدمة غير متاحة', code = 'SERVICE_UNAVAILABLE') {
    super(message, 503, code);
  }
}

/**
 * Database Errors
 * أخطاء قاعدة البيانات
 */
class DatabaseError extends ApiError {
  constructor(message = 'خطأ في قاعدة البيانات', originalError = null) {
    super(message, 500, 'DATABASE_ERROR');
    this.originalError = originalError;
  }
}

/**
 * Prisma-specific Errors
 * أخطاء Prisma المحددة
 */
class PrismaError extends ApiError {
  constructor(prismaError) {
    let message = 'خطأ في قاعدة البيانات';
    let code = 'DATABASE_ERROR';
    let statusCode = 500;

    switch (prismaError.code) {
      case 'P2002':
        message = 'القيمة موجودة مسبقاً';
        code = 'DUPLICATE_ENTRY';
        statusCode = 409;
        break;
      case 'P2025':
        message = 'السجل غير موجود';
        code = 'NOT_FOUND';
        statusCode = 404;
        break;
      case 'P2003':
        message = 'علاقة غير صالحة';
        code = 'INVALID_RELATION';
        statusCode = 400;
        break;
      case 'P2014':
        message = 'تعارض في العلاقة';
        code = 'RELATION_CONFLICT';
        statusCode = 409;
        break;
    }

    super(message, statusCode, code);
    this.prismaCode = prismaError.code;
    this.meta = prismaError.meta;
  }
}

/**
 * Payment Errors
 * أخطاء الدفع
 */
class PaymentError extends ApiError {
  constructor(message = 'خطأ في الدفع', provider = null) {
    super(message, 500, 'PAYMENT_ERROR');
    this.provider = provider;
  }
}

/**
 * Authentication Errors
 * أخطاء المصادقة
 */
class AuthenticationError extends ApiError {
  constructor(message = 'خطأ في المصادقة', code = 'AUTH_ERROR') {
    super(message, 401, code);
  }
}

/**
 * JWT Errors
 * أخطاء التوكن
 */
class TokenError extends ApiError {
  constructor(message = 'خطأ في التوكن', code = 'TOKEN_ERROR') {
    super(message, 401, code);
  }
}

/**
 * File Upload Errors
 * أخطاء رفع الملفات
 */
class FileUploadError extends ApiError {
  constructor(message = 'خطأ في رفع الملف', code = 'FILE_UPLOAD_ERROR') {
    super(message, 400, code);
  }
}

/**
 * External Service Errors
 * أخطاء الخدمات الخارجية
 */
class ExternalServiceError extends ApiError {
  constructor(service, message = 'خطأ في الخدمة الخارجية') {
    super(`${service}: ${message}`, 503, 'EXTERNAL_SERVICE_ERROR');
    this.service = service;
  }
}

/**
 * Error Handler Utility
 * أداة معالجة الأخطاء
 */
const errorHandler = {
  /**
   * Convert Prisma error to API error
   * تحويل خطأ Prisma إلى خطأ API
   */
  handlePrismaError(error) {
    if (error.code && error.code.startsWith('P')) {
      return new PrismaError(error);
    }
    return new DatabaseError(error.message, error);
  },

  /**
   * Handle JWT errors
   * معالجة أخطاء JWT
   */
  handleJWTError(error) {
    if (error.name === 'JsonWebTokenError') {
      return new TokenError('توكن غير صالح');
    }
    if (error.name === 'TokenExpiredError') {
      return new TokenError('توكن منتهي الصلاحية', 'TOKEN_EXPIRED');
    }
    return new TokenError(error.message);
  },

  /**
   * Handle validation errors
   * معالجة أخطاء التحقق
   */
  handleValidationError(errors) {
    const formattedErrors = errors.map(err => ({
      field: err.path || err.param,
      message: err.msg || err.message
    }));
    return new ValidationError('خطأ في التحقق من البيانات', formattedErrors);
  },

  /**
   * Log error for monitoring
   * تسجيل الخطأ للمراقبة
   */
  logError(error, context = {}) {
    const logger = require('./logger');

    const logData = {
      message: error.message,
      code: error.code || 'UNKNOWN',
      statusCode: error.statusCode || 500,
      ...context
    };

    if (error.statusCode >= 500) {
      logger.error(logData, error.stack);
    } else {
      logger.warn(logData);
    }
  }
};

module.exports = {
  // Error Classes
  ApiError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  RateLimitError,
  InternalServerError,
  ServiceUnavailableError,
  DatabaseError,
  PrismaError,
  PaymentError,
  AuthenticationError,
  TokenError,
  FileUploadError,
  ExternalServiceError,

  // Error Handler
  errorHandler
};

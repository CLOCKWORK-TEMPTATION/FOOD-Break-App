/**
 * Rate Limiting Middleware
 * حماية ضد هجمات Brute Force و DDoS
 */

const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

/**
 * Rate limiter للـ Authentication endpoints
 * يسمح بـ 5 محاولات كل 15 دقيقة
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 5, // 5 طلبات كحد أقصى
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_ATTEMPTS',
      message: 'لقد تجاوزت الحد الأقصى لمحاولات تسجيل الدخول. يرجى المحاولة بعد 15 دقيقة.'
    }
  },
  standardHeaders: true, // إرجاع معلومات rate limit في headers
  legacyHeaders: false, // تعطيل X-RateLimit-* headers القديمة
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip} on ${req.path}`);
    res.status(429).json({
      success: false,
      error: {
        code: 'TOO_MANY_ATTEMPTS',
        message: 'لقد تجاوزت الحد الأقصى للطلبات. يرجى المحاولة لاحقاً.'
      }
    });
  }
});

/**
 * Rate limiter للـ QR Code Generation
 * يسمح بـ 10 طلبات كل ساعة
 */
const qrGenerationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // ساعة واحدة
  max: 10, // 10 طلبات كحد أقصى
  message: {
    success: false,
    error: {
      code: 'QR_GENERATION_LIMIT_EXCEEDED',
      message: 'لقد تجاوزت الحد الأقصى لتوليد رموز QR. يرجى المحاولة بعد ساعة.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`QR generation rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: {
        code: 'QR_GENERATION_LIMIT_EXCEEDED',
        message: 'لقد تجاوزت الحد الأقصى لتوليد رموز QR. يرجى المحاولة لاحقاً.'
      }
    });
  }
});

/**
 * Rate limiter عام للـ API
 * يسمح بـ 100 طلب كل 15 دقيقة
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 100, // 100 طلب كحد أقصى
  message: {
    success: false,
    error: {
      code: 'API_RATE_LIMIT_EXCEEDED',
      message: 'لقد تجاوزت الحد الأقصى للطلبات. يرجى المحاولة بعد 15 دقيقة.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // تخطي rate limiting للـ health check و static files
    return req.path === '/health' || req.path.startsWith('/static');
  }
});

/**
 * Rate limiter للـ Payment endpoints
 * يسمح بـ 10 طلبات كل ساعة
 */
const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // ساعة واحدة
  max: 10, // 10 طلبات كحد أقصى
  message: {
    success: false,
    error: {
      code: 'PAYMENT_RATE_LIMIT_EXCEEDED',
      message: 'لقد تجاوزت الحد الأقصى لمعاملات الدفع. يرجى المحاولة بعد ساعة.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter للـ Admin endpoints
 * يسمح بـ 50 طلب كل 15 دقيقة
 */
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 50, // 50 طلب كحد أقصى
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter ديناميكي مع خيارات قابلة للتخصيص
 */
function rateLimiter(options = {}) {
  const {
    windowMs = 15 * 60 * 1000,
    max = 100,
    message = {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'لقد تجاوزت الحد الأقصى للطلبات. يرجى المحاولة لاحقاً.'
      }
    }
  } = options;

  return rateLimit({
    windowMs,
    max,
    message,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip} on ${req.path}`);
      res.status(429).json(message);
    }
  });
}

module.exports = {
  rateLimiter,
  authLimiter,
  qrGenerationLimiter,
  apiLimiter,
  paymentLimiter,
  adminLimiter
};

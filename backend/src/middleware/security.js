/**
 * Security Middleware - حماية متقدمة
 * HTTPS/SSL, DDoS Protection, Security Headers
 */

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

/**
 * HTTPS Redirect Middleware
 * إعادة توجيه HTTP إلى HTTPS في الإنتاج
 */
const httpsRedirect = (req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure && req.get('x-forwarded-proto') !== 'https') {
    return res.redirect(301, `https://${req.hostname}${req.url}`);
  }
  next();
};

/**
 * Advanced Helmet Configuration
 * إعدادات أمان متقدمة
 */
const advancedHelmet = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  noSniff: true,
  xssFilter: true,
  hidePoweredBy: true
});

/**
 * DDoS Protection - حماية من هجمات DDoS
 * Rate limiting عدواني للطلبات المشبوهة
 */
const ddosProtection = rateLimit({
  windowMs: 1 * 60 * 1000, // دقيقة واحدة
  max: 200, // 200 طلب كحد أقصى
  message: {
    success: false,
    error: {
      code: 'DDOS_PROTECTION',
      message: 'تم اكتشاف نشاط مشبوه. تم حظر الوصول مؤقتاً.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.error(`DDoS Protection triggered for IP: ${req.ip} on ${req.path}`);
    res.status(429).json({
      success: false,
      error: {
        code: 'DDOS_PROTECTION',
        message: 'تم اكتشاف نشاط مشبوه. تم حظر الوصول مؤقتاً.'
      }
    });
  },
  skip: (req) => {
    return req.path === '/health';
  }
});

/**
 * IP Blacklist Middleware
 * حظر عناوين IP المشبوهة
 */
const ipBlacklist = new Set();

const ipBlacklistMiddleware = (req, res, next) => {
  const clientIp = req.ip || req.connection.remoteAddress;
  
  if (ipBlacklist.has(clientIp)) {
    logger.warn(`Blocked request from blacklisted IP: ${clientIp}`);
    return res.status(403).json({
      success: false,
      error: {
        code: 'IP_BLOCKED',
        message: 'تم حظر الوصول من هذا العنوان.'
      }
    });
  }
  
  next();
};

/**
 * Add IP to blacklist
 */
const addToBlacklist = (ip) => {
  ipBlacklist.add(ip);
  logger.warn(`IP added to blacklist: ${ip}`);
};

/**
 * Remove IP from blacklist
 */
const removeFromBlacklist = (ip) => {
  ipBlacklist.delete(ip);
  logger.info(`IP removed from blacklist: ${ip}`);
};

/**
 * Request Size Limiter
 * تحديد حجم الطلبات لمنع هجمات Payload
 */
const requestSizeLimiter = (req, res, next) => {
  const maxSize = process.env.MAX_REQUEST_SIZE || '10mb';
  
  if (req.headers['content-length'] && parseInt(req.headers['content-length']) > 10 * 1024 * 1024) {
    logger.warn(`Request size exceeded for IP: ${req.ip}`);
    return res.status(413).json({
      success: false,
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'حجم الطلب كبير جداً.'
      }
    });
  }
  
  next();
};

/**
 * Security Audit Logger
 * تسجيل الأحداث الأمنية
 */
const securityAuditLogger = (req, res, next) => {
  const securityEvents = ['login', 'logout', 'password-change', 'admin-action'];
  const path = req.path.toLowerCase();
  
  if (securityEvents.some(event => path.includes(event))) {
    logger.info(`Security Event: ${req.method} ${req.path} from IP: ${req.ip}`);
  }
  
  next();
};

module.exports = {
  httpsRedirect,
  advancedHelmet,
  ddosProtection,
  ipBlacklistMiddleware,
  addToBlacklist,
  removeFromBlacklist,
  requestSizeLimiter,
  securityAuditLogger
};

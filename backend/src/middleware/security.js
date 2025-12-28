const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');

/**
 * Security Middleware
 * تأمين متقدم للتطبيق
 */

// Rate Limiting متقدم
const createRateLimiter = (windowMs = 15 * 60 * 1000, max = 100) => {
  return rateLimit({
    windowMs,
    max,
    message: { success: false, error: { message: 'Too many requests, please try again later' } },
    standardHeaders: true,
    legacyHeaders: false
  });
};

// Rate limiters مختلفة
const rateLimiters = {
  general: createRateLimiter(15 * 60 * 1000, 100), // 100 requests per 15 minutes
  auth: createRateLimiter(15 * 60 * 1000, 5), // 5 login attempts per 15 minutes
  api: createRateLimiter(60 * 1000, 60), // 60 requests per minute
  strict: createRateLimiter(60 * 1000, 10) // 10 requests per minute
};

// Helmet configuration
const helmetConfig = helmet({
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
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Input Sanitization
const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj.replace(/[<>]/g, '');
    }
    if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).forEach(key => {
        obj[key] = sanitize(obj[key]);
      });
    }
    return obj;
  };

  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);
  next();
};

// CSRF Protection
const csrfProtection = (req, res, next) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const token = req.headers['x-csrf-token'];
    if (!token) {
      return res.status(403).json({
        success: false,
        error: { message: 'CSRF token missing' }
      });
    }
    // Verify token logic here
  }
  next();
};

// SQL Injection Prevention (Prisma handles this, but extra check)
const preventSQLInjection = (req, res, next) => {
  const sqlPattern = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi;
  
  const checkValue = (value) => {
    if (typeof value === 'string' && sqlPattern.test(value)) {
      return true;
    }
    return false;
  };

  const checkObject = (obj) => {
    for (const key in obj) {
      if (checkValue(obj[key])) return true;
      if (typeof obj[key] === 'object') {
        if (checkObject(obj[key])) return true;
      }
    }
    return false;
  };

  if (checkObject(req.body) || checkObject(req.query) || checkObject(req.params)) {
    return res.status(400).json({
      success: false,
      error: { message: 'Invalid input detected' }
    });
  }

  next();
};

// XSS Protection
const xssProtection = (req, res, next) => {
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
};

// Secure Headers
const secureHeaders = (req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
};

// Audit Log
const auditLog = (req, res, next) => {
  const log = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    ip: req.ip,
    userId: req.user?.id,
    userAgent: req.headers['user-agent']
  };

  // Log sensitive operations
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    console.log('[AUDIT]', JSON.stringify(log));
  }

  next();
};

module.exports = {
  rateLimiters,
  helmetConfig,
  sanitizeInput,
  csrfProtection,
  preventSQLInjection,
  xssProtection,
  secureHeaders,
  auditLog
};

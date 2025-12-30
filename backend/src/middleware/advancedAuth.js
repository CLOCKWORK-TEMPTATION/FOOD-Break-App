/**
 * Advanced Authentication Middleware
 * وسيط المصادقة المتقدم
 *
 * Features / الميزات:
 * - Multi-device session management / إدارة جلسات متعددة الأجهزة
 * - IP tracking / تتبع IP
 * - Device fingerprinting / بصمة الجهاز
 * - Suspicious activity detection / كشف النشاط المشبوه
 * - Rate limiting per user / تحديد المعدل لكل مستخدم
 */

const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');
const redis = require('../config/redis');

const prisma = new PrismaClient();

/**
 * Enhanced JWT Authentication with session tracking
 * مصادقة JWT محسّنة مع تتبع الجلسات
 */
const authenticateWithSession = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    const token = typeof authHeader === 'string' ? authHeader.split(' ')[1] : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Authentication required / المصادقة مطلوبة' },
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if token is blacklisted (for logout/security)
    const isBlacklisted = await redis.get(`blacklist:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        error: { code: 'TOKEN_REVOKED', message: 'Token has been revoked / تم إلغاء التوكن' },
      });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found / المستخدم غير موجود' },
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: { code: 'ACCOUNT_DISABLED', message: 'Account disabled / الحساب معطل' },
      });
    }

    // Track session activity
    const sessionKey = `session:${user.id}:${decoded.sessionId || 'default'}`;
    const sessionData = {
      userId: user.id,
      lastActivity: new Date().toISOString(),
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
    };

    await redis.set(sessionKey, sessionData, 3600); // 1 hour

    // Attach user and session to request
    req.user = user;
    req.sessionId = decoded.sessionId;

    return next();
  } catch (error) {
    logger.warn(`Authentication failed / فشلت المصادقة: ${error.message}`);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid token / التوكن غير صحيح' },
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Token expired / انتهت صلاحية التوكن',
          expiredAt: error.expiredAt,
        },
      });
    }

    return res.status(500).json({
      success: false,
      error: { code: 'AUTH_ERROR', message: 'Authentication error / خطأ في المصادقة' },
    });
  }
};

/**
 * Rate limiting per authenticated user
 * تحديد المعدل لكل مستخدم مُصادق
 */
const userRateLimit = (maxRequests = 100, windowMs = 60000) => {
  return async (req, res, next) => {
    if (!req.user) {
      return next();
    }

    const key = `rate_limit:user:${req.user.id}`;

    try {
      const current = await redis.incr(key);

      if (current === 1) {
        await redis.expire(key, Math.floor(windowMs / 1000));
      }

      if (current > maxRequests) {
        return res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests / طلبات كثيرة جداً',
            retryAfter: await redis.ttl(key),
          },
        });
      }

      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - current));

      next();
    } catch (error) {
      logger.error('Rate limit error:', error);
      next(); // Continue on error
    }
  };
};

/**
 * Detect suspicious activity
 * كشف النشاط المشبوه
 */
const detectSuspiciousActivity = async (req, res, next) => {
  if (!req.user) {
    return next();
  }

  try {
    const userKey = `activity:${req.user.id}`;
    const activityData = {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      timestamp: Date.now(),
      endpoint: req.originalUrl,
      method: req.method,
    };

    // Get recent activities
    const recentActivities = (await redis.get(userKey)) || [];

    // Check for suspicious patterns
    const suspiciousPatterns = [
      // Multiple IPs in short time
      {
        check: () => {
          const recentIps = recentActivities
            .filter(a => Date.now() - a.timestamp < 300000) // 5 minutes
            .map(a => a.ip);
          return new Set(recentIps).size > 3;
        },
        message: 'Multiple IPs detected / تم اكتشاف عدة IPs',
      },
      // Too many failed attempts
      {
        check: () => {
          const failedAttempts = recentActivities.filter(
            a => Date.now() - a.timestamp < 600000 && a.endpoint.includes('/login')
          );
          return failedAttempts.length > 5;
        },
        message: 'Too many login attempts / محاولات تسجيل دخول كثيرة',
      },
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.check()) {
        logger.warn(`Suspicious activity detected for user ${req.user.id}: ${pattern.message}`);

        // Log security event
        // Can trigger additional security measures here

        req.suspiciousActivity = true;
      }
    }

    // Update activity log
    recentActivities.push(activityData);

    // Keep only last 50 activities
    const trimmedActivities = recentActivities.slice(-50);
    await redis.set(userKey, trimmedActivities, 3600); // 1 hour

    next();
  } catch (error) {
    logger.error('Suspicious activity detection error:', error);
    next(); // Continue on error
  }
};

/**
 * Require specific permissions
 * يتطلب صلاحيات محددة
 */
const requirePermissions = (...permissions) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Authentication required / المصادقة مطلوبة' },
      });
    }

    // Role-based permissions
    const rolePermissions = {
      ADMIN: ['*'], // All permissions
      PRODUCER: [
        'orders:read',
        'orders:create',
        'orders:update',
        'projects:read',
        'projects:create',
        'projects:update',
        'budgets:read',
        'budgets:manage',
      ],
      VIP: ['orders:read', 'orders:create', 'orders:update', 'exceptions:request'],
      REGULAR: ['orders:read', 'orders:create', 'profile:update'],
    };

    const userPermissions = rolePermissions[req.user.role] || [];

    // Check if user has all required permissions
    const hasPermissions = permissions.every(
      permission => userPermissions.includes('*') || userPermissions.includes(permission)
    );

    if (!hasPermissions) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Insufficient permissions / صلاحيات غير كافية',
          required: permissions,
          current: userPermissions,
        },
      });
    }

    next();
  };
};

/**
 * Validate device fingerprint
 * التحقق من بصمة الجهاز
 */
const validateDeviceFingerprint = async (req, res, next) => {
  if (!req.user) {
    return next();
  }

  try {
    const deviceFingerprint = req.headers['x-device-fingerprint'];

    if (!deviceFingerprint) {
      // Optional: Could require device fingerprint for high-security operations
      return next();
    }

    const knownDevicesKey = `devices:${req.user.id}`;
    const knownDevices = (await redis.get(knownDevicesKey)) || [];

    const isKnownDevice = knownDevices.some(d => d.fingerprint === deviceFingerprint);

    if (!isKnownDevice) {
      logger.info(`New device detected for user ${req.user.id}`);

      // Add new device
      knownDevices.push({
        fingerprint: deviceFingerprint,
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.connection.remoteAddress,
      });

      await redis.set(knownDevicesKey, knownDevices, 86400 * 30); // 30 days

      // Could send notification to user about new device
      req.newDevice = true;
    } else {
      // Update last seen
      const device = knownDevices.find(d => d.fingerprint === deviceFingerprint);
      if (device) {
        device.lastSeen = new Date().toISOString();
        await redis.set(knownDevicesKey, knownDevices, 86400 * 30);
      }
    }

    next();
  } catch (error) {
    logger.error('Device fingerprint validation error:', error);
    next(); // Continue on error
  }
};

/**
 * Logout and blacklist token
 * تسجيل الخروج وإضافة التوكن للقائمة السوداء
 */
const logoutUser = async (req, res) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    const token = typeof authHeader === 'string' ? authHeader.split(' ')[1] : null;

    if (token) {
      // Decode to get expiration
      const decoded = jwt.decode(token);
      const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);

      // Blacklist token until it expires
      if (expiresIn > 0) {
        await redis.set(`blacklist:${token}`, 'true', expiresIn);
      }

      // Clear session
      if (req.user && decoded.sessionId) {
        const sessionKey = `session:${req.user.id}:${decoded.sessionId}`;
        await redis.del(sessionKey);
      }
    }

    res.json({
      success: true,
      message: 'Logged out successfully / تم تسجيل الخروج بنجاح',
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'LOGOUT_ERROR', message: 'Error logging out / خطأ في تسجيل الخروج' },
    });
  }
};

module.exports = {
  authenticateWithSession,
  userRateLimit,
  detectSuspiciousActivity,
  requirePermissions,
  validateDeviceFingerprint,
  logoutUser,
};

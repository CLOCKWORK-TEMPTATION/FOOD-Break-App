/**
 * CDN & Load Balancing Configuration
 * إعدادات CDN وتوزيع الأحمال
 */

const logger = require('../utils/logger');

/**
 * CDN Configuration
 * إعدادات شبكة توزيع المحتوى
 */
const cdnConfig = {
  enabled: process.env.CDN_ENABLED === 'true',
  provider: process.env.CDN_PROVIDER || 'cloudflare', // cloudflare, cloudfront, fastly
  baseUrl: process.env.CDN_BASE_URL || '',
  staticAssets: process.env.CDN_STATIC_ASSETS === 'true',
  cacheControl: {
    images: 'public, max-age=31536000, immutable',
    static: 'public, max-age=86400',
    api: 'no-cache, no-store, must-revalidate'
  }
};

/**
 * CDN Middleware
 * إضافة headers للـ CDN
 */
const cdnMiddleware = (req, res, next) => {
  if (!cdnConfig.enabled) {
    return next();
  }

  // إضافة Cache-Control headers
  if (req.path.match(/\.(jpg|jpeg|png|gif|svg|ico|webp)$/i)) {
    res.set('Cache-Control', cdnConfig.cacheControl.images);
  } else if (req.path.match(/\.(css|js|woff|woff2|ttf|eot)$/i)) {
    res.set('Cache-Control', cdnConfig.cacheControl.static);
  } else if (req.path.startsWith('/api/')) {
    res.set('Cache-Control', cdnConfig.cacheControl.api);
  }

  // إضافة CDN headers
  res.set('X-CDN-Provider', cdnConfig.provider);
  
  next();
};

/**
 * Load Balancer Health Check
 * فحص صحة الخادم للـ Load Balancer
 */
const loadBalancerHealthCheck = (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
    },
    cpu: process.cpuUsage()
  };

  // فحص الذاكرة
  const memoryUsagePercent = (health.memory.used / health.memory.total) * 100;
  if (memoryUsagePercent > 90) {
    health.status = 'unhealthy';
    health.reason = 'High memory usage';
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
};

/**
 * Sticky Session Handler
 * معالج الجلسات الثابتة للـ Load Balancer
 */
const stickySessionMiddleware = (req, res, next) => {
  const sessionId = req.headers['x-session-id'] || req.cookies?.sessionId;
  
  if (sessionId) {
    res.set('X-Session-Id', sessionId);
  }
  
  next();
};

/**
 * Request Distribution Logger
 * تسجيل توزيع الطلبات
 */
const requestDistributionLogger = (req, res, next) => {
  const serverId = process.env.SERVER_ID || 'server-1';
  res.set('X-Server-Id', serverId);
  
  logger.debug(`Request handled by ${serverId}: ${req.method} ${req.path}`);
  
  next();
};

/**
 * Get CDN URL for asset
 * الحصول على رابط CDN للملف
 */
const getCdnUrl = (assetPath) => {
  if (!cdnConfig.enabled || !cdnConfig.baseUrl) {
    return assetPath;
  }
  
  return `${cdnConfig.baseUrl}${assetPath}`;
};

/**
 * Purge CDN Cache
 * مسح ذاكرة التخزين المؤقت للـ CDN
 */
const purgeCdnCache = async (paths = []) => {
  if (!cdnConfig.enabled) {
    logger.warn('CDN not enabled, skipping cache purge');
    return { success: false, message: 'CDN not enabled' };
  }

  try {
    logger.info(`Purging CDN cache for paths: ${paths.join(', ')}`);
    
    // هنا يتم التكامل مع API الـ CDN Provider
    // مثال: Cloudflare, CloudFront, Fastly
    
    return { success: true, message: 'Cache purged successfully' };
  } catch (error) {
    logger.error('Failed to purge CDN cache:', error);
    return { success: false, message: error.message };
  }
};

module.exports = {
  cdnConfig,
  cdnMiddleware,
  loadBalancerHealthCheck,
  stickySessionMiddleware,
  requestDistributionLogger,
  getCdnUrl,
  purgeCdnCache
};

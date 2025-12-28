/**
 * AI Rate Limiter Middleware
 * تحديد معدل استخدام AI APIs
 */

const logger = require('../utils/logger');

class AIRateLimiter {
  constructor() {
    this.requests = new Map(); // userId -> { count, resetTime }
    this.maxRequestsPerHour = parseInt(process.env.AI_MAX_REQUESTS_PER_HOUR) || 10;
    this.windowMs = 60 * 60 * 1000; // ساعة واحدة
  }

  async checkLimit(userId) {
    const now = Date.now();
    const userRequests = this.requests.get(userId);

    if (!userRequests || now > userRequests.resetTime) {
      // نافذة جديدة
      this.requests.set(userId, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return { allowed: true, remaining: this.maxRequestsPerHour - 1 };
    }

    if (userRequests.count >= this.maxRequestsPerHour) {
      const resetIn = Math.ceil((userRequests.resetTime - now) / 1000 / 60);
      logger.warn(`AI rate limit exceeded for user ${userId}`);
      return {
        allowed: false,
        remaining: 0,
        resetIn: `${resetIn} minutes`
      };
    }

    userRequests.count++;
    return {
      allowed: true,
      remaining: this.maxRequestsPerHour - userRequests.count
    };
  }

  middleware() {
    return async (req, res, next) => {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const result = await this.checkLimit(req.user.id);

      res.setHeader('X-RateLimit-Limit', this.maxRequestsPerHour);
      res.setHeader('X-RateLimit-Remaining', result.remaining);

      if (!result.allowed) {
        return res.status(429).json({
          success: false,
          error: 'تجاوزت الحد المسموح من طلبات AI',
          resetIn: result.resetIn
        });
      }

      next();
    };
  }

  // تنظيف البيانات القديمة كل ساعة
  startCleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [userId, data] of this.requests.entries()) {
        if (now > data.resetTime) {
          this.requests.delete(userId);
        }
      }
      logger.debug(`AI rate limiter cleanup: ${this.requests.size} active users`);
    }, this.windowMs);
  }
}

const aiRateLimiter = new AIRateLimiter();
aiRateLimiter.startCleanup();

module.exports = aiRateLimiter;

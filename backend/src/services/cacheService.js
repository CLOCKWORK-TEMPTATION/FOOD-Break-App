/**
 * Cache Service - Redis Implementation
 * خدمة التخزين المؤقت المركزية
 */

const logger = require('../utils/logger');

class CacheService {
  constructor() {
    this.redis = null;
    this.enabled = process.env.REDIS_ENABLED === 'true';
    this.defaultTTL = 3600; // ساعة واحدة
  }

  async connect() {
    if (!this.enabled) {
      logger.info('Redis caching disabled');
      return;
    }

    try {
      const redis = require('redis');
      this.redis = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      });

      this.redis.on('error', (err) => logger.error('Redis error:', err));
      await this.redis.connect();
      logger.info('Redis connected successfully');
    } catch (error) {
      logger.warn('Redis connection failed, caching disabled:', error.message);
      this.enabled = false;
    }
  }

  async get(key) {
    if (!this.enabled || !this.redis) return null;
    
    try {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = this.defaultTTL) {
    if (!this.enabled || !this.redis) return false;
    
    try {
      await this.redis.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  }

  async del(key) {
    if (!this.enabled || !this.redis) return false;
    
    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  }

  async delPattern(pattern) {
    if (!this.enabled || !this.redis) return false;
    
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(keys);
      }
      return true;
    } catch (error) {
      logger.error('Cache delete pattern error:', error);
      return false;
    }
  }

  // Wrapper للدوال مع caching تلقائي
  async wrap(key, fn, ttl = this.defaultTTL) {
    const cached = await this.get(key);
    if (cached) {
      logger.debug(`Cache hit: ${key}`);
      return cached;
    }

    logger.debug(`Cache miss: ${key}`);
    const result = await fn();
    await this.set(key, result, ttl);
    return result;
  }

  async disconnect() {
    if (this.redis) {
      await this.redis.quit();
      logger.info('Redis disconnected');
    }
  }
}

module.exports = new CacheService();

/**
 * إعدادات Redis للتخزين المؤقت
 * Redis Configuration for Caching
 */

const redis = require('redis');
const logger = require('../utils/logger');

let redisClient = null;

/**
 * إنشاء اتصال Redis
 * Create Redis connection
 */
const createRedisClient = async () => {
  if (redisClient) return redisClient;

  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis: Max reconnection attempts reached');
            return new Error('Redis connection failed');
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      logger.info('Redis Client Connected');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logger.error('Failed to create Redis client:', error);
    return null;
  }
};

/**
 * الحصول على قيمة من الكاش
 * Get value from cache
 */
const get = async (key) => {
  try {
    if (!redisClient) await createRedisClient();
    if (!redisClient) return null;

    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.error(`Redis GET error for key ${key}:`, error);
    return null;
  }
};

/**
 * تعيين قيمة في الكاش مع وقت انتهاء
 * Set value in cache with expiration
 */
const set = async (key, value, expirationInSeconds = 3600) => {
  try {
    if (!redisClient) await createRedisClient();
    if (!redisClient) return false;

    await redisClient.setEx(key, expirationInSeconds, JSON.stringify(value));
    return true;
  } catch (error) {
    logger.error(`Redis SET error for key ${key}:`, error);
    return false;
  }
};

/**
 * حذف قيمة من الكاش
 * Delete value from cache
 */
const del = async (key) => {
  try {
    if (!redisClient) await createRedisClient();
    if (!redisClient) return false;

    await redisClient.del(key);
    return true;
  } catch (error) {
    logger.error(`Redis DEL error for key ${key}:`, error);
    return false;
  }
};

/**
 * حذف جميع المفاتيح التي تطابق النمط
 * Delete all keys matching pattern
 */
const delPattern = async (pattern) => {
  try {
    if (!redisClient) await createRedisClient();
    if (!redisClient) return false;

    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    return true;
  } catch (error) {
    logger.error(`Redis DEL pattern error for ${pattern}:`, error);
    return false;
  }
};

/**
 * إغلاق اتصال Redis
 * Close Redis connection
 */
const disconnect = async () => {
  try {
    if (redisClient) {
      await redisClient.quit();
      redisClient = null;
    }
  } catch (error) {
    logger.error('Redis disconnect error:', error);
  }
};

module.exports = {
  createRedisClient,
  get,
  set,
  del,
  delPattern,
  disconnect
};

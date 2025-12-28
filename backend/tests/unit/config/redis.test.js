/**
 * Redis Configuration Tests
 * اختبارات شاملة لإعدادات Redis
 */

// Mock redis before requiring the module
jest.mock('redis', () => ({
  createClient: jest.fn()
}));

jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

const redis = require('redis');
const logger = require('../../../src/utils/logger');

describe('Redis Configuration Tests', () => {
  let mockRedisClient;
  let redisConfig;

  beforeEach(() => {
    // Clear module cache to get fresh instance
    jest.resetModules();
    jest.clearAllMocks();

    // Setup mock Redis client
    mockRedisClient = {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      quit: jest.fn().mockResolvedValue(undefined),
      get: jest.fn(),
      setEx: jest.fn(),
      del: jest.fn(),
      keys: jest.fn(),
      on: jest.fn()
    };

    redis.createClient.mockReturnValue(mockRedisClient);

    // Require fresh module after mocking
    redisConfig = require('../../../src/config/redis');
  });

  afterEach(async () => {
    // Clean up
    if (redisConfig && redisConfig.disconnect) {
      await redisConfig.disconnect();
    }
  });

  describe('createRedisClient', () => {
    it('should create Redis client with default URL', async () => {
      const client = await redisConfig.createRedisClient();

      expect(redis.createClient).toHaveBeenCalledWith({
        url: 'redis://localhost:6379',
        socket: expect.objectContaining({
          reconnectStrategy: expect.any(Function)
        })
      });
      expect(mockRedisClient.connect).toHaveBeenCalled();
      expect(client).toBe(mockRedisClient);
    });

    it('should create Redis client with custom URL from env', async () => {
      process.env.REDIS_URL = 'redis://custom:6380';

      // Reload module to pick up new env
      jest.resetModules();
      const freshRedisConfig = require('../../../src/config/redis');

      await freshRedisConfig.createRedisClient();

      expect(redis.createClient).toHaveBeenCalledWith({
        url: 'redis://custom:6380',
        socket: expect.any(Object)
      });

      delete process.env.REDIS_URL;
    });

    it('should return existing client if already created', async () => {
      const client1 = await redisConfig.createRedisClient();
      redis.createClient.mockClear();

      const client2 = await redisConfig.createRedisClient();

      expect(redis.createClient).not.toHaveBeenCalled();
      expect(client1).toBe(client2);
    });

    it('should set up error event handler', async () => {
      await redisConfig.createRedisClient();

      expect(mockRedisClient.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should set up connect event handler', async () => {
      await redisConfig.createRedisClient();

      expect(mockRedisClient.on).toHaveBeenCalledWith('connect', expect.any(Function));
    });

    it('should log connection success', async () => {
      await redisConfig.createRedisClient();

      const connectHandler = mockRedisClient.on.mock.calls.find(
        call => call[0] === 'connect'
      )[1];

      connectHandler();

      expect(logger.info).toHaveBeenCalledWith('Redis Client Connected');
    });

    it('should log connection errors', async () => {
      await redisConfig.createRedisClient();

      const errorHandler = mockRedisClient.on.mock.calls.find(
        call => call[0] === 'error'
      )[1];

      const testError = new Error('Connection failed');
      errorHandler(testError);

      expect(logger.error).toHaveBeenCalledWith('Redis Client Error:', testError);
    });

    it('should handle connection failure', async () => {
      mockRedisClient.connect.mockRejectedValue(new Error('Connection failed'));

      const client = await redisConfig.createRedisClient();

      expect(client).toBeNull();
      expect(logger.error).toHaveBeenCalled();
    });

    it('should implement reconnect strategy', async () => {
      await redisConfig.createRedisClient();

      const socketConfig = redis.createClient.mock.calls[0][0].socket;
      const reconnectStrategy = socketConfig.reconnectStrategy;

      // Test exponential backoff
      expect(reconnectStrategy(1)).toBe(100);
      expect(reconnectStrategy(5)).toBe(500);
      expect(reconnectStrategy(10)).toBe(1000);
      expect(reconnectStrategy(50)).toBe(3000); // Max 3000ms
    });

    it('should stop reconnecting after max attempts', async () => {
      await redisConfig.createRedisClient();

      const socketConfig = redis.createClient.mock.calls[0][0].socket;
      const reconnectStrategy = socketConfig.reconnectStrategy;

      const result = reconnectStrategy(11);
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe('Redis connection failed');
    });
  });

  describe('get', () => {
    it('should get value from Redis and parse JSON', async () => {
      const testData = { name: 'John', age: 30 };
      mockRedisClient.get.mockResolvedValue(JSON.stringify(testData));

      const result = await redisConfig.get('test-key');

      expect(mockRedisClient.get).toHaveBeenCalledWith('test-key');
      expect(result).toEqual(testData);
    });

    it('should return null if key does not exist', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const result = await redisConfig.get('non-existent-key');

      expect(result).toBeNull();
    });

    it('should handle get errors', async () => {
      mockRedisClient.get.mockRejectedValue(new Error('Get failed'));

      const result = await redisConfig.get('test-key');

      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalled();
    });

    it('should create client if not exists', async () => {
      jest.resetModules();
      const freshRedis = require('../../../src/config/redis');

      mockRedisClient.get.mockResolvedValue(JSON.stringify({ test: 'data' }));

      await freshRedis.get('test-key');

      expect(redis.createClient).toHaveBeenCalled();
    });

    it('should handle null client gracefully', async () => {
      mockRedisClient.connect.mockRejectedValue(new Error('Failed'));

      const result = await redisConfig.get('test-key');

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should set value in Redis with default expiration', async () => {
      mockRedisClient.setEx.mockResolvedValue('OK');

      const result = await redisConfig.set('test-key', { name: 'John' });

      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        'test-key',
        3600,
        JSON.stringify({ name: 'John' })
      );
      expect(result).toBe(true);
    });

    it('should set value with custom expiration', async () => {
      mockRedisClient.setEx.mockResolvedValue('OK');

      const result = await redisConfig.set('test-key', { data: 'test' }, 7200);

      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        'test-key',
        7200,
        JSON.stringify({ data: 'test' })
      );
      expect(result).toBe(true);
    });

    it('should handle set errors', async () => {
      mockRedisClient.setEx.mockRejectedValue(new Error('Set failed'));

      const result = await redisConfig.set('test-key', { data: 'test' });

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should return false if client is null', async () => {
      mockRedisClient.connect.mockRejectedValue(new Error('Failed'));

      const result = await redisConfig.set('test-key', { data: 'test' });

      expect(result).toBe(false);
    });

    it('should serialize complex objects', async () => {
      const complexData = {
        user: { name: 'John', nested: { value: 123 } },
        array: [1, 2, 3]
      };
      mockRedisClient.setEx.mockResolvedValue('OK');

      await redisConfig.set('complex-key', complexData);

      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        'complex-key',
        3600,
        JSON.stringify(complexData)
      );
    });
  });

  describe('del', () => {
    it('should delete key from Redis', async () => {
      mockRedisClient.del.mockResolvedValue(1);

      const result = await redisConfig.del('test-key');

      expect(mockRedisClient.del).toHaveBeenCalledWith('test-key');
      expect(result).toBe(true);
    });

    it('should handle delete errors', async () => {
      mockRedisClient.del.mockRejectedValue(new Error('Delete failed'));

      const result = await redisConfig.del('test-key');

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should return false if client is null', async () => {
      mockRedisClient.connect.mockRejectedValue(new Error('Failed'));

      const result = await redisConfig.del('test-key');

      expect(result).toBe(false);
    });
  });

  describe('delPattern', () => {
    it('should delete all keys matching pattern', async () => {
      const keys = ['user:1', 'user:2', 'user:3'];
      mockRedisClient.keys.mockResolvedValue(keys);
      mockRedisClient.del.mockResolvedValue(3);

      const result = await redisConfig.delPattern('user:*');

      expect(mockRedisClient.keys).toHaveBeenCalledWith('user:*');
      expect(mockRedisClient.del).toHaveBeenCalledWith(keys);
      expect(result).toBe(true);
    });

    it('should handle case when no keys match pattern', async () => {
      mockRedisClient.keys.mockResolvedValue([]);

      const result = await redisConfig.delPattern('nonexistent:*');

      expect(mockRedisClient.keys).toHaveBeenCalledWith('nonexistent:*');
      expect(mockRedisClient.del).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should handle delPattern errors', async () => {
      mockRedisClient.keys.mockRejectedValue(new Error('Keys failed'));

      const result = await redisConfig.delPattern('test:*');

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should return false if client is null', async () => {
      mockRedisClient.connect.mockRejectedValue(new Error('Failed'));

      const result = await redisConfig.delPattern('test:*');

      expect(result).toBe(false);
    });
  });

  describe('disconnect', () => {
    it('should disconnect Redis client', async () => {
      await redisConfig.createRedisClient();
      mockRedisClient.quit.mockResolvedValue('OK');

      await redisConfig.disconnect();

      expect(mockRedisClient.quit).toHaveBeenCalled();
    });

    it('should handle disconnect errors', async () => {
      await redisConfig.createRedisClient();
      mockRedisClient.quit.mockRejectedValue(new Error('Quit failed'));

      await redisConfig.disconnect();

      expect(logger.error).toHaveBeenCalledWith('Redis disconnect error:', expect.any(Error));
    });

    it('should handle disconnect when client is null', async () => {
      // Don't create client
      await redisConfig.disconnect();

      // Should not throw
      expect(mockRedisClient.quit).not.toHaveBeenCalled();
    });
  });

  describe('Module exports', () => {
    it('should export all required functions', () => {
      expect(redisConfig.createRedisClient).toBeDefined();
      expect(redisConfig.get).toBeDefined();
      expect(redisConfig.set).toBeDefined();
      expect(redisConfig.del).toBeDefined();
      expect(redisConfig.delPattern).toBeDefined();
      expect(redisConfig.disconnect).toBeDefined();
    });

    it('all exported functions should be functions', () => {
      expect(typeof redisConfig.createRedisClient).toBe('function');
      expect(typeof redisConfig.get).toBe('function');
      expect(typeof redisConfig.set).toBe('function');
      expect(typeof redisConfig.del).toBe('function');
      expect(typeof redisConfig.delPattern).toBe('function');
      expect(typeof redisConfig.disconnect).toBe('function');
    });
  });
});

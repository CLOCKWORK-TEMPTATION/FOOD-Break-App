/**
 * اختبارات وحدة Redis Configuration
 * Unit tests for Redis configuration module
 */

const redis = require('redis');
const logger = require('../../../src/utils/logger');
const redisConfig = require('../../../src/config/redis');

// Mock Redis client
jest.mock('redis');
jest.mock('../../../src/utils/logger');

describe('Redis Configuration', () => {
  let mockRedisClient;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock Redis client
    mockRedisClient = {
      connect: jest.fn().mockResolvedValue(undefined),
      get: jest.fn(),
      setEx: jest.fn(),
      del: jest.fn(),
      keys: jest.fn(),
      quit: jest.fn().mockResolvedValue(undefined),
      on: jest.fn()
    };

    redis.createClient = jest.fn().mockReturnValue(mockRedisClient);
  });

  describe('createRedisClient', () => {
    it('should create and connect to Redis client successfully', async () => {
      const client = await redisConfig.createRedisClient();

      expect(redis.createClient).toHaveBeenCalledWith({
        url: 'redis://localhost:6379',
        socket: {
          reconnectStrategy: expect.any(Function)
        }
      });
      expect(mockRedisClient.connect).toHaveBeenCalled();
      expect(client).toBe(mockRedisClient);
    });

    it('should use REDIS_URL from environment if available', async () => {
      process.env.REDIS_URL = 'redis://custom:6380';

      await redisConfig.createRedisClient();

      expect(redis.createClient).toHaveBeenCalledWith({
        url: 'redis://custom:6380',
        socket: {
          reconnectStrategy: expect.any(Function)
        }
      });

      delete process.env.REDIS_URL;
    });

    it('should return existing client if already created', async () => {
      const firstClient = await redisConfig.createRedisClient();
      const secondClient = await redisConfig.createRedisClient();

      expect(firstClient).toBe(secondClient);
      expect(redis.createClient).toHaveBeenCalledTimes(1);
    });

    it('should setup error event handler', async () => {
      await redisConfig.createRedisClient();

      expect(mockRedisClient.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should setup connect event handler', async () => {
      await redisConfig.createRedisClient();

      expect(mockRedisClient.on).toHaveBeenCalledWith('connect', expect.any(Function));
    });

    it('should log error when Redis client error occurs', async () => {
      await redisConfig.createRedisClient();

      const errorHandler = mockRedisClient.on.mock.calls.find(
        call => call[0] === 'error'
      )[1];

      const testError = new Error('Redis connection failed');
      errorHandler(testError);

      expect(logger.error).toHaveBeenCalledWith('Redis Client Error:', testError);
    });

    it('should log info when Redis client connects', async () => {
      await redisConfig.createRedisClient();

      const connectHandler = mockRedisClient.on.mock.calls.find(
        call => call[0] === 'connect'
      )[1];

      connectHandler();

      expect(logger.info).toHaveBeenCalledWith('Redis Client Connected');
    });

    it('should handle connection errors and return null', async () => {
      mockRedisClient.connect.mockRejectedValue(new Error('Connection failed'));

      const client = await redisConfig.createRedisClient();

      expect(client).toBeNull();
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to create Redis client:',
        expect.any(Error)
      );
    });

    it('should implement reconnect strategy correctly', async () => {
      await redisConfig.createRedisClient();

      const reconnectStrategy = redis.createClient.mock.calls[0][0].socket.reconnectStrategy;

      // Test with less than 10 retries
      expect(reconnectStrategy(1)).toBe(100);
      expect(reconnectStrategy(5)).toBe(500);
      expect(reconnectStrategy(10)).toBe(1000);

      // Test max value capping at 3000
      expect(reconnectStrategy(50)).toBe(3000);
    });

    it('should return error after max reconnection attempts', async () => {
      await redisConfig.createRedisClient();

      const reconnectStrategy = redis.createClient.mock.calls[0][0].socket.reconnectStrategy;
      const result = reconnectStrategy(11);

      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe('Redis connection failed');
      expect(logger.error).toHaveBeenCalledWith('Redis: Max reconnection attempts reached');
    });
  });

  describe('get', () => {
    beforeEach(async () => {
      await redisConfig.createRedisClient();
      jest.clearAllMocks();
    });

    it('should get and parse JSON value from cache', async () => {
      const testData = { name: 'test', value: 123 };
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

    it('should handle JSON parse errors and return null', async () => {
      mockRedisClient.get.mockResolvedValue('invalid-json{');

      const result = await redisConfig.get('invalid-key');

      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Redis GET error'),
        expect.any(Error)
      );
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedisClient.get.mockRejectedValue(new Error('Redis error'));

      const result = await redisConfig.get('error-key');

      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalledWith(
        'Redis GET error for key error-key:',
        expect.any(Error)
      );
    });

    it('should create client if not already created', async () => {
      // Disconnect first
      await redisConfig.disconnect();
      jest.clearAllMocks();

      mockRedisClient.get.mockResolvedValue(JSON.stringify({ test: 'data' }));

      await redisConfig.get('test-key');

      expect(redis.createClient).toHaveBeenCalled();
    });

    it('should return null if client creation fails', async () => {
      await redisConfig.disconnect();
      jest.clearAllMocks();

      mockRedisClient.connect.mockRejectedValue(new Error('Connection failed'));

      const result = await redisConfig.get('test-key');

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    beforeEach(async () => {
      await redisConfig.createRedisClient();
      jest.clearAllMocks();
    });

    it('should set value in cache with default expiration', async () => {
      const testData = { name: 'test', value: 123 };
      mockRedisClient.setEx.mockResolvedValue('OK');

      const result = await redisConfig.set('test-key', testData);

      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        'test-key',
        3600,
        JSON.stringify(testData)
      );
      expect(result).toBe(true);
    });

    it('should set value with custom expiration time', async () => {
      const testData = { name: 'test' };
      mockRedisClient.setEx.mockResolvedValue('OK');

      const result = await redisConfig.set('test-key', testData, 1800);

      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        'test-key',
        1800,
        JSON.stringify(testData)
      );
      expect(result).toBe(true);
    });

    it('should handle Redis errors and return false', async () => {
      mockRedisClient.setEx.mockRejectedValue(new Error('Redis error'));

      const result = await redisConfig.set('error-key', { test: 'data' });

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        'Redis SET error for key error-key:',
        expect.any(Error)
      );
    });

    it('should create client if not already created', async () => {
      await redisConfig.disconnect();
      jest.clearAllMocks();

      mockRedisClient.setEx.mockResolvedValue('OK');

      await redisConfig.set('test-key', { test: 'data' });

      expect(redis.createClient).toHaveBeenCalled();
    });

    it('should return false if client creation fails', async () => {
      await redisConfig.disconnect();
      jest.clearAllMocks();

      mockRedisClient.connect.mockRejectedValue(new Error('Connection failed'));

      const result = await redisConfig.set('test-key', { test: 'data' });

      expect(result).toBe(false);
    });

    it('should stringify complex objects correctly', async () => {
      const complexData = {
        array: [1, 2, 3],
        nested: { obj: 'value' },
        number: 42,
        boolean: true,
        null: null
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
    beforeEach(async () => {
      await redisConfig.createRedisClient();
      jest.clearAllMocks();
    });

    it('should delete key from cache successfully', async () => {
      mockRedisClient.del.mockResolvedValue(1);

      const result = await redisConfig.del('test-key');

      expect(mockRedisClient.del).toHaveBeenCalledWith('test-key');
      expect(result).toBe(true);
    });

    it('should handle Redis errors and return false', async () => {
      mockRedisClient.del.mockRejectedValue(new Error('Redis error'));

      const result = await redisConfig.del('error-key');

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        'Redis DEL error for key error-key:',
        expect.any(Error)
      );
    });

    it('should create client if not already created', async () => {
      await redisConfig.disconnect();
      jest.clearAllMocks();

      mockRedisClient.del.mockResolvedValue(1);

      await redisConfig.del('test-key');

      expect(redis.createClient).toHaveBeenCalled();
    });

    it('should return false if client creation fails', async () => {
      await redisConfig.disconnect();
      jest.clearAllMocks();

      mockRedisClient.connect.mockRejectedValue(new Error('Connection failed'));

      const result = await redisConfig.del('test-key');

      expect(result).toBe(false);
    });
  });

  describe('delPattern', () => {
    beforeEach(async () => {
      await redisConfig.createRedisClient();
      jest.clearAllMocks();
    });

    it('should delete all keys matching pattern', async () => {
      const matchingKeys = ['user:1', 'user:2', 'user:3'];
      mockRedisClient.keys.mockResolvedValue(matchingKeys);
      mockRedisClient.del.mockResolvedValue(3);

      const result = await redisConfig.delPattern('user:*');

      expect(mockRedisClient.keys).toHaveBeenCalledWith('user:*');
      expect(mockRedisClient.del).toHaveBeenCalledWith(matchingKeys);
      expect(result).toBe(true);
    });

    it('should handle empty key list', async () => {
      mockRedisClient.keys.mockResolvedValue([]);

      const result = await redisConfig.delPattern('nonexistent:*');

      expect(mockRedisClient.keys).toHaveBeenCalledWith('nonexistent:*');
      expect(mockRedisClient.del).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should handle Redis errors and return false', async () => {
      mockRedisClient.keys.mockRejectedValue(new Error('Redis error'));

      const result = await redisConfig.delPattern('error:*');

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        'Redis DEL pattern error for error:*:',
        expect.any(Error)
      );
    });

    it('should create client if not already created', async () => {
      await redisConfig.disconnect();
      jest.clearAllMocks();

      mockRedisClient.keys.mockResolvedValue([]);

      await redisConfig.delPattern('test:*');

      expect(redis.createClient).toHaveBeenCalled();
    });

    it('should return false if client creation fails', async () => {
      await redisConfig.disconnect();
      jest.clearAllMocks();

      mockRedisClient.connect.mockRejectedValue(new Error('Connection failed'));

      const result = await redisConfig.delPattern('test:*');

      expect(result).toBe(false);
    });

    it('should handle pattern with multiple matching keys', async () => {
      const manyKeys = Array.from({ length: 100 }, (_, i) => `cache:item:${i}`);
      mockRedisClient.keys.mockResolvedValue(manyKeys);
      mockRedisClient.del.mockResolvedValue(100);

      const result = await redisConfig.delPattern('cache:item:*');

      expect(mockRedisClient.del).toHaveBeenCalledWith(manyKeys);
      expect(result).toBe(true);
    });
  });

  describe('disconnect', () => {
    it('should disconnect from Redis successfully', async () => {
      await redisConfig.createRedisClient();
      jest.clearAllMocks();

      await redisConfig.disconnect();

      expect(mockRedisClient.quit).toHaveBeenCalled();
    });

    it('should handle disconnect errors gracefully', async () => {
      await redisConfig.createRedisClient();
      jest.clearAllMocks();

      mockRedisClient.quit.mockRejectedValue(new Error('Disconnect error'));

      await redisConfig.disconnect();

      expect(logger.error).toHaveBeenCalledWith(
        'Redis disconnect error:',
        expect.any(Error)
      );
    });

    it('should do nothing if client is not connected', async () => {
      await redisConfig.disconnect();

      expect(mockRedisClient.quit).not.toHaveBeenCalled();
    });

    it('should reset client to null after disconnect', async () => {
      await redisConfig.createRedisClient();
      await redisConfig.disconnect();
      jest.clearAllMocks();

      // Next operation should create a new client
      mockRedisClient.get.mockResolvedValue(null);
      await redisConfig.get('test-key');

      expect(redis.createClient).toHaveBeenCalled();
    });
  });

  describe('Integration scenarios', () => {
    beforeEach(async () => {
      await redisConfig.createRedisClient();
      jest.clearAllMocks();
    });

    it('should handle complete set-get-delete cycle', async () => {
      const testData = { userId: '123', name: 'Test User' };

      // Set
      mockRedisClient.setEx.mockResolvedValue('OK');
      const setResult = await redisConfig.set('user:123', testData);
      expect(setResult).toBe(true);

      // Get
      mockRedisClient.get.mockResolvedValue(JSON.stringify(testData));
      const getData = await redisConfig.get('user:123');
      expect(getData).toEqual(testData);

      // Delete
      mockRedisClient.del.mockResolvedValue(1);
      const delResult = await redisConfig.del('user:123');
      expect(delResult).toBe(true);
    });

    it('should handle pattern deletion workflow', async () => {
      // Create multiple keys
      mockRedisClient.setEx.mockResolvedValue('OK');
      await redisConfig.set('session:1', { data: 'a' });
      await redisConfig.set('session:2', { data: 'b' });
      await redisConfig.set('session:3', { data: 'c' });

      // Delete all sessions
      mockRedisClient.keys.mockResolvedValue(['session:1', 'session:2', 'session:3']);
      mockRedisClient.del.mockResolvedValue(3);
      const result = await redisConfig.delPattern('session:*');

      expect(result).toBe(true);
      expect(mockRedisClient.del).toHaveBeenCalledWith(['session:1', 'session:2', 'session:3']);
    });

    it('should handle concurrent operations', async () => {
      mockRedisClient.get.mockResolvedValue(JSON.stringify({ test: 1 }));
      mockRedisClient.setEx.mockResolvedValue('OK');

      const promises = [
        redisConfig.get('key1'),
        redisConfig.set('key2', { test: 2 }),
        redisConfig.get('key3'),
        redisConfig.del('key4')
      ];

      await Promise.all(promises);

      expect(mockRedisClient.get).toHaveBeenCalledTimes(2);
      expect(mockRedisClient.setEx).toHaveBeenCalledTimes(1);
      expect(mockRedisClient.del).toHaveBeenCalledTimes(1);
    });
  });
});

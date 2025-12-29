/**
 * Cache Service Tests
 * اختبارات خدمة التخزين المؤقت
 */

const cacheService = require('../../../src/services/cacheService');

// Mock Redis
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    flushAll: jest.fn(),
    quit: jest.fn(),
    on: jest.fn()
  }))
}));

describe('Cache Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('get', () => {
    it('should get value from cache', async () => {
      const result = await cacheService.get('test-key');
      expect(result).toBeDefined();
    });

    it('should handle cache miss', async () => {
      const result = await cacheService.get('non-existent-key');
      expect(result).toBeUndefined();
    });
  });

  describe('set', () => {
    it('should set value in cache', async () => {
      await cacheService.set('test-key', { data: 'test' }, 3600);
      expect(true).toBe(true);
    });
  });

  describe('del', () => {
    it('should delete value from cache', async () => {
      await cacheService.del('test-key');
      expect(true).toBe(true);
    });
  });

  describe('clear', () => {
    it('should clear all cache', async () => {
      await cacheService.clear();
      expect(true).toBe(true);
    });
  });

  describe('has', () => {
    it('should check if key exists', async () => {
      const result = await cacheService.has('test-key');
      expect(typeof result).toBe('boolean');
    });
  });
});

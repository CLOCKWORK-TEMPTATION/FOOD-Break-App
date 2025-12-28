const cache = require('../../cacheService');

describe('CacheService', () => {
  beforeAll(async () => {
    await cache.connect();
  });

  afterAll(async () => {
    await cache.disconnect();
  });

  beforeEach(async () => {
    if (cache.enabled && cache.redis) {
      await cache.redis.flushAll();
    }
  });

  describe('set and get', () => {
    it('should set and get value', async () => {
      await cache.set('test-key', { data: 'test' }, 60);
      const result = await cache.get('test-key');
      expect(result).toEqual({ data: 'test' });
    });

    it('should return null for non-existent key', async () => {
      const result = await cache.get('non-existent');
      expect(result).toBeNull();
    });

    it('should handle complex objects', async () => {
      const complex = { arr: [1, 2, 3], nested: { key: 'value' }, num: 123 };
      await cache.set('complex', complex, 60);
      const result = await cache.get('complex');
      expect(result).toEqual(complex);
    });
  });

  describe('del', () => {
    it('should delete key', async () => {
      await cache.set('delete-me', 'value', 60);
      await cache.del('delete-me');
      const result = await cache.get('delete-me');
      expect(result).toBeNull();
    });
  });

  describe('delPattern', () => {
    it('should delete keys by pattern', async () => {
      await cache.set('user:1:data', 'data1', 60);
      await cache.set('user:2:data', 'data2', 60);
      await cache.set('other:key', 'other', 60);

      await cache.delPattern('user:*');

      expect(await cache.get('user:1:data')).toBeNull();
      expect(await cache.get('user:2:data')).toBeNull();
      expect(await cache.get('other:key')).not.toBeNull();
    });
  });

  describe('wrap', () => {
    it('should cache function result', async () => {
      let callCount = 0;
      const fn = async () => {
        callCount++;
        return { result: 'data' };
      };

      const result1 = await cache.wrap('wrap-test', fn, 60);
      const result2 = await cache.wrap('wrap-test', fn, 60);

      expect(result1).toEqual(result2);
      expect(callCount).toBe(1); // Function called only once
    });

    it('should call function if cache miss', async () => {
      let callCount = 0;
      const fn = async () => {
        callCount++;
        return { count: callCount };
      };

      await cache.wrap('wrap-test-2', fn, 60);
      await cache.del('wrap-test-2');
      await cache.wrap('wrap-test-2', fn, 60);

      expect(callCount).toBe(2);
    });
  });

  describe('disabled cache', () => {
    it('should handle disabled cache gracefully', async () => {
      const originalEnabled = cache.enabled;
      cache.enabled = false;

      await cache.set('test', 'value', 60);
      const result = await cache.get('test');
      expect(result).toBeNull();

      cache.enabled = originalEnabled;
    });
  });
});

/**
 * Rate Limiter Middleware Unit Tests
 * اختبارات وحدة middleware تقييد معدل الطلبات
 */

const rateLimit = require('express-rate-limit');
const request = require('supertest');
const express = require('express');

describe('Rate Limiter Middleware', () => {
  let app;
  let mockWindowMs;
  let mockMax;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    mockWindowMs = 15 * 60 * 1000; // 15 minutes
    mockMax = 10; // 10 requests
  });

  describe('Auth Rate Limiter', () => {
    it('should allow requests within limit', async () => {
      let requestCount = 0;

      app.use(rateLimit({
        windowMs: 60000,
        max: 5,
        handler: (req, res) => {
          res.status(429).json({ error: 'Too many requests' });
        }
      }));

      app.get('/test', (req, res) => {
        requestCount++;
        res.json({ count: requestCount });
      });

      // Make 5 requests - should all succeed
      for (let i = 0; i < 5; i++) {
        const response = await request(app).get('/test');
        expect(response.status).toBe(200);
      }
    });

    it('should block requests exceeding limit', async () => {
      app.use(rateLimit({
        windowMs: 60000,
        max: 3,
        standardHeaders: true,
        legacyHeaders: false
      }));

      app.get('/test', (req, res) => res.json({ ok: true }));

      // First 3 requests should succeed
      for (let i = 0; i < 3; i++) {
        const response = await request(app).get('/test');
        expect(response.status).toBe(200);
      }

      // 4th request should be rate limited
      const response = await request(app).get('/test');
      expect(response.status).toBe(429);
      expect(response.body).toHaveProperty('error');
    });

    it('should set retry-after header', async () => {
      app.use(rateLimit({
        windowMs: 60000,
        max: 1
      }));

      app.get('/test', (req, res) => res.json({ ok: true }));

      await request(app).get('/test');
      const response = await request(app).get('/test');

      expect(response.status).toBe(429);
      expect(response.headers['retry-after']).toBeDefined();
    });

    it('should skip successful requests from count', async () => {
      app.use(rateLimit({
        windowMs: 60000,
        max: 2,
        skipSuccessfulRequests: true
      }));

      app.get('/test', (req, res) => res.json({ ok: true }));

      // All successful requests should not count
      for (let i = 0; i < 10; i++) {
        const response = await request(app).get('/test');
        expect(response.status).toBe(200);
      }
    });

    it('should use custom key generator', async () => {
      app.use(rateLimit({
        windowMs: 60000,
        max: 2,
        keyGenerator: (req) => {
          return req.headers['x-api-key'] || req.ip;
        }
      }));

      app.get('/test', (req, res) => res.json({ ok: true }));

      // Requests with same API key should share limit
      const response1 = await request(app)
        .get('/test')
        .set('X-API-Key', 'key1');
      expect(response1.status).toBe(200);

      const response2 = await request(app)
        .get('/test')
        .set('X-API-Key', 'key1');
      expect(response2.status).toBe(200);

      const response3 = await request(app)
        .get('/test')
        .set('X-API-Key', 'key1');
      expect(response3.status).toBe(429);

      // Different API key should have separate limit
      const response4 = await request(app)
        .get('/test')
        .set('X-API-Key', 'key2');
      expect(response4.status).toBe(200);
    });
  });

  describe('IP-based Rate Limiting', () => {
    it('should limit requests per IP address', async () => {
      app.use(rateLimit({
        windowMs: 60000,
        max: 2
      }));

      app.get('/test', (req, res) => res.json({ ok: true }));

      // Simulate requests from IP1
      const response1 = await request(app)
        .get('/test')
        .set('X-Forwarded-For', '192.168.1.1');
      expect(response1.status).toBe(200);

      const response2 = await request(app)
        .get('/test')
        .set('X-Forwarded-For', '192.168.1.1');
      expect(response2.status).toBe(200);

      const response3 = await request(app)
        .get('/test')
        .set('X-Forwarded-For', '192.168.1.1');
      expect(response3.status).toBe(429);

      // Different IP should not be affected
      const response4 = await request(app)
        .get('/test')
        .set('X-Forwarded-For', '192.168.1.2');
      expect(response4.status).toBe(200);
    });
  });

  describe('Whitelist Support', () => {
    it('should skip rate limiting for whitelisted IPs', async () => {
      const whitelist = ['127.0.0.1', '::1'];

      app.use(rateLimit({
        windowMs: 60000,
        max: 2,
        skip: (req) => {
          return whitelist.includes(req.ip) ||
                 whitelist.includes(req.connection.remoteAddress);
        }
      }));

      app.get('/test', (req, res) => res.json({ ok: true }));

      // Whitelisted IP should not be limited
      for (let i = 0; i < 10; i++) {
        const response = await request(app)
          .get('/test')
          .set('X-Forwarded-For', '127.0.0.1');
        expect(response.status).toBe(200);
      }
    });
  });

  describe('Custom Handler', () => {
    it('should use custom error handler', async () => {
      app.use(rateLimit({
        windowMs: 60000,
        max: 1,
        handler: (req, res) => {
          res.status(429).json({
            success: false,
            error: {
              code: 'TOO_MANY_REQUESTS',
              message: 'محاولات كثيرة جداً، يرجى المحاولة لاحقاً'
            }
          });
        }
      }));

      app.get('/test', (req, res) => res.json({ ok: true }));

      await request(app).get('/test');
      const response = await request(app).get('/test');

      expect(response.status).toBe(429);
      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'TOO_MANY_REQUESTS',
          message: 'محاولات كثيرة جداً، يرجى المحاولة لاحقاً'
        }
      });
    });

    it('should support Arabic error messages', async () => {
      app.use(rateLimit({
        windowMs: 60000,
        max: 1,
        handler: (req, res) => {
          res.status(429).json({
            success: false,
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'لقد تجاوزت الحد المسموح من الطلبات'
            }
          });
        }
      }));

      app.get('/test', (req, res) => res.json({ ok: true }));

      await request(app).get('/test');
      const response = await request(app).get('/test');

      expect(response.body.error.message).toMatch(/الحد المسموح/);
    });
  });

  describe('Store Options', () => {
    it('should use memory store by default', () => {
      const limiter = rateLimit({
        windowMs: 60000,
        max: 10
      });

      expect(limiter).toBeDefined();
    });

    it('should reset after window expires', async () => {
      jest.useFakeTimers();

      app.use(rateLimit({
        windowMs: 1000, // 1 second
        max: 2
      }));

      app.get('/test', (req, res) => res.json({ ok: true }));

      // Make 2 requests
      await request(app).get('/test');
      await request(app).get('/test');

      // 3rd should be blocked
      let response = await request(app).get('/test');
      expect(response.status).toBe(429);

      // Advance time past window
      jest.advanceTimersByTime(1100);

      // Should work again after window expires
      response = await request(app).get('/test');
      expect(response.status).toBe(200);

      jest.useRealTimers();
    });
  });

  describe('Different Limits per Route', () => {
    it('should apply different limits for different routes', async () => {
      const strictLimiter = rateLimit({
        windowMs: 60000,
        max: 2
      });

      const looseLimiter = rateLimit({
        windowMs: 60000,
        max: 10
      });

      app.get('/strict', strictLimiter, (req, res) => res.json({ ok: true }));
      app.get('/loose', looseLimiter, (req, res) => res.json({ ok: true }));

      // Strict route - should block after 2
      await request(app).get('/strict');
      await request(app).get('/strict');
      const strictResponse = await request(app).get('/strict');
      expect(strictResponse.status).toBe(429);

      // Loose route - should still work
      for (let i = 0; i < 5; i++) {
        const response = await request(app).get('/loose');
        expect(response.status).toBe(200);
      }
    });
  });

  describe('Headers Configuration', () => {
    it('should include rate limit headers when enabled', async () => {
      app.use(rateLimit({
        windowMs: 60000,
        max: 5,
        standardHeaders: true,
        legacyHeaders: false
      }));

      app.get('/test', (req, res) => res.json({ ok: true }));

      const response = await request(app).get('/test');

      expect(response.headers['ratelimit-limit']).toBeDefined();
      expect(response.headers['ratelimit-remaining']).toBeDefined();
      expect(response.headers['ratelimit-reset']).toBeDefined();
    });

    it('should include legacy headers when enabled', async () => {
      app.use(rateLimit({
        windowMs: 60000,
        max: 5,
        standardHeaders: false,
        legacyHeaders: true
      }));

      app.get('/test', (req, res) => res.json({ ok: true }));

      const response = await request(app).get('/test');

      expect(response.headers['x-ratelimit-limit']).toBeDefined();
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
      expect(response.headers['x-ratelimit-reset']).toBeDefined();
    });
  });
});

/**
 * AI Rate Limiter Tests
 */

const aiRateLimiter = require('../aiRateLimiter');

describe('AIRateLimiter', () => {
  beforeEach(() => {
    aiRateLimiter.requests.clear();
  });

  describe('checkLimit', () => {
    it('should allow first request', async () => {
      const result = await aiRateLimiter.checkLimit('user-1');
      
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThan(0);
    });

    it('should block after exceeding limit', async () => {
      const userId = 'user-2';
      const maxRequests = aiRateLimiter.maxRequestsPerHour;
      
      // Make max requests
      for (let i = 0; i < maxRequests; i++) {
        await aiRateLimiter.checkLimit(userId);
      }
      
      // Next request should be blocked
      const result = await aiRateLimiter.checkLimit(userId);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should reset after window expires', async () => {
      const userId = 'user-3';
      
      // Make request
      await aiRateLimiter.checkLimit(userId);
      
      // Manually expire window
      const userRequests = aiRateLimiter.requests.get(userId);
      userRequests.resetTime = Date.now() - 1000;
      
      // Next request should be allowed
      const result = await aiRateLimiter.checkLimit(userId);
      expect(result.allowed).toBe(true);
    });
  });

  describe('middleware', () => {
    it('should return 401 if no user', async () => {
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();
      
      await aiRateLimiter.middleware()(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next if allowed', async () => {
      const req = { user: { id: 'user-4' } };
      const res = {
        setHeader: jest.fn()
      };
      const next = jest.fn();
      
      await aiRateLimiter.middleware()(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });

    it('should return 429 if limit exceeded', async () => {
      const userId = 'user-5';
      const maxRequests = aiRateLimiter.maxRequestsPerHour;
      
      // Exceed limit
      for (let i = 0; i < maxRequests; i++) {
        await aiRateLimiter.checkLimit(userId);
      }
      
      const req = { user: { id: userId } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        setHeader: jest.fn()
      };
      const next = jest.fn();
      
      await aiRateLimiter.middleware()(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(429);
      expect(next).not.toHaveBeenCalled();
    });
  });
});

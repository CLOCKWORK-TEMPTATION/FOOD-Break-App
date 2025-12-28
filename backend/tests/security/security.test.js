/**
 * Security Testing Suite
 * اختبارات الأمان الشاملة
 */

const request = require('supertest');
const app = require('../../src/server');

describe('Security Tests - اختبارات الأمان', () => {
  describe('Rate Limiting', () => {
    it('should block excessive requests', async () => {
      const requests = Array(150).fill(null).map(() => 
        request(app).get('/api/v1/menu')
      );
      const responses = await Promise.all(requests);
      const blocked = responses.filter(r => r.status === 429);
      expect(blocked.length).toBeGreaterThan(0);
    });
  });

  describe('SQL Injection Protection', () => {
    it('should reject SQL injection attempts', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: "admin' OR '1'='1", password: 'test' });
      expect(res.status).toBe(400);
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const res = await request(app).get('/health');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });
  });

  describe('Authentication', () => {
    it('should reject requests without token', async () => {
      const res = await request(app).get('/api/v1/users/profile');
      expect(res.status).toBe(401);
    });
  });
});

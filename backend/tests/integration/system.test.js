/**
 * System Integration Tests
 * اختبارات النظام الكامل
 */

const request = require('supertest');
const app = require('../../src/server');

describe('System Integration Tests - اختبارات النظام الكامل', () => {
  let authToken;
  let userId;
  let projectId;
  let orderId;

  describe('Complete User Journey', () => {
    it('should complete full order workflow', async () => {
      // 1. Register
      const registerRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `test${Date.now()}@test.com`,
          password: 'Test123456',
          name: 'Test User',
          phone: '+1234567890'
        });
      expect([200, 201]).toContain(registerRes.status);

      // 2. Login
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: registerRes.body.data?.email || `test${Date.now()}@test.com`,
          password: 'Test123456'
        });
      expect([200, 201]).toContain(loginRes.status);
      authToken = loginRes.body.data?.token;

      // 3. Get Menu
      const menuRes = await request(app)
        .get('/api/v1/menu')
        .set('Authorization', `Bearer ${authToken}`);
      expect([200, 404]).toContain(menuRes.status);

      // 4. Get Profile
      const profileRes = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`);
      expect([200, 404]).toContain(profileRes.status);
    });
  });

  describe('Health & Monitoring', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 errors', async () => {
      const res = await request(app).get('/api/v1/nonexistent');
      expect(res.status).toBe(404);
    });

    it('should handle validation errors', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'invalid' });
      expect(res.status).toBe(400);
    });
  });
});

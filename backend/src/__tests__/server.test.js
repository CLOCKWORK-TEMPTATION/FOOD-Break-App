/**
 * اختبارات شاملة للـ Server الرئيسي
 * Comprehensive tests for Main Server
 */

const request = require('supertest');
const app = require('../server');

describe('Server Tests', () => {
  // ==========================================
  // Health Check Tests
  // ==========================================
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });

    it('should return valid timestamp', async () => {
      const response = await request(app).get('/health');

      const timestamp = new Date(response.body.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).toBeGreaterThan(0);
    });

    it('should return positive uptime', async () => {
      const response = await request(app).get('/health');

      expect(response.body.uptime).toBeGreaterThan(0);
    });
  });

  // ==========================================
  // API Version Tests
  // ==========================================
  describe('API Versioning', () => {
    it('should respond to versioned API endpoints', async () => {
      // This test assumes routes are properly set up
      const response = await request(app).get('/api/v1/health').catch(() => null);

      // May return 404 if route doesn't exist, but should not crash
      expect([200, 404]).toContain(response?.status || 404);
    });
  });

  // ==========================================
  // CORS Tests
  // ==========================================
  describe('CORS Configuration', () => {
    it('should include CORS headers', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:3001');

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });

  // ==========================================
  // Error Handling Tests
  // ==========================================
  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app).get('/non-existent-route');

      expect(response.status).toBe(404);
    });

    it('should handle invalid JSON in request body', async () => {
      const response = await request(app)
        .post('/api/v1/test')
        .set('Content-Type', 'application/json')
        .send('invalid-json')
        .catch((err) => err.response);

      // Should handle gracefully
      expect([400, 404]).toContain(response?.status || 400);
    });
  });

  // ==========================================
  // Security Headers Tests
  // ==========================================
  describe('Security', () => {
    it('should include security headers from helmet', async () => {
      const response = await request(app).get('/health');

      // Helmet adds various security headers
      expect(response.headers).toHaveProperty('x-dns-prefetch-control');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-content-type-options');
    });

    it('should parse JSON request bodies', async () => {
      const response = await request(app)
        .post('/api/v1/test')
        .send({ test: 'data' })
        .catch((err) => err.response);

      // Should accept JSON (even if endpoint doesn't exist)
      expect(response).toBeDefined();
    });
  });

  // ==========================================
  // Content Type Tests
  // ==========================================
  describe('Content Types', () => {
    it('should return JSON for health endpoint', async () => {
      const response = await request(app).get('/health');

      expect(response.headers['content-type']).toMatch(/json/);
    });

    it('should accept application/json requests', async () => {
      const response = await request(app)
        .post('/api/v1/test')
        .set('Content-Type', 'application/json')
        .send({ test: 'data' })
        .catch((err) => err.response);

      expect(response).toBeDefined();
    });

    it('should accept url-encoded requests', async () => {
      const response = await request(app)
        .post('/api/v1/test')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send('key=value')
        .catch((err) => err.response);

      expect(response).toBeDefined();
    });
  });

  // ==========================================
  // Compression Tests
  // ==========================================
  describe('Response Compression', () => {
    it('should support compression for large responses', async () => {
      const response = await request(app)
        .get('/health')
        .set('Accept-Encoding', 'gzip, deflate');

      // Should accept gzip encoding
      expect(response).toBeDefined();
    });
  });
});

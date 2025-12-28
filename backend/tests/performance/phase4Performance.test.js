/**
 * Phase 4 Performance Tests
 * اختبارات الأداء للمميزات المتقدمة
 */

const request = require('supertest');
const app = require('../../src/server');
const { 
  createTestUser, 
  generateTestToken, 
  cleanupTestData, 
  closePrisma 
} = require('../utils/testHelpers');

describe('Phase 4 Performance Tests', () => {
  let userToken;
  let adminToken;

  beforeAll(async () => {
    const user = await createTestUser({ role: 'REGULAR' });
    const admin = await createTestUser({ role: 'ADMIN' });
    
    userToken = generateTestToken(user.id, 'REGULAR');
    adminToken = generateTestToken(admin.id, 'ADMIN');
  });

  afterAll(async () => {
    await cleanupTestData();
    await closePrisma();
  });

  describe('Voice Processing Performance', () => {
    it('should process voice commands within acceptable time limits', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .post('/api/v1/voice/process')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          audioData: 'base64-audio-data',
          language: 'ar'
        });

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(processingTime).toBeLessThan(3000); // Should process within 3 seconds
    });

    it('should handle multiple concurrent voice requests', async () => {
      const concurrentRequests = 20;
      const requests = [];

      const startTime = Date.now();

      for (let i = 0; i < concurrentRequests; i++) {
        requests.push(
          request(app)
            .post('/api/v1/voice/process')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
              audioData: `audio-data-${i}`,
              language: 'ar'
            })
        );
      }

      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBeLessThan(500);
      });

      // Average processing time should be reasonable
      const averageTime = totalTime / concurrentRequests;
      expect(averageTime).toBeLessThan(5000); // 5 seconds average
    });
  });

  describe('Medical Data Processing Performance', () => {
    it('should encrypt and decrypt medical data efficiently', async () => {
      const largeProfileData = {
        allergies: Array(100).fill('NUTS'), // Large allergy list
        chronicConditions: Array(50).fill('DIABETES'),
        medications: Array(30).fill('INSULIN'),
        consentGiven: true
      };

      const startTime = Date.now();

      const response = await request(app)
        .post('/api/v1/medical/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send(largeProfileData);

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(processingTime).toBeLessThan(2000); // Should encrypt within 2 seconds
    });

    it('should perform medical alerts checking quickly', async () => {
      const largeIngredientsList = Array(200).fill().map((_, i) => `INGREDIENT_${i}`);

      const startTime = Date.now();

      const response = await request(app)
        .post('/api/v1/medical/check-item')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          ingredients: largeIngredientsList
        });

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(processingTime).toBeLessThan(1500); // Should check within 1.5 seconds
    });
  });

  describe('Emergency System Performance', () => {
    it('should activate emergency mode quickly', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .post('/api/v1/emergency/activate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          projectId: 'test-project',
          emergencyType: 'SCHEDULE_CHANGE',
          reason: 'Performance test'
        });

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(processingTime).toBeLessThan(1000); // Should activate within 1 second
    });

    it('should handle emergency restaurant search efficiently', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/api/v1/emergency/restaurants')
        .set('Authorization', `Bearer ${userToken}`)
        .query({
          latitude: 30.0444,
          longitude: 31.2357,
          radius: 10000
        });

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(processingTime).toBeLessThan(800); // Should search within 0.8 seconds
    });
  });

  describe('Database Query Performance', () => {
    it('should handle complex medical profile queries efficiently', async () => {
      // Create multiple medical profiles first
      const profileCreationPromises = [];
      for (let i = 0; i < 50; i++) {
        const user = await createTestUser({ email: `perf-test-${i}@test.com` });
        const token = generateTestToken(user.id);
        
        profileCreationPromises.push(
          request(app)
            .post('/api/v1/medical/profile')
            .set('Authorization', `Bearer ${token}`)
            .send({
              allergies: ['NUTS', 'DAIRY'],
              consentGiven: true
            })
        );
      }

      await Promise.all(profileCreationPromises);

      // Now test query performance
      const startTime = Date.now();

      const response = await request(app)
        .get('/api/v1/medical/incidents')
        .set('Authorization', `Bearer ${userToken}`)
        .query({
          page: 1,
          limit: 100
        });

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(queryTime).toBeLessThan(500); // Should query within 0.5 seconds
    });
  });

  describe('Memory Usage Tests', () => {
    it('should not cause memory leaks during intensive operations', async () => {
      const initialMemory = process.memoryUsage();

      // Perform 100 intensive operations
      const operations = [];
      for (let i = 0; i < 100; i++) {
        operations.push(
          request(app)
            .post('/api/v1/voice/process')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
              audioData: `large-audio-data-${i}`.repeat(100),
              language: 'ar'
            })
        );
      }

      await Promise.all(operations);

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      // Memory increase should be reasonable (less than 100MB)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    });
  });

  describe('API Response Time Benchmarks', () => {
    const endpoints = [
      { method: 'GET', path: '/api/v1/voice/preferences', token: 'user' },
      { method: 'GET', path: '/api/v1/medical/profile', token: 'user' },
      { method: 'GET', path: '/api/v1/emergency/inventory?projectId=test', token: 'user' },
      { method: 'POST', path: '/api/v1/voice/text-to-speech', token: 'user', body: { text: 'test', language: 'ar' } },
      { method: 'POST', path: '/api/v1/medical/check-item', token: 'user', body: { ingredients: ['CHICKEN'] } }
    ];

    endpoints.forEach(endpoint => {
      it(`should respond to ${endpoint.method} ${endpoint.path} within acceptable time`, async () => {
        const token = endpoint.token === 'admin' ? adminToken : userToken;
        const startTime = Date.now();

        let response;
        if (endpoint.method === 'GET') {
          response = await request(app)
            .get(endpoint.path)
            .set('Authorization', `Bearer ${token}`);
        } else {
          response = await request(app)
            .post(endpoint.path)
            .set('Authorization', `Bearer ${token}`)
            .send(endpoint.body || {});
        }

        const endTime = Date.now();
        const responseTime = endTime - startTime;

        expect(response.status).toBeLessThan(500);
        expect(responseTime).toBeLessThan(2000); // All endpoints should respond within 2 seconds
      });
    });
  });

  describe('Stress Testing', () => {
    it('should handle high load without degrading significantly', async () => {
      const highLoadRequests = 100;
      const requests = [];
      const responseTimes = [];

      for (let i = 0; i < highLoadRequests; i++) {
        const startTime = Date.now();
        
        const requestPromise = request(app)
          .get('/api/v1/voice/preferences')
          .set('Authorization', `Bearer ${userToken}`)
          .then(response => {
            const endTime = Date.now();
            responseTimes.push(endTime - startTime);
            return response;
          });

        requests.push(requestPromise);
      }

      const responses = await Promise.all(requests);

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Calculate performance metrics
      const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      const minResponseTime = Math.min(...responseTimes);

      console.log(`Performance Metrics:
        - Average Response Time: ${averageResponseTime}ms
        - Max Response Time: ${maxResponseTime}ms
        - Min Response Time: ${minResponseTime}ms
        - Total Requests: ${highLoadRequests}
      `);

      // Performance assertions
      expect(averageResponseTime).toBeLessThan(3000); // 3 seconds average
      expect(maxResponseTime).toBeLessThan(10000); // 10 seconds max
    });
  });
});
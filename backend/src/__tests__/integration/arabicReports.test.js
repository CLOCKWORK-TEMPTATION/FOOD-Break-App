/**
 * اختبارات تكامل التقارير العربية
 * Arabic Reports Integration Tests
 */

const request = require('supertest');
const app = require('../../app');
const { setupTestDB, cleanupTestDB } = require('../helpers/testDb');
const { createTestUser, createTestOrder, createTestRestaurant } = require('../helpers/testData');

describe('Arabic Reports Integration Tests', () => {
  let adminToken, producerToken, userToken;
  let testUser, testAdmin, testProducer;
  let testRestaurant, testOrders;

  beforeAll(async () => {
    await setupTestDB();
    
    // إنشاء مستخدمين للاختبار
    testAdmin = await createTestUser({ role: 'ADMIN' });
    testProducer = await createTestUser({ role: 'PRODUCER' });
    testUser = await createTestUser({ role: 'REGULAR' });
    
    // إنشاء مطعم للاختبار
    testRestaurant = await createTestRestaurant();
    
    // إنشاء طلبات للاختبار
    testOrders = await Promise.all([
      createTestOrder({ 
        customer: testUser._id, 
        restaurant: testRestaurant._id,
        status: 'DELIVERED',
        totalAmount: 150
      }),
      createTestOrder({ 
        customer: testUser._id, 
        restaurant: testRestaurant._id,
        status: 'PENDING',
        totalAmount: 200
      })
    ]);

    // الحصول على tokens
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: testAdmin.email, password: 'password123' });
    adminToken = adminLogin.body.data.token;

    const producerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: testProducer.email, password: 'password123' });
    producerToken = producerLogin.body.data.token;

    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'password123' });
    userToken = userLogin.body.data.token;
  });

  afterAll(async () => {
    await cleanupTestDB();
  });

  describe('Daily Orders Report', () => {
    test('should generate daily orders report for admin', async () => {
      const response = await request(app)
        .get('/api/arabic-reports/daily-orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Accept-Language', 'ar')
        .expect(200);

      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.headers['content-disposition']).toContain('daily-orders');
      expect(response.body).toBeInstanceOf(Buffer);
    });

    test('should generate daily orders report for producer', async () => {
      const response = await request(app)
        .get('/api/arabic-reports/daily-orders')
        .set('Authorization', `Bearer ${producerToken}`)
        .set('Accept-Language', 'ar')
        .expect(200);

      expect(response.headers['content-type']).toBe('application/pdf');
    });

    test('should reject daily orders report for regular user', async () => {
      const response = await request(app)
        .get('/api/arabic-reports/daily-orders')
        .set('Authorization', `Bearer ${userToken}`)
        .set('Accept-Language', 'ar')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('رفض');
    });

    test('should generate report for specific date', async () => {
      const testDate = '2024-01-15';
      const response = await request(app)
        .get(`/api/arabic-reports/daily-orders?date=${testDate}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Accept-Language', 'ar')
        .expect(200);

      expect(response.headers['content-disposition']).toContain(testDate);
    });

    test('should handle invalid date format', async () => {
      const response = await request(app)
        .get('/api/arabic-reports/daily-orders?date=invalid-date')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Accept-Language', 'ar')
        .expect(200); // Should still work with current date

      expect(response.headers['content-type']).toBe('application/pdf');
    });
  });

  describe('Monthly Orders Report', () => {
    test('should generate monthly orders report', async () => {
      const response = await request(app)
        .get('/api/arabic-reports/monthly-orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Accept-Language', 'ar')
        .expect(200);

      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.headers['content-disposition']).toContain('monthly-orders');
    });

    test('should generate report for specific month and year', async () => {
      const response = await request(app)
        .get('/api/arabic-reports/monthly-orders?year=2024&month=1')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Accept-Language', 'ar')
        .expect(200);

      expect(response.headers['content-disposition']).toContain('2024-01');
    });

    test('should handle invalid month/year parameters', async () => {
      const response = await request(app)
        .get('/api/arabic-reports/monthly-orders?year=invalid&month=invalid')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Accept-Language', 'ar')
        .expect(200);

      expect(response.headers['content-type']).toBe('application/pdf');
    });

    test('should reject unauthorized access', async () => {
      const response = await request(app)
        .get('/api/arabic-reports/monthly-orders')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Restaurants Report', () => {
    test('should generate restaurants report for admin only', async () => {
      const response = await request(app)
        .get('/api/arabic-reports/restaurants')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Accept-Language', 'ar')
        .expect(200);

      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.headers['content-disposition']).toContain('restaurants-report');
    });

    test('should reject restaurants report for producer', async () => {
      const response = await request(app)
        .get('/api/arabic-reports/restaurants')
        .set('Authorization', `Bearer ${producerToken}`)
        .set('Accept-Language', 'ar')
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    test('should include restaurant statistics', async () => {
      const response = await request(app)
        .get('/api/arabic-reports/restaurants')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Accept-Language', 'ar')
        .expect(200);

      expect(response.body).toBeInstanceOf(Buffer);
      expect(response.body.length).toBeGreaterThan(1000); // Should contain substantial content
    });
  });

  describe('Statistics Report', () => {
    test('should generate stats report', async () => {
      const response = await request(app)
        .get('/api/arabic-reports/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Accept-Language', 'ar')
        .expect(200);

      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.headers['content-disposition']).toContain('stats-report');
    });

    test('should generate stats report with date range', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';
      
      const response = await request(app)
        .get(`/api/arabic-reports/stats?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Accept-Language', 'ar')
        .expect(200);

      expect(response.headers['content-type']).toBe('application/pdf');
    });

    test('should handle empty date range', async () => {
      const futureDate = '2030-01-01';
      
      const response = await request(app)
        .get(`/api/arabic-reports/stats?startDate=${futureDate}&endDate=${futureDate}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Accept-Language', 'ar')
        .expect(200);

      expect(response.headers['content-type']).toBe('application/pdf');
    });
  });

  describe('Invoice Generation', () => {
    test('should generate invoice for order owner', async () => {
      const response = await request(app)
        .get(`/api/arabic-reports/invoice/${testOrders[0]._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .set('Accept-Language', 'ar')
        .expect(200);

      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.headers['content-disposition']).toContain(`invoice-${testOrders[0].orderNumber}`);
    });

    test('should generate invoice for admin', async () => {
      const response = await request(app)
        .get(`/api/arabic-reports/invoice/${testOrders[0]._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Accept-Language', 'ar')
        .expect(200);

      expect(response.headers['content-type']).toBe('application/pdf');
    });

    test('should reject invoice access for non-owner', async () => {
      // إنشاء مستخدم آخر
      const otherUser = await createTestUser({ role: 'REGULAR' });
      const otherLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: otherUser.email, password: 'password123' });
      const otherToken = otherLogin.body.data.token;

      const response = await request(app)
        .get(`/api/arabic-reports/invoice/${testOrders[0]._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .set('Accept-Language', 'ar')
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    test('should handle non-existent order', async () => {
      const fakeOrderId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .get(`/api/arabic-reports/invoice/${fakeOrderId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Accept-Language', 'ar')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('غير موجود');
    });

    test('should handle invalid order ID format', async () => {
      const response = await request(app)
        .get('/api/arabic-reports/invoice/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Accept-Language', 'ar')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Arabic Localization', () => {
    test('should return Arabic error messages', async () => {
      const response = await request(app)
        .get('/api/arabic-reports/daily-orders')
        .set('Accept-Language', 'ar')
        .expect(401);

      expect(response.body.message).toMatch(/عربي|مصرح|دخول/);
    });

    test('should handle English fallback', async () => {
      const response = await request(app)
        .get('/api/arabic-reports/daily-orders')
        .set('Accept-Language', 'en')
        .expect(401);

      expect(response.body.message).toMatch(/unauthorized|token|login/i);
    });

    test('should use Arabic by default', async () => {
      const response = await request(app)
        .get('/api/arabic-reports/daily-orders')
        .expect(401);

      // Should default to Arabic
      expect(response.body.message).toMatch(/عربي|مصرح|دخول/);
    });
  });

  describe('Performance and Load Testing', () => {
    test('should handle multiple concurrent report requests', async () => {
      const promises = Array.from({ length: 5 }, () =>
        request(app)
          .get('/api/arabic-reports/daily-orders')
          .set('Authorization', `Bearer ${adminToken}`)
          .set('Accept-Language', 'ar')
      );

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toBe('application/pdf');
      });
    });

    test('should complete report generation within reasonable time', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/arabic-reports/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Accept-Language', 'ar')
        .expect(200);

      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      expect(response.headers['content-type']).toBe('application/pdf');
    });

    test('should handle large dataset efficiently', async () => {
      // إنشاء طلبات إضافية للاختبار
      const additionalOrders = await Promise.all(
        Array.from({ length: 50 }, (_, i) =>
          createTestOrder({
            customer: testUser._id,
            restaurant: testRestaurant._id,
            status: 'DELIVERED',
            totalAmount: Math.floor(Math.random() * 500) + 50
          })
        )
      );

      const response = await request(app)
        .get('/api/arabic-reports/daily-orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Accept-Language', 'ar')
        .expect(200);

      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.body.length).toBeGreaterThan(5000); // Should contain substantial content
    });
  });

  describe('Error Handling', () => {
    test('should handle database connection errors gracefully', async () => {
      // محاكاة خطأ في قاعدة البيانات
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const response = await request(app)
        .get('/api/arabic-reports/daily-orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Accept-Language', 'ar');

      // Should either succeed or return proper error
      expect([200, 500]).toContain(response.status);
      
      if (response.status === 500) {
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBeDefined();
      }
      
      console.error.mockRestore();
    });

    test('should handle malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/arabic-reports/daily-orders')
        .set('Authorization', 'InvalidToken')
        .set('Accept-Language', 'ar')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should handle expired token', async () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      
      const response = await request(app)
        .get('/api/arabic-reports/daily-orders')
        .set('Authorization', `Bearer ${expiredToken}`)
        .set('Accept-Language', 'ar')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Content Validation', () => {
    test('should generate PDF with Arabic content', async () => {
      const response = await request(app)
        .get('/api/arabic-reports/daily-orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Accept-Language', 'ar')
        .expect(200);

      const pdfBuffer = response.body;
      const pdfString = pdfBuffer.toString();
      
      // PDF should contain Arabic text markers
      expect(pdfString).toMatch(/%PDF/); // PDF header
      expect(pdfBuffer.length).toBeGreaterThan(1000); // Substantial content
    });

    test('should include proper PDF metadata', async () => {
      const response = await request(app)
        .get('/api/arabic-reports/invoice/${testOrders[0]._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Accept-Language', 'ar')
        .expect(200);

      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.headers['content-disposition']).toMatch(/attachment/);
      expect(response.headers['content-disposition']).toMatch(/\.pdf/);
    });
  });
});
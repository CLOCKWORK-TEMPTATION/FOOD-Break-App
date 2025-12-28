/**
 * Emergency API Integration Tests
 * اختبارات تكامل API الطوارئ - Phase 4 Feature
 */

const request = require('supertest');
const app = require('../../../src/server');
const { 
  createTestUser, 
  createTestProject, 
  generateTestToken, 
  cleanupTestData, 
  closePrisma 
} = require('../../utils/testHelpers');

describe('Emergency API - Integration Tests', () => {
  let adminUser, regularUser, adminToken, userToken, testProject;

  beforeAll(async () => {
    // إنشاء مستخدمين للاختبار
    adminUser = await createTestUser({ role: 'ADMIN' });
    regularUser = await createTestUser({ role: 'REGULAR' });
    
    // إنشاء مشروع للاختبار
    testProject = await createTestProject({ name: 'Emergency Test Project' });
    
    // إنشاء tokens
    adminToken = generateTestToken(adminUser.id, 'ADMIN');
    userToken = generateTestToken(regularUser.id, 'REGULAR');
  });

  afterAll(async () => {
    await cleanupTestData();
    await closePrisma();
  });

  describe('POST /api/v1/emergency/activate', () => {
    it('should activate emergency mode successfully (Admin)', async () => {
      const emergencyData = {
        projectId: testProject.id,
        emergencyType: 'SCHEDULE_CHANGE',
        reason: 'Urgent schedule change required',
        estimatedDuration: 120
      };

      const response = await request(app)
        .post('/api/v1/emergency/activate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(emergencyData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        projectId: testProject.id,
        emergencyType: 'SCHEDULE_CHANGE',
        isActive: true
      });
      expect(response.body.message).toContain('تم تفعيل وضع الطوارئ');
    });

    it('should reject activation by regular user', async () => {
      const emergencyData = {
        projectId: testProject.id,
        emergencyType: 'MEDICAL'
      };

      const response = await request(app)
        .post('/api/v1/emergency/activate')
        .set('Authorization', `Bearer ${userToken}`)
        .send(emergencyData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('غير مصرح');
    });

    it('should validate emergency type', async () => {
      const emergencyData = {
        projectId: testProject.id,
        emergencyType: 'INVALID_TYPE'
      };

      const response = await request(app)
        .post('/api/v1/emergency/activate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(emergencyData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should require authentication', async () => {
      const emergencyData = {
        projectId: testProject.id,
        emergencyType: 'TECHNICAL'
      };

      await request(app)
        .post('/api/v1/emergency/activate')
        .send(emergencyData)
        .expect(401);
    });
  });

  describe('POST /api/v1/emergency/orders', () => {
    beforeEach(async () => {
      // تفعيل وضع الطوارئ قبل كل اختبار
      await request(app)
        .post('/api/v1/emergency/activate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          projectId: testProject.id,
          emergencyType: 'SCHEDULE_CHANGE'
        });
    });

    it('should create emergency order successfully', async () => {
      const orderData = {
        projectId: testProject.id,
        urgencyLevel: 'HIGH',
        specialInstructions: 'Urgent delivery needed',
        deliveryLocation: {
          address: '123 Emergency Street',
          latitude: 30.0444,
          longitude: 31.2357
        }
      };

      const response = await request(app)
        .post('/api/v1/emergency/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(orderData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        projectId: testProject.id,
        urgencyLevel: 'HIGH',
        status: 'URGENT_PENDING'
      });
      expect(response.body.data.estimatedDeliveryTime).toBeLessThan(30); // High priority = fast delivery
    });

    it('should validate urgency level', async () => {
      const orderData = {
        projectId: testProject.id,
        urgencyLevel: 'INVALID_LEVEL'
      };

      const response = await request(app)
        .post('/api/v1/emergency/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(orderData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should require active emergency mode', async () => {
      // إلغاء تفعيل وضع الطوارئ
      await request(app)
        .post('/api/v1/emergency/deactivate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ projectId: testProject.id });

      const orderData = {
        projectId: testProject.id,
        urgencyLevel: 'MEDIUM'
      };

      const response = await request(app)
        .post('/api/v1/emergency/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(orderData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('emergency mode');
    });
  });

  describe('GET /api/v1/emergency/restaurants', () => {
    it('should return emergency restaurants within radius', async () => {
      const response = await request(app)
        .get('/api/v1/emergency/restaurants')
        .set('Authorization', `Bearer ${userToken}`)
        .query({
          latitude: 30.0444,
          longitude: 31.2357,
          radius: 5000
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // التحقق من أن المطاعم مرتبة حسب وقت الاستجابة
      const restaurants = response.body.data;
      if (restaurants.length > 1) {
        for (let i = 1; i < restaurants.length; i++) {
          expect(restaurants[i].emergencyResponseTime)
            .toBeGreaterThanOrEqual(restaurants[i-1].emergencyResponseTime);
        }
      }
    });

    it('should validate coordinates', async () => {
      const response = await request(app)
        .get('/api/v1/emergency/restaurants')
        .set('Authorization', `Bearer ${userToken}`)
        .query({
          latitude: 'invalid',
          longitude: 'invalid'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should use default radius if not provided', async () => {
      const response = await request(app)
        .get('/api/v1/emergency/restaurants')
        .set('Authorization', `Bearer ${userToken}`)
        .query({
          latitude: 30.0444,
          longitude: 31.2357
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/emergency/inventory', () => {
    it('should return pre-prepared inventory', async () => {
      const response = await request(app)
        .get('/api/v1/emergency/inventory')
        .set('Authorization', `Bearer ${userToken}`)
        .query({ projectId: testProject.id })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // التحقق من أن العناصر غير منتهية الصلاحية
      response.body.data.forEach(item => {
        if (item.expiryDate) {
          expect(new Date(item.expiryDate)).toBeInstanceOf(Date);
          expect(new Date(item.expiryDate).getTime()).toBeGreaterThan(Date.now());
        }
      });
    });

    it('should require project ID', async () => {
      const response = await request(app)
        .get('/api/v1/emergency/inventory')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /api/v1/emergency/inventory', () => {
    it('should add item to pre-prepared inventory (Admin)', async () => {
      const inventoryItem = {
        projectId: testProject.id,
        itemName: 'Emergency Sandwich',
        quantity: 50,
        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        storageLocation: 'Fridge A'
      };

      const response = await request(app)
        .post('/api/v1/emergency/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(inventoryItem)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        projectId: testProject.id,
        itemName: 'Emergency Sandwich',
        quantity: 50
      });
    });

    it('should reject addition by regular user', async () => {
      const inventoryItem = {
        projectId: testProject.id,
        itemName: 'Emergency Sandwich',
        quantity: 50
      };

      const response = await request(app)
        .post('/api/v1/emergency/inventory')
        .set('Authorization', `Bearer ${userToken}`)
        .send(inventoryItem)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should validate quantity', async () => {
      const inventoryItem = {
        projectId: testProject.id,
        itemName: 'Emergency Sandwich',
        quantity: -5 // Invalid negative quantity
      };

      const response = await request(app)
        .post('/api/v1/emergency/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(inventoryItem)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /api/v1/emergency/history', () => {
    it('should return emergency history with pagination (Admin)', async () => {
      const response = await request(app)
        .get('/api/v1/emergency/history')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          projectId: testProject.id,
          page: 1,
          limit: 10
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: expect.any(Number),
        totalPages: expect.any(Number)
      });
    });

    it('should filter by date range', async () => {
      const startDate = new Date('2024-01-01').toISOString();
      const endDate = new Date('2024-12-31').toISOString();

      const response = await request(app)
        .get('/api/v1/emergency/history')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          projectId: testProject.id,
          startDate,
          endDate
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // التحقق من أن جميع النتائج ضمن النطاق الزمني
      response.body.data.forEach(emergency => {
        const createdAt = new Date(emergency.createdAt);
        expect(createdAt.getTime()).toBeGreaterThanOrEqual(new Date(startDate).getTime());
        expect(createdAt.getTime()).toBeLessThanOrEqual(new Date(endDate).getTime());
      });
    });

    it('should reject access by regular user', async () => {
      const response = await request(app)
        .get('/api/v1/emergency/history')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/emergency/schedule-change', () => {
    it('should send schedule change notification (Admin)', async () => {
      const changeData = {
        projectId: testProject.id,
        changeType: 'DELAY',
        newSchedule: {
          deliveryTime: '14:00',
          estimatedDelay: 30
        },
        reason: 'Traffic congestion',
        affectedMeals: ['LUNCH']
      };

      const response = await request(app)
        .post('/api/v1/emergency/schedule-change')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(changeData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        projectId: testProject.id,
        changeType: 'DELAY'
      });
      expect(response.body.data.sentTo).toBeGreaterThan(0);
    });

    it('should validate change type', async () => {
      const changeData = {
        projectId: testProject.id,
        changeType: 'INVALID_TYPE'
      };

      const response = await request(app)
        .post('/api/v1/emergency/schedule-change')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(changeData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /api/v1/emergency/deactivate', () => {
    beforeEach(async () => {
      // تفعيل وضع الطوارئ قبل كل اختبار
      await request(app)
        .post('/api/v1/emergency/activate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          projectId: testProject.id,
          emergencyType: 'TECHNICAL'
        });
    });

    it('should deactivate emergency mode successfully (Admin)', async () => {
      const deactivationData = {
        projectId: testProject.id,
        reason: 'Emergency resolved successfully'
      };

      const response = await request(app)
        .post('/api/v1/emergency/deactivate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(deactivationData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('تم إلغاء تفعيل وضع الطوارئ');
    });

    it('should reject deactivation by regular user', async () => {
      const deactivationData = {
        projectId: testProject.id,
        reason: 'Emergency resolved'
      };

      const response = await request(app)
        .post('/api/v1/emergency/deactivate')
        .set('Authorization', `Bearer ${userToken}`)
        .send(deactivationData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});
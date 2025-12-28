/**
 * Integration Tests - Orders API
 * Why: اختبار مسارات الطلبات بشكل متكامل
 */

const request = require('supertest');
const app = require('../../../src/server');
const { 
  createTestUser, 
  createTestRestaurant, 
  createTestMenuItem,
  createTestOrder,
  cleanupTestData, 
  closePrisma, 
  generateTestToken 
} = require('../../utils/testHelpers');

describe('Orders API - Integration Tests', () => {
  let testUser;
  let testRestaurant;
  let testMenuItem;
  let authToken;

  beforeAll(async () => {
    await cleanupTestData();
  });

  beforeEach(async () => {
    testUser = await createTestUser();
    testRestaurant = await createTestRestaurant();
    testMenuItem = await createTestMenuItem({ restaurantId: testRestaurant.id });
    authToken = generateTestToken(testUser.id, testUser.role);
  });

  afterAll(async () => {
    await cleanupTestData();
    await closePrisma();
  });

  describe('POST /api/v1/orders', () => {
    test('should create order successfully', async () => {
      const orderData = {
        restaurantId: testRestaurant.id,
        items: [
          {
            menuItemId: testMenuItem.id,
            quantity: 2
          }
        ],
        totalAmount: testMenuItem.price * 2
      };

      const response = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('order');
      expect(response.body.data.order).toHaveProperty('id');
      expect(response.body.data.order.userId).toBe(testUser.id);
    });

    test('should reject order without authentication', async () => {
      const orderData = {
        restaurantId: testRestaurant.id,
        items: [{ menuItemId: testMenuItem.id, quantity: 1 }]
      };

      const response = await request(app)
        .post('/api/v1/orders')
        .send(orderData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should validate order data', async () => {
      const response = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/orders', () => {
    beforeEach(async () => {
      await createTestOrder({ userId: testUser.id, restaurantId: testRestaurant.id });
    });

    test('should return user orders', async () => {
      const response = await request(app)
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    test('should filter orders by status', async () => {
      const response = await request(app)
        .get('/api/v1/orders?status=PENDING')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/orders/:id', () => {
    let testOrder;

    beforeEach(async () => {
      testOrder = await createTestOrder({ userId: testUser.id, restaurantId: testRestaurant.id });
    });

    test('should return order by id', async () => {
      const response = await request(app)
        .get(`/api/v1/orders/${testOrder.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id', testOrder.id);
    });

    test('should reject access to other user order', async () => {
      const otherUser = await createTestUser();
      const otherToken = generateTestToken(otherUser.id, otherUser.role);

      const response = await request(app)
        .get(`/api/v1/orders/${testOrder.id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/orders/:id/status', () => {
    let testOrder;

    beforeEach(async () => {
      testOrder = await createTestOrder({ userId: testUser.id, restaurantId: testRestaurant.id });
    });

    test('should update order status', async () => {
      const response = await request(app)
        .patch(`/api/v1/orders/${testOrder.id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'CONFIRMED' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('status', 'CONFIRMED');
    });
  });
});

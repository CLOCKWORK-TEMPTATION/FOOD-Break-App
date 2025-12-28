/**
 * Integration Tests - Payments API
 * Why: اختبار مسارات المدفوعات بشكل متكامل
 */

const request = require('supertest');
const app = require('../../../src/server');
const { createTestUser, cleanupTestData, closePrisma, generateTestToken } = require('../../utils/testHelpers');

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn(() => ({
    paymentIntents: {
      create: jest.fn().mockResolvedValue({
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret',
        status: 'requires_payment_method',
        amount: 5000,
        currency: 'egp'
      }),
      retrieve: jest.fn().mockResolvedValue({
        id: 'pi_test_123',
        status: 'succeeded',
        amount: 5000,
        currency: 'egp',
        payment_method: 'pm_test_123'
      })
    },
    refunds: {
      create: jest.fn().mockResolvedValue({
        id: 're_test_123',
        amount: 5000,
        status: 'succeeded'
      })
    },
    webhooks: {
      constructEvent: jest.fn().mockReturnValue({
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_123',
            status: 'succeeded'
          }
        }
      })
    }
  }));
});

describe('Payments API - Integration Tests', () => {
  let testUser;
  let authToken;

  beforeAll(async () => {
    await cleanupTestData();
  });

  beforeEach(async () => {
    testUser = await createTestUser();
    authToken = generateTestToken(testUser.id, testUser.role);
  });

  afterAll(async () => {
    await cleanupTestData();
    await closePrisma();
  });

  describe('POST /api/v1/payments/create-intent', () => {
    test('should create payment intent successfully', async () => {
      const response = await request(app)
        .post('/api/v1/payments/create-intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 50.0,
          currency: 'egp'
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('clientSecret');
      expect(response.body.data).toHaveProperty('paymentId');
    });

    test('should reject invalid amount', async () => {
      const response = await request(app)
        .post('/api/v1/payments/create-intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: -10,
          currency: 'egp'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .post('/api/v1/payments/create-intent')
        .send({
          amount: 50.0
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/payments/confirm', () => {
    test('should confirm payment successfully', async () => {
      // First create a payment intent
      const createResponse = await request(app)
        .post('/api/v1/payments/create-intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 50.0,
          currency: 'egp'
        })
        .expect(201);

      const paymentIntentId = 'pi_test_123';

      const response = await request(app)
        .post('/api/v1/payments/confirm')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          paymentIntentId
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('status');
    });
  });

  describe('GET /api/v1/payments', () => {
    test('should return user payments', async () => {
      const response = await request(app)
        .get('/api/v1/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    test('should filter payments by status', async () => {
      const response = await request(app)
        .get('/api/v1/payments?status=COMPLETED')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/v1/payments/invoices', () => {
    test('should create invoice successfully', async () => {
      // This test would require an order or payment to exist
      // Implementation depends on your test data setup
    });
  });
});

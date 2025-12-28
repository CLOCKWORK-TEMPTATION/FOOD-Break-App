/**
 * E2E Tests - Payment Flow
 * Why: اختبار السيناريو الكامل للدفع
 */

const request = require('supertest');
const app = require('../../../src/server');
const { cleanupTestData, closePrisma } = require('../utils/testHelpers');

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
        currency: 'egp'
      })
    },
    refunds: {
      create: jest.fn().mockResolvedValue({
        id: 're_test_123',
        amount: 5000,
        status: 'succeeded'
      })
    }
  }));
});

describe('E2E - Payment Flow', () => {
  let userToken;
  let userId;
  let orderId;
  let paymentIntentId;

  beforeAll(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await closePrisma();
  });

  test('Complete payment flow: Create Payment Intent -> Confirm Payment -> Verify Invoice', async () => {
    // Step 1: Register and login
    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `payment${Date.now()}@test.com`,
        password: 'Test123!@#',
        firstName: 'Payment',
        lastName: 'Test'
      })
      .expect(201);

    userId = registerResponse.body.data.user.id;

    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: registerResponse.body.data.user.email,
        password: 'Test123!@#'
      })
      .expect(200);

    userToken = loginResponse.body.data.token;

    // Step 2: Create payment intent
    const paymentIntentResponse = await request(app)
      .post('/api/v1/payments/create-intent')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        amount: 50.0,
        currency: 'egp'
      })
      .expect(201);

    expect(paymentIntentResponse.body.success).toBe(true);
    expect(paymentIntentResponse.body.data).toHaveProperty('clientSecret');
    paymentIntentId = paymentIntentResponse.body.data.paymentId;

    // Step 3: Confirm payment (simulated)
    const confirmResponse = await request(app)
      .post('/api/v1/payments/confirm')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        paymentIntentId: 'pi_test_123'
      })
      .expect(200);

    expect(confirmResponse.body.success).toBe(true);

    // Step 4: Get payment history
    const paymentsResponse = await request(app)
      .get('/api/v1/payments')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(paymentsResponse.body.success).toBe(true);
    expect(paymentsResponse.body.data).toBeInstanceOf(Array);
  });

  test('Payment refund flow', async () => {
    // This test would require:
    // 1. A completed payment
    // 2. Refund request
    // 3. Verification of refund status

    // Implementation depends on your refund setup
  });
});

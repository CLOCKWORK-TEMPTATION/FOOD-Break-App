/**
 * Integration Tests - Auth API
 * Why: اختبار مسارات المصادقة بشكل متكامل
 */

const request = require('supertest');
const app = require('../../../src/server');
const { createTestUser, cleanupTestData, closePrisma, generateTestToken } = require('../../utils/testHelpers');

describe('Auth API - Integration Tests', () => {
  let testUser;

  beforeAll(async () => {
    // تنظيف قاعدة البيانات
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await closePrisma();
  });

  describe('POST /api/v1/auth/register', () => {
    test('should register new user successfully', async () => {
      const userData = {
        email: `test${Date.now()}@test.com`,
        password: 'Test123!@#',
        firstName: 'Test',
        lastName: 'User'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    test('should reject duplicate email', async () => {
      const userData = {
        email: `duplicate${Date.now()}@test.com`,
        password: 'Test123!@#',
        firstName: 'Test',
        lastName: 'User'
      };

      // التسجيل الأول
      await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      // محاولة التسجيل مرة أخرى
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'test@test.com' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      testUser = await createTestUser({
        email: `login${Date.now()}@test.com`,
        passwordHash: require('bcryptjs').hashSync('Test123!@#', 10)
      });
    });

    test('should login with correct credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'Test123!@#'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
    });

    test('should reject incorrect password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should reject non-existent user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'Test123!@#'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    beforeEach(async () => {
      testUser = await createTestUser();
    });

    test('should return current user with valid token', async () => {
      const token = generateTestToken(testUser.id, testUser.role);

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id', testUser.id);
      expect(response.body.data).toHaveProperty('email', testUser.email);
    });

    test('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});

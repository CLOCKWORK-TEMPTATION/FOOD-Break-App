/**
 * اختبارات Integration Tests لـ Auth API Routes
 * Integration Tests for Authentication API Routes
 */

const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const app = require('../../server');
const { hashPassword } = require('../../utils/password');
const { generateToken } = require('../../utils/jwt');

// Mock Prisma
jest.mock('@prisma/client');
jest.mock('../../utils/logger');
jest.mock('../../jobs', () => ({ startJobs: jest.fn() }));
jest.mock('../../services/reminderSchedulerService', () => ({
  initialize: jest.fn(),
  stopAll: jest.fn()
}));
jest.mock('../../utils/monitoring', () => ({ initMonitoring: jest.fn() }));

describe('Auth Routes - Integration Tests', () => {
  let mockPrisma;

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret-key';
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    PrismaClient.mockImplementation(() => mockPrisma);
  });

  // ==========================================
  // POST /api/v1/auth/register
  // ==========================================
  describe('POST /api/v1/auth/register', () => {
    const validRegistrationData = {
      email: 'test@example.com',
      password: 'SecurePass123!',
      firstName: 'أحمد',
      lastName: 'محمد',
      phoneNumber: '+966501234567',
      role: 'REGULAR'
    };

    it('يجب أن يسجل مستخدم جديد بنجاح', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-123',
        email: validRegistrationData.email,
        firstName: validRegistrationData.firstName,
        lastName: validRegistrationData.lastName,
        role: 'REGULAR',
        isActive: true,
        createdAt: new Date()
      });

      // Act
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(validRegistrationData)
        .expect('Content-Type', /json/)
        .expect(201);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user.email).toBe(validRegistrationData.email);
    });

    it('يجب أن يرفض تسجيل بريد إلكتروني غير صالح', async () => {
      // Act
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...validRegistrationData,
          email: 'invalid-email'
        })
        .expect('Content-Type', /json/)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('يجب أن يرفض كلمة مرور قصيرة جداً', async () => {
      // Act
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...validRegistrationData,
          password: '123'
        })
        .expect('Content-Type', /json/)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
    });

    it('يجب أن يرفض بيانات ناقصة', async () => {
      // Act
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123'
          // missing firstName and lastName
        })
        .expect('Content-Type', /json/)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
    });

    it('يجب أن يرفض دور غير صالح', async () => {
      // Act
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...validRegistrationData,
          role: 'INVALID_ROLE'
        })
        .expect('Content-Type', /json/)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
    });

    it('يجب أن يرفض بريد إلكتروني مكرر', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'existing-user',
        email: validRegistrationData.email
      });

      // Act
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(validRegistrationData)
        .expect('Content-Type', /json/)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('مستخدم');
    });

    it('يجب أن يطبع البيانات بشكل صحيح (normalize)', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com', // normalized
        firstName: 'أحمد',
        lastName: 'محمد',
        role: 'REGULAR',
        isActive: true,
        createdAt: new Date()
      });

      // Act
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...validRegistrationData,
          email: 'TEST@EXAMPLE.COM' // will be normalized
        })
        .expect(201);

      // Assert
      expect(response.body.success).toBe(true);
    });
  });

  // ==========================================
  // POST /api/v1/auth/login
  // ==========================================
  describe('POST /api/v1/auth/login', () => {
    const loginCredentials = {
      email: 'test@example.com',
      password: 'SecurePass123!'
    };

    it('يجب أن ينجح تسجيل الدخول ببيانات صحيحة', async () => {
      // Arrange
      const hashedPassword = await hashPassword(loginCredentials.password);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email: loginCredentials.email,
        passwordHash: hashedPassword,
        firstName: 'أحمد',
        lastName: 'محمد',
        role: 'REGULAR',
        isActive: true
      });

      // Act
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginCredentials)
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user).not.toHaveProperty('passwordHash');
    });

    it('يجب أن يرفض تسجيل الدخول بريد إلكتروني غير صالح', async () => {
      // Act
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123'
        })
        .expect('Content-Type', /json/)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
    });

    it('يجب أن يرفض تسجيل الدخول بدون كلمة مرور', async () => {
      // Act
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com'
        })
        .expect('Content-Type', /json/)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
    });

    it('يجب أن يرفض تسجيل الدخول لمستخدم غير موجود', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Act
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginCredentials)
        .expect('Content-Type', /json/)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
    });

    it('يجب أن يرفض تسجيل الدخول بكلمة مرور خاطئة', async () => {
      // Arrange
      const hashedPassword = await hashPassword('DifferentPassword123!');
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email: loginCredentials.email,
        passwordHash: hashedPassword,
        isActive: true
      });

      // Act
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginCredentials)
        .expect('Content-Type', /json/)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
    });

    it('يجب أن يرفض تسجيل الدخول لحساب غير مفعل', async () => {
      // Arrange
      const hashedPassword = await hashPassword(loginCredentials.password);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email: loginCredentials.email,
        passwordHash: hashedPassword,
        isActive: false
      });

      // Act
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginCredentials)
        .expect('Content-Type', /json/)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('غير مفعل');
    });
  });

  // ==========================================
  // GET /api/v1/auth/me
  // ==========================================
  describe('GET /api/v1/auth/me', () => {
    it('يجب أن يرجع بيانات المستخدم الحالي', async () => {
      // Arrange
      const userId = 'user-123';
      const token = generateToken({ userId, role: 'REGULAR' });

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        email: 'test@example.com',
        firstName: 'أحمد',
        lastName: 'محمد',
        role: 'REGULAR',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Act
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('email');
      expect(response.body.data).toHaveProperty('firstName');
      expect(response.body.data).not.toHaveProperty('passwordHash');
    });

    it('يجب أن يرفض الطلب بدون توكن', async () => {
      // Act
      const response = await request(app)
        .get('/api/v1/auth/me')
        .expect('Content-Type', /json/)
        .expect(401);

      // Assert
      expect(response.body.success).toBe(false);
    });

    it('يجب أن يرفض الطلب بتوكن غير صالح', async () => {
      // Act
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect('Content-Type', /json/)
        .expect(401);

      // Assert
      expect(response.body.success).toBe(false);
    });
  });

  // ==========================================
  // PUT /api/v1/auth/profile
  // ==========================================
  describe('PUT /api/v1/auth/profile', () => {
    const userId = 'user-123';
    let token;

    beforeEach(() => {
      token = generateToken({ userId, role: 'REGULAR' });
    });

    it('يجب أن يحدث الملف الشخصي بنجاح', async () => {
      // Arrange
      const updateData = {
        firstName: 'أحمد المحدث',
        lastName: 'محمد المحدث',
        phoneNumber: '+966509876543'
      };

      mockPrisma.user.update.mockResolvedValue({
        id: userId,
        email: 'test@example.com',
        ...updateData,
        role: 'REGULAR',
        updatedAt: new Date()
      });

      // Act
      const response = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe(updateData.firstName);
      expect(response.body.data.lastName).toBe(updateData.lastName);
    });

    it('يجب أن يرفض تحديث بدون مصادقة', async () => {
      // Act
      const response = await request(app)
        .put('/api/v1/auth/profile')
        .send({ firstName: 'أحمد' })
        .expect('Content-Type', /json/)
        .expect(401);

      // Assert
      expect(response.body.success).toBe(false);
    });

    it('يجب أن يرفض رقم هاتف غير صالح', async () => {
      // Act
      const response = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ phoneNumber: 'invalid-phone' })
        .expect('Content-Type', /json/)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
    });
  });

  // ==========================================
  // POST /api/v1/auth/change-password
  // ==========================================
  describe('POST /api/v1/auth/change-password', () => {
    const userId = 'user-123';
    let token;

    beforeEach(() => {
      token = generateToken({ userId, role: 'REGULAR' });
    });

    it('يجب أن يغير كلمة المرور بنجاح', async () => {
      // Arrange
      const currentPassword = 'OldPass123!';
      const newPassword = 'NewPass456!';
      const hashedOldPassword = await hashPassword(currentPassword);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        email: 'test@example.com',
        passwordHash: hashedOldPassword
      });

      mockPrisma.user.update.mockResolvedValue({});

      // Act
      const response = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword, newPassword })
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
    });

    it('يجب أن يرفض تغيير كلمة المرور بدون مصادقة', async () => {
      // Act
      const response = await request(app)
        .post('/api/v1/auth/change-password')
        .send({
          currentPassword: 'old',
          newPassword: 'new123'
        })
        .expect('Content-Type', /json/)
        .expect(401);

      // Assert
      expect(response.body.success).toBe(false);
    });

    it('يجب أن يرفض كلمة مرور جديدة قصيرة', async () => {
      // Act
      const response = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'OldPass123!',
          newPassword: '123'
        })
        .expect('Content-Type', /json/)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
    });
  });
});

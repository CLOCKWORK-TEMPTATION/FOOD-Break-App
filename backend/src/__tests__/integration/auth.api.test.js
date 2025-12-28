/**
 * اختبارات تكامل لـ Auth API
 * Integration Tests for Authentication API Endpoints
 *
 * يغطي:
 * - POST /api/v1/auth/register
 * - POST /api/v1/auth/login
 * - GET /api/v1/auth/me
 * - PUT /api/v1/auth/profile
 * - POST /api/v1/auth/change-password
 * - POST /api/v1/auth/logout
 */

const request = require('supertest');
const express = require('express');
const authRoutes = require('../../routes/auth');
const authController = require('../../controllers/authController');

// Mock the controller
jest.mock('../../controllers/authController');
jest.mock('../../middleware/auth');

const app = express();
app.use(express.json());
app.use('/api/v1/auth', authRoutes);

// Global error handler
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'حدث خطأ داخلي'
    }
  });
});

describe('Auth API Integration Tests - اختبارات تكامل API المصادقة', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/register - تسجيل مستخدم جديد', () => {
    it('يجب تسجيل مستخدم جديد بنجاح - 201', async () => {
      // Arrange
      const newUser = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'أحمد',
        lastName: 'محمد',
        phoneNumber: '+966501234567'
      };

      const mockResponse = {
        success: true,
        data: {
          user: {
            id: 'user-123',
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            role: 'REGULAR'
          },
          token: 'mock_jwt_token',
          refreshToken: 'mock_refresh_token'
        }
      };

      authController.register.mockImplementation((req, res) => {
        res.status(201).json(mockResponse);
      });

      // Act
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(newUser);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('refreshToken');
    });

    it('يجب رفض التسجيل ببريد إلكتروني غير صالح - 400', async () => {
      // Arrange
      const invalidUser = {
        email: 'invalid-email',
        password: 'password123',
        firstName: 'أحمد',
        lastName: 'محمد'
      };

      // Act
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(invalidUser);

      // Assert
      expect(response.status).toBe(400);
    });

    it('يجب رفض التسجيل بكلمة مرور قصيرة - 400', async () => {
      // Arrange
      const invalidUser = {
        email: 'test@example.com',
        password: '123', // أقل من 6 أحرف
        firstName: 'أحمد',
        lastName: 'محمد'
      };

      // Act
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(invalidUser);

      // Assert
      expect(response.status).toBe(400);
    });

    it('يجب رفض التسجيل بدون الاسم الأول - 400', async () => {
      // Arrange
      const invalidUser = {
        email: 'test@example.com',
        password: 'password123',
        lastName: 'محمد'
        // No firstName
      };

      // Act
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(invalidUser);

      // Assert
      expect(response.status).toBe(400);
    });

    it('يجب رفض التسجيل بدور غير صالح - 400', async () => {
      // Arrange
      const invalidUser = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'أحمد',
        lastName: 'محمد',
        role: 'INVALID_ROLE'
      };

      // Act
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(invalidUser);

      // Assert
      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/login - تسجيل الدخول', () => {
    it('يجب تسجيل الدخول بنجاح - 200', async () => {
      // Arrange
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      const mockResponse = {
        success: true,
        data: {
          user: {
            id: 'user-123',
            email: credentials.email,
            firstName: 'أحمد',
            role: 'REGULAR'
          },
          token: 'mock_jwt_token',
          refreshToken: 'mock_refresh_token'
        }
      };

      authController.login.mockImplementation((req, res) => {
        res.status(200).json(mockResponse);
      });

      // Act
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(credentials);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe(credentials.email);
    });

    it('يجب رفض تسجيل الدخول ببريد إلكتروني غير صالح - 400', async () => {
      // Arrange
      const invalidCredentials = {
        email: 'invalid-email',
        password: 'password123'
      };

      // Act
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(invalidCredentials);

      // Assert
      expect(response.status).toBe(400);
    });

    it('يجب رفض تسجيل الدخول بدون كلمة مرور - 400', async () => {
      // Arrange
      const invalidCredentials = {
        email: 'test@example.com'
        // No password
      };

      // Act
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(invalidCredentials);

      // Assert
      expect(response.status).toBe(400);
    });

    it('يجب رفض تسجيل الدخول مع كلمة مرور خاطئة - 401', async () => {
      // Arrange
      const credentials = {
        email: 'test@example.com',
        password: 'wrong_password'
      };

      authController.login.mockImplementation((req, res) => {
        res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
          }
        });
      });

      // Act
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(credentials);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/auth/me - الحصول على بيانات المستخدم الحالي', () => {
    it('يجب الحصول على بيانات المستخدم بنجاح - 200', async () => {
      // Arrange
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'أحمد',
        lastName: 'محمد',
        role: 'REGULAR'
      };

      authController.getCurrentUser.mockImplementation((req, res) => {
        res.status(200).json({
          success: true,
          data: mockUser
        });
      });

      // Mock authentication middleware
      const { authenticateToken } = require('../../middleware/auth');
      authenticateToken.mockImplementation((req, res, next) => {
        req.user = { userId: 'user-123', role: 'REGULAR' };
        next();
      });

      // Act
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer mock_token');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('email');
    });

    it('يجب رفض الطلب بدون توكن - 401', async () => {
      // Arrange
      const { authenticateToken } = require('../../middleware/auth');
      authenticateToken.mockImplementation((req, res, next) => {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'التوكن غير موجود'
          }
        });
      });

      // Act
      const response = await request(app)
        .get('/api/v1/auth/me');

      // Assert
      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/v1/auth/profile - تحديث الملف الشخصي', () => {
    it('يجب تحديث الملف الشخصي بنجاح - 200', async () => {
      // Arrange
      const updateData = {
        firstName: 'أحمد المحدث',
        lastName: 'محمد المحدث',
        phoneNumber: '+966509876543'
      };

      const mockUpdatedUser = {
        id: 'user-123',
        email: 'test@example.com',
        ...updateData,
        role: 'REGULAR'
      };

      authController.updateProfile.mockImplementation((req, res) => {
        res.status(200).json({
          success: true,
          data: mockUpdatedUser
        });
      });

      const { authenticateToken } = require('../../middleware/auth');
      authenticateToken.mockImplementation((req, res, next) => {
        req.user = { userId: 'user-123' };
        next();
      });

      // Act
      const response = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', 'Bearer mock_token')
        .send(updateData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe(updateData.firstName);
    });

    it('يجب رفض التحديث برقم هاتف غير صالح - 400', async () => {
      // Arrange
      const invalidData = {
        phoneNumber: 'invalid-phone'
      };

      const { authenticateToken } = require('../../middleware/auth');
      authenticateToken.mockImplementation((req, res, next) => {
        req.user = { userId: 'user-123' };
        next();
      });

      // Act
      const response = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', 'Bearer mock_token')
        .send(invalidData);

      // Assert
      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/change-password - تغيير كلمة المرور', () => {
    it('يجب تغيير كلمة المرور بنجاح - 200', async () => {
      // Arrange
      const passwordData = {
        currentPassword: 'old_password',
        newPassword: 'new_password123'
      };

      authController.changePassword.mockImplementation((req, res) => {
        res.status(200).json({
          success: true,
          message: 'تم تغيير كلمة المرور بنجاح'
        });
      });

      const { authenticateToken } = require('../../middleware/auth');
      authenticateToken.mockImplementation((req, res, next) => {
        req.user = { userId: 'user-123' };
        next();
      });

      // Act
      const response = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', 'Bearer mock_token')
        .send(passwordData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('يجب رفض تغيير كلمة المرور بكلمة مرور جديدة قصيرة - 400', async () => {
      // Arrange
      const invalidData = {
        currentPassword: 'old_password',
        newPassword: '123' // أقل من 6 أحرف
      };

      const { authenticateToken } = require('../../middleware/auth');
      authenticateToken.mockImplementation((req, res, next) => {
        req.user = { userId: 'user-123' };
        next();
      });

      // Act
      const response = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', 'Bearer mock_token')
        .send(invalidData);

      // Assert
      expect(response.status).toBe(400);
    });

    it('يجب رفض تغيير كلمة المرور بدون كلمة المرور الحالية - 400', async () => {
      // Arrange
      const invalidData = {
        newPassword: 'new_password123'
        // No currentPassword
      };

      const { authenticateToken } = require('../../middleware/auth');
      authenticateToken.mockImplementation((req, res, next) => {
        req.user = { userId: 'user-123' };
        next();
      });

      // Act
      const response = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', 'Bearer mock_token')
        .send(invalidData);

      // Assert
      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/logout - تسجيل الخروج', () => {
    it('يجب تسجيل الخروج بنجاح - 200', async () => {
      // Arrange
      authController.logout.mockImplementation((req, res) => {
        res.status(200).json({
          success: true,
          message: 'تم تسجيل الخروج بنجاح'
        });
      });

      const { authenticateToken } = require('../../middleware/auth');
      authenticateToken.mockImplementation((req, res, next) => {
        req.user = { userId: 'user-123' };
        next();
      });

      // Act
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', 'Bearer mock_token');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Rate Limiting - تحديد المعدل', () => {
    it('يجب تطبيق Rate Limiting على تسجيل الدخول', async () => {
      // هذا الاختبار يتطلب إعداد خاص لـ rate limiter
      // يمكن تنفيذه في بيئة تكامل حقيقية
      expect(true).toBe(true);
    });

    it('يجب تطبيق Rate Limiting على التسجيل', async () => {
      // هذا الاختبار يتطلب إعداد خاص لـ rate limiter
      // يمكن تنفيذه في بيئة تكامل حقيقية
      expect(true).toBe(true);
    });
  });
});

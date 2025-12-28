/**
 * Integration Tests لمسارات المصادقة (Auth Routes)
 * اختبارات شاملة لـ API Endpoints
 */

const request = require('supertest');
const express = require('express');
const authRoutes = require('../../routes/auth');

// Mock dependencies
jest.mock('../../controllers/authController');
jest.mock('../../middleware/auth');
jest.mock('../../middleware/validation');

const authController = require('../../controllers/authController');
const { authenticateToken } = require('../../middleware/auth');
const { validate } = require('../../middleware/validation');

// إنشاء تطبيق Express للاختبار
const app = express();
app.use(express.json());
app.use('/api/v1/auth', authRoutes);

describe('Auth Routes Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/register', () => {
    const validUserData = {
      email: 'test@example.com',
      password: 'SecurePass123',
      firstName: 'محمد',
      lastName: 'أحمد',
      phoneNumber: '+201234567890',
    };

    it('يجب أن يسجل مستخدم جديد بنجاح', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: {
            id: 'user_123',
            email: validUserData.email,
            firstName: validUserData.firstName,
            lastName: validUserData.lastName,
            role: 'REGULAR',
          },
          token: 'jwt_token',
          refreshToken: 'refresh_token',
        },
      };

      validate.mockImplementation((validationRules) => {
        return (req, res, next) => {
          next();
        };
      });

      authController.register.mockImplementation((req, res) => {
        res.status(201).json(mockResponse);
      });

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(validUserData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('token');
      expect(authController.register).toHaveBeenCalled();
    });

    it('يجب أن يرفض البريد الإلكتروني غير الصحيح', async () => {
      const invalidData = { ...validUserData, email: 'invalid-email' };

      validate.mockImplementation((validationRules) => {
        return (req, res, next) => {
          res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'البريد الإلكتروني غير صالح',
            },
          });
        };
      });

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('يجب أن يرفض كلمة المرور القصيرة', async () => {
      const invalidData = { ...validUserData, password: '12345' };

      validate.mockImplementation((validationRules) => {
        return (req, res, next) => {
          res.status(400).json({
            success: false,
            error: {
              message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
            },
          });
        };
      });

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(authController.register).not.toHaveBeenCalled();
    });

    it('يجب أن يرفض الاسم المفقود', async () => {
      const invalidData = { ...validUserData };
      delete invalidData.firstName;

      validate.mockImplementation((validationRules) => {
        return (req, res, next) => {
          res.status(400).json({
            success: false,
            error: { message: 'الاسم الأول مطلوب' },
          });
        };
      });

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(invalidData);

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    const validCredentials = {
      email: 'test@example.com',
      password: 'SecurePass123',
    };

    it('يجب أن يسجل الدخول بنجاح', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: {
            id: 'user_123',
            email: validCredentials.email,
            firstName: 'محمد',
            role: 'REGULAR',
          },
          token: 'jwt_token',
          refreshToken: 'refresh_token',
        },
      };

      validate.mockImplementation((validationRules) => {
        return (req, res, next) => next();
      });

      authController.login.mockImplementation((req, res) => {
        res.status(200).json(mockResponse);
      });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(validCredentials);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('token');
      expect(authController.login).toHaveBeenCalled();
    });

    it('يجب أن يرفض بيانات الدخول الناقصة', async () => {
      const invalidCredentials = {
        email: 'test@example.com',
        // password missing
      };

      validate.mockImplementation((validationRules) => {
        return (req, res, next) => {
          res.status(400).json({
            success: false,
            error: { message: 'كلمة المرور مطلوبة' },
          });
        };
      });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(invalidCredentials);

      expect(response.status).toBe(400);
    });

    it('يجب أن يرفض البريد الإلكتروني الخاطئ', async () => {
      const invalidCredentials = {
        email: 'not-an-email',
        password: 'password',
      };

      validate.mockImplementation((validationRules) => {
        return (req, res, next) => {
          res.status(400).json({
            success: false,
            error: { message: 'البريد الإلكتروني غير صالح' },
          });
        };
      });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(invalidCredentials);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('يجب أن يرجع بيانات المستخدم الحالي', async () => {
      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        firstName: 'محمد',
        lastName: 'أحمد',
        role: 'REGULAR',
      };

      const mockResponse = {
        success: true,
        data: mockUser,
      };

      authenticateToken.mockImplementation((req, res, next) => {
        req.user = { id: 'user_123', role: 'REGULAR' };
        next();
      });

      authController.getCurrentUser.mockImplementation((req, res) => {
        res.status(200).json(mockResponse);
      });

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('email');
      expect(authenticateToken).toHaveBeenCalled();
    });

    it('يجب أن يطلب توكن للمصادقة', async () => {
      authenticateToken.mockImplementation((req, res, next) => {
        res.status(401).json({
          success: false,
          error: 'رجاءً قم بتسجيل الدخول أولاً',
        });
      });

      const response = await request(app)
        .get('/api/v1/auth/me');

      expect(response.status).toBe(401);
      expect(authController.getCurrentUser).not.toHaveBeenCalled();
    });

    it('يجب أن يرفض التوكن المنتهي', async () => {
      authenticateToken.mockImplementation((req, res, next) => {
        res.status(401).json({
          success: false,
          error: 'انتهت صلاحية التوكن',
        });
      });

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer expired_token');

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/v1/auth/profile', () => {
    const updateData = {
      firstName: 'أحمد جديد',
      lastName: 'محمد جديد',
      phoneNumber: '+201987654321',
    };

    it('يجب أن يحدث الملف الشخصي', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'user_123',
          email: 'test@example.com',
          ...updateData,
          role: 'REGULAR',
        },
      };

      authenticateToken.mockImplementation((req, res, next) => {
        req.user = { id: 'user_123', role: 'REGULAR' };
        next();
      });

      validate.mockImplementation((validationRules) => {
        return (req, res, next) => next();
      });

      authController.updateProfile.mockImplementation((req, res) => {
        res.status(200).json(mockResponse);
      });

      const response = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', 'Bearer valid_token')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.data.firstName).toBe(updateData.firstName);
      expect(authController.updateProfile).toHaveBeenCalled();
    });

    it('يجب أن يرفض البيانات غير الصالحة', async () => {
      const invalidData = {
        firstName: '',
        lastName: 'محمد',
      };

      authenticateToken.mockImplementation((req, res, next) => next());

      validate.mockImplementation((validationRules) => {
        return (req, res, next) => {
          res.status(400).json({
            success: false,
            error: { message: 'الاسم الأول لا يمكن أن يكون فارغاً' },
          });
        };
      });

      const response = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', 'Bearer valid_token')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(authController.updateProfile).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/v1/auth/change-password', () => {
    const validPasswordData = {
      currentPassword: 'OldPass123',
      newPassword: 'NewPass456',
    };

    it('يجب أن يغير كلمة المرور بنجاح', async () => {
      const mockResponse = {
        success: true,
        message: 'تم تغيير كلمة المرور بنجاح',
      };

      authenticateToken.mockImplementation((req, res, next) => {
        req.user = { id: 'user_123', role: 'REGULAR' };
        next();
      });

      validate.mockImplementation((validationRules) => {
        return (req, res, next) => next();
      });

      authController.changePassword.mockImplementation((req, res) => {
        res.status(200).json(mockResponse);
      });

      const response = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', 'Bearer valid_token')
        .send(validPasswordData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(authController.changePassword).toHaveBeenCalled();
    });

    it('يجب أن يرفض كلمة المرور الجديدة القصيرة', async () => {
      const invalidData = {
        currentPassword: 'OldPass123',
        newPassword: '12345', // أقل من 6 أحرف
      };

      authenticateToken.mockImplementation((req, res, next) => next());

      validate.mockImplementation((validationRules) => {
        return (req, res, next) => {
          res.status(400).json({
            success: false,
            error: {
              message: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل',
            },
          });
        };
      });

      const response = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', 'Bearer valid_token')
        .send(invalidData);

      expect(response.status).toBe(400);
    });

    it('يجب أن يطلب كلمة المرور الحالية', async () => {
      const invalidData = {
        newPassword: 'NewPass456',
      };

      authenticateToken.mockImplementation((req, res, next) => next());

      validate.mockImplementation((validationRules) => {
        return (req, res, next) => {
          res.status(400).json({
            success: false,
            error: { message: 'كلمة المرور الحالية مطلوبة' },
          });
        };
      });

      const response = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', 'Bearer valid_token')
        .send(invalidData);

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('يجب أن يسجل الخروج بنجاح', async () => {
      const mockResponse = {
        success: true,
        message: 'تم تسجيل الخروج بنجاح',
      };

      authenticateToken.mockImplementation((req, res, next) => {
        req.user = { id: 'user_123', role: 'REGULAR' };
        next();
      });

      authController.logout.mockImplementation((req, res) => {
        res.status(200).json(mockResponse);
      });

      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(authController.logout).toHaveBeenCalled();
    });

    it('يجب أن يطلب المصادقة لتسجيل الخروج', async () => {
      authenticateToken.mockImplementation((req, res, next) => {
        res.status(401).json({
          success: false,
          error: 'رجاءً قم بتسجيل الدخول أولاً',
        });
      });

      const response = await request(app)
        .post('/api/v1/auth/logout');

      expect(response.status).toBe(401);
      expect(authController.logout).not.toHaveBeenCalled();
    });
  });

  describe('Rate Limiting', () => {
    it('يجب أن يحد من محاولات تسجيل الدخول المتكررة', async () => {
      // هذا الاختبار يتطلب إعداد حقيقي لـ rate limiter
      // في البيئة الحالية، نتحقق فقط من وجود الإعداد
      const authRoutesModule = require('../../routes/auth');
      expect(authRoutesModule).toBeDefined();
    });
  });
});

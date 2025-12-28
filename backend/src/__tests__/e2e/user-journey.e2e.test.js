/**
 * اختبارات E2E لرحلة المستخدم الكاملة
 * End-to-End Tests for Complete User Journey
 *
 * سيناريو الاختبار:
 * 1. تسجيل مستخدم جديد
 * 2. تسجيل الدخول
 * 3. تحديث الملف الشخصي
 * 4. إنشاء طلب جديد
 * 5. عرض تفاصيل الطلب
 * 6. تحديث حالة الطلب
 * 7. إلغاء الطلب
 */

const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const app = require('../../server');

// Mock dependencies
jest.mock('@prisma/client');
jest.mock('../../utils/logger');
jest.mock('../../jobs', () => ({ startJobs: jest.fn() }));
jest.mock('../../services/reminderSchedulerService', () => ({
  initialize: jest.fn(),
  stopAll: jest.fn()
}));
jest.mock('../../utils/monitoring', () => ({ initMonitoring: jest.fn() }));

describe('User Journey - E2E Tests', () => {
  let mockPrisma;
  let userToken;
  let userId;
  let orderId;

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
      order: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      restaurant: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      project: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      }
    };

    PrismaClient.mockImplementation(() => mockPrisma);
  });

  // ==========================================
  // سيناريو كامل: من التسجيل إلى الطلب
  // ==========================================
  describe('سيناريو: رحلة مستخدم كاملة', () => {
    it('يجب أن يكمل رحلة المستخدم من التسجيل حتى إنشاء وإلغاء الطلب', async () => {
      // ==========================================
      // 1. تسجيل مستخدم جديد
      // ==========================================
      const registrationData = {
        email: 'ahmed@example.com',
        password: 'SecurePass123!',
        firstName: 'أحمد',
        lastName: 'محمد',
        phoneNumber: '+966501234567'
      };

      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      mockPrisma.user.create.mockResolvedValueOnce({
        id: 'user-new-123',
        email: registrationData.email,
        firstName: registrationData.firstName,
        lastName: registrationData.lastName,
        role: 'REGULAR',
        isActive: true,
        createdAt: new Date()
      });

      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(registrationData)
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.data).toHaveProperty('token');
      expect(registerResponse.body.data.user.email).toBe(registrationData.email);

      userId = registerResponse.body.data.user.id;
      userToken = registerResponse.body.data.token;

      // ==========================================
      // 2. تسجيل الدخول (للتأكد من أن المستخدم يمكنه تسجيل الدخول)
      // ==========================================
      const hashedPassword = require('../../utils/password').hashPassword;
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: userId,
        email: registrationData.email,
        passwordHash: await hashedPassword(registrationData.password),
        firstName: registrationData.firstName,
        lastName: registrationData.lastName,
        role: 'REGULAR',
        isActive: true
      });

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: registrationData.email,
          password: registrationData.password
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.data).toHaveProperty('token');
      userToken = loginResponse.body.data.token;

      // ==========================================
      // 3. الحصول على بيانات المستخدم الحالي
      // ==========================================
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: userId,
        email: registrationData.email,
        firstName: registrationData.firstName,
        lastName: registrationData.lastName,
        phoneNumber: registrationData.phoneNumber,
        role: 'REGULAR',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const meResponse = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(meResponse.body.success).toBe(true);
      expect(meResponse.body.data.email).toBe(registrationData.email);
      expect(meResponse.body.data).not.toHaveProperty('passwordHash');

      // ==========================================
      // 4. تحديث الملف الشخصي
      // ==========================================
      const updatedProfile = {
        firstName: 'أحمد المحدث',
        phoneNumber: '+966509876543'
      };

      mockPrisma.user.update.mockResolvedValueOnce({
        id: userId,
        email: registrationData.email,
        firstName: updatedProfile.firstName,
        lastName: registrationData.lastName,
        phoneNumber: updatedProfile.phoneNumber,
        role: 'REGULAR',
        updatedAt: new Date()
      });

      const profileResponse = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send(updatedProfile)
        .expect(200);

      expect(profileResponse.body.success).toBe(true);
      expect(profileResponse.body.data.firstName).toBe(updatedProfile.firstName);

      // ==========================================
      // 5. إنشاء طلب جديد
      // ==========================================
      const orderData = {
        userId: userId,
        projectId: 'project-123',
        restaurantId: 'restaurant-456',
        totalAmount: 150.50,
        deliveryAddress: 'الرياض، حي النخيل',
        items: [
          {
            menuItemId: 'item-1',
            quantity: 2,
            price: 50.00,
            specialInstructions: 'بدون بصل'
          },
          {
            menuItemId: 'item-2',
            quantity: 1,
            price: 50.50
          }
        ]
      };

      mockPrisma.order.create.mockResolvedValueOnce({
        id: 'order-new-789',
        ...orderData,
        status: 'PENDING',
        createdAt: new Date(),
        user: { id: userId, firstName: updatedProfile.firstName },
        restaurant: { id: orderData.restaurantId, name: 'مطعم النخيل' },
        project: { id: orderData.projectId, name: 'مشروع 1' }
      });

      const createOrderResponse = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(orderData)
        .expect(201);

      expect(createOrderResponse.body.success).toBe(true);
      expect(createOrderResponse.body.data.status).toBe('PENDING');
      expect(createOrderResponse.body.data.totalAmount).toBe(orderData.totalAmount);

      orderId = createOrderResponse.body.data.id;

      // ==========================================
      // 6. عرض تفاصيل الطلب
      // ==========================================
      mockPrisma.order.findUnique.mockResolvedValueOnce({
        id: orderId,
        userId: userId,
        projectId: orderData.projectId,
        restaurantId: orderData.restaurantId,
        status: 'PENDING',
        totalAmount: orderData.totalAmount,
        deliveryAddress: orderData.deliveryAddress,
        createdAt: new Date(),
        user: { id: userId, firstName: updatedProfile.firstName },
        restaurant: { id: orderData.restaurantId, name: 'مطعم النخيل' },
        project: { id: orderData.projectId, name: 'مشروع 1' }
      });

      const orderDetailsResponse = await request(app)
        .get(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(orderDetailsResponse.body.success).toBe(true);
      expect(orderDetailsResponse.body.data.id).toBe(orderId);
      expect(orderDetailsResponse.body.data.status).toBe('PENDING');

      // ==========================================
      // 7. عرض جميع طلبات المستخدم
      // ==========================================
      mockPrisma.order.findMany.mockResolvedValueOnce([
        {
          id: orderId,
          userId: userId,
          status: 'PENDING',
          totalAmount: orderData.totalAmount,
          user: { firstName: updatedProfile.firstName },
          restaurant: { name: 'مطعم النخيل' },
          project: { name: 'مشروع 1' }
        }
      ]);
      mockPrisma.order.count.mockResolvedValueOnce(1);

      const ordersListResponse = await request(app)
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(ordersListResponse.body.success).toBe(true);
      expect(ordersListResponse.body.data.orders).toHaveLength(1);
      expect(ordersListResponse.body.data.pagination.total).toBe(1);

      // ==========================================
      // 8. إلغاء الطلب
      // ==========================================
      mockPrisma.order.findUnique.mockResolvedValueOnce({
        id: orderId,
        userId: userId,
        status: 'PENDING'
      });

      mockPrisma.order.update.mockResolvedValueOnce({
        id: orderId,
        userId: userId,
        status: 'CANCELLED',
        updatedAt: new Date()
      });

      const cancelResponse = await request(app)
        .post(`/api/v1/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ reason: 'تغيير في الخطة' })
        .expect(200);

      expect(cancelResponse.body.success).toBe(true);
      expect(cancelResponse.body.data.status).toBe('CANCELLED');

      // ==========================================
      // 9. التحقق من عدم القدرة على إلغاء الطلب مرة أخرى
      // ==========================================
      mockPrisma.order.findUnique.mockResolvedValueOnce({
        id: orderId,
        userId: userId,
        status: 'CANCELLED'
      });

      const cancelAgainResponse = await request(app)
        .post(`/api/v1/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ reason: 'سبب آخر' })
        .expect(400);

      expect(cancelAgainResponse.body.success).toBe(false);
    });
  });

  // ==========================================
  // سيناريو: محاولة الوصول غير المصرح به
  // ==========================================
  describe('سيناريو: محاولة الوصول غير المصرح به', () => {
    it('يجب أن يرفض الوصول إلى الموارد بدون مصادقة', async () => {
      // محاولة الوصول إلى الملف الشخصي بدون توكن
      await request(app)
        .get('/api/v1/auth/me')
        .expect(401);

      // محاولة إنشاء طلب بدون توكن
      await request(app)
        .post('/api/v1/orders')
        .send({ userId: 'user-123', totalAmount: 100 })
        .expect(401);

      // محاولة عرض الطلبات بدون توكن
      await request(app)
        .get('/api/v1/orders')
        .expect(401);
    });

    it('يجب أن يرفض الوصول إلى طلبات مستخدم آخر', async () => {
      const { generateToken } = require('../../utils/jwt');
      const user1Token = generateToken({ userId: 'user-1', role: 'REGULAR' });

      mockPrisma.order.findUnique.mockResolvedValueOnce({
        id: 'order-123',
        userId: 'user-2', // مستخدم مختلف
        status: 'PENDING'
      });

      // محاولة إلغاء طلب مستخدم آخر
      const response = await request(app)
        .post('/api/v1/orders/order-123/cancel')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ reason: 'سبب' })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  // ==========================================
  // سيناريو: معالجة الأخطاء
  // ==========================================
  describe('سيناريو: معالجة الأخطاء بشكل صحيح', () => {
    it('يجب أن يعالج أخطاء قاعدة البيانات بشكل صحيح', async () => {
      const { generateToken } = require('../../utils/jwt');
      const userToken = generateToken({ userId: 'user-123', role: 'REGULAR' });

      // محاكاة خطأ في قاعدة البيانات
      mockPrisma.order.findMany.mockRejectedValueOnce(
        new Error('Database connection error')
      );

      const response = await request(app)
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('يجب أن يعالج بيانات غير صالحة بشكل صحيح', async () => {
      // محاولة التسجيل ببيانات غير صالحة
      const invalidData = {
        email: 'not-an-email',
        password: '123' // كلمة مرور قصيرة جداً
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('يجب أن يرجع 404 للمسارات غير الموجودة', async () => {
      const response = await request(app)
        .get('/api/v1/non-existent-route')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  // ==========================================
  // سيناريو: التحقق من الأمان
  // ==========================================
  describe('سيناريو: التحقق من تطبيق الأمان', () => {
    it('يجب أن يتضمن رؤوس الأمان (Security Headers)', async () => {
      const response = await request(app).get('/health');

      // التحقق من وجود Helmet headers
      expect(response.headers).toHaveProperty('x-dns-prefetch-control');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-content-type-options');
    });

    it('يجب أن يتضمن CORS headers', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:3001');

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });

    it('يجب ألا يكشف عن معلومات حساسة في الأخطاء', async () => {
      mockPrisma.user.findUnique.mockRejectedValueOnce(
        new Error('Internal database error with sensitive info')
      );

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(500);

      // يجب ألا تحتوي رسالة الخطأ على تفاصيل حساسة
      expect(response.body.error.message).not.toContain('database');
      expect(response.body.error.message).not.toContain('sensitive');
    });
  });
});

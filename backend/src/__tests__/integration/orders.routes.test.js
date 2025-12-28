/**
 * اختبارات Integration Tests لـ Orders API Routes
 * Integration Tests for Orders API Routes
 */

const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const app = require('../../server');
const { generateToken } = require('../../utils/jwt');

// Mock dependencies
jest.mock('@prisma/client');
jest.mock('../../utils/logger');
jest.mock('../../jobs', () => ({ startJobs: jest.fn() }));
jest.mock('../../services/reminderSchedulerService', () => ({
  initialize: jest.fn(),
  stopAll: jest.fn()
}));
jest.mock('../../utils/monitoring', () => ({ initMonitoring: jest.fn() }));

describe('Orders Routes - Integration Tests', () => {
  let mockPrisma;
  let userToken;
  const userId = 'user-123';

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret-key';
    userToken = generateToken({ userId, role: 'REGULAR' });
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockPrisma = {
      order: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
      },
      user: {
        findUnique: jest.fn()
      }
    };

    PrismaClient.mockImplementation(() => mockPrisma);
  });

  // ==========================================
  // POST /api/v1/orders
  // ==========================================
  describe('POST /api/v1/orders', () => {
    const validOrderData = {
      userId: 'user-123',
      projectId: 'project-456',
      restaurantId: 'restaurant-789',
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

    it('يجب أن ينشئ طلب جديد بنجاح', async () => {
      // Arrange
      const mockCreatedOrder = {
        id: 'order-1',
        ...validOrderData,
        status: 'PENDING',
        createdAt: new Date(),
        user: { id: userId, firstName: 'أحمد' },
        restaurant: { id: validOrderData.restaurantId, name: 'مطعم النخيل' },
        project: { id: validOrderData.projectId, name: 'مشروع 1' }
      };

      mockPrisma.order.create.mockResolvedValue(mockCreatedOrder);

      // Act
      const response = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validOrderData)
        .expect('Content-Type', /json/)
        .expect(201);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.status).toBe('PENDING');
      expect(response.body.data.totalAmount).toBe(validOrderData.totalAmount);
    });

    it('يجب أن يرفض إنشاء طلب بدون مصادقة', async () => {
      // Act
      const response = await request(app)
        .post('/api/v1/orders')
        .send(validOrderData)
        .expect('Content-Type', /json/)
        .expect(401);

      // Assert
      expect(response.body.success).toBe(false);
    });

    it('يجب أن يرفض بيانات طلب ناقصة', async () => {
      // Act
      const response = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          userId: 'user-123'
          // missing required fields
        })
        .expect('Content-Type', /json/)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
    });

    it('يجب أن يتعامل مع طلب بدون عناصر', async () => {
      // Arrange
      const orderWithNoItems = { ...validOrderData, items: [] };
      mockPrisma.order.create.mockResolvedValue({
        id: 'order-1',
        ...orderWithNoItems,
        status: 'PENDING'
      });

      // Act
      const response = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(orderWithNoItems)
        .expect('Content-Type', /json/)
        .expect(201);

      // Assert
      expect(response.body.success).toBe(true);
    });

    it('يجب أن يرفض مبلغ إجمالي سالب', async () => {
      // Act
      const response = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          ...validOrderData,
          totalAmount: -100
        })
        .expect('Content-Type', /json/)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
    });
  });

  // ==========================================
  // GET /api/v1/orders
  // ==========================================
  describe('GET /api/v1/orders', () => {
    it('يجب أن يجلب جميع الطلبات مع pagination', async () => {
      // Arrange
      const mockOrders = [
        {
          id: 'order-1',
          userId,
          status: 'PENDING',
          totalAmount: 100,
          user: { firstName: 'أحمد' },
          restaurant: { name: 'مطعم 1' },
          project: { name: 'مشروع 1' }
        },
        {
          id: 'order-2',
          userId,
          status: 'DELIVERED',
          totalAmount: 200,
          user: { firstName: 'أحمد' },
          restaurant: { name: 'مطعم 2' },
          project: { name: 'مشروع 1' }
        }
      ];

      mockPrisma.order.findMany.mockResolvedValue(mockOrders);
      mockPrisma.order.count.mockResolvedValue(15);

      // Act
      const response = await request(app)
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toHaveLength(2);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.total).toBe(15);
    });

    it('يجب أن يصفي الطلبات حسب status', async () => {
      // Arrange
      mockPrisma.order.findMany.mockResolvedValue([]);
      mockPrisma.order.count.mockResolvedValue(0);

      // Act
      const response = await request(app)
        .get('/api/v1/orders?status=DELIVERED')
        .set('Authorization', `Bearer ${userToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'DELIVERED'
          })
        })
      );
    });

    it('يجب أن يطبق pagination بشكل صحيح', async () => {
      // Arrange
      mockPrisma.order.findMany.mockResolvedValue([]);
      mockPrisma.order.count.mockResolvedValue(50);

      // Act
      const response = await request(app)
        .get('/api/v1/orders?page=2&limit=10')
        .set('Authorization', `Bearer ${userToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination.page).toBe(2);
      expect(response.body.data.pagination.pages).toBe(5);
    });

    it('يجب أن يرفض الطلب بدون مصادقة', async () => {
      // Act
      const response = await request(app)
        .get('/api/v1/orders')
        .expect('Content-Type', /json/)
        .expect(401);

      // Assert
      expect(response.body.success).toBe(false);
    });
  });

  // ==========================================
  // GET /api/v1/orders/:id
  // ==========================================
  describe('GET /api/v1/orders/:id', () => {
    it('يجب أن يجلب تفاصيل الطلب بنجاح', async () => {
      // Arrange
      const orderId = 'order-123';
      const mockOrder = {
        id: orderId,
        userId,
        status: 'PENDING',
        totalAmount: 150,
        user: { id: userId, firstName: 'أحمد' },
        restaurant: { id: 'rest-1', name: 'مطعم النخيل' },
        project: { id: 'proj-1', name: 'مشروع 1' }
      };

      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);

      // Act
      const response = await request(app)
        .get(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(orderId);
      expect(response.body.data.status).toBe('PENDING');
    });

    it('يجب أن يرجع 404 لطلب غير موجود', async () => {
      // Arrange
      mockPrisma.order.findUnique.mockResolvedValue(null);

      // Act
      const response = await request(app)
        .get('/api/v1/orders/non-existent-id')
        .set('Authorization', `Bearer ${userToken}`)
        .expect('Content-Type', /json/)
        .expect(404);

      // Assert
      expect(response.body.success).toBe(false);
    });

    it('يجب أن يرفض الطلب بدون مصادقة', async () => {
      // Act
      const response = await request(app)
        .get('/api/v1/orders/order-123')
        .expect('Content-Type', /json/)
        .expect(401);

      // Assert
      expect(response.body.success).toBe(false);
    });
  });

  // ==========================================
  // PATCH /api/v1/orders/:id/status
  // ==========================================
  describe('PATCH /api/v1/orders/:id/status', () => {
    const orderId = 'order-123';
    const adminToken = generateToken({ userId: 'admin-1', role: 'ADMIN' });

    it('يجب أن يحدث حالة الطلب بنجاح', async () => {
      // Arrange
      mockPrisma.order.update.mockResolvedValue({
        id: orderId,
        status: 'CONFIRMED',
        user: {},
        restaurant: {}
      });

      // Act
      const response = await request(app)
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'CONFIRMED' })
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('CONFIRMED');
    });

    it('يجب أن يرفض حالة غير صحيحة', async () => {
      // Act
      const response = await request(app)
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'INVALID_STATUS' })
        .expect('Content-Type', /json/)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
    });

    it('يجب أن يرفض التحديث بدون مصادقة', async () => {
      // Act
      const response = await request(app)
        .patch(`/api/v1/orders/${orderId}/status`)
        .send({ status: 'CONFIRMED' })
        .expect('Content-Type', /json/)
        .expect(401);

      // Assert
      expect(response.body.success).toBe(false);
    });
  });

  // ==========================================
  // POST /api/v1/orders/:id/cancel
  // ==========================================
  describe('POST /api/v1/orders/:id/cancel', () => {
    const orderId = 'order-123';

    it('يجب أن يلغي الطلب بنجاح', async () => {
      // Arrange
      mockPrisma.order.findUnique.mockResolvedValue({
        id: orderId,
        userId,
        status: 'PENDING'
      });

      mockPrisma.order.update.mockResolvedValue({
        id: orderId,
        status: 'CANCELLED'
      });

      // Act
      const response = await request(app)
        .post(`/api/v1/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ reason: 'تغيير في الخطة' })
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('CANCELLED');
    });

    it('يجب أن يرفض إلغاء طلب لمستخدم آخر', async () => {
      // Arrange
      mockPrisma.order.findUnique.mockResolvedValue({
        id: orderId,
        userId: 'different-user',
        status: 'PENDING'
      });

      // Act
      const response = await request(app)
        .post(`/api/v1/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ reason: 'سبب' })
        .expect('Content-Type', /json/)
        .expect(403);

      // Assert
      expect(response.body.success).toBe(false);
    });

    it('يجب أن يرفض إلغاء طلب تم تسليمه', async () => {
      // Arrange
      mockPrisma.order.findUnique.mockResolvedValue({
        id: orderId,
        userId,
        status: 'DELIVERED'
      });

      // Act
      const response = await request(app)
        .post(`/api/v1/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ reason: 'سبب' })
        .expect('Content-Type', /json/)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
    });
  });

  // ==========================================
  // GET /api/v1/orders/stats/:projectId
  // ==========================================
  describe('GET /api/v1/orders/stats/:projectId', () => {
    const projectId = 'project-123';

    it('يجب أن يجلب إحصائيات الطلبات بنجاح', async () => {
      // Arrange
      const mockStats = [
        { status: 'PENDING', _count: { id: 5 }, _sum: { totalAmount: 500 } },
        { status: 'DELIVERED', _count: { id: 10 }, _sum: { totalAmount: 1500 } }
      ];

      mockPrisma.order.groupBy.mockResolvedValue(mockStats);

      // Act
      const response = await request(app)
        .get(`/api/v1/orders/stats/${projectId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('status');
      expect(response.body.data[0]).toHaveProperty('_count');
      expect(response.body.data[0]).toHaveProperty('_sum');
    });

    it('يجب أن يطبق نطاق التاريخ إذا تم توفيره', async () => {
      // Arrange
      mockPrisma.order.groupBy.mockResolvedValue([]);

      // Act
      const response = await request(app)
        .get(`/api/v1/orders/stats/${projectId}?startDate=2024-01-01&endDate=2024-12-31`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(mockPrisma.order.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            projectId,
            createdAt: expect.any(Object)
          })
        })
      );
    });
  });
});

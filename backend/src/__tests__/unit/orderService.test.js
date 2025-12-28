/**
 * اختبارات Unit Tests لخدمة الطلبات
 * Unit Tests for Order Service
 */

const { PrismaClient } = require('@prisma/client');
const orderService = require('../../services/orderService');

// Mock Prisma
jest.mock('@prisma/client');

describe('OrderService - Unit Tests', () => {
  let mockPrisma;

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
    };

    PrismaClient.mockImplementation(() => mockPrisma);
  });

  // ==========================================
  // اختبارات إنشاء طلب جديد
  // ==========================================
  describe('createOrder()', () => {
    const validOrderData = {
      userId: 'user-123',
      projectId: 'project-456',
      restaurantId: 'restaurant-789',
      totalAmount: 150.50,
      deliveryAddress: 'الرياض، حي النخيل، شارع الملك فهد',
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
        user: { id: validOrderData.userId, firstName: 'أحمد' },
        restaurant: { id: validOrderData.restaurantId, name: 'مطعم النخيل' },
        project: { id: validOrderData.projectId, name: 'مشروع 1' }
      };

      mockPrisma.order.create.mockResolvedValue(mockCreatedOrder);

      // Act
      const result = await orderService.createOrder(validOrderData);

      // Assert
      expect(mockPrisma.order.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: validOrderData.userId,
          projectId: validOrderData.projectId,
          restaurantId: validOrderData.restaurantId,
          totalAmount: validOrderData.totalAmount,
          status: 'PENDING',
          deliveryAddress: validOrderData.deliveryAddress,
          items: {
            create: expect.arrayContaining([
              expect.objectContaining({
                menuItemId: 'item-1',
                quantity: 2,
                price: 50.00
              })
            ])
          }
        }),
        include: expect.any(Object)
      });
      expect(result).toEqual(mockCreatedOrder);
      expect(result.status).toBe('PENDING');
    });

    it('يجب أن يتعامل مع عناصر طلب فارغة', async () => {
      // Arrange
      const orderWithNoItems = { ...validOrderData, items: [] };
      mockPrisma.order.create.mockResolvedValue({
        id: 'order-1',
        ...orderWithNoItems,
        status: 'PENDING'
      });

      // Act
      await orderService.createOrder(orderWithNoItems);

      // Assert
      expect(mockPrisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            items: {
              create: []
            }
          })
        })
      );
    });

    it('يجب أن يتعامل مع الأخطاء بشكل صحيح', async () => {
      // Arrange
      mockPrisma.order.create.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(orderService.createOrder(validOrderData))
        .rejects
        .toThrow('خطأ في إنشاء الطلب');
    });

    it('يجب أن يحفظ التعليمات الخاصة للعناصر', async () => {
      // Arrange
      mockPrisma.order.create.mockResolvedValue({
        id: 'order-1',
        status: 'PENDING'
      });

      // Act
      await orderService.createOrder(validOrderData);

      // Assert
      const createCall = mockPrisma.order.create.mock.calls[0][0];
      const firstItem = createCall.data.items.create[0];
      expect(firstItem.specialInstructions).toBe('بدون بصل');
    });
  });

  // ==========================================
  // اختبارات جلب الطلبات مع التصفية
  // ==========================================
  describe('getOrders()', () => {
    it('يجب أن يجلب جميع الطلبات مع pagination', async () => {
      // Arrange
      const mockOrders = [
        { id: '1', status: 'PENDING', totalAmount: 100 },
        { id: '2', status: 'DELIVERED', totalAmount: 200 }
      ];

      mockPrisma.order.findMany.mockResolvedValue(mockOrders);
      mockPrisma.order.count.mockResolvedValue(15);

      // Act
      const result = await orderService.getOrders({ page: 1, limit: 10 });

      // Assert
      expect(mockPrisma.order.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' }
      });
      expect(result.orders).toEqual(mockOrders);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 15,
        pages: 2
      });
    });

    it('يجب أن يصفي الطلبات حسب userId', async () => {
      // Arrange
      mockPrisma.order.findMany.mockResolvedValue([]);
      mockPrisma.order.count.mockResolvedValue(0);

      // Act
      await orderService.getOrders({ userId: 'user-123' });

      // Assert
      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-123' }
        })
      );
    });

    it('يجب أن يصفي الطلبات حسب projectId', async () => {
      // Arrange
      mockPrisma.order.findMany.mockResolvedValue([]);
      mockPrisma.order.count.mockResolvedValue(0);

      // Act
      await orderService.getOrders({ projectId: 'project-456' });

      // Assert
      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { projectId: 'project-456' }
        })
      );
    });

    it('يجب أن يصفي الطلبات حسب status', async () => {
      // Arrange
      mockPrisma.order.findMany.mockResolvedValue([]);
      mockPrisma.order.count.mockResolvedValue(0);

      // Act
      await orderService.getOrders({ status: 'DELIVERED' });

      // Assert
      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'DELIVERED' }
        })
      );
    });

    it('يجب أن يحسب pagination بشكل صحيح', async () => {
      // Arrange
      mockPrisma.order.findMany.mockResolvedValue([]);
      mockPrisma.order.count.mockResolvedValue(25);

      // Act
      const result = await orderService.getOrders({ page: 3, limit: 10 });

      // Assert
      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20, // (page 3 - 1) * 10
          take: 10
        })
      );
      expect(result.pagination.pages).toBe(3); // Math.ceil(25 / 10)
    });
  });

  // ==========================================
  // اختبارات جلب طلب محدد
  // ==========================================
  describe('getOrderById()', () => {
    it('يجب أن يجلب الطلب بنجاح', async () => {
      // Arrange
      const mockOrder = {
        id: 'order-123',
        status: 'PENDING',
        totalAmount: 150,
        user: { id: 'user-1', firstName: 'أحمد' },
        restaurant: { id: 'rest-1', name: 'مطعم النخيل' },
        project: { id: 'proj-1', name: 'مشروع 1' }
      };

      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);

      // Act
      const result = await orderService.getOrderById('order-123');

      // Assert
      expect(mockPrisma.order.findUnique).toHaveBeenCalledWith({
        where: { id: 'order-123' },
        include: expect.any(Object)
      });
      expect(result).toEqual(mockOrder);
    });

    it('يجب أن يرمي خطأ للطلب غير الموجود', async () => {
      // Arrange
      mockPrisma.order.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(orderService.getOrderById('non-existent'))
        .rejects
        .toThrow('الطلب غير موجود');
    });
  });

  // ==========================================
  // اختبارات تحديث حالة الطلب
  // ==========================================
  describe('updateOrderStatus()', () => {
    const validStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED'];

    validStatuses.forEach(status => {
      it(`يجب أن يحدث الحالة إلى ${status} بنجاح`, async () => {
        // Arrange
        mockPrisma.order.update.mockResolvedValue({
          id: 'order-123',
          status,
          user: {},
          restaurant: {}
        });

        // Act
        const result = await orderService.updateOrderStatus('order-123', status, 'user-1');

        // Assert
        expect(mockPrisma.order.update).toHaveBeenCalledWith({
          where: { id: 'order-123' },
          data: expect.objectContaining({
            status,
            updatedAt: expect.any(Date)
          }),
          include: expect.any(Object)
        });
        expect(result.status).toBe(status);
      });
    });

    it('يجب أن يرفض حالة غير صحيحة', async () => {
      // Act & Assert
      await expect(orderService.updateOrderStatus('order-123', 'INVALID_STATUS', 'user-1'))
        .rejects
        .toThrow('حالة الطلب غير صحيحة');

      expect(mockPrisma.order.update).not.toHaveBeenCalled();
    });
  });

  // ==========================================
  // اختبارات إلغاء الطلب
  // ==========================================
  describe('cancelOrder()', () => {
    it('يجب أن يلغي الطلب بنجاح', async () => {
      // Arrange
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'order-123',
        userId: 'user-123',
        status: 'PENDING'
      });
      mockPrisma.order.update.mockResolvedValue({
        id: 'order-123',
        status: 'CANCELLED'
      });

      // Act
      const result = await orderService.cancelOrder('order-123', 'user-123', 'سبب الإلغاء');

      // Assert
      expect(mockPrisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-123' },
        data: expect.objectContaining({
          status: 'CANCELLED'
        })
      });
      expect(result.status).toBe('CANCELLED');
    });

    it('يجب أن يرفض إلغاء طلب غير موجود', async () => {
      // Arrange
      mockPrisma.order.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(orderService.cancelOrder('non-existent', 'user-123', 'سبب'))
        .rejects
        .toThrow('الطلب غير موجود');
    });

    it('يجب أن يرفض إلغاء طلب لمستخدم آخر', async () => {
      // Arrange
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'order-123',
        userId: 'user-456',
        status: 'PENDING'
      });

      // Act & Assert
      await expect(orderService.cancelOrder('order-123', 'user-123', 'سبب'))
        .rejects
        .toThrow('غير مصرح لك بإلغاء هذا الطلب');
    });

    it('يجب أن يرفض إلغاء طلب تم تسليمه', async () => {
      // Arrange
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'order-123',
        userId: 'user-123',
        status: 'DELIVERED'
      });

      // Act & Assert
      await expect(orderService.cancelOrder('order-123', 'user-123', 'سبب'))
        .rejects
        .toThrow('لا يمكن إلغاء طلب تم تسليمه');
    });
  });

  // ==========================================
  // اختبارات إحصائيات الطلبات
  // ==========================================
  describe('getOrderStats()', () => {
    it('يجب أن يحسب إحصائيات الطلبات بنجاح', async () => {
      // Arrange
      const mockStats = [
        { status: 'PENDING', _count: { id: 5 }, _sum: { totalAmount: 500 } },
        { status: 'DELIVERED', _count: { id: 10 }, _sum: { totalAmount: 1500 } }
      ];

      mockPrisma.order.groupBy.mockResolvedValue(mockStats);

      // Act
      const result = await orderService.getOrderStats('project-123');

      // Assert
      expect(mockPrisma.order.groupBy).toHaveBeenCalledWith({
        by: ['status'],
        where: { projectId: 'project-123' },
        _count: { id: true },
        _sum: { totalAmount: true }
      });
      expect(result).toEqual(mockStats);
    });

    it('يجب أن يطبق نطاق التاريخ إذا تم توفيره', async () => {
      // Arrange
      const dateRange = {
        start: '2024-01-01',
        end: '2024-12-31'
      };

      mockPrisma.order.groupBy.mockResolvedValue([]);

      // Act
      await orderService.getOrderStats('project-123', dateRange);

      // Assert
      expect(mockPrisma.order.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            projectId: 'project-123',
            createdAt: {
              gte: new Date(dateRange.start),
              lte: new Date(dateRange.end)
            }
          })
        })
      );
    });
  });
});

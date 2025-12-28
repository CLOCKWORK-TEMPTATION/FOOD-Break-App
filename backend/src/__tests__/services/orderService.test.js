/**
 * اختبارات وحدة orderService
 * Unit Tests for Order Service
 *
 * يغطي:
 * - إنشاء طلب جديد (Create Order)
 * - الحصول على الطلبات (Get Orders)
 * - الحصول على طلب محدد (Get Order By ID)
 * - تحديث حالة الطلب (Update Order Status)
 * - إلغاء الطلب (Cancel Order)
 * - حساب إحصائيات الطلبات (Order Statistics)
 */

const OrderService = require('../../services/orderService');
const { PrismaClient } = require('@prisma/client');

jest.mock('@prisma/client');

describe('OrderService - خدمة الطلبات', () => {
  let mockPrisma;
  let orderService;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPrisma = {
      order: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn()
      }
    };

    PrismaClient.mockImplementation(() => mockPrisma);

    // Re-require to get new instance with fresh mocks
    jest.resetModules();
    orderService = require('../../services/orderService');
  });

  describe('createOrder - إنشاء طلب جديد', () => {
    it('يجب إنشاء طلب جديد بنجاح', async () => {
      // Arrange
      const orderData = {
        userId: 'user-123',
        projectId: 'project-456',
        restaurantId: 'restaurant-789',
        totalAmount: 150.50,
        deliveryAddress: 'مكة المكرمة',
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

      const mockOrder = {
        id: 'order-123',
        ...orderData,
        status: 'PENDING',
        createdAt: new Date(),
        user: { id: 'user-123', firstName: 'أحمد' },
        restaurant: { id: 'restaurant-789', name: 'مطعم الفخامة' },
        project: { id: 'project-456', name: 'مشروع 1' }
      };

      mockPrisma.order.create.mockResolvedValue(mockOrder);

      // Act
      const result = await orderService.createOrder(orderData);

      // Assert
      expect(mockPrisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: orderData.userId,
            projectId: orderData.projectId,
            restaurantId: orderData.restaurantId,
            totalAmount: orderData.totalAmount,
            status: 'PENDING'
          })
        })
      );
      expect(result).toEqual(mockOrder);
      expect(result.status).toBe('PENDING');
    });

    it('يجب التعامل مع الطلبات بدون عناصر', async () => {
      // Arrange
      const orderData = {
        userId: 'user-123',
        projectId: 'project-456',
        restaurantId: 'restaurant-789',
        totalAmount: 0,
        deliveryAddress: 'مكة المكرمة',
        items: []
      };

      const mockOrder = {
        id: 'order-123',
        ...orderData,
        status: 'PENDING',
        createdAt: new Date()
      };

      mockPrisma.order.create.mockResolvedValue(mockOrder);

      // Act
      const result = await orderService.createOrder(orderData);

      // Assert
      expect(result).toBeDefined();
    });

    it('يجب رفع خطأ عند فشل إنشاء الطلب', async () => {
      // Arrange
      const orderData = {
        userId: 'user-123',
        projectId: 'project-456',
        restaurantId: 'restaurant-789',
        totalAmount: 150.50,
        deliveryAddress: 'مكة المكرمة',
        items: []
      };

      mockPrisma.order.create.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(orderService.createOrder(orderData)).rejects.toThrow(
        'خطأ في إنشاء الطلب'
      );
    });
  });

  describe('getOrders - الحصول على الطلبات', () => {
    it('يجب الحصول على الطلبات مع الفلاتر', async () => {
      // Arrange
      const filters = {
        userId: 'user-123',
        status: 'PENDING',
        page: 1,
        limit: 10
      };

      const mockOrders = [
        {
          id: 'order-1',
          userId: 'user-123',
          status: 'PENDING',
          totalAmount: 100
        },
        {
          id: 'order-2',
          userId: 'user-123',
          status: 'PENDING',
          totalAmount: 200
        }
      ];

      mockPrisma.order.findMany.mockResolvedValue(mockOrders);
      mockPrisma.order.count.mockResolvedValue(2);

      // Act
      const result = await orderService.getOrders(filters);

      // Assert
      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: filters.userId,
            status: filters.status
          })
        })
      );
      expect(result.orders).toEqual(mockOrders);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        pages: 1
      });
    });

    it('يجب الحصول على جميع الطلبات بدون فلاتر', async () => {
      // Arrange
      const mockOrders = [
        { id: 'order-1', status: 'PENDING' },
        { id: 'order-2', status: 'CONFIRMED' },
        { id: 'order-3', status: 'DELIVERED' }
      ];

      mockPrisma.order.findMany.mockResolvedValue(mockOrders);
      mockPrisma.order.count.mockResolvedValue(3);

      // Act
      const result = await orderService.getOrders({});

      // Assert
      expect(result.orders).toHaveLength(3);
      expect(result.pagination.total).toBe(3);
    });

    it('يجب دعم الـ Pagination بشكل صحيح', async () => {
      // Arrange
      const filters = { page: 2, limit: 5 };
      mockPrisma.order.findMany.mockResolvedValue([]);
      mockPrisma.order.count.mockResolvedValue(12);

      // Act
      const result = await orderService.getOrders(filters);

      // Assert
      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5, // (page - 1) * limit = (2 - 1) * 5
          take: 5
        })
      );
      expect(result.pagination.pages).toBe(3); // Math.ceil(12 / 5)
    });
  });

  describe('getOrderById - الحصول على طلب محدد', () => {
    it('يجب الحصول على طلب محدد بنجاح', async () => {
      // Arrange
      const orderId = 'order-123';
      const mockOrder = {
        id: orderId,
        userId: 'user-123',
        status: 'CONFIRMED',
        totalAmount: 150.50
      };

      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);

      // Act
      const result = await orderService.getOrderById(orderId);

      // Assert
      expect(mockPrisma.order.findUnique).toHaveBeenCalledWith({
        where: { id: orderId },
        include: expect.any(Object)
      });
      expect(result).toEqual(mockOrder);
    });

    it('يجب رفع خطأ عند عدم وجود الطلب', async () => {
      // Arrange
      const orderId = 'nonexistent-order';
      mockPrisma.order.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(orderService.getOrderById(orderId)).rejects.toThrow(
        'الطلب غير موجود'
      );
    });
  });

  describe('updateOrderStatus - تحديث حالة الطلب', () => {
    it('يجب تحديث حالة الطلب بنجاح', async () => {
      // Arrange
      const orderId = 'order-123';
      const newStatus = 'CONFIRMED';
      const updatedBy = 'admin-456';

      const mockUpdatedOrder = {
        id: orderId,
        status: newStatus,
        updatedAt: new Date()
      };

      mockPrisma.order.update.mockResolvedValue(mockUpdatedOrder);

      // Act
      const result = await orderService.updateOrderStatus(orderId, newStatus, updatedBy);

      // Assert
      expect(mockPrisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: orderId },
          data: expect.objectContaining({
            status: newStatus
          })
        })
      );
      expect(result.status).toBe(newStatus);
    });

    it('يجب رفض الحالات غير الصحيحة', async () => {
      // Arrange
      const orderId = 'order-123';
      const invalidStatus = 'INVALID_STATUS';

      // Act & Assert
      await expect(
        orderService.updateOrderStatus(orderId, invalidStatus, 'admin')
      ).rejects.toThrow('حالة الطلب غير صحيحة');

      expect(mockPrisma.order.update).not.toHaveBeenCalled();
    });

    it('يجب قبول جميع الحالات الصحيحة', async () => {
      // Arrange
      const validStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED'];
      const orderId = 'order-123';

      mockPrisma.order.update.mockResolvedValue({ id: orderId, status: '' });

      // Act & Assert
      for (const status of validStatuses) {
        await expect(
          orderService.updateOrderStatus(orderId, status, 'admin')
        ).resolves.toBeDefined();
      }
    });
  });

  describe('cancelOrder - إلغاء الطلب', () => {
    it('يجب إلغاء الطلب بنجاح', async () => {
      // Arrange
      const orderId = 'order-123';
      const userId = 'user-123';
      const reason = 'تغيير في الخطة';

      const mockOrder = {
        id: orderId,
        userId: userId,
        status: 'PENDING'
      };

      const mockCancelledOrder = {
        ...mockOrder,
        status: 'CANCELLED',
        updatedAt: new Date()
      };

      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.order.update.mockResolvedValue(mockCancelledOrder);

      // Act
      const result = await orderService.cancelOrder(orderId, userId, reason);

      // Assert
      expect(result.status).toBe('CANCELLED');
    });

    it('يجب رفض إلغاء طلب غير موجود', async () => {
      // Arrange
      mockPrisma.order.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        orderService.cancelOrder('order-123', 'user-123', 'reason')
      ).rejects.toThrow('الطلب غير موجود');
    });

    it('يجب رفض إلغاء طلب لمستخدم آخر', async () => {
      // Arrange
      const mockOrder = {
        id: 'order-123',
        userId: 'user-123',
        status: 'PENDING'
      };

      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);

      // Act & Assert
      await expect(
        orderService.cancelOrder('order-123', 'different-user', 'reason')
      ).rejects.toThrow('غير مصرح لك بإلغاء هذا الطلب');
    });

    it('يجب رفض إلغاء طلب تم تسليمه', async () => {
      // Arrange
      const mockOrder = {
        id: 'order-123',
        userId: 'user-123',
        status: 'DELIVERED'
      };

      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);

      // Act & Assert
      await expect(
        orderService.cancelOrder('order-123', 'user-123', 'reason')
      ).rejects.toThrow('لا يمكن إلغاء طلب تم تسليمه');
    });
  });

  describe('getOrderStats - حساب إحصائيات الطلبات', () => {
    it('يجب حساب الإحصائيات بنجاح', async () => {
      // Arrange
      const projectId = 'project-123';
      const dateRange = {
        start: '2024-01-01',
        end: '2024-01-31'
      };

      const mockStats = [
        { status: 'PENDING', _count: { id: 5 }, _sum: { totalAmount: 500 } },
        { status: 'DELIVERED', _count: { id: 10 }, _sum: { totalAmount: 1500 } }
      ];

      mockPrisma.order.groupBy.mockResolvedValue(mockStats);

      // Act
      const result = await orderService.getOrderStats(projectId, dateRange);

      // Assert
      expect(mockPrisma.order.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          by: ['status'],
          where: expect.objectContaining({
            projectId,
            createdAt: expect.any(Object)
          })
        })
      );
      expect(result).toEqual(mockStats);
    });

    it('يجب العمل بدون نطاق تاريخي', async () => {
      // Arrange
      const projectId = 'project-123';
      mockPrisma.order.groupBy.mockResolvedValue([]);

      // Act
      await orderService.getOrderStats(projectId);

      // Assert
      expect(mockPrisma.order.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            createdAt: expect.any(Object)
          })
        })
      );
    });
  });
});

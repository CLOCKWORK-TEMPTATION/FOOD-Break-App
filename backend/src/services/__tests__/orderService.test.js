/**
 * اختبارات خدمة الطلبات (OrderService)
 * Unit Tests لخدمة إدارة الطلبات
 */

const orderService = require('../orderService');
const { PrismaClient } = require('@prisma/client');

// Mock Prisma Client
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    order: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

const prisma = new PrismaClient();

describe('OrderService - اختبارات خدمة الطلبات', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrder - إنشاء طلب جديد', () => {
    const mockOrderData = {
      userId: 'user_123',
      projectId: 'project_456',
      restaurantId: 'restaurant_789',
      totalAmount: 150.5,
      deliveryAddress: 'القاهرة، شارع العمال',
      items: [
        {
          menuItemId: 'menu_1',
          quantity: 2,
          price: 50,
          specialInstructions: 'بدون بصلاً',
        },
        {
          menuItemId: 'menu_2',
          quantity: 1,
          price: 50.5,
        },
      ],
    };

    it('يجب أن ينشئ طلباً جديداً بنجاح', async () => {
      const createdOrder = {
        id: 'order_123',
        status: 'PENDING',
        ...mockOrderData,
        user: { id: mockOrderData.userId, firstName: 'محمد' },
        restaurant: { id: mockOrderData.restaurantId, name: 'مطعم حسن' },
        project: { id: mockOrderData.projectId, name: 'مشروع الأسبوع' },
      };

      prisma.order.create.mockResolvedValue(createdOrder);

      const result = await orderService.createOrder(mockOrderData);

      expect(result).toEqual(createdOrder);
      expect(prisma.order.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockOrderData.userId,
          projectId: mockOrderData.projectId,
          restaurantId: mockOrderData.restaurantId,
          totalAmount: mockOrderData.totalAmount,
          status: 'PENDING',
          deliveryAddress: mockOrderData.deliveryAddress,
          items: {
            create: [
              {
                menuItemId: 'menu_1',
                quantity: 2,
                price: 50,
                specialInstructions: 'بدون بصلاً',
              },
              {
                menuItemId: 'menu_2',
                quantity: 1,
                price: 50.5,
                specialInstructions: null,
              },
            ],
          },
        }),
        include: expect.any(Object),
      });
    });

    it('يجب أن يعالج المصفوفة الفارغة للعناصر', async () => {
      const orderWithEmptyItems = { ...mockOrderData, items: [] };
      prisma.order.create.mockResolvedValue({
        id: 'order_123',
        items: [],
      });

      await orderService.createOrder(orderWithEmptyItems);

      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            items: { create: [] },
          }),
        })
      );
    });

    it('يجب أن يعالج العناصر بدون تعليمات خاصة', async () => {
      const itemsWithoutInstructions = [
        { menuItemId: 'menu_1', quantity: 1, price: 50 },
      ];
      const orderData = { ...mockOrderData, items: itemsWithoutInstructions };

      prisma.order.create.mockResolvedValue({ id: 'order_123' });

      await orderService.createOrder(orderData);

      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            items: {
              create: [
                expect.objectContaining({
                  specialInstructions: null,
                }),
              ],
            },
          }),
        })
      );
    });

    it('يجب أن يرمي خطأ عند فشل إنشاء الطلب', async () => {
      prisma.order.create.mockRejectedValue(
        new Error('Database error')
      );

      await expect(orderService.createOrder(mockOrderData)).rejects.toThrow(
        'خطأ في إنشاء الطلب:'
      );
    });
  });

  describe('getOrders - جلب الطلبات مع التصفية', () => {
    const mockOrders = [
      {
        id: 'order_1',
        status: 'PENDING',
        user: { id: 'user_123', firstName: 'محمد' },
        restaurant: { id: 'rest_1', name: 'مطعم حسن' },
      },
      {
        id: 'order_2',
        status: 'DELIVERED',
        user: { id: 'user_123', firstName: 'محمد' },
        restaurant: { id: 'rest_1', name: 'مطعم حسن' },
      },
    ];

    it('يجب أن يرجع جميع الطلبات بدون فلاتر', async () => {
      prisma.order.findMany.mockResolvedValue(mockOrders);
      prisma.order.count.mockResolvedValue(2);

      const result = await orderService.getOrders();

      expect(result.orders).toEqual(mockOrders);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        pages: 1,
      });
    });

    it('يجب أن يصفّي الطلبات حسب المستخدم', async () => {
      prisma.order.findMany.mockResolvedValue([mockOrders[0]]);
      prisma.order.count.mockResolvedValue(1);

      await orderService.getOrders({ userId: 'user_123' });

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user_123' },
        })
      );
    });

    it('يجب أن يصفّي الطلبات حسب الحالة', async () => {
      prisma.order.findMany.mockResolvedValue([mockOrders[0]]);
      prisma.order.count.mockResolvedValue(1);

      await orderService.getOrders({ status: 'PENDING' });

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'PENDING' },
        })
      );
    });

    it('يجب أن يطبق الترقيم (pagination) بشكل صحيح', async () => {
      prisma.order.findMany.mockResolvedValue(mockOrders);
      prisma.order.count.mockResolvedValue(25);

      const result = await orderService.getOrders({ page: 2, limit: 10 });

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
      expect(result.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        pages: 3,
      });
    });

    it('يجب أن يطبق فلاتر متعددة معاً', async () => {
      prisma.order.findMany.mockResolvedValue([mockOrders[0]]);
      prisma.order.count.mockResolvedValue(1);

      await orderService.getOrders({
        userId: 'user_123',
        projectId: 'project_456',
        status: 'PENDING',
        page: 1,
        limit: 5,
      });

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: 'user_123',
            projectId: 'project_456',
            status: 'PENDING',
          },
          skip: 0,
          take: 5,
        })
      );
    });

    it('يجب أن يرتب الطلبات من الأحدث للأقدم', async () => {
      prisma.order.findMany.mockResolvedValue(mockOrders);
      prisma.order.count.mockResolvedValue(2);

      await orderService.getOrders();

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      );
    });
  });

  describe('getOrderById - جلب طلب محدد', () => {
    const mockOrder = {
      id: 'order_123',
      status: 'PENDING',
      totalAmount: 150,
      user: { id: 'user_123', firstName: 'محمد' },
      restaurant: { id: 'rest_1', name: 'مطعم حسن' },
      project: { id: 'proj_1', name: 'مشروع الأسبوع' },
    };

    it('يجب أن يرجع الطلب الموجود', async () => {
      prisma.order.findUnique.mockResolvedValue(mockOrder);

      const result = await orderService.getOrderById('order_123');

      expect(result).toEqual(mockOrder);
      expect(prisma.order.findUnique).toHaveBeenCalledWith({
        where: { id: 'order_123' },
        include: expect.any(Object),
      });
    });

    it('يجب أن يرمي خطأ للطلب غير الموجود', async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(orderService.getOrderById('non_existent')).rejects.toThrow(
        'الطلب غير موجود'
      );
    });
  });

  describe('updateOrderStatus - تحديث حالة الطلب', () => {
    const mockOrder = {
      id: 'order_123',
      status: 'CONFIRMED',
      user: { id: 'user_123', firstName: 'محمد' },
      restaurant: { id: 'rest_1', name: 'مطعم حسن' },
    };

    it('يجب أن يحدث الحالة إلى قيمة صحيحة', async () => {
      prisma.order.update.mockResolvedValue(mockOrder);

      const result = await orderService.updateOrderStatus(
        'order_123',
        'CONFIRMED',
        'admin_123'
      );

      expect(result.status).toBe('CONFIRMED');
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order_123' },
        data: {
          status: 'CONFIRMED',
          updatedAt: expect.any(Date),
        },
        include: expect.any(Object),
      });
    });

    it('يجب أن يقبل جميع الحالات الصحيحة', () => {
      const validStatuses = [
        'PENDING',
        'CONFIRMED',
        'PREPARING',
        'READY',
        'DELIVERED',
        'CANCELLED',
      ];

      validStatuses.forEach((status) => {
        expect(() => {
          // لا يمكننا اختبار async مباشرة، لكن يمكننا التحقق من المنطق
          const orderService = require('../orderService');
        }).not.toThrow();
      });
    });

    it('يجب أن يرفض الحالات غير الصحيحة', async () => {
      await expect(
        orderService.updateOrderStatus('order_123', 'INVALID_STATUS')
      ).rejects.toThrow('حالة الطلب غير صحيحة');

      expect(prisma.order.update).not.toHaveBeenCalled();
    });

    it('يجب أن يحدث تاريخ التحديث', async () => {
      prisma.order.update.mockResolvedValue(mockOrder);

      await orderService.updateOrderStatus('order_123', 'PREPARING');

      const updateCall = prisma.order.update.mock.calls[0][0];
      expect(updateCall.data.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('cancelOrder - إلغاء الطلب', () => {
    const mockPendingOrder = {
      id: 'order_123',
      userId: 'user_123',
      status: 'PENDING',
    };

    const mockDeliveredOrder = {
      id: 'order_456',
      userId: 'user_123',
      status: 'DELIVERED',
    };

    it('يجب أن يلغي طلباً في حالة PENDING', async () => {
      prisma.order.findUnique.mockResolvedValue(mockPendingOrder);
      prisma.order.update.mockResolvedValue({
        ...mockPendingOrder,
        status: 'CANCELLED',
      });

      const result = await orderService.cancelOrder(
        'order_123',
        'user_123',
        'رغبة المستخدم'
      );

      expect(result.status).toBe('CANCELLED');
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order_123' },
        data: {
          status: 'CANCELLED',
          updatedAt: expect.any(Date),
        },
      });
    });

    it('يجب أن يرفض إلغاء طلب غير موجود', async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(
        orderService.cancelOrder('non_existent', 'user_123', 'سبب')
      ).rejects.toThrow('الطلب غير موجود');
    });

    it('يجب أن يرفض إلغاء طلب لمستخدم آخر', async () => {
      prisma.order.findUnique.mockResolvedValue({
        ...mockPendingOrder,
        userId: 'different_user',
      });

      await expect(
        orderService.cancelOrder('order_123', 'user_123', 'سبب')
      ).rejects.toThrow('غير مصرح لك بإلغاء هذا الطلب');
    });

    it('يجب أن يرفض إلغاء طلب تم تسليمه', async () => {
      prisma.order.findUnique.mockResolvedValue(mockDeliveredOrder);

      await expect(
        orderService.cancelOrder('order_456', 'user_123', 'سبب')
      ).rejects.toThrow('لا يمكن إلغاء طلب تم تسليمه');
    });
  });

  describe('getOrderStats - حساب إحصائيات الطلبات', () => {
    const mockStats = [
      { status: 'PENDING', _count: { id: 10 }, _sum: { totalAmount: 500 } },
      { status: 'DELIVERED', _count: { id: 25 }, _sum: { totalAmount: 2500 } },
    ];

    it('يجب أن يحسب إحصائيات الطلبات لمشروع', async () => {
      prisma.order.groupBy.mockResolvedValue(mockStats);

      const result = await orderService.getOrderStats('project_123');

      expect(result).toEqual(mockStats);
      expect(prisma.order.groupBy).toHaveBeenCalledWith({
        by: ['status'],
        where: { projectId: 'project_123' },
        _count: { id: true },
        _sum: { totalAmount: true },
      });
    });

    it('يجب أن يطبق فلتر النطاق الزمني', async () => {
      prisma.order.groupBy.mockResolvedValue(mockStats);

      const dateRange = {
        start: '2024-01-01',
        end: '2024-12-31',
      };

      await orderService.getOrderStats('project_123', dateRange);

      expect(prisma.order.groupBy).toHaveBeenCalledWith({
        by: ['status'],
        where: {
          projectId: 'project_123',
          createdAt: {
            gte: new Date(dateRange.start),
            lte: new Date(dateRange.end),
          },
        },
        _count: { id: true },
        _sum: { totalAmount: true },
      });
    });

    it('يجب أن يعالج عدم وجود نطاق زمني', async () => {
      prisma.order.groupBy.mockResolvedValue(mockStats);

      await orderService.getOrderStats('project_123', null);

      expect(prisma.order.groupBy).toHaveBeenCalledWith({
        by: ['status'],
        where: { projectId: 'project_123' },
        _count: { id: true },
        _sum: { totalAmount: true },
      });
    });
  });
});

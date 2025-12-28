// Mock database
jest.mock('@prisma/client', () => {
  const mPrisma = {
    order: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      groupBy: jest.fn(),
    },
    $disconnect: jest.fn(),
  };
  return { PrismaClient: jest.fn(() => mPrisma) };
});

const orderService = require('../orderService');
const { PrismaClient } = require('@prisma/client');

describe('OrderService', () => {
  let prisma;

  beforeEach(() => {
    // Access the mock instance
    prisma = new PrismaClient();
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    it('should create an order successfully', async () => {
      const orderData = {
        userId: 'user-1',
        projectId: 'project-1',
        restaurantId: 'rest-1',
        totalAmount: 100,
        deliveryAddress: '123 Main St',
        items: [
          { menuItemId: 'item-1', quantity: 2, price: 50 }
        ]
      };

      const mockOrder = {
        id: 'order-1',
        ...orderData,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      prisma.order.create.mockResolvedValue(mockOrder);

      const result = await orderService.createOrder(orderData);

      expect(prisma.order.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          userId: orderData.userId,
          totalAmount: orderData.totalAmount,
          items: {
            create: expect.arrayContaining([
              expect.objectContaining({ menuItemId: 'item-1', quantity: 2 })
            ])
          }
        })
      }));
      expect(result).toEqual(mockOrder);
    });

    it('should handle errors during creation', async () => {
      prisma.order.create.mockRejectedValue(new Error('DB Error'));
      await expect(orderService.createOrder({})).rejects.toThrow('خطأ في إنشاء الطلب');
    });
  });

  describe('getOrderById', () => {
    it('should return order if found', async () => {
      const mockOrder = { id: 'order-1', status: 'PENDING' };
      prisma.order.findUnique.mockResolvedValue(mockOrder);

      const result = await orderService.getOrderById('order-1');
      expect(result).toEqual(mockOrder);
    });

    it('should throw error if order not found', async () => {
      prisma.order.findUnique.mockResolvedValue(null);
      await expect(orderService.getOrderById('non-existent')).rejects.toThrow('الطلب غير موجود');
    });
  });

  describe('updateOrderStatus', () => {
    it('should update status successfully', async () => {
      const mockOrder = { id: 'order-1', status: 'CONFIRMED' };
      prisma.order.update.mockResolvedValue(mockOrder);

      const result = await orderService.updateOrderStatus('order-1', 'CONFIRMED', 'admin');
      expect(prisma.order.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'order-1' },
        data: expect.objectContaining({ status: 'CONFIRMED' })
      }));
      expect(result).toEqual(mockOrder);
    });

    it('should throw error for invalid status', async () => {
      await expect(orderService.updateOrderStatus('order-1', 'INVALID_STATUS', 'admin'))
        .rejects.toThrow('حالة الطلب غير صحيحة');
    });
  });
});

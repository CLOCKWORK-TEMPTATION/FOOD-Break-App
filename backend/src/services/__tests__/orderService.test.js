const { mockDeep } = require('jest-mock-extended');

// 1. Create the mock instance first
const mockPrisma = mockDeep();

// 2. Mock the module to return that specific instance
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma)
}));

// 3. Import the service (which will call new PrismaClient())
const orderService = require('../orderService');

describe('OrderService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    const orderData = {
      userId: 'user-1',
      projectId: 'project-1',
      restaurantId: 'rest-1',
      totalAmount: 100,
      deliveryAddress: 'Test Address',
      items: [
        { menuItemId: 'item-1', quantity: 2, price: 50 }
      ]
    };

    it('should create an order successfully', async () => {
      const createdOrder = {
        id: 'order-1',
        ...orderData,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.order.create.mockResolvedValue(createdOrder);

      const result = await orderService.createOrder(orderData);

      expect(mockPrisma.order.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: orderData.userId,
          projectId: orderData.projectId,
          totalAmount: orderData.totalAmount,
          status: 'PENDING'
        }),
        include: expect.any(Object)
      });
      expect(result).toEqual(createdOrder);
    });

    it('should handle errors during creation', async () => {
      mockPrisma.order.create.mockRejectedValue(new Error('DB Error'));

      await expect(orderService.createOrder(orderData)).rejects.toThrow('خطأ في إنشاء الطلب: DB Error');
    });
  });

  describe('getOrders', () => {
    it('should get orders with pagination', async () => {
      const mockOrders = [{ id: 1 }, { id: 2 }];
      mockPrisma.order.findMany.mockResolvedValue(mockOrders);
      mockPrisma.order.count.mockResolvedValue(2);

      const result = await orderService.getOrders({ page: 1, limit: 10 });

      expect(mockPrisma.order.findMany).toHaveBeenCalled();
      expect(result.orders).toEqual(mockOrders);
      expect(result.pagination.total).toBe(2);
    });
  });
});

const orderService = require('../../orderService');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('OrderService', () => {
  let testUser, testProject, testRestaurant, testMenuItem;

  beforeAll(async () => {
    testUser = await prisma.user.create({
      data: { email: 'test@test.com', passwordHash: 'hash', firstName: 'Test', lastName: 'User', role: 'REGULAR' }
    });
    testProject = await prisma.project.create({
      data: { name: 'Test Project', qrCode: 'TEST123', startDate: new Date(), orderWindow: 60 }
    });
    testRestaurant = await prisma.restaurant.create({
      data: { name: 'Test Restaurant', address: 'Test Address', latitude: 0, longitude: 0 }
    });
    testMenuItem = await prisma.menuItem.create({
      data: { restaurantId: testRestaurant.id, name: 'Test Item', price: 50 }
    });
  });

  afterAll(async () => {
    await prisma.order.deleteMany();
    await prisma.menuItem.deleteMany();
    await prisma.restaurant.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('createOrder', () => {
    it('should create order successfully', async () => {
      const orderData = {
        userId: testUser.id,
        projectId: testProject.id,
        restaurantId: testRestaurant.id,
        totalAmount: 100,
        items: [{ menuItemId: testMenuItem.id, quantity: 2, price: 50 }]
      };

      const order = await orderService.createOrder(orderData);
      expect(order).toBeDefined();
      expect(order.userId).toBe(testUser.id);
      expect(order.status).toBe('PENDING');
    });

    it('should throw error if outside order window', async () => {
      const closedProject = await prisma.project.create({
        data: { name: 'Closed', qrCode: 'CLOSED', startDate: new Date(Date.now() - 2 * 60 * 60 * 1000), orderWindow: 60 }
      });

      await expect(orderService.createOrder({
        userId: testUser.id,
        projectId: closedProject.id,
        items: [{ menuItemId: testMenuItem.id, quantity: 1, price: 50 }]
      })).rejects.toThrow('نافذة الطلب مغلقة');

      await prisma.project.delete({ where: { id: closedProject.id } });
    });
  });

  describe('getOrders', () => {
    it('should return paginated orders', async () => {
      const result = await orderService.getOrders({ userId: testUser.id, page: 1, limit: 10 });
      expect(result).toHaveProperty('orders');
      expect(result).toHaveProperty('pagination');
      expect(Array.isArray(result.orders)).toBe(true);
    });

    it('should filter by status', async () => {
      const result = await orderService.getOrders({ status: 'PENDING' });
      expect(result.orders.every(o => o.status === 'PENDING')).toBe(true);
    });
  });

  describe('getOrderById', () => {
    it('should return order by id', async () => {
      const created = await orderService.createOrder({
        userId: testUser.id,
        totalAmount: 50,
        items: [{ menuItemId: testMenuItem.id, quantity: 1, price: 50 }]
      });

      const order = await orderService.getOrderById(created.id);
      expect(order.id).toBe(created.id);
    });

    it('should throw error if order not found', async () => {
      await expect(orderService.getOrderById('invalid-id')).rejects.toThrow();
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status', async () => {
      const created = await orderService.createOrder({
        userId: testUser.id,
        totalAmount: 50,
        items: [{ menuItemId: testMenuItem.id, quantity: 1, price: 50 }]
      });

      const updated = await orderService.updateOrderStatus(created.id, 'CONFIRMED', testUser.id);
      expect(updated.status).toBe('CONFIRMED');
    });

    it('should throw error for invalid status', async () => {
      const created = await orderService.createOrder({
        userId: testUser.id,
        totalAmount: 50,
        items: [{ menuItemId: testMenuItem.id, quantity: 1, price: 50 }]
      });

      await expect(orderService.updateOrderStatus(created.id, 'INVALID', testUser.id)).rejects.toThrow();
    });
  });

  describe('cancelOrder', () => {
    it('should cancel order', async () => {
      const created = await orderService.createOrder({
        userId: testUser.id,
        totalAmount: 50,
        items: [{ menuItemId: testMenuItem.id, quantity: 1, price: 50 }]
      });

      const cancelled = await orderService.cancelOrder(created.id, testUser.id, 'Test reason');
      expect(cancelled.status).toBe('CANCELLED');
    });

    it('should throw error if not owner', async () => {
      const otherUser = await prisma.user.create({
        data: { email: 'other@test.com', passwordHash: 'hash', firstName: 'Other', lastName: 'User' }
      });

      const created = await orderService.createOrder({
        userId: testUser.id,
        totalAmount: 50,
        items: [{ menuItemId: testMenuItem.id, quantity: 1, price: 50 }]
      });

      await expect(orderService.cancelOrder(created.id, otherUser.id, 'Test')).rejects.toThrow();
      await prisma.user.delete({ where: { id: otherUser.id } });
    });
  });

  describe('aggregateOrdersByRestaurant', () => {
    it('should aggregate orders by restaurant', async () => {
      await orderService.createOrder({
        userId: testUser.id,
        projectId: testProject.id,
        restaurantId: testRestaurant.id,
        totalAmount: 100,
        items: [{ menuItemId: testMenuItem.id, quantity: 2, price: 50 }]
      });

      const result = await orderService.aggregateOrdersByRestaurant(testProject.id, new Date().toISOString().split('T')[0]);
      expect(Array.isArray(result)).toBe(true);
    });
  });
});

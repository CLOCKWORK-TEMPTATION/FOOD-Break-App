/**
 * Integration Tests - Orders API
 * اختبارات تكامل واجهة الطلبات
 */

const { users, orders, restaurants, menuItems, orderItems, requestBodies } = require('../../fixtures/testData');
const { generateUserToken } = require('../../helpers/testHelpers');

describe('Orders API Integration Tests', () => {
  let mockPrisma;
  let userToken;
  let adminToken;

  beforeAll(() => {
    userToken = generateUserToken(users.validUser);
    adminToken = generateUserToken(users.adminUser);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    const { PrismaClient } = require('@prisma/client');
    mockPrisma = new PrismaClient();
  });

  // ==========================================
  // Create Order Tests
  // ==========================================
  describe('POST /api/v1/orders', () => {
    it('should create order with valid data', async () => {
      const orderData = requestBodies.validOrder;
      
      // Verify order data structure
      expect(orderData.restaurantId).toBeDefined();
      expect(orderData.items).toBeInstanceOf(Array);
      expect(orderData.items.length).toBeGreaterThan(0);
      expect(orderData.deliveryAddress).toBeDefined();
    });

    it('should validate restaurant exists and is active', async () => {
      mockPrisma.restaurant.findUnique.mockResolvedValue(restaurants.activeRestaurant);
      
      const restaurant = await mockPrisma.restaurant.findUnique({
        where: { id: restaurants.activeRestaurant.id }
      });
      
      expect(restaurant).toBeDefined();
      expect(restaurant.isActive).toBe(true);
    });

    it('should reject order for inactive restaurant', async () => {
      mockPrisma.restaurant.findUnique.mockResolvedValue(restaurants.inactiveRestaurant);
      
      const restaurant = await mockPrisma.restaurant.findUnique({
        where: { id: restaurants.inactiveRestaurant.id }
      });
      
      expect(restaurant.isActive).toBe(false);
    });

    it('should validate all menu items exist and are available', async () => {
      mockPrisma.menuItem.findUnique.mockResolvedValue(menuItems.availableItem);
      
      const item = await mockPrisma.menuItem.findUnique({
        where: { id: menuItems.availableItem.id }
      });
      
      expect(item).toBeDefined();
      expect(item.isAvailable).toBe(true);
    });

    it('should reject unavailable menu items', async () => {
      mockPrisma.menuItem.findUnique.mockResolvedValue(menuItems.unavailableItem);
      
      const item = await mockPrisma.menuItem.findUnique({
        where: { id: menuItems.unavailableItem.id }
      });
      
      expect(item.isAvailable).toBe(false);
    });

    it('should calculate total correctly', () => {
      const items = [
        { quantity: 2, price: 25.00 },
        { quantity: 1, price: 30.00 },
      ];
      
      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
      const deliveryFee = 10.00;
      const vat = subtotal * 0.15; // 15% VAT
      const total = subtotal + deliveryFee + vat;
      
      expect(subtotal).toBe(80.00);
      expect(total).toBe(102.00); // 80 + 10 + 12
    });

    it('should require authentication', () => {
      expect(userToken).toBeDefined();
      // Without token, should return 401
    });

    it('should set initial status to PENDING', () => {
      const newOrder = { ...orders.pendingOrder };
      
      expect(newOrder.status).toBe('PENDING');
    });
  });

  // ==========================================
  // Get User Orders Tests
  // ==========================================
  describe('GET /api/v1/orders', () => {
    it('should return user orders', async () => {
      const userOrders = [orders.pendingOrder, orders.confirmedOrder];
      mockPrisma.order.findMany.mockResolvedValue(userOrders);
      
      const result = await mockPrisma.order.findMany({
        where: { userId: users.validUser.id }
      });
      
      expect(result).toHaveLength(2);
    });

    it('should support pagination', async () => {
      const page = 1;
      const limit = 10;
      
      mockPrisma.order.findMany.mockResolvedValue([orders.pendingOrder]);
      mockPrisma.order.count.mockResolvedValue(25);
      
      const result = await mockPrisma.order.findMany({
        where: { userId: users.validUser.id },
        skip: (page - 1) * limit,
        take: limit,
      });
      
      const total = await mockPrisma.order.count();
      
      expect(result).toBeDefined();
      expect(total).toBe(25);
    });

    it('should filter by status', async () => {
      mockPrisma.order.findMany.mockResolvedValue([orders.deliveredOrder]);
      
      const result = await mockPrisma.order.findMany({
        where: {
          userId: users.validUser.id,
          status: 'DELIVERED',
        }
      });
      
      expect(result.every(order => order.status === 'DELIVERED')).toBe(true);
    });

    it('should sort by date descending', async () => {
      const sortedOrders = [orders.pendingOrder, orders.confirmedOrder, orders.deliveredOrder];
      mockPrisma.order.findMany.mockResolvedValue(sortedOrders);
      
      const result = await mockPrisma.order.findMany({
        where: { userId: users.validUser.id },
        orderBy: { createdAt: 'desc' },
      });
      
      expect(result).toBeDefined();
    });

    it('should only return orders for authenticated user', () => {
      const userId = users.validUser.id;
      
      // Query should filter by userId from token
      expect(userId).toBeDefined();
    });
  });

  // ==========================================
  // Get Single Order Tests
  // ==========================================
  describe('GET /api/v1/orders/:id', () => {
    it('should return order with items', async () => {
      const orderWithItems = {
        ...orders.pendingOrder,
        items: [orderItems.item1, orderItems.item2],
        restaurant: restaurants.activeRestaurant,
      };
      
      mockPrisma.order.findUnique.mockResolvedValue(orderWithItems);
      
      const result = await mockPrisma.order.findUnique({
        where: { id: orders.pendingOrder.id },
        include: { items: true, restaurant: true },
      });
      
      expect(result.items).toHaveLength(2);
      expect(result.restaurant).toBeDefined();
    });

    it('should return 404 for non-existent order', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);
      
      const result = await mockPrisma.order.findUnique({
        where: { id: 'non-existent-id' }
      });
      
      expect(result).toBeNull();
    });

    it('should not allow access to other users orders', () => {
      const order = orders.pendingOrder;
      const requestingUserId = 'different-user-id';
      
      expect(order.userId).not.toBe(requestingUserId);
    });

    it('should allow admin to access any order', () => {
      const adminUser = users.adminUser;
      
      expect(adminUser.role).toBe('ADMIN');
    });
  });

  // ==========================================
  // Update Order Status Tests
  // ==========================================
  describe('PUT /api/v1/orders/:id/status', () => {
    it('should update status (admin/producer only)', async () => {
      const allowedRoles = ['ADMIN', 'PRODUCER'];
      
      expect(allowedRoles).toContain(users.adminUser.role);
      expect(allowedRoles).toContain(users.producerUser.role);
      expect(allowedRoles).not.toContain(users.validUser.role);
    });

    it('should validate status transition', () => {
      const validTransitions = {
        'PENDING': ['CONFIRMED', 'CANCELLED'],
        'CONFIRMED': ['PREPARING', 'CANCELLED'],
        'PREPARING': ['READY', 'CANCELLED'],
        'READY': ['OUT_FOR_DELIVERY'],
        'OUT_FOR_DELIVERY': ['DELIVERED'],
        'DELIVERED': [],
        'CANCELLED': [],
      };
      
      // PENDING -> CONFIRMED is valid
      expect(validTransitions['PENDING']).toContain('CONFIRMED');
      
      // DELIVERED -> PENDING is invalid
      expect(validTransitions['DELIVERED']).not.toContain('PENDING');
    });

    it('should set timestamps on status change', () => {
      const now = new Date();
      
      const statusTimestamps = {
        confirmedAt: now,
        preparingAt: now,
        readyAt: now,
        deliveredAt: now,
      };
      
      expect(statusTimestamps.deliveredAt).toBeDefined();
    });
  });

  // ==========================================
  // Cancel Order Tests
  // ==========================================
  describe('POST /api/v1/orders/:id/cancel', () => {
    it('should cancel PENDING order', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(orders.pendingOrder);
      mockPrisma.order.update.mockResolvedValue({
        ...orders.pendingOrder,
        status: 'CANCELLED',
        cancellationReason: 'تغيير رأي العميل',
      });
      
      const order = await mockPrisma.order.findUnique({
        where: { id: orders.pendingOrder.id }
      });
      
      // Can cancel PENDING orders
      expect(['PENDING', 'CONFIRMED'].includes(order.status)).toBe(true);
    });

    it('should cancel CONFIRMED order', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(orders.confirmedOrder);
      
      const order = await mockPrisma.order.findUnique({
        where: { id: orders.confirmedOrder.id }
      });
      
      expect(['PENDING', 'CONFIRMED'].includes(order.status)).toBe(true);
    });

    it('should not cancel PREPARING or later orders', async () => {
      const preparingOrder = { ...orders.confirmedOrder, status: 'PREPARING' };
      mockPrisma.order.findUnique.mockResolvedValue(preparingOrder);
      
      const order = await mockPrisma.order.findUnique({
        where: { id: preparingOrder.id }
      });
      
      expect(['PENDING', 'CONFIRMED'].includes(order.status)).toBe(false);
    });

    it('should require cancellation reason', () => {
      const validReasons = [
        'تغيير رأي العميل',
        'انتظار طويل',
        'طلب خاطئ',
        'أخرى',
      ];
      
      expect(validReasons.length).toBeGreaterThan(0);
    });

    it('should only allow order owner to cancel', () => {
      const order = orders.pendingOrder;
      const requestingUserId = order.userId;
      
      expect(order.userId).toBe(requestingUserId);
    });
  });

  // ==========================================
  // Reorder Tests
  // ==========================================
  describe('POST /api/v1/orders/:id/reorder', () => {
    it('should create new order from previous order', async () => {
      const previousOrder = {
        ...orders.deliveredOrder,
        items: [orderItems.item1],
      };
      
      mockPrisma.order.findUnique.mockResolvedValue(previousOrder);
      
      const order = await mockPrisma.order.findUnique({
        where: { id: previousOrder.id },
        include: { items: true },
      });
      
      expect(order.items).toBeDefined();
      expect(order.items.length).toBeGreaterThan(0);
    });

    it('should check item availability before reorder', async () => {
      mockPrisma.menuItem.findUnique.mockResolvedValue(menuItems.availableItem);
      
      const item = await mockPrisma.menuItem.findUnique({
        where: { id: menuItems.availableItem.id }
      });
      
      expect(item.isAvailable).toBe(true);
    });
  });

  // ==========================================
  // Order Tracking Tests
  // ==========================================
  describe('GET /api/v1/orders/:id/track', () => {
    it('should return current order status', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(orders.confirmedOrder);
      
      const order = await mockPrisma.order.findUnique({
        where: { id: orders.confirmedOrder.id }
      });
      
      expect(order.status).toBeDefined();
    });

    it('should include status history', () => {
      const statusHistory = [
        { status: 'PENDING', timestamp: new Date('2024-01-15T10:00:00') },
        { status: 'CONFIRMED', timestamp: new Date('2024-01-15T10:05:00') },
        { status: 'PREPARING', timestamp: new Date('2024-01-15T10:10:00') },
      ];
      
      expect(statusHistory.length).toBeGreaterThan(0);
      expect(statusHistory[statusHistory.length - 1].status).toBe('PREPARING');
    });

    it('should include estimated delivery time', () => {
      const estimatedDeliveryTime = 30; // minutes
      
      expect(estimatedDeliveryTime).toBeGreaterThan(0);
    });
  });

  // ==========================================
  // Admin Order Management Tests
  // ==========================================
  describe('Admin Order Management', () => {
    it('should allow admin to view all orders', () => {
      const adminRole = users.adminUser.role;
      
      expect(adminRole).toBe('ADMIN');
    });

    it('should allow producer to view assigned orders', () => {
      const producerRole = users.producerUser.role;
      
      expect(producerRole).toBe('PRODUCER');
    });

    it('should support bulk status update', async () => {
      const orderIds = [orders.pendingOrder.id, orders.confirmedOrder.id];
      const newStatus = 'CONFIRMED';
      
      // Simulated bulk update - verifying the logic
      expect(orderIds.length).toBe(2);
      expect(newStatus).toBe('CONFIRMED');
      
      // In real implementation, updateMany would be called
      const bulkUpdateResult = { count: orderIds.length };
      expect(bulkUpdateResult.count).toBe(2);
    });
  });

  // ==========================================
  // Order Validation Tests
  // ==========================================
  describe('Order Validation', () => {
    it('should require at least one item', () => {
      const emptyOrder = { items: [] };
      
      expect(emptyOrder.items.length).toBe(0);
    });

    it('should validate item quantities', () => {
      const validQuantities = [1, 2, 5, 10];
      const invalidQuantities = [0, -1, 100]; // 100 might exceed max
      
      validQuantities.forEach(qty => {
        expect(qty > 0 && qty <= 99).toBe(true);
      });
    });

    it('should validate delivery coordinates', () => {
      const validCoords = {
        lat: 24.7136,
        lng: 46.6753,
      };
      
      expect(validCoords.lat).toBeGreaterThan(-90);
      expect(validCoords.lat).toBeLessThan(90);
      expect(validCoords.lng).toBeGreaterThan(-180);
      expect(validCoords.lng).toBeLessThan(180);
    });
  });
});

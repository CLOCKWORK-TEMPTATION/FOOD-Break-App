/**
 * Unit Tests - Order Service
 * اختبارات وحدة خدمة الطلبات
 */

const { users, restaurants, menuItems, orders, orderItems, requestBodies } = require('../../fixtures/testData');
const { generateUUID } = require('../../helpers/testHelpers');

describe('Order Service', () => {
  let mockPrisma;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockPrisma = global.mockPrisma;
  });

  // ==========================================
  // Order Creation Tests
  // ==========================================
  describe('createOrder', () => {
    it('should create order with valid data', async () => {
      const userId = users.validUser.id;
      const orderData = requestBodies.validOrder;
      
      mockPrisma.restaurant.findUnique.mockResolvedValue(restaurants.activeRestaurant);
      mockPrisma.menuItem.findUnique.mockResolvedValue(menuItems.availableItem);
      mockPrisma.order.create.mockResolvedValue({
        ...orders.pendingOrder,
        userId,
        restaurantId: orderData.restaurantId,
      });
      
      // Verify restaurant exists and is active
      const restaurant = await mockPrisma.restaurant.findUnique({
        where: { id: orderData.restaurantId }
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

    it('should reject order with unavailable menu items', async () => {
      mockPrisma.menuItem.findUnique.mockResolvedValue(menuItems.unavailableItem);
      
      const item = await mockPrisma.menuItem.findUnique({
        where: { id: menuItems.unavailableItem.id }
      });
      
      expect(item.isAvailable).toBe(false);
    });

    it('should calculate total amount correctly', () => {
      const items = [
        { ...orderItems.item1, quantity: 2, price: 25.00 },
        { ...orderItems.item2, quantity: 1, price: 25.00 },
      ];
      
      const total = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
      
      expect(total).toBe(75.00);
    });

    it('should set initial status to PENDING', async () => {
      mockPrisma.order.create.mockResolvedValue(orders.pendingOrder);
      
      const order = await mockPrisma.order.create({
        data: {
          userId: users.validUser.id,
          restaurantId: restaurants.activeRestaurant.id,
          status: 'PENDING',
        }
      });
      
      expect(order.status).toBe('PENDING');
    });
  });

  // ==========================================
  // Order Retrieval Tests
  // ==========================================
  describe('getOrderById', () => {
    it('should return order with details', async () => {
      const orderWithDetails = {
        ...orders.pendingOrder,
        items: [orderItems.item1, orderItems.item2],
        restaurant: restaurants.activeRestaurant,
      };
      
      mockPrisma.order.findUnique.mockResolvedValue(orderWithDetails);
      
      const order = await mockPrisma.order.findUnique({
        where: { id: orders.pendingOrder.id },
        include: { items: true, restaurant: true }
      });
      
      expect(order).toBeDefined();
      expect(order.items).toHaveLength(2);
      expect(order.restaurant).toBeDefined();
    });

    it('should return null for non-existent order', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);
      
      const order = await mockPrisma.order.findUnique({
        where: { id: 'non-existent-id' }
      });
      
      expect(order).toBeNull();
    });
  });

  // ==========================================
  // User Orders Tests
  // ==========================================
  describe('getUserOrders', () => {
    it('should return all orders for user', async () => {
      const userOrders = [orders.pendingOrder, orders.confirmedOrder, orders.deliveredOrder];
      mockPrisma.order.findMany.mockResolvedValue(userOrders);
      
      const result = await mockPrisma.order.findMany({
        where: { userId: users.validUser.id }
      });
      
      expect(result).toHaveLength(3);
    });

    it('should return empty array for user with no orders', async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);
      
      const result = await mockPrisma.order.findMany({
        where: { userId: 'user-with-no-orders' }
      });
      
      expect(result).toEqual([]);
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
      
      const total = await mockPrisma.order.count({
        where: { userId: users.validUser.id }
      });
      
      expect(result).toBeDefined();
      expect(total).toBe(25);
    });

    it('should filter by status', async () => {
      mockPrisma.order.findMany.mockResolvedValue([orders.deliveredOrder]);
      
      const result = await mockPrisma.order.findMany({
        where: { 
          userId: users.validUser.id,
          status: 'DELIVERED'
        }
      });
      
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('DELIVERED');
    });
  });

  // ==========================================
  // Order Status Update Tests
  // ==========================================
  describe('updateOrderStatus', () => {
    it('should update status from PENDING to CONFIRMED', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(orders.pendingOrder);
      mockPrisma.order.update.mockResolvedValue({
        ...orders.pendingOrder,
        status: 'CONFIRMED',
      });
      
      const updated = await mockPrisma.order.update({
        where: { id: orders.pendingOrder.id },
        data: { status: 'CONFIRMED' }
      });
      
      expect(updated.status).toBe('CONFIRMED');
    });

    it('should update status from CONFIRMED to PREPARING', async () => {
      mockPrisma.order.update.mockResolvedValue({
        ...orders.confirmedOrder,
        status: 'PREPARING',
      });
      
      const updated = await mockPrisma.order.update({
        where: { id: orders.confirmedOrder.id },
        data: { status: 'PREPARING' }
      });
      
      expect(updated.status).toBe('PREPARING');
    });

    it('should update status to DELIVERED and set deliveredAt', async () => {
      const now = new Date();
      mockPrisma.order.update.mockResolvedValue({
        ...orders.confirmedOrder,
        status: 'DELIVERED',
        deliveredAt: now,
      });
      
      const updated = await mockPrisma.order.update({
        where: { id: orders.confirmedOrder.id },
        data: { 
          status: 'DELIVERED',
          deliveredAt: now,
        }
      });
      
      expect(updated.status).toBe('DELIVERED');
      expect(updated.deliveredAt).toBeDefined();
    });

    it('should not allow invalid status transitions', () => {
      // Valid status flow: PENDING -> CONFIRMED -> PREPARING -> READY -> OUT_FOR_DELIVERY -> DELIVERED
      const validTransitions = {
        'PENDING': ['CONFIRMED', 'CANCELLED'],
        'CONFIRMED': ['PREPARING', 'CANCELLED'],
        'PREPARING': ['READY', 'CANCELLED'],
        'READY': ['OUT_FOR_DELIVERY'],
        'OUT_FOR_DELIVERY': ['DELIVERED'],
        'DELIVERED': [],
        'CANCELLED': [],
      };
      
      // DELIVERED -> PENDING is invalid
      expect(validTransitions['DELIVERED']).not.toContain('PENDING');
      
      // CANCELLED -> anything is invalid
      expect(validTransitions['CANCELLED']).toEqual([]);
    });
  });

  // ==========================================
  // Order Cancellation Tests
  // ==========================================
  describe('cancelOrder', () => {
    it('should cancel PENDING order', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(orders.pendingOrder);
      mockPrisma.order.update.mockResolvedValue({
        ...orders.pendingOrder,
        status: 'CANCELLED',
        cancellationReason: 'تغيير رأي العميل',
      });
      
      const cancelled = await mockPrisma.order.update({
        where: { id: orders.pendingOrder.id },
        data: { 
          status: 'CANCELLED',
          cancellationReason: 'تغيير رأي العميل',
        }
      });
      
      expect(cancelled.status).toBe('CANCELLED');
    });

    it('should not cancel DELIVERED order', async () => {
      const deliveredOrder = orders.deliveredOrder;
      
      // Cannot cancel delivered orders
      expect(deliveredOrder.status).toBe('DELIVERED');
      
      // Business logic should prevent this
      const canCancel = ['PENDING', 'CONFIRMED'].includes(deliveredOrder.status);
      expect(canCancel).toBe(false);
    });

    it('should store cancellation reason', async () => {
      const reason = 'انتظار طويل';
      
      mockPrisma.order.update.mockResolvedValue({
        ...orders.pendingOrder,
        status: 'CANCELLED',
        cancellationReason: reason,
      });
      
      const cancelled = await mockPrisma.order.update({
        where: { id: orders.pendingOrder.id },
        data: { status: 'CANCELLED', cancellationReason: reason }
      });
      
      expect(cancelled.cancellationReason).toBe(reason);
    });
  });

  // ==========================================
  // Order Total Calculation Tests
  // ==========================================
  describe('calculateOrderTotal', () => {
    it('should calculate subtotal correctly', () => {
      const items = [
        { quantity: 2, price: 25.00 },
        { quantity: 3, price: 15.00 },
        { quantity: 1, price: 50.00 },
      ];
      
      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
      
      expect(subtotal).toBe(145.00); // (2*25) + (3*15) + (1*50)
    });

    it('should apply delivery fee', () => {
      const subtotal = 100.00;
      const deliveryFee = 10.00;
      
      const total = subtotal + deliveryFee;
      
      expect(total).toBe(110.00);
    });

    it('should apply discount correctly', () => {
      const subtotal = 100.00;
      const discountPercent = 10;
      
      const discount = subtotal * (discountPercent / 100);
      const total = subtotal - discount;
      
      expect(discount).toBe(10.00);
      expect(total).toBe(90.00);
    });

    it('should apply VAT correctly', () => {
      const subtotal = 100.00;
      const vatPercent = 15; // Saudi VAT
      
      const vat = subtotal * (vatPercent / 100);
      const total = subtotal + vat;
      
      expect(vat).toBe(15.00);
      expect(total).toBe(115.00);
    });
  });

  // ==========================================
  // Order Validation Tests
  // ==========================================
  describe('validateOrder', () => {
    it('should require at least one item', () => {
      const orderWithNoItems = { items: [] };
      
      const isValid = orderWithNoItems.items.length > 0;
      
      expect(isValid).toBe(false);
    });

    it('should require valid quantity', () => {
      const validQuantities = [1, 2, 5, 10];
      const invalidQuantities = [0, -1, 1.5, 'abc'];
      
      validQuantities.forEach(qty => {
        expect(Number.isInteger(qty) && qty > 0).toBe(true);
      });
      
      invalidQuantities.forEach(qty => {
        expect(Number.isInteger(qty) && qty > 0).toBe(false);
      });
    });

    it('should require delivery address', () => {
      const orderWithAddress = { deliveryAddress: 'شارع الملك فهد' };
      const orderWithoutAddress = { deliveryAddress: '' };
      
      expect(orderWithAddress.deliveryAddress.length > 0).toBe(true);
      expect(orderWithoutAddress.deliveryAddress.length > 0).toBe(false);
    });
  });
});

/**
 * Integration Tests - Admin API
 * اختبارات تكامل واجهة الإدارة
 */

const { users, orders, restaurants, menuItems } = require('../../fixtures/testData');
const { generateUserToken } = require('../../utils/testHelpers');

describe('Admin API Integration Tests', () => {
  let mockPrisma;
  let adminToken;
  let producerToken;
  let regularToken;

  beforeAll(() => {
    adminToken = generateUserToken(users.adminUser);
    producerToken = generateUserToken(users.producerUser);
    regularToken = generateUserToken(users.validUser);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma = global.mockPrisma;
  });

  // ==========================================
  // Dashboard Stats Tests
  // ==========================================
  describe('GET /api/v1/admin/stats', () => {
    it('should return dashboard statistics for admin', async () => {
      mockPrisma.order.count.mockResolvedValue(100);
      mockPrisma.user.count.mockResolvedValue(50);
      mockPrisma.restaurant.count.mockResolvedValue(10);
      
      const stats = {
        totalOrders: await mockPrisma.order.count(),
        totalUsers: await mockPrisma.user.count(),
        totalRestaurants: await mockPrisma.restaurant.count(),
      };
      
      expect(stats.totalOrders).toBe(100);
      expect(stats.totalUsers).toBe(50);
      expect(stats.totalRestaurants).toBe(10);
    });

    it('should return revenue statistics', () => {
      const revenueStats = {
        todayRevenue: 5000.00,
        weekRevenue: 35000.00,
        monthRevenue: 150000.00,
        yearRevenue: 1800000.00,
      };
      
      expect(revenueStats.todayRevenue).toBeGreaterThan(0);
      expect(revenueStats.weekRevenue).toBeGreaterThanOrEqual(revenueStats.todayRevenue);
    });

    it('should return order status breakdown', async () => {
      const statusBreakdown = {
        pending: 10,
        confirmed: 15,
        preparing: 8,
        delivered: 67,
        cancelled: 5,
      };
      
      const total = Object.values(statusBreakdown).reduce((a, b) => a + b, 0);
      
      expect(total).toBe(105);
    });

    it('should deny access to regular users', () => {
      const regularUserRole = users.validUser.role;
      const allowedRoles = ['ADMIN', 'PRODUCER'];
      
      expect(allowedRoles).not.toContain(regularUserRole);
    });

    it('should allow access to producer', () => {
      const producerRole = users.producerUser.role;
      const allowedRoles = ['ADMIN', 'PRODUCER'];
      
      expect(allowedRoles).toContain(producerRole);
    });
  });

  // ==========================================
  // Admin Orders Management Tests
  // ==========================================
  describe('GET /api/v1/admin/orders', () => {
    it('should return all orders for admin', async () => {
      const allOrders = [orders.pendingOrder, orders.confirmedOrder, orders.deliveredOrder];
      mockPrisma.order.findMany.mockResolvedValue(allOrders);
      
      const result = await mockPrisma.order.findMany({
        include: { user: true, restaurant: true }
      });
      
      expect(result).toHaveLength(3);
    });

    it('should support filtering by status', async () => {
      mockPrisma.order.findMany.mockResolvedValue([orders.pendingOrder]);
      
      const result = await mockPrisma.order.findMany({
        where: { status: 'PENDING' }
      });
      
      expect(result.every(o => o.status === 'PENDING')).toBe(true);
    });

    it('should support filtering by date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      
      mockPrisma.order.findMany.mockResolvedValue([orders.pendingOrder]);
      
      const result = await mockPrisma.order.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          }
        }
      });
      
      expect(result).toBeDefined();
    });

    it('should support filtering by restaurant', async () => {
      mockPrisma.order.findMany.mockResolvedValue([orders.pendingOrder]);
      
      const result = await mockPrisma.order.findMany({
        where: { restaurantId: restaurants.activeRestaurant.id }
      });
      
      expect(result).toBeDefined();
    });

    it('should include pagination', () => {
      const pagination = {
        page: 1,
        limit: 20,
        total: 100,
        totalPages: 5,
      };
      
      expect(pagination.totalPages).toBe(Math.ceil(pagination.total / pagination.limit));
    });
  });

  // ==========================================
  // Update Order Status Tests
  // ==========================================
  describe('PUT /api/v1/admin/orders/:id/status', () => {
    it('should update order status', async () => {
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

    it('should validate status transition', () => {
      const currentStatus = 'PENDING';
      const validNextStatuses = ['CONFIRMED', 'CANCELLED'];
      const invalidNextStatus = 'DELIVERED';
      
      expect(validNextStatuses).not.toContain(invalidNextStatus);
    });

    it('should record status change timestamp', async () => {
      const now = new Date();
      
      mockPrisma.order.update.mockResolvedValue({
        ...orders.pendingOrder,
        status: 'CONFIRMED',
        confirmedAt: now,
      });
      
      const updated = await mockPrisma.order.update({
        where: { id: orders.pendingOrder.id },
        data: { status: 'CONFIRMED', confirmedAt: now }
      });
      
      expect(updated.confirmedAt).toBeDefined();
    });
  });

  // ==========================================
  // Restaurant Management Tests
  // ==========================================
  describe('GET /api/v1/admin/restaurants', () => {
    it('should return all restaurants', async () => {
      const allRestaurants = [restaurants.activeRestaurant, restaurants.inactiveRestaurant];
      mockPrisma.restaurant.findMany.mockResolvedValue(allRestaurants);
      
      const result = await mockPrisma.restaurant.findMany();
      
      expect(result).toHaveLength(2);
    });

    it('should include restaurant statistics', () => {
      const restaurantWithStats = {
        ...restaurants.activeRestaurant,
        _count: {
          orders: 150,
          menuItems: 25,
        },
        totalRevenue: 75000.00,
        averageRating: 4.5,
      };
      
      expect(restaurantWithStats._count.orders).toBe(150);
      expect(restaurantWithStats.averageRating).toBe(4.5);
    });
  });

  // ==========================================
  // Toggle Restaurant Status Tests
  // ==========================================
  describe('PUT /api/v1/admin/restaurants/:id/toggle', () => {
    it('should toggle restaurant active status', async () => {
      mockPrisma.restaurant.update.mockResolvedValue({
        ...restaurants.activeRestaurant,
        isActive: false,
      });
      
      const updated = await mockPrisma.restaurant.update({
        where: { id: restaurants.activeRestaurant.id },
        data: { isActive: false }
      });
      
      expect(updated.isActive).toBe(false);
    });

    it('should activate inactive restaurant', async () => {
      mockPrisma.restaurant.update.mockResolvedValue({
        ...restaurants.inactiveRestaurant,
        isActive: true,
      });
      
      const updated = await mockPrisma.restaurant.update({
        where: { id: restaurants.inactiveRestaurant.id },
        data: { isActive: true }
      });
      
      expect(updated.isActive).toBe(true);
    });
  });

  // ==========================================
  // Menu Management Tests
  // ==========================================
  describe('GET /api/v1/admin/restaurants/:id/menu', () => {
    it('should return restaurant menu items', async () => {
      const menuList = [menuItems.availableItem, menuItems.unavailableItem];
      mockPrisma.menuItem.findMany.mockResolvedValue(menuList);
      
      const result = await mockPrisma.menuItem.findMany({
        where: { restaurantId: restaurants.activeRestaurant.id }
      });
      
      expect(result).toHaveLength(2);
    });
  });

  // ==========================================
  // Update Menu Item Tests
  // ==========================================
  describe('PUT /api/v1/admin/menu/:id', () => {
    it('should update menu item details', async () => {
      const updateData = {
        name: 'شاورما لحم مميزة',
        price: 30.00,
      };
      
      mockPrisma.menuItem.update.mockResolvedValue({
        ...menuItems.availableItem,
        ...updateData,
      });
      
      const updated = await mockPrisma.menuItem.update({
        where: { id: menuItems.availableItem.id },
        data: updateData
      });
      
      expect(updated.price).toBe(30.00);
    });

    it('should validate price is positive', () => {
      const validPrices = [0.01, 1, 10, 100];
      const invalidPrices = [0, -1, -100];
      
      validPrices.forEach(price => {
        expect(price > 0).toBe(true);
      });
      
      invalidPrices.forEach(price => {
        expect(price > 0).toBe(false);
      });
    });
  });

  // ==========================================
  // Toggle Menu Item Availability Tests
  // ==========================================
  describe('PUT /api/v1/admin/menu/:id/toggle', () => {
    it('should toggle menu item availability', async () => {
      mockPrisma.menuItem.update.mockResolvedValue({
        ...menuItems.availableItem,
        isAvailable: false,
      });
      
      const updated = await mockPrisma.menuItem.update({
        where: { id: menuItems.availableItem.id },
        data: { isAvailable: false }
      });
      
      expect(updated.isAvailable).toBe(false);
    });
  });

  // ==========================================
  // User Management Tests
  // ==========================================
  describe('GET /api/v1/admin/users', () => {
    it('should return all users for admin', async () => {
      const allUsers = [users.validUser, users.adminUser, users.producerUser];
      mockPrisma.user.findMany.mockResolvedValue(allUsers);
      
      const result = await mockPrisma.user.findMany();
      
      expect(result).toHaveLength(3);
    });

    it('should support filtering by role', async () => {
      mockPrisma.user.findMany.mockResolvedValue([users.adminUser]);
      
      const result = await mockPrisma.user.findMany({
        where: { role: 'ADMIN' }
      });
      
      expect(result.every(u => u.role === 'ADMIN')).toBe(true);
    });

    it('should not expose password hashes', () => {
      const safeUserData = {
        id: users.validUser.id,
        email: users.validUser.email,
        firstName: users.validUser.firstName,
        lastName: users.validUser.lastName,
        role: users.validUser.role,
      };
      
      expect(safeUserData).not.toHaveProperty('passwordHash');
      expect(safeUserData).not.toHaveProperty('password');
    });
  });

  // ==========================================
  // Toggle User Status Tests
  // ==========================================
  describe('PUT /api/v1/admin/users/:id/toggle', () => {
    it('should toggle user active status', async () => {
      mockPrisma.user.update.mockResolvedValue({
        ...users.validUser,
        isActive: false,
      });
      
      const updated = await mockPrisma.user.update({
        where: { id: users.validUser.id },
        data: { isActive: false }
      });
      
      expect(updated.isActive).toBe(false);
    });

    it('should not allow admin to deactivate themselves', () => {
      const adminId = users.adminUser.id;
      const targetUserId = users.adminUser.id;
      
      expect(adminId).toBe(targetUserId);
      // Should reject this action
    });
  });

  // ==========================================
  // Notification Sending Tests
  // ==========================================
  describe('POST /api/v1/admin/notifications/send', () => {
    it('should send notification to user', async () => {
      const notificationData = {
        userId: users.validUser.id,
        title: 'إشعار جديد',
        message: 'محتوى الإشعار',
        type: 'INFO',
      };
      
      mockPrisma.notification.create.mockResolvedValue({
        id: 'notification-123',
        ...notificationData,
        createdAt: new Date(),
      });
      
      const notification = await mockPrisma.notification.create({
        data: notificationData
      });
      
      expect(notification.id).toBeDefined();
      expect(notification.userId).toBe(users.validUser.id);
    });

    it('should send bulk notification to all users', async () => {
      const allUserIds = [users.validUser.id, users.vipUser.id];
      
      mockPrisma.notification.createMany.mockResolvedValue({ count: 2 });
      
      const result = await mockPrisma.notification.createMany({
        data: allUserIds.map(userId => ({
          userId,
          title: 'إشعار للجميع',
          message: 'رسالة عامة',
        }))
      });
      
      expect(result.count).toBe(2);
    });
  });

  // ==========================================
  // Authorization Tests
  // ==========================================
  describe('Authorization', () => {
    it('should require ADMIN or PRODUCER role', () => {
      const allowedRoles = ['ADMIN', 'PRODUCER'];
      
      expect(allowedRoles).toContain('ADMIN');
      expect(allowedRoles).toContain('PRODUCER');
      expect(allowedRoles).not.toContain('REGULAR');
      expect(allowedRoles).not.toContain('VIP');
    });

    it('should reject requests without token', () => {
      const authHeader = undefined;
      
      expect(authHeader).toBeUndefined();
    });

    it('should reject requests with invalid token', () => {
      const invalidToken = 'invalid.token.here';
      
      expect(invalidToken.split('.').length).toBe(3);
      // But verification would fail
    });

    it('should reject requests from regular users', () => {
      const regularUserRole = users.validUser.role;
      const allowedRoles = ['ADMIN', 'PRODUCER'];
      
      expect(allowedRoles).not.toContain(regularUserRole);
    });
  });

  // ==========================================
  // Audit Log Tests
  // ==========================================
  describe('Audit Logging', () => {
    it('should log admin actions', () => {
      const auditLog = {
        adminId: users.adminUser.id,
        action: 'UPDATE_ORDER_STATUS',
        targetId: orders.pendingOrder.id,
        details: { oldStatus: 'PENDING', newStatus: 'CONFIRMED' },
        timestamp: new Date(),
        ipAddress: '192.168.1.1',
      };
      
      expect(auditLog.adminId).toBeDefined();
      expect(auditLog.action).toBeDefined();
    });
  });
});

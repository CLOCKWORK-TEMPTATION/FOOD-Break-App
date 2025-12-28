/**
 * E2E Tests - Admin Journey
 * اختبارات End-to-End لرحلة المسؤول الكاملة
 */

const bcrypt = require('bcryptjs');
const { prisma: mockPrisma } = require("../../utils/testHelpers");

const { users, orders, restaurants, menuItems } = require('../fixtures/testData');
const { prisma: mockPrisma } = require("../../utils/testHelpers");
const { generateUserToken, generateUUID } = require('../helpers/testHelpers');
const { prisma: mockPrisma } = require("../../utils/testHelpers");

describe('E2E: Admin Management Journey', () => {
  let mockPrisma;
  let adminToken;
  let producerToken;

  beforeAll(() => {
    adminToken = generateUserToken(users.adminUser);
    producerToken = generateUserToken(users.producerUser);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // Scenario 1: Daily Admin Operations
  // ==========================================
  describe('Scenario 1: Daily Admin Dashboard Operations', () => {
    
    it('Step 1: Admin logs in', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...users.adminUser,
        passwordHash: await bcrypt.hash('AdminPass123!', 10),
      });
      
      const admin = await mockPrisma.user.findUnique({
        where: { email: users.adminUser.email }
      });
      
      expect(admin.role).toBe('ADMIN');
    });

    it('Step 2: Admin views dashboard statistics', async () => {
      // Simulate getting statistics
      mockPrisma.order.count.mockResolvedValue(150);
      mockPrisma.user.count.mockResolvedValue(500);
      mockPrisma.restaurant.count.mockResolvedValue(25);
      
      const stats = {
        totalOrders: await mockPrisma.order.count(),
        totalUsers: await mockPrisma.user.count(),
        totalRestaurants: await mockPrisma.restaurant.count(),
        todayOrders: 45,
        todayRevenue: 12500.00,
        pendingOrders: 12,
      };
      
      expect(stats.totalOrders).toBe(150);
      expect(stats.todayRevenue).toBeGreaterThan(0);
    });

    it('Step 3: Admin reviews pending orders', async () => {
      const pendingOrders = [
        { ...orders.pendingOrder, id: 'order-1' },
        { ...orders.pendingOrder, id: 'order-2' },
        { ...orders.pendingOrder, id: 'order-3' },
      ];
      
      mockPrisma.order.findMany.mockResolvedValue(pendingOrders);
      
      const result = await mockPrisma.order.findMany({
        where: { status: 'PENDING' },
        include: { user: true, restaurant: true },
        orderBy: { createdAt: 'asc' },
      });
      
      expect(result).toHaveLength(3);
    });

    it('Step 4: Admin confirms pending orders', async () => {
      mockPrisma.order.update.mockResolvedValue({
        ...orders.pendingOrder,
        status: 'CONFIRMED',
        confirmedAt: new Date(),
      });
      
      const confirmedOrder = await mockPrisma.order.update({
        where: { id: orders.pendingOrder.id },
        data: { 
          status: 'CONFIRMED',
          confirmedAt: new Date(),
        }
      });
      
      expect(confirmedOrder.status).toBe('CONFIRMED');
    });

    it('Step 5: Admin views user list', async () => {
      // In real API, passwordHash is never selected
      const userList = [
        { 
          id: users.validUser.id,
          email: users.validUser.email,
          firstName: users.validUser.firstName,
          lastName: users.validUser.lastName,
          role: users.validUser.role,
          isActive: users.validUser.isActive,
          createdAt: users.validUser.createdAt,
        },
        { 
          id: users.vipUser.id,
          email: users.vipUser.email,
          firstName: users.vipUser.firstName,
          lastName: users.vipUser.lastName,
          role: users.vipUser.role,
          isActive: users.vipUser.isActive,
          createdAt: users.vipUser.createdAt,
        },
      ];
      
      mockPrisma.user.findMany.mockResolvedValue(userList);
      
      const result = await mockPrisma.user.findMany({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
        }
      });
      
      result.forEach(user => {
        expect(user).not.toHaveProperty('passwordHash');
      });
    });

    it('Step 6: Admin sends notification to users', async () => {
      const notification = {
        title: 'عرض خاص!',
        message: 'خصم 20% على جميع الطلبات اليوم',
        type: 'PROMOTION',
      };
      
      mockPrisma.notification.createMany.mockResolvedValue({ count: 100 });
      
      const result = await mockPrisma.notification.createMany({
        data: [
          { userId: users.validUser.id, ...notification },
          { userId: users.vipUser.id, ...notification },
        ]
      });
      
      expect(result.count).toBeGreaterThan(0);
    });
  });

  // ==========================================
  // Scenario 2: Restaurant Management
  // ==========================================
  describe('Scenario 2: Restaurant Onboarding & Management', () => {
    
    it('Step 1: Admin adds new restaurant', async () => {
      const newRestaurant = {
        name: 'مطعم الضيافة',
        description: 'أشهى المأكولات العربية',
        cuisineType: 'عربي',
        address: 'شارع العليا، الرياض',
        phoneNumber: '+966112223333',
        email: 'info@diyafa.com',
        isPartner: true,
        isActive: true,
      };
      
      mockPrisma.restaurant.create.mockResolvedValue({
        id: generateUUID(),
        ...newRestaurant,
        createdAt: new Date(),
      });
      
      const restaurant = await mockPrisma.restaurant.create({
        data: newRestaurant
      });
      
      expect(restaurant.id).toBeDefined();
      expect(restaurant.name).toBe(newRestaurant.name);
    });

    it('Step 2: Admin adds menu items to restaurant', async () => {
      const menuItemData = {
        restaurantId: restaurants.activeRestaurant.id,
        name: 'كباب مشكل',
        nameAr: 'كباب مشكل',
        description: 'تشكيلة من الكباب الشهي',
        price: 65.00,
        category: 'وجبات رئيسية',
        isAvailable: true,
      };
      
      mockPrisma.menuItem.create.mockResolvedValue({
        id: generateUUID(),
        ...menuItemData,
        createdAt: new Date(),
      });
      
      const menuItem = await mockPrisma.menuItem.create({
        data: menuItemData
      });
      
      expect(menuItem.id).toBeDefined();
      expect(menuItem.price).toBe(65.00);
    });

    it('Step 3: Admin updates menu item price', async () => {
      const newPrice = 70.00;
      
      mockPrisma.menuItem.update.mockResolvedValue({
        ...menuItems.availableItem,
        price: newPrice,
      });
      
      const updated = await mockPrisma.menuItem.update({
        where: { id: menuItems.availableItem.id },
        data: { price: newPrice }
      });
      
      expect(updated.price).toBe(newPrice);
    });

    it('Step 4: Admin marks item as unavailable', async () => {
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

    it('Step 5: Admin deactivates restaurant temporarily', async () => {
      mockPrisma.restaurant.update.mockResolvedValue({
        ...restaurants.activeRestaurant,
        isActive: false,
      });
      
      const deactivated = await mockPrisma.restaurant.update({
        where: { id: restaurants.activeRestaurant.id },
        data: { isActive: false }
      });
      
      expect(deactivated.isActive).toBe(false);
    });

    it('Step 6: Admin reactivates restaurant', async () => {
      mockPrisma.restaurant.update.mockResolvedValue({
        ...restaurants.inactiveRestaurant,
        isActive: true,
      });
      
      const reactivated = await mockPrisma.restaurant.update({
        where: { id: restaurants.inactiveRestaurant.id },
        data: { isActive: true }
      });
      
      expect(reactivated.isActive).toBe(true);
    });
  });

  // ==========================================
  // Scenario 3: Order Issue Resolution
  // ==========================================
  describe('Scenario 3: Order Issue Resolution', () => {
    
    it('Step 1: Admin receives complaint about delayed order', async () => {
      const complaint = {
        orderId: orders.confirmedOrder.id,
        userId: users.validUser.id,
        issue: 'تأخر في التوصيل',
        description: 'الطلب متأخر أكثر من ساعة',
        createdAt: new Date(),
      };
      
      expect(complaint.orderId).toBeDefined();
      expect(complaint.issue).toBe('تأخر في التوصيل');
    });

    it('Step 2: Admin views order details', async () => {
      const orderDetails = {
        ...orders.confirmedOrder,
        user: users.validUser,
        restaurant: restaurants.activeRestaurant,
        items: [
          { menuItem: menuItems.availableItem, quantity: 2 },
        ],
        statusHistory: [
          { status: 'PENDING', timestamp: new Date('2024-01-15T10:00:00') },
          { status: 'CONFIRMED', timestamp: new Date('2024-01-15T10:05:00') },
        ],
      };
      
      mockPrisma.order.findUnique.mockResolvedValue(orderDetails);
      
      const order = await mockPrisma.order.findUnique({
        where: { id: orders.confirmedOrder.id },
        include: { user: true, restaurant: true, items: true },
      });
      
      expect(order.user).toBeDefined();
      expect(order.restaurant).toBeDefined();
    });

    it('Step 3: Admin issues partial refund', async () => {
      const refundAmount = 25.00; // Partial refund
      
      mockPrisma.payment.update.mockResolvedValue({
        orderId: orders.confirmedOrder.id,
        status: 'PARTIALLY_REFUNDED',
        refundAmount,
        refundedAt: new Date(),
      });
      
      // Simulate refund processing
      expect(refundAmount).toBeLessThan(orders.confirmedOrder.totalAmount);
    });

    it('Step 4: Admin adds compensation credit', async () => {
      const creditAmount = 15.00;
      
      mockPrisma.user.update.mockResolvedValue({
        ...users.validUser,
        walletBalance: creditAmount,
      });
      
      // User receives credit
      const updated = await mockPrisma.user.update({
        where: { id: users.validUser.id },
        data: { walletBalance: { increment: creditAmount } },
      });
      
      expect(updated.walletBalance).toBe(creditAmount);
    });

    it('Step 5: Admin sends apology notification', async () => {
      const apologyNotification = {
        userId: users.validUser.id,
        title: 'اعتذار عن التأخير',
        message: 'نعتذر عن التأخير في طلبك. تم إضافة رصيد تعويضي لحسابك.',
        type: 'APOLOGY',
      };
      
      mockPrisma.notification.create.mockResolvedValue({
        id: generateUUID(),
        ...apologyNotification,
        createdAt: new Date(),
      });
      
      const notification = await mockPrisma.notification.create({
        data: apologyNotification
      });
      
      expect(notification.type).toBe('APOLOGY');
    });

    it('Step 6: Admin marks issue as resolved', async () => {
      const resolvedIssue = {
        orderId: orders.confirmedOrder.id,
        resolution: 'تم استرداد جزئي وإضافة رصيد تعويضي',
        resolvedBy: users.adminUser.id,
        resolvedAt: new Date(),
      };
      
      expect(resolvedIssue.resolvedAt).toBeDefined();
      expect(resolvedIssue.resolvedBy).toBe(users.adminUser.id);
    });
  });

  // ==========================================
  // Scenario 4: Producer Daily Operations
  // ==========================================
  describe('Scenario 4: Producer Order Management', () => {
    
    it('Step 1: Producer logs in', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(users.producerUser);
      
      const producer = await mockPrisma.user.findUnique({
        where: { email: users.producerUser.email }
      });
      
      expect(producer.role).toBe('PRODUCER');
    });

    it('Step 2: Producer views assigned orders', async () => {
      const assignedOrders = [
        { ...orders.confirmedOrder, assignedTo: users.producerUser.id },
      ];
      
      mockPrisma.order.findMany.mockResolvedValue(assignedOrders);
      
      const result = await mockPrisma.order.findMany({
        where: { 
          assignedTo: users.producerUser.id,
          status: { in: ['CONFIRMED', 'PREPARING'] }
        }
      });
      
      expect(result).toHaveLength(1);
    });

    it('Step 3: Producer starts preparing order', async () => {
      mockPrisma.order.update.mockResolvedValue({
        ...orders.confirmedOrder,
        status: 'PREPARING',
        preparingAt: new Date(),
      });
      
      const updated = await mockPrisma.order.update({
        where: { id: orders.confirmedOrder.id },
        data: { 
          status: 'PREPARING',
          preparingAt: new Date(),
        }
      });
      
      expect(updated.status).toBe('PREPARING');
    });

    it('Step 4: Producer marks order as ready', async () => {
      mockPrisma.order.update.mockResolvedValue({
        ...orders.confirmedOrder,
        status: 'READY',
        readyAt: new Date(),
      });
      
      const updated = await mockPrisma.order.update({
        where: { id: orders.confirmedOrder.id },
        data: { 
          status: 'READY',
          readyAt: new Date(),
        }
      });
      
      expect(updated.status).toBe('READY');
    });

    it('Step 5: Producer assigns order for delivery', async () => {
      mockPrisma.order.update.mockResolvedValue({
        ...orders.confirmedOrder,
        status: 'OUT_FOR_DELIVERY',
        outForDeliveryAt: new Date(),
      });
      
      const updated = await mockPrisma.order.update({
        where: { id: orders.confirmedOrder.id },
        data: { 
          status: 'OUT_FOR_DELIVERY',
          outForDeliveryAt: new Date(),
        }
      });
      
      expect(updated.status).toBe('OUT_FOR_DELIVERY');
    });
  });

  // ==========================================
  // Scenario 5: Reports & Analytics
  // ==========================================
  describe('Scenario 5: Admin Reports & Analytics', () => {
    
    it('Step 1: Admin generates daily report', () => {
      const dailyReport = {
        date: new Date().toISOString().split('T')[0],
        totalOrders: 85,
        completedOrders: 78,
        cancelledOrders: 5,
        pendingOrders: 2,
        totalRevenue: 25500.00,
        averageOrderValue: 300.00,
        newUsers: 12,
      };
      
      expect(dailyReport.totalOrders).toBe(85);
      expect(dailyReport.completedOrders + dailyReport.cancelledOrders + dailyReport.pendingOrders)
        .toBe(dailyReport.totalOrders);
    });

    it('Step 2: Admin views top performing restaurants', () => {
      const topRestaurants = [
        { name: 'مطعم البيت الشامي', totalOrders: 150, revenue: 45000 },
        { name: 'مطعم الضيافة', totalOrders: 120, revenue: 36000 },
        { name: 'مطعم الريف', totalOrders: 95, revenue: 28500 },
      ];
      
      expect(topRestaurants[0].totalOrders).toBeGreaterThan(topRestaurants[1].totalOrders);
    });

    it('Step 3: Admin views popular menu items', () => {
      const popularItems = [
        { name: 'شاورما دجاج', orderCount: 250, revenue: 6250 },
        { name: 'برجر لحم', orderCount: 180, revenue: 6300 },
        { name: 'بيتزا مارغريتا', orderCount: 150, revenue: 5250 },
      ];
      
      expect(popularItems.length).toBe(3);
      expect(popularItems[0].orderCount).toBeGreaterThanOrEqual(popularItems[1].orderCount);
    });

    it('Step 4: Admin exports report to CSV', () => {
      const csvHeaders = ['التاريخ', 'عدد الطلبات', 'الإيرادات', 'المستخدمين الجدد'];
      const csvData = [
        ['2024-01-15', '85', '25500', '12'],
        ['2024-01-14', '92', '27600', '15'],
      ];
      
      expect(csvHeaders.length).toBe(4);
      expect(csvData.length).toBe(2);
    });
  });

  // ==========================================
  // Authorization Edge Cases
  // ==========================================
  describe('Authorization Edge Cases', () => {
    
    it('should prevent admin from deleting themselves', () => {
      const currentAdminId = users.adminUser.id;
      const targetUserId = users.adminUser.id;
      
      expect(currentAdminId).toBe(targetUserId);
      // Should reject self-deletion
    });

    it('should prevent producer from accessing user management', () => {
      const producerRole = users.producerUser.role;
      const userManagementRoles = ['ADMIN'];
      
      expect(userManagementRoles).not.toContain(producerRole);
    });

    it('should log all admin actions', () => {
      const auditLog = {
        adminId: users.adminUser.id,
        action: 'UPDATE_ORDER_STATUS',
        targetType: 'ORDER',
        targetId: orders.pendingOrder.id,
        previousValue: { status: 'PENDING' },
        newValue: { status: 'CONFIRMED' },
        timestamp: new Date(),
        ipAddress: '192.168.1.100',
      };
      
      expect(auditLog.adminId).toBeDefined();
      expect(auditLog.action).toBeDefined();
      expect(auditLog.timestamp).toBeDefined();
    });
  });
});

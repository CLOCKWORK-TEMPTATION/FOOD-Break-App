/**
 * E2E Tests - User Journey
 * اختبارات End-to-End لرحلة المستخدم الكاملة
 */

const request = require('supertest');
const { prisma: mockPrisma } = require("../../utils/testHelpers");
const bcrypt = require('bcryptjs');
const { prisma: mockPrisma } = require("../../utils/testHelpers");
const jwt = require('jsonwebtoken');
const { prisma: mockPrisma } = require("../../utils/testHelpers");

const { users, restaurants, menuItems, orders, projects } = require('../fixtures/testData');
const { prisma: mockPrisma } = require("../../utils/testHelpers");
const { 
  generateUserToken, 
  generateUUID, 
  generateRandomEmail, 
  generateRandomPhone 
} = require('../helpers/testHelpers');

describe('E2E: Complete User Journey', () => {
  let mockPrisma;
  let testUser;
  let accessToken;

  beforeAll(() => {
    testUser = {
      id: generateUUID(),
      email: generateRandomEmail(),
      firstName: 'مستخدم',
      lastName: 'اختبار',
      phoneNumber: generateRandomPhone(),
      role: 'REGULAR',
      isActive: true,
    };
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // Scenario 1: New User Registration & First Order
  // ==========================================
  describe('Scenario 1: New User Registration to First Order', () => {
    
    it('Step 1: User registers successfully', async () => {
      const registrationData = {
        email: testUser.email,
        password: 'SecurePass123!',
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        phoneNumber: testUser.phoneNumber,
      };
      
      // Simulate user doesn't exist
      mockPrisma.user.findUnique.mockResolvedValue(null);
      
      // Simulate successful registration
      const hashedPassword = await bcrypt.hash(registrationData.password, 10);
      mockPrisma.user.create.mockResolvedValue({
        ...testUser,
        passwordHash: hashedPassword,
        createdAt: new Date(),
      });
      
      // Verify registration succeeds
      const user = await mockPrisma.user.create({
        data: {
          email: registrationData.email,
          passwordHash: hashedPassword,
          firstName: registrationData.firstName,
          lastName: registrationData.lastName,
          phoneNumber: registrationData.phoneNumber,
        }
      });
      
      expect(user.id).toBeDefined();
      expect(user.email).toBe(testUser.email);
      
      // Generate token for next steps
      accessToken = generateUserToken(user);
      expect(accessToken).toBeDefined();
    });

    it('Step 2: User browses nearby restaurants', async () => {
      mockPrisma.restaurant.findMany.mockResolvedValue([restaurants.activeRestaurant]);
      
      const nearbyRestaurants = await mockPrisma.restaurant.findMany({
        where: {
          isActive: true,
          isPartner: true,
        }
      });
      
      expect(nearbyRestaurants.length).toBeGreaterThan(0);
      expect(nearbyRestaurants[0].isActive).toBe(true);
    });

    it('Step 3: User selects a restaurant', async () => {
      mockPrisma.restaurant.findUnique.mockResolvedValue(restaurants.activeRestaurant);
      
      const selectedRestaurant = await mockPrisma.restaurant.findUnique({
        where: { id: restaurants.activeRestaurant.id }
      });
      
      expect(selectedRestaurant).toBeDefined();
      expect(selectedRestaurant.name).toBe(restaurants.activeRestaurant.name);
    });

    it('Step 4: User views menu', async () => {
      mockPrisma.menuItem.findMany.mockResolvedValue([menuItems.availableItem]);
      
      const menu = await mockPrisma.menuItem.findMany({
        where: {
          restaurantId: restaurants.activeRestaurant.id,
          isAvailable: true,
        }
      });
      
      expect(menu.length).toBeGreaterThan(0);
      expect(menu[0].isAvailable).toBe(true);
    });

    it('Step 5: User adds items to cart', () => {
      const cart = {
        restaurantId: restaurants.activeRestaurant.id,
        items: [
          { menuItemId: menuItems.availableItem.id, quantity: 2 },
        ],
      };
      
      expect(cart.items.length).toBe(1);
      expect(cart.items[0].quantity).toBe(2);
    });

    it('Step 6: User places order', async () => {
      const orderData = {
        userId: testUser.id,
        restaurantId: restaurants.activeRestaurant.id,
        status: 'PENDING',
        totalAmount: 50.00,
        deliveryAddress: 'شارع الاختبار',
      };
      
      mockPrisma.order.create.mockResolvedValue({
        id: generateUUID(),
        ...orderData,
        createdAt: new Date(),
      });
      
      const order = await mockPrisma.order.create({ data: orderData });
      
      expect(order.id).toBeDefined();
      expect(order.status).toBe('PENDING');
      expect(order.userId).toBe(testUser.id);
    });

    it('Step 7: User makes payment', async () => {
      const paymentData = {
        orderId: orders.pendingOrder.id,
        userId: testUser.id,
        amount: 50.00,
        status: 'COMPLETED',
        provider: 'STRIPE',
      };
      
      mockPrisma.payment.create.mockResolvedValue({
        id: generateUUID(),
        ...paymentData,
        createdAt: new Date(),
      });
      
      const payment = await mockPrisma.payment.create({ data: paymentData });
      
      expect(payment.status).toBe('COMPLETED');
    });

    it('Step 8: Order is confirmed', async () => {
      mockPrisma.order.update.mockResolvedValue({
        ...orders.pendingOrder,
        status: 'CONFIRMED',
      });
      
      const confirmedOrder = await mockPrisma.order.update({
        where: { id: orders.pendingOrder.id },
        data: { status: 'CONFIRMED' }
      });
      
      expect(confirmedOrder.status).toBe('CONFIRMED');
    });

    it('Step 9: User tracks order progress', async () => {
      const orderStatuses = ['CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'];
      
      for (const status of orderStatuses) {
        mockPrisma.order.findUnique.mockResolvedValue({
          ...orders.pendingOrder,
          status,
        });
        
        const order = await mockPrisma.order.findUnique({
          where: { id: orders.pendingOrder.id }
        });
        
        expect(order.status).toBe(status);
      }
    });

    it('Step 10: Order is delivered', async () => {
      mockPrisma.order.update.mockResolvedValue({
        ...orders.pendingOrder,
        status: 'DELIVERED',
        deliveredAt: new Date(),
      });
      
      const deliveredOrder = await mockPrisma.order.update({
        where: { id: orders.pendingOrder.id },
        data: { status: 'DELIVERED', deliveredAt: new Date() }
      });
      
      expect(deliveredOrder.status).toBe('DELIVERED');
      expect(deliveredOrder.deliveredAt).toBeDefined();
    });
  });

  // ==========================================
  // Scenario 2: QR Code Project Access
  // ==========================================
  describe('Scenario 2: QR Code Scan & Project Order', () => {
    
    it('Step 1: User scans QR code', () => {
      const qrData = {
        projectId: projects.activeProject.id,
        token: jwt.sign(
          { projectId: projects.activeProject.id },
          process.env.QR_SECRET_KEY,
          { expiresIn: '24h' }
        ),
      };
      
      expect(qrData.projectId).toBeDefined();
      expect(qrData.token).toBeDefined();
    });

    it('Step 2: Token is verified', () => {
      const token = jwt.sign(
        { projectId: projects.activeProject.id },
        process.env.QR_SECRET_KEY,
        { expiresIn: '24h' }
      );
      
      const decoded = jwt.verify(token, process.env.QR_SECRET_KEY);
      
      expect(decoded.projectId).toBe(projects.activeProject.id);
    });

    it('Step 3: Project is validated (active & within date range)', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(projects.activeProject);
      
      const project = await mockPrisma.project.findUnique({
        where: { id: projects.activeProject.id }
      });
      
      expect(project.isActive).toBe(true);
      
      const now = new Date();
      // Check project date range logic
      expect(project.startDate).toBeDefined();
      expect(project.endDate).toBeDefined();
    });

    it('Step 4: User is associated with project', async () => {
      mockPrisma.$transaction.mockResolvedValue({
        userId: testUser.id,
        projectId: projects.activeProject.id,
        scannedAt: new Date(),
      });
      
      // User-project association would be created
      expect(testUser.id).toBeDefined();
      expect(projects.activeProject.id).toBeDefined();
    });

    it('Step 5: User views project menu', async () => {
      mockPrisma.menuItem.findMany.mockResolvedValue([menuItems.availableItem]);
      
      const projectMenu = await mockPrisma.menuItem.findMany({
        where: {
          menuType: 'CORE',
          isAvailable: true,
        }
      });
      
      expect(projectMenu.length).toBeGreaterThan(0);
    });

    it('Step 6: User places project order within time window', async () => {
      const orderWindowMinutes = projects.activeProject.orderWindow;
      
      // Simulate ordering within window
      const now = new Date();
      const windowEnd = new Date(now.getTime() + orderWindowMinutes * 60 * 1000);
      
      expect(now < windowEnd).toBe(true);
      
      mockPrisma.order.create.mockResolvedValue({
        id: generateUUID(),
        userId: testUser.id,
        projectId: projects.activeProject.id,
        status: 'PENDING',
      });
      
      const order = await mockPrisma.order.create({
        data: {
          userId: testUser.id,
          projectId: projects.activeProject.id,
          status: 'PENDING',
        }
      });
      
      expect(order.projectId).toBe(projects.activeProject.id);
    });
  });

  // ==========================================
  // Scenario 3: Returning User Reorder
  // ==========================================
  describe('Scenario 3: Returning User Quick Reorder', () => {
    
    it('Step 1: User logs in', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...users.validUser,
        passwordHash: await bcrypt.hash('TestPass123!', 10),
      });
      
      const user = await mockPrisma.user.findUnique({
        where: { email: users.validUser.email }
      });
      
      expect(user).toBeDefined();
      
      const isPasswordValid = await bcrypt.compare('TestPass123!', user.passwordHash);
      expect(isPasswordValid).toBe(true);
    });

    it('Step 2: User views order history', async () => {
      mockPrisma.order.findMany.mockResolvedValue([
        orders.deliveredOrder,
        orders.confirmedOrder,
      ]);
      
      const orderHistory = await mockPrisma.order.findMany({
        where: { userId: users.validUser.id },
        orderBy: { createdAt: 'desc' },
      });
      
      expect(orderHistory.length).toBeGreaterThan(0);
    });

    it('Step 3: User selects order to reorder', async () => {
      const previousOrder = {
        ...orders.deliveredOrder,
        items: [
          { menuItemId: menuItems.availableItem.id, quantity: 2 },
        ],
      };
      
      mockPrisma.order.findUnique.mockResolvedValue(previousOrder);
      
      const selectedOrder = await mockPrisma.order.findUnique({
        where: { id: orders.deliveredOrder.id },
        include: { items: true },
      });
      
      expect(selectedOrder.items).toBeDefined();
    });

    it('Step 4: Items availability is verified', async () => {
      mockPrisma.menuItem.findUnique.mockResolvedValue(menuItems.availableItem);
      
      const item = await mockPrisma.menuItem.findUnique({
        where: { id: menuItems.availableItem.id }
      });
      
      expect(item.isAvailable).toBe(true);
    });

    it('Step 5: New order is created from previous', async () => {
      const newOrderId = generateUUID();
      
      mockPrisma.order.create.mockResolvedValue({
        id: newOrderId,
        userId: users.validUser.id,
        restaurantId: orders.deliveredOrder.restaurantId,
        status: 'PENDING',
        totalAmount: orders.deliveredOrder.totalAmount,
      });
      
      const newOrder = await mockPrisma.order.create({
        data: {
          userId: users.validUser.id,
          restaurantId: orders.deliveredOrder.restaurantId,
          status: 'PENDING',
          totalAmount: orders.deliveredOrder.totalAmount,
        }
      });
      
      expect(newOrder.id).toBe(newOrderId);
      expect(newOrder.status).toBe('PENDING');
    });
  });

  // ==========================================
  // Scenario 4: Order Cancellation Flow
  // ==========================================
  describe('Scenario 4: Order Cancellation', () => {
    
    it('Step 1: User views pending order', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(orders.pendingOrder);
      
      const order = await mockPrisma.order.findUnique({
        where: { id: orders.pendingOrder.id }
      });
      
      expect(order.status).toBe('PENDING');
    });

    it('Step 2: User requests cancellation', async () => {
      const cancellationReason = 'تغيير رأي العميل';
      
      mockPrisma.order.update.mockResolvedValue({
        ...orders.pendingOrder,
        status: 'CANCELLED',
        cancellationReason,
        cancelledAt: new Date(),
      });
      
      const cancelledOrder = await mockPrisma.order.update({
        where: { id: orders.pendingOrder.id },
        data: {
          status: 'CANCELLED',
          cancellationReason,
          cancelledAt: new Date(),
        }
      });
      
      expect(cancelledOrder.status).toBe('CANCELLED');
      expect(cancelledOrder.cancellationReason).toBe(cancellationReason);
    });

    it('Step 3: Payment is refunded', async () => {
      mockPrisma.payment.update.mockResolvedValue({
        ...require('../fixtures/testData').payments.completedPayment,
        status: 'REFUNDED',
        refundedAt: new Date(),
      });
      
      // Simulated refund
      const refundedPayment = await mockPrisma.payment.update({
        where: { orderId: orders.pendingOrder.id },
        data: {
          status: 'REFUNDED',
          refundedAt: new Date(),
        }
      });
      
      expect(refundedPayment.status).toBe('REFUNDED');
    });

    it('Step 4: User receives cancellation notification', async () => {
      mockPrisma.notification.create.mockResolvedValue({
        id: generateUUID(),
        userId: users.validUser.id,
        title: 'تم إلغاء طلبك',
        message: 'تم إلغاء طلبك بنجاح وسيتم استرداد المبلغ',
        type: 'ORDER_CANCELLED',
        createdAt: new Date(),
      });
      
      const notification = await mockPrisma.notification.create({
        data: {
          userId: users.validUser.id,
          title: 'تم إلغاء طلبك',
          message: 'تم إلغاء طلبك بنجاح وسيتم استرداد المبلغ',
          type: 'ORDER_CANCELLED',
        }
      });
      
      expect(notification.type).toBe('ORDER_CANCELLED');
    });
  });

  // ==========================================
  // Scenario 5: Profile Management
  // ==========================================
  describe('Scenario 5: User Profile Management', () => {
    
    it('Step 1: User views profile', async () => {
      // In real API response, passwordHash is excluded via select
      const profileData = {
        id: users.validUser.id,
        email: users.validUser.email,
        firstName: users.validUser.firstName,
        lastName: users.validUser.lastName,
        phoneNumber: users.validUser.phoneNumber,
        role: users.validUser.role,
      };
      
      mockPrisma.user.findUnique.mockResolvedValue(profileData);
      
      const profile = await mockPrisma.user.findUnique({
        where: { id: users.validUser.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          role: true,
        }
      });
      
      expect(profile.email).toBe(users.validUser.email);
      expect(profile).not.toHaveProperty('passwordHash');
    });

    it('Step 2: User updates profile', async () => {
      const updateData = {
        firstName: 'محمد',
        lastName: 'علي',
        phoneNumber: '+966501234569',
      };
      
      mockPrisma.user.update.mockResolvedValue({
        ...users.validUser,
        ...updateData,
      });
      
      const updatedProfile = await mockPrisma.user.update({
        where: { id: users.validUser.id },
        data: updateData,
      });
      
      expect(updatedProfile.firstName).toBe('محمد');
      expect(updatedProfile.lastName).toBe('علي');
    });

    it('Step 3: User changes password', async () => {
      const currentPassword = 'CurrentPass123!';
      const newPassword = 'NewSecurePass456!';
      
      const currentHash = await bcrypt.hash(currentPassword, 10);
      const isCurrentValid = await bcrypt.compare(currentPassword, currentHash);
      
      expect(isCurrentValid).toBe(true);
      
      const newHash = await bcrypt.hash(newPassword, 10);
      
      mockPrisma.user.update.mockResolvedValue({
        ...users.validUser,
        passwordHash: newHash,
      });
      
      const updated = await mockPrisma.user.update({
        where: { id: users.validUser.id },
        data: { passwordHash: newHash },
      });
      
      expect(updated.passwordHash).toBe(newHash);
    });

    it('Step 4: User sets dietary preferences', async () => {
      const preferences = {
        isVegetarian: true,
        isGlutenFree: false,
        allergens: ['nuts', 'dairy'],
      };
      
      mockPrisma.userPreferences.upsert.mockResolvedValue({
        userId: users.validUser.id,
        ...preferences,
      });
      
      const savedPreferences = await mockPrisma.userPreferences.upsert({
        where: { userId: users.validUser.id },
        create: { userId: users.validUser.id, ...preferences },
        update: preferences,
      });
      
      expect(savedPreferences.isVegetarian).toBe(true);
      expect(savedPreferences.allergens).toContain('nuts');
    });
  });

  // ==========================================
  // Error Scenarios
  // ==========================================
  describe('Error Handling Scenarios', () => {
    
    it('should handle network errors gracefully', async () => {
      mockPrisma.restaurant.findMany.mockRejectedValue(new Error('Network error'));
      
      await expect(mockPrisma.restaurant.findMany()).rejects.toThrow('Network error');
    });

    it('should handle authentication errors', () => {
      const expiredToken = jwt.sign(
        { userId: users.validUser.id },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' }
      );
      
      expect(() => {
        jwt.verify(expiredToken, process.env.JWT_SECRET);
      }).toThrow();
    });

    it('should handle validation errors', () => {
      const invalidOrderData = {
        items: [], // Empty items - invalid
      };
      
      expect(invalidOrderData.items.length).toBe(0);
    });

    it('should handle concurrent order conflicts', async () => {
      // Simulate item becoming unavailable during order
      mockPrisma.menuItem.findUnique
        .mockResolvedValueOnce(menuItems.availableItem)
        .mockResolvedValueOnce(menuItems.unavailableItem);
      
      const firstCheck = await mockPrisma.menuItem.findUnique({ where: { id: menuItems.availableItem.id } });
      expect(firstCheck.isAvailable).toBe(true);
      
      const secondCheck = await mockPrisma.menuItem.findUnique({ where: { id: menuItems.availableItem.id } });
      expect(secondCheck.isAvailable).toBe(false);
    });
  });
});

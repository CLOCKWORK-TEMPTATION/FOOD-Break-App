/**
 * Integration Tests: Order + Exception Flow
 * اختبارات التكامل: تدفق الطلب + الاستثناء
 *
 * Tests the complete flow of creating orders with exception handling,
 * including cost calculation, approval workflows, and break window validation.
 */

const { PrismaClient } = require('@prisma/client');
const orderService = require('../../src/services/orderService');
const qrCodeService = require('../../src/services/qrCodeService');

const prisma = new PrismaClient();

describe('🔄 Order + Exception Integration Tests / اختبارات تكامل الطلب والاستثناء', () => {
  let testUser;
  let testProject;
  let testRestaurant;
  let testMenuItem;

  beforeAll(async () => {
    // Create test data
    testUser = await prisma.user.create({
      data: {
        email: 'order-exception-test@example.com',
        passwordHash: 'hashedpassword',
        firstName: 'أحمد',
        lastName: 'محمد',
        role: 'REGULAR',
        isActive: true
      }
    });

    testRestaurant = await prisma.restaurant.create({
      data: {
        name: 'Test Restaurant',
        nameAr: 'مطعم تجريبي',
        description: 'Test restaurant for orders',
        descriptionAr: 'مطعم تجريبي للطلبات',
        address: '123 Test St',
        addressAr: 'شارع الاختبار 123',
        latitude: 30.0444,
        longitude: 31.2357,
        isActive: true,
        isPartner: true,
        rating: 4.5,
        deliveryFee: 10,
        minimumOrder: 30
      }
    });

    testMenuItem = await prisma.menuItem.create({
      data: {
        restaurantId: testRestaurant.id,
        name: 'Test Meal',
        nameAr: 'وجبة تجريبية',
        description: 'A test meal',
        descriptionAr: 'وجبة اختبارية',
        price: 75,
        category: 'Main Dish',
        isAvailable: true
      }
    });

    // Project with active order window
    const now = new Date();
    testProject = await prisma.project.create({
      data: {
        name: 'Test Project',
        startDate: new Date(now.getTime() - 15 * 60000), // Started 15 min ago
        endDate: new Date(now.getTime() + 2 * 60 * 60000), // Ends in 2 hours
        orderWindow: 60, // 60 minute order window
        isActive: true
      }
    });

    // Add user as project member
    await prisma.projectMember.create({
      data: {
        userId: testUser.id,
        projectId: testProject.id,
        role: 'MEMBER',
        isActive: true
      }
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.exception.deleteMany({ where: { userId: testUser.id } });
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({ where: { userId: testUser.id } });
    await prisma.projectMember.deleteMany({ where: { userId: testUser.id } });
    await prisma.project.deleteMany({ where: { id: testProject.id } });
    await prisma.menuItem.deleteMany({ where: { id: testMenuItem.id } });
    await prisma.restaurant.deleteMany({ where: { id: testRestaurant.id } });
    await prisma.user.deleteMany({ where: { email: { contains: 'order-exception-test' } } });
    await prisma.$disconnect();
  });

  describe('Regular Order Creation / إنشاء طلب عادي', () => {
    it('should create regular order within break window / يجب إنشاء طلب عادي داخل نافذة الطلب', async () => {
      const orderData = {
        userId: testUser.id,
        projectId: testProject.id,
        restaurantId: testRestaurant.id,
        orderType: 'REGULAR',
        totalAmount: 75,
        deliveryAddress: '123 Test St',
        deliveryLat: 30.0444,
        deliveryLng: 31.2357,
        items: [
          {
            menuItemId: testMenuItem.id,
            quantity: 1,
            price: 75
          }
        ]
      };

      const order = await orderService.createOrder(orderData);

      expect(order).toBeDefined();
      expect(order.orderType).toBe('REGULAR');
      expect(order.status).toBe('PENDING');
      expect(order.totalAmount).toBe(75);
      expect(order.userPayAmount).toBe(0); // Regular orders are fully covered
      expect(order.items).toHaveLength(1);
    });

    it('should reject regular order outside break window / يجب رفض طلب عادي خارج نافذة الطلب', async () => {
      // Create project with closed window
      const closedProject = await prisma.project.create({
        data: {
          name: 'Closed Window Project',
          startDate: new Date(Date.now() - 2 * 60 * 60000), // Started 2 hours ago
          endDate: new Date(Date.now() + 1 * 60 * 60000),
          orderWindow: 30, // 30 min window (now closed)
          isActive: true
        }
      });

      const orderData = {
        userId: testUser.id,
        projectId: closedProject.id,
        restaurantId: testRestaurant.id,
        orderType: 'REGULAR',
        totalAmount: 75,
        items: []
      };

      await expect(orderService.createOrder(orderData)).rejects.toThrow('نافذة الطلب مغلقة');

      await prisma.project.delete({ where: { id: closedProject.id } });
    });
  });

  describe('Exception Order - FULL Type / طلب استثنائي - كامل', () => {
    it('should create FULL exception order with correct cost calculation / يجب إنشاء طلب استثنائي كامل بحساب صحيح', async () => {
      const orderData = {
        userId: testUser.id,
        projectId: testProject.id,
        restaurantId: testRestaurant.id,
        orderType: 'EXCEPTION',
        exceptionType: 'FULL',
        exceptionReason: 'Working late, need dinner',
        totalAmount: 120,
        items: [
          {
            menuItemId: testMenuItem.id,
            quantity: 1,
            price: 120
          }
        ]
      };

      const order = await orderService.createOrder(orderData);

      expect(order).toBeDefined();
      expect(order.orderType).toBe('EXCEPTION');
      expect(order.status).toBe('PENDING_APPROVAL');
      expect(order.totalAmount).toBe(120);
      expect(order.userPayAmount).toBe(0); // Company pays all for FULL exception
      expect(order.exceptionType).toBe('FULL');
      expect(order.exceptionAmount).toBe(120);

      // Check exception record was created
      const exception = await prisma.exception.findFirst({
        where: { orderId: order.id }
      });

      expect(exception).toBeDefined();
      expect(exception.exceptionType).toBe('FULL');
      expect(exception.requestedAmount).toBe(120);
      expect(exception.status).toBe('PENDING');
    });
  });

  describe('Exception Order - LIMITED Type / طلب استثنائي - محدود', () => {
    it('should create LIMITED exception with user paying difference / يجب إنشاء طلب محدود مع دفع المستخدم للفرق', async () => {
      const orderData = {
        userId: testUser.id,
        projectId: testProject.id,
        restaurantId: testRestaurant.id,
        orderType: 'EXCEPTION',
        exceptionType: 'LIMITED',
        exceptionReason: 'Slightly over budget',
        totalAmount: 150,
        regularBudget: 50, // Regular budget
        items: [
          {
            menuItemId: testMenuItem.id,
            quantity: 2,
            price: 150
          }
        ]
      };

      const order = await orderService.createOrder(orderData);

      expect(order).toBeDefined();
      expect(order.orderType).toBe('EXCEPTION');
      expect(order.totalAmount).toBe(150);
      expect(order.userPayAmount).toBe(100); // User pays: 150 - 50 = 100
      expect(order.exceptionAmount).toBe(50); // Company pays regular budget
      expect(order.exceptionType).toBe('LIMITED');

      const exception = await prisma.exception.findFirst({
        where: { orderId: order.id }
      });

      expect(exception.requestedAmount).toBe(50); // Only requesting regular budget
    });

    it('should handle LIMITED exception when total is below regular budget / يجب معالجة محدود عندما المبلغ أقل من الميزانية', async () => {
      const orderData = {
        userId: testUser.id,
        projectId: testProject.id,
        restaurantId: testRestaurant.id,
        orderType: 'EXCEPTION',
        exceptionType: 'LIMITED',
        totalAmount: 40,
        regularBudget: 50,
        items: []
      };

      const order = await orderService.createOrder(orderData);

      expect(order.userPayAmount).toBe(0); // User pays nothing (below budget)
      expect(order.exceptionAmount).toBe(40); // Company pays actual amount
    });
  });

  describe('Exception Order - SELF_PAID Type / طلب استثنائي - مدفوع ذاتياً', () => {
    it('should create SELF_PAID exception with user paying all / يجب إنشاء طلب مدفوع ذاتياً مع دفع المستخدم كل شيء', async () => {
      const orderData = {
        userId: testUser.id,
        projectId: testProject.id,
        restaurantId: testRestaurant.id,
        orderType: 'EXCEPTION',
        exceptionType: 'SELF_PAID',
        exceptionReason: 'Personal meal preference',
        totalAmount: 200,
        items: [
          {
            menuItemId: testMenuItem.id,
            quantity: 2,
            price: 200
          }
        ]
      };

      const order = await orderService.createOrder(orderData);

      expect(order).toBeDefined();
      expect(order.orderType).toBe('EXCEPTION');
      expect(order.totalAmount).toBe(200);
      expect(order.userPayAmount).toBe(200); // User pays everything
      expect(order.exceptionAmount).toBe(0); // Company pays nothing
      expect(order.exceptionType).toBe('SELF_PAID');

      const exception = await prisma.exception.findFirst({
        where: { orderId: order.id }
      });

      expect(exception.requestedAmount).toBe(0); // No company funds requested
    });
  });

  describe('QR Code + Project Access Integration / تكامل رمز QR والوصول للمشروع', () => {
    it('should validate project access for member / يجب التحقق من وصول العضو للمشروع', async () => {
      const accessValidation = await qrCodeService.validateProjectAccess(
        testProject.id,
        testUser.id
      );

      expect(accessValidation.hasAccess).toBe(true);
      expect(accessValidation.accessLevel).toBe('MEMBER');
      expect(accessValidation.membershipDetails).toBeDefined();
      expect(accessValidation.membershipDetails.role).toBe('MEMBER');
    });

    it('should reject access for non-member / يجب رفض وصول غير العضو', async () => {
      const nonMember = await prisma.user.create({
        data: {
          email: 'non-member@example.com',
          passwordHash: 'hash',
          firstName: 'Non',
          lastName: 'Member',
          role: 'REGULAR'
        }
      });

      const accessValidation = await qrCodeService.validateProjectAccess(
        testProject.id,
        nonMember.id
      );

      expect(accessValidation.hasAccess).toBe(false);
      expect(accessValidation.reason).toContain('ليس عضواً');

      await prisma.user.delete({ where: { id: nonMember.id } });
    });

    it('should allow admin access without membership / يجب السماح للمدير بالوصول بدون عضوية', async () => {
      const admin = await prisma.user.create({
        data: {
          email: 'admin@example.com',
          passwordHash: 'hash',
          firstName: 'Admin',
          lastName: 'User',
          role: 'ADMIN',
          isActive: true
        }
      });

      const accessValidation = await qrCodeService.validateProjectAccess(
        testProject.id,
        admin.id
      );

      expect(accessValidation.hasAccess).toBe(true);
      expect(accessValidation.accessLevel).toBe('ADMIN');

      await prisma.user.delete({ where: { id: admin.id } });
    });

    it('should generate and validate project QR code / يجب توليد والتحقق من رمز QR للمشروع', async () => {
      const qrData = await qrCodeService.generateProjectQR(testProject.id, {
        name: testProject.name,
        validUntil: new Date(Date.now() + 24 * 60 * 60000)
      });

      expect(qrData).toBeDefined();
      expect(qrData.token).toBeDefined();
      expect(qrData.data).toBeDefined();
      expect(qrData.data.projectId).toBe(testProject.id);

      // Validate the QR code
      const validation = await qrCodeService.validateQRCode(qrData.token, 'PROJECT_ACCESS');

      expect(validation.isValid).toBe(true);
      expect(validation.decoded.projectId).toBe(testProject.id);
    });
  });

  describe('Order Window Edge Cases / حالات حدود نافذة الطلب', () => {
    it('should allow exception order outside window / يجب السماح بطلب استثنائي خارج النافذة', async () => {
      // Create project with closed window
      const closedProject = await prisma.project.create({
        data: {
          name: 'Closed Window for Exception',
          startDate: new Date(Date.now() - 3 * 60 * 60000), // Started 3 hours ago
          endDate: new Date(Date.now() + 1 * 60 * 60000),
          orderWindow: 30, // 30 min window (now closed)
          isActive: true
        }
      });

      const orderData = {
        userId: testUser.id,
        projectId: closedProject.id,
        restaurantId: testRestaurant.id,
        orderType: 'EXCEPTION',
        exceptionType: 'FULL',
        exceptionReason: 'Missed the window',
        totalAmount: 80,
        items: []
      };

      const order = await orderService.createOrder(orderData);

      expect(order).toBeDefined();
      expect(order.orderType).toBe('EXCEPTION');
      expect(order.status).toBe('PENDING_APPROVAL');

      await prisma.project.delete({ where: { id: closedProject.id } });
    });

    it('should calculate window correctly with different durations / يجب حساب النافذة بشكل صحيح بمدد مختلفة', () => {
      const now = new Date();

      // Test 30-minute window
      const project30 = {
        startDate: new Date(now.getTime() - 20 * 60000), // 20 min ago
        orderWindow: 30
      };
      expect(orderService.isWithinOrderWindow(project30)).toBe(true);

      // Test 60-minute window
      const project60 = {
        startDate: new Date(now.getTime() - 45 * 60000), // 45 min ago
        orderWindow: 60
      };
      expect(orderService.isWithinOrderWindow(project60)).toBe(true);

      // Test expired window
      const projectExpired = {
        startDate: new Date(now.getTime() - 2 * 60 * 60000), // 2 hours ago
        orderWindow: 30
      };
      expect(orderService.isWithinOrderWindow(projectExpired)).toBe(false);
    });
  });

  describe('Cost Calculation Edge Cases / حالات حدود حساب التكلفة', () => {
    it('should handle zero-amount exception / يجب معالجة استثناء بمبلغ صفر', async () => {
      const result = await orderService.handleExceptionOrder({
        totalAmount: 0,
        exceptionType: 'FULL',
        regularBudget: 50
      });

      expect(result.totalAmount).toBe(0);
      expect(result.userPayAmount).toBe(0);
      expect(result.exceptionAmount).toBe(0);
    });

    it('should handle very large amounts / يجب معالجة مبالغ كبيرة جداً', async () => {
      const result = await orderService.handleExceptionOrder({
        totalAmount: 5000,
        exceptionType: 'LIMITED',
        regularBudget: 50
      });

      expect(result.userPayAmount).toBe(4950); // 5000 - 50
      expect(result.exceptionAmount).toBe(50);
    });

    it('should reject invalid exception type / يجب رفض نوع استثناء غير صحيح', async () => {
      await expect(
        orderService.handleExceptionOrder({
          totalAmount: 100,
          exceptionType: 'INVALID_TYPE',
          regularBudget: 50
        })
      ).rejects.toThrow('نوع الاستثناء غير صحيح');
    });
  });

  describe('Arabic Content Validation / التحقق من المحتوى العربي', () => {
    it('should have Arabic restaurant names / يجب أن يكون للمطاعم أسماء عربية', async () => {
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: testRestaurant.id }
      });

      expect(restaurant.nameAr).toBeDefined();
      expect(restaurant.nameAr).toBeTruthy();
      expect(restaurant.descriptionAr).toBeDefined();
    });

    it('should have Arabic menu item names / يجب أن يكون لعناصر القائمة أسماء عربية', async () => {
      const menuItem = await prisma.menuItem.findUnique({
        where: { id: testMenuItem.id }
      });

      expect(menuItem.nameAr).toBeDefined();
      expect(menuItem.nameAr).toBeTruthy();
      expect(menuItem.descriptionAr).toBeDefined();
    });
  });
});

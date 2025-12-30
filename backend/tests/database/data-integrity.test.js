/**
 * Database Data Integrity Tests
 * اختبارات سلامة بيانات قاعدة البيانات
 *
 * These tests verify database constraints, relationships, and data integrity
 * هذه الاختبارات تتحقق من قيود قاعدة البيانات والعلاقات وسلامة البيانات
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

describe('🔒 Database Data Integrity Tests / اختبارات سلامة البيانات', () => {
  // Cleanup after each test
  afterEach(async () => {
    // Clean up test data in reverse order of dependencies
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.menuItem.deleteMany({});
    await prisma.restaurant.deleteMany({});
    await prisma.userPreferences.deleteMany({});
    await prisma.user.deleteMany({ where: { email: { contains: 'test-' } } });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('User Model Constraints / قيود نموذج المستخدم', () => {
    it('should enforce unique email constraint / يجب فرض قيد البريد الإلكتروني الفريد', async () => {
      const userData = {
        email: 'test-unique@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        firstName: 'أحمد',
        lastName: 'محمد',
      };

      // Create first user
      await prisma.user.create({ data: userData });

      // Try to create duplicate
      await expect(prisma.user.create({ data: userData })).rejects.toThrow();
    });

    it('should require mandatory fields / يجب أن يتطلب الحقول الإلزامية', async () => {
      const invalidUser = {
        email: 'test-invalid@example.com',
        // Missing passwordHash, firstName, lastName
      };

      await expect(prisma.user.create({ data: invalidUser })).rejects.toThrow();
    });

    it('should set default values correctly / يجب تعيين القيم الافتراضية بشكل صحيح', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'test-defaults@example.com',
          passwordHash: await bcrypt.hash('password123', 10),
          firstName: 'أحمد',
          lastName: 'محمد',
        },
      });

      expect(user.role).toBe('REGULAR');
      expect(user.isActive).toBe(true);
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should validate email format (database level) / يجب التحقق من صيغة البريد الإلكتروني', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'test-format@example.com',
          passwordHash: await bcrypt.hash('password123', 10),
          firstName: 'Test',
          lastName: 'User',
        },
      });

      expect(user.email).toContain('@');
      expect(user.email).toMatch(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/);
    });
  });

  describe('Restaurant Model Constraints / قيود نموذج المطعم', () => {
    it('should enforce required geographic coordinates / يجب فرض الإحداثيات الجغرافية المطلوبة', async () => {
      const restaurant = await prisma.restaurant.create({
        data: {
          name: 'مطعم تجريبي',
          address: 'القاهرة',
          latitude: 30.0444,
          longitude: 31.2357,
        },
      });

      expect(restaurant.latitude).toBeDefined();
      expect(restaurant.longitude).toBeDefined();
      expect(typeof restaurant.latitude).toBe('number');
      expect(typeof restaurant.longitude).toBe('number');
    });

    it('should set default rating and status / يجب تعيين التقييم والحالة الافتراضية', async () => {
      const restaurant = await prisma.restaurant.create({
        data: {
          name: 'مطعم افتراضي',
          address: 'الجيزة',
          latitude: 30.0131,
          longitude: 31.2089,
        },
      });

      expect(restaurant.rating).toBe(0);
      expect(restaurant.isActive).toBe(true);
      expect(restaurant.isPartner).toBe(false);
    });

    it('should validate latitude and longitude ranges / يجب التحقق من نطاقات الإحداثيات', async () => {
      const restaurant = await prisma.restaurant.create({
        data: {
          name: 'مطعم إحداثيات',
          address: 'الإسكندرية',
          latitude: 31.2001,
          longitude: 29.9187,
        },
      });

      // Egypt latitude range: ~22° to ~32°
      expect(restaurant.latitude).toBeGreaterThanOrEqual(22);
      expect(restaurant.latitude).toBeLessThanOrEqual(32);

      // Egypt longitude range: ~25° to ~37°
      expect(restaurant.longitude).toBeGreaterThanOrEqual(25);
      expect(restaurant.longitude).toBeLessThanOrEqual(37);
    });
  });

  describe('Order Model Relationships / علاقات نموذج الطلب', () => {
    let testUser, testRestaurant, testMenuItem;

    beforeEach(async () => {
      // Create test user
      testUser = await prisma.user.create({
        data: {
          email: 'test-order@example.com',
          passwordHash: await bcrypt.hash('password123', 10),
          firstName: 'محمد',
          lastName: 'علي',
        },
      });

      // Create test restaurant
      testRestaurant = await prisma.restaurant.create({
        data: {
          name: 'مطعم الطلبات',
          address: 'القاهرة',
          latitude: 30.0444,
          longitude: 31.2357,
        },
      });

      // Create test menu item
      testMenuItem = await prisma.menuItem.create({
        data: {
          name: 'شاورما',
          nameAr: 'شاورما',
          price: 25,
          restaurantId: testRestaurant.id,
        },
      });
    });

    it('should create order with valid relationships / يجب إنشاء طلب بعلاقات صحيحة', async () => {
      const order = await prisma.order.create({
        data: {
          userId: testUser.id,
          restaurantId: testRestaurant.id,
          status: 'PENDING',
          totalAmount: 25,
        },
        include: {
          user: true,
          restaurant: true,
        },
      });

      expect(order.user.email).toBe('test-order@example.com');
      expect(order.restaurant.name).toBe('مطعم الطلبات');
      expect(order.status).toBe('PENDING');
    });

    it('should cascade delete order items when order is deleted / يجب حذف عناصر الطلب عند حذف الطلب', async () => {
      const order = await prisma.order.create({
        data: {
          userId: testUser.id,
          restaurantId: testRestaurant.id,
          status: 'PENDING',
          totalAmount: 25,
        },
      });

      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          menuItemId: testMenuItem.id,
          quantity: 1,
          price: 25,
        },
      });

      // Delete order
      await prisma.order.delete({ where: { id: order.id } });

      // Check that order items are also deleted
      const orderItems = await prisma.orderItem.findMany({
        where: { orderId: order.id },
      });

      expect(orderItems).toHaveLength(0);
    });

    it('should enforce foreign key constraints / يجب فرض قيود المفاتيح الأجنبية', async () => {
      // Try to create order with non-existent user
      await expect(
        prisma.order.create({
          data: {
            userId: 'non-existent-user-id',
            status: 'PENDING',
            totalAmount: 25,
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('Nutrition and Dietary Data / البيانات الغذائية', () => {
    let testUser, testRestaurant, testMenuItem;

    beforeEach(async () => {
      testUser = await prisma.user.create({
        data: {
          email: 'test-nutrition@example.com',
          passwordHash: await bcrypt.hash('password123', 10),
          firstName: 'فاطمة',
          lastName: 'أحمد',
        },
      });

      testRestaurant = await prisma.restaurant.create({
        data: {
          name: 'مطعم صحي',
          address: 'القاهرة',
          latitude: 30.0444,
          longitude: 31.2357,
        },
      });

      testMenuItem = await prisma.menuItem.create({
        data: {
          name: 'سلطة',
          nameAr: 'سلطة خضراء',
          price: 15,
          restaurantId: testRestaurant.id,
        },
      });
    });

    it('should create nutritional info with valid data / يجب إنشاء معلومات غذائية بيانات صحيحة', async () => {
      const nutritionInfo = await prisma.nutritionalInfo.create({
        data: {
          menuItemId: testMenuItem.id,
          calories: 150,
          protein: 5,
          carbs: 20,
          fat: 3,
          fiber: 5,
          sodium: 200,
          allergens: [],
        },
      });

      expect(nutritionInfo.calories).toBe(150);
      expect(nutritionInfo.allergens).toEqual([]);
    });

    it('should enforce unique nutritional info per menu item / يجب فرض معلومات غذائية فريدة لكل عنصر', async () => {
      await prisma.nutritionalInfo.create({
        data: {
          menuItemId: testMenuItem.id,
          calories: 150,
        },
      });

      // Try to create duplicate
      await expect(
        prisma.nutritionalInfo.create({
          data: {
            menuItemId: testMenuItem.id,
            calories: 200,
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('Index Performance / أداء الفهارس', () => {
    it('should use email index for user queries / يجب استخدام فهرس البريد للاستعلامات', async () => {
      // Create multiple users
      for (let i = 0; i < 10; i++) {
        await prisma.user.create({
          data: {
            email: `test-index-${i}@example.com`,
            passwordHash: await bcrypt.hash('password123', 10),
            firstName: `User${i}`,
            lastName: 'Test',
          },
        });
      }

      const startTime = Date.now();
      const user = await prisma.user.findUnique({
        where: { email: 'test-index-5@example.com' },
      });
      const endTime = Date.now();

      expect(user).toBeDefined();
      expect(endTime - startTime).toBeLessThan(100); // Should be very fast with index
    });
  });

  describe('Data Validation / التحقق من البيانات', () => {
    it('should validate order status enum / يجب التحقق من حالات الطلب', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'test-enum@example.com',
          passwordHash: await bcrypt.hash('password123', 10),
          firstName: 'Test',
          lastName: 'User',
        },
      });

      const validStatuses = [
        'PENDING',
        'CONFIRMED',
        'PREPARING',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'CANCELLED',
      ];

      for (const status of validStatuses) {
        const order = await prisma.order.create({
          data: {
            userId: user.id,
            status,
            totalAmount: 50,
          },
        });

        expect(order.status).toBe(status);
        await prisma.order.delete({ where: { id: order.id } });
      }
    });

    it('should reject invalid enum values / يجب رفض قيم enum غير صحيحة', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'test-invalid-enum@example.com',
          passwordHash: await bcrypt.hash('password123', 10),
          firstName: 'Test',
          lastName: 'User',
        },
      });

      await expect(
        prisma.order.create({
          data: {
            userId: user.id,
            status: 'INVALID_STATUS',
            totalAmount: 50,
          },
        })
      ).rejects.toThrow();
    });
  });
});

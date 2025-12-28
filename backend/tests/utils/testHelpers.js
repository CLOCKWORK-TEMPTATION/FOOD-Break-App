/**
 * Test Helpers - أدوات مساعدة للاختبارات
 * Why: توحيد الأدوات المساعدة وتقليل التكرار في الاختبارات
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

/**
 * إنشاء مستخدم تجريبي
 */
async function createTestUser(userData = {}) {
  const defaultData = {
    email: `test${Date.now()}@test.com`,
    passwordHash: await bcrypt.hash('Test123!@#', 10),
    firstName: 'Test',
    lastName: 'User',
    role: 'REGULAR',
    isActive: true,
    ...userData
  };

  return await prisma.user.create({
    data: defaultData
  });
}

/**
 * إنشاء مطعم تجريبي
 */
async function createTestRestaurant(restaurantData = {}) {
  const defaultData = {
    name: `Test Restaurant ${Date.now()}`,
    description: 'Test restaurant description',
    cuisineType: 'Italian',
    address: '123 Test Street',
    latitude: 30.0444,
    longitude: 31.2357,
    isPartner: true,
    isActive: true,
    ...restaurantData
  };

  return await prisma.restaurant.create({
    data: defaultData
  });
}

/**
 * إنشاء عنصر قائمة تجريبي
 */
async function createTestMenuItem(menuItemData = {}) {
  const restaurant = menuItemData.restaurantId 
    ? await prisma.restaurant.findUnique({ where: { id: menuItemData.restaurantId } })
    : await createTestRestaurant();

  const defaultData = {
    restaurantId: restaurant.id,
    name: `Test Menu Item ${Date.now()}`,
    description: 'Test menu item description',
    price: 50.0,
    category: 'Main',
    isAvailable: true,
    menuType: 'CORE',
    qualityScore: 4.5,
    ...menuItemData
  };

  return await prisma.menuItem.create({
    data: defaultData
  });
}

/**
 * إنشاء طلب تجريبي
 */
async function createTestOrder(orderData = {}) {
  const user = orderData.userId 
    ? await prisma.user.findUnique({ where: { id: orderData.userId } })
    : await createTestUser();

  const restaurant = orderData.restaurantId
    ? await prisma.restaurant.findUnique({ where: { id: orderData.restaurantId } })
    : await createTestRestaurant();

  const menuItem = await createTestMenuItem({ restaurantId: restaurant.id });

  const defaultData = {
    userId: user.id,
    restaurantId: restaurant.id,
    status: 'PENDING',
    orderType: 'REGULAR',
    totalAmount: 50.0,
    ...orderData
  };

  const order = await prisma.order.create({
    data: defaultData
  });

  // إضافة عناصر الطلب
  await prisma.orderItem.create({
    data: {
      orderId: order.id,
      menuItemId: menuItem.id,
      quantity: 1,
      price: menuItem.price
    }
  });

  return await prisma.order.findUnique({
    where: { id: order.id },
    include: { items: true }
  });
}

/**
 * إنشاء JWT token تجريبي
 */
function generateTestToken(userId, role = 'REGULAR') {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET || 'test-secret-key',
    { expiresIn: '1h' }
  );
}

/**
 * إنشاء JWT token منتهي الصلاحية
 */
function generateExpiredToken(payload) {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'test-secret-key',
    { expiresIn: '-1h' } // منتهي الصلاحية
  );
}

/**
 * إنشاء token للمستخدم
 */
function generateUserToken(user) {
  return jwt.sign(
    { userId: user.id, role: user.role || 'REGULAR' },
    process.env.JWT_SECRET || 'test-secret-key',
    { expiresIn: '1h' }
  );
}

/**
 * إنشاء UUID تجريبي
 */
function generateUUID() {
  return 'test-uuid-' + Math.random().toString(36).substr(2, 9);
}

/**
 * إنشاء بريد إلكتروني عشوائي
 */
function generateRandomEmail() {
  return `test${Math.random().toString(36).substr(2, 9)}@test.com`;
}

/**
 * إنشاء mock request object
 */
function createMockRequest(overrides = {}) {
  return {
    body: {},
    params: {},
    query: {},
    user: { id: 'test-user-id', role: 'REGULAR' },
    t: jest.fn((key) => key), // Mock localization function
    ...overrides
  };
}

/**
 * إنشاء mock response object
 */
function createMockResponse() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res;
}

/**
 * إنشاء mock next function
 */
function createMockNext() {
  return jest.fn();
}

/**
 * تنظيف قاعدة البيانات التجريبية
 */
async function cleanupTestData() {
  // حذف البيانات بترتيب عكسي للعلاقات
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.menuItem.deleteMany({});
  await prisma.restaurant.deleteMany({});
  await prisma.user.deleteMany({});
}

/**
 * إغلاق اتصال Prisma
 */
async function closePrisma() {
  await prisma.$disconnect();
}

module.exports = {
  createTestUser,
  createTestRestaurant,
  createTestMenuItem,
  createTestOrder,
  generateTestToken,
  generateExpiredToken,
  generateUserToken,
  generateUUID,
  generateRandomEmail,
  createMockRequest,
  createMockResponse,
  createMockNext,
  cleanupTestData,
  closePrisma,
  prisma
};

/**
 * Test Helpers - أدوات مساعدة للاختبارات
 * Why: توحيد الأدوات المساعدة وتقليل التكرار في الاختبارات
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock Prisma Client globally for tests
const mockPrisma = {
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    upsert: jest.fn(),
    deleteMany: jest.fn()
  },
  restaurant: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    deleteMany: jest.fn()
  },
  menuItem: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    deleteMany: jest.fn()
  },
  order: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    deleteMany: jest.fn()
  },
  orderItem: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn()
  },
  payment: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    deleteMany: jest.fn()
  },
  project: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    deleteMany: jest.fn()
  },
  // Phase 4 Models
  emergencySession: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    deleteMany: jest.fn()
  },
  emergencyOrder: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn()
  },
  emergencyLog: {
    create: jest.fn(),
    findMany: jest.fn(),
    deleteMany: jest.fn()
  },
  prePreparedInventory: {
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn()
  },
  scheduleChangeNotification: {
    create: jest.fn(),
    findMany: jest.fn(),
    deleteMany: jest.fn()
  },
  emergencyRestaurantNotification: {
    create: jest.fn(),
    findMany: jest.fn(),
    deleteMany: jest.fn()
  },
  medicalProfile: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
    deleteMany: jest.fn()
  },
  medicalIncident: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    deleteMany: jest.fn()
  },
  medicalCheck: {
    create: jest.fn(),
    findMany: jest.fn(),
    deleteMany: jest.fn()
  },
  medicalConsent: {
    create: jest.fn(),
    findMany: jest.fn(),
    upsert: jest.fn(),
    deleteMany: jest.fn()
  },
  emergencyAlert: {
    create: jest.fn(),
    findMany: jest.fn(),
    deleteMany: jest.fn()
  },
  emergencyContactNotification: {
    create: jest.fn(),
    findMany: jest.fn(),
    deleteMany: jest.fn()
  },
  medicalDataAccessLog: {
    create: jest.fn(),
    findMany: jest.fn(),
    deleteMany: jest.fn()
  },
  medicalDataDeletion: {
    create: jest.fn(),
    findMany: jest.fn()
  },
  ingredient: {
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  drugFoodInteraction: {
    findFirst: jest.fn(),
    findMany: jest.fn()
  },
  voiceSession: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    deleteMany: jest.fn()
  },
  voicePreferences: {
    create: jest.fn(),
    findUnique: jest.fn(),
    upsert: jest.fn(),
    deleteMany: jest.fn()
  },
  voiceShortcut: {
    create: jest.fn(),
    findMany: jest.fn(),
    deleteMany: jest.fn()
  },
  personalVoiceModel: {
    create: jest.fn(),
    findUnique: jest.fn(),
    deleteMany: jest.fn()
  },
  dietaryProfile: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn()
  },
  // Transaction support
  $transaction: jest.fn((callback) => callback(mockPrisma)),
  $disconnect: jest.fn()
};

// Export the mock for use in tests
global.mockPrisma = mockPrisma;

const prisma = mockPrisma;

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
    headers: {},
    user: { id: 'test-user-id', role: 'REGULAR' },
    t: jest.fn((key) => key), // Mock localization function
    get: jest.fn((header) => {
      const headers = {
        'user-agent': 'test-user-agent',
        'authorization': 'Bearer test-token',
        'content-type': 'application/json'
      };
      return headers[header.toLowerCase()];
    }),
    ip: '127.0.0.1',
    method: 'GET',
    url: '/test',
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
  // Reset all mocks instead of actual database operations
  Object.keys(mockPrisma).forEach(model => {
    if (typeof mockPrisma[model] === 'object' && mockPrisma[model] !== null) {
      Object.keys(mockPrisma[model]).forEach(method => {
        if (jest.isMockFunction(mockPrisma[model][method])) {
          mockPrisma[model][method].mockReset();
        }
      });
    }
  });
}

/**
 * إغلاق اتصال Prisma
 */
async function closePrisma() {
  // Mock disconnect
  return Promise.resolve();
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

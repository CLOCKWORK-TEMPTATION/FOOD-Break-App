const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

/**
 * Test Helpers & Fixtures
 * مساعدات واختبارات للتطوير
 */

// إنشاء مستخدم تجريبي
const createTestUser = async (overrides = {}) => {
  const defaultUser = {
    email: `test_${Date.now()}@test.com`,
    passwordHash: await bcrypt.hash('password123', 10),
    firstName: 'Test',
    lastName: 'User',
    role: 'REGULAR',
    isActive: true
  };

  return await prisma.user.create({
    data: { ...defaultUser, ...overrides }
  });
};

// إنشاء مطعم تجريبي
const createTestRestaurant = async (overrides = {}) => {
  const defaultRestaurant = {
    name: `Test Restaurant ${Date.now()}`,
    address: 'Test Address',
    latitude: 24.7136,
    longitude: 46.6753,
    isPartner: true,
    isActive: true,
    rating: 4.5
  };

  return await prisma.restaurant.create({
    data: { ...defaultRestaurant, ...overrides }
  });
};

// إنشاء عنصر قائمة تجريبي
const createTestMenuItem = async (restaurantId, overrides = {}) => {
  const defaultItem = {
    restaurantId,
    name: `Test Item ${Date.now()}`,
    price: 50,
    category: 'Test',
    isAvailable: true,
    menuType: 'CORE'
  };

  return await prisma.menuItem.create({
    data: { ...defaultItem, ...overrides }
  });
};

// إنشاء طلب تجريبي
const createTestOrder = async (userId, restaurantId, overrides = {}) => {
  const defaultOrder = {
    userId,
    restaurantId,
    status: 'PENDING',
    orderType: 'REGULAR',
    totalAmount: 100
  };

  return await prisma.order.create({
    data: { ...defaultOrder, ...overrides }
  });
};

// إنشاء مشروع تجريبي
const createTestProject = async (overrides = {}) => {
  const defaultProject = {
    name: `Test Project ${Date.now()}`,
    qrCode: `QR_${Date.now()}`,
    startDate: new Date(),
    isActive: true
  };

  return await prisma.project.create({
    data: { ...defaultProject, ...overrides }
  });
};

// تنظيف قاعدة البيانات
const cleanupDatabase = async () => {
  const tables = [
    'OrderItem',
    'Order',
    'MenuItem',
    'Restaurant',
    'ProjectMember',
    'Project',
    'UserPreferences',
    'User'
  ];

  for (const table of tables) {
    await prisma[table.charAt(0).toLowerCase() + table.slice(1)].deleteMany({});
  }
};

// إنشاء JWT token تجريبي
const createTestToken = (userId, role = 'REGULAR') => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'test_secret',
    { expiresIn: '1h' }
  );
};

// Mock data generators
const mockData = {
  user: (overrides = {}) => ({
    email: `user_${Date.now()}@test.com`,
    firstName: 'John',
    lastName: 'Doe',
    role: 'REGULAR',
    ...overrides
  }),

  restaurant: (overrides = {}) => ({
    name: 'Test Restaurant',
    address: '123 Test St',
    latitude: 24.7136,
    longitude: 46.6753,
    rating: 4.5,
    ...overrides
  }),

  menuItem: (restaurantId, overrides = {}) => ({
    restaurantId,
    name: 'Test Dish',
    price: 50,
    category: 'Main',
    isAvailable: true,
    ...overrides
  }),

  order: (userId, restaurantId, overrides = {}) => ({
    userId,
    restaurantId,
    totalAmount: 100,
    status: 'PENDING',
    ...overrides
  })
};

module.exports = {
  createTestUser,
  createTestRestaurant,
  createTestMenuItem,
  createTestOrder,
  createTestProject,
  cleanupDatabase,
  createTestToken,
  mockData
};

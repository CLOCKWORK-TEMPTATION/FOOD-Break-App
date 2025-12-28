/**
 * Test Helpers - دوال مساعدة للاختبارات
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// ==========================================
// Token Generation Helpers
// ==========================================

/**
 * توليد JWT token للاختبار
 */
const generateTestToken = (payload, expiresIn = '1h') => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only',
    { expiresIn }
  );
};

/**
 * توليد token للمستخدم
 */
const generateUserToken = (user) => {
  return generateTestToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });
};

/**
 * توليد token منتهي الصلاحية
 */
const generateExpiredToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only',
    { expiresIn: '-1h' }
  );
};

/**
 * توليد token غير صالح
 */
const generateInvalidToken = () => {
  return 'invalid.token.here';
};

// ==========================================
// Password Helpers
// ==========================================

/**
 * تشفير كلمة مرور للاختبار
 */
const hashPassword = async (password) => {
  return bcrypt.hash(password, 10);
};

/**
 * مقارنة كلمات المرور
 */
const comparePasswords = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

// ==========================================
// Mock Helpers
// ==========================================

/**
 * إنشاء mock لـ Prisma
 */
const createPrismaMock = () => {
  return {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    order: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    menuItem: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    restaurant: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    payment: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn((fn) => fn()),
  };
};

/**
 * إنشاء mock request
 */
const createMockRequest = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  headers: {
    'content-type': 'application/json',
  },
  user: null,
  ip: '127.0.0.1',
  ...overrides,
});

/**
 * إنشاء mock response
 */
const createMockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.set = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res;
};

/**
 * إنشاء mock next function
 */
const createMockNext = () => jest.fn();

// ==========================================
// Assertion Helpers
// ==========================================

/**
 * التحقق من شكل الاستجابة الناجحة
 */
const expectSuccessResponse = (res, statusCode = 200) => {
  expect(res.status).toHaveBeenCalledWith(statusCode);
  const jsonCall = res.json.mock.calls[0][0];
  expect(jsonCall).toHaveProperty('success', true);
  return jsonCall;
};

/**
 * التحقق من شكل استجابة الخطأ
 */
const expectErrorResponse = (res, statusCode, errorCode = null) => {
  expect(res.status).toHaveBeenCalledWith(statusCode);
  const jsonCall = res.json.mock.calls[0][0];
  expect(jsonCall).toHaveProperty('success', false);
  if (errorCode) {
    expect(jsonCall.error).toHaveProperty('code', errorCode);
  }
  return jsonCall;
};

/**
 * التحقق من وجود pagination
 */
const expectPagination = (data) => {
  expect(data).toHaveProperty('pagination');
  expect(data.pagination).toHaveProperty('page');
  expect(data.pagination).toHaveProperty('limit');
  expect(data.pagination).toHaveProperty('total');
};

// ==========================================
// Delay Helper
// ==========================================

/**
 * تأخير للاختبارات غير المتزامنة
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ==========================================
// Random Data Generators
// ==========================================

/**
 * توليد UUID عشوائي
 */
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * توليد بريد إلكتروني عشوائي
 */
const generateRandomEmail = () => {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
};

/**
 * توليد رقم هاتف سعودي عشوائي
 */
const generateRandomPhone = () => {
  return `+9665${Math.floor(10000000 + Math.random() * 90000000)}`;
};

// ==========================================
// Exports
// ==========================================

module.exports = {
  // Token helpers
  generateTestToken,
  generateUserToken,
  generateExpiredToken,
  generateInvalidToken,
  
  // Password helpers
  hashPassword,
  comparePasswords,
  
  // Mock helpers
  createPrismaMock,
  createMockRequest,
  createMockResponse,
  createMockNext,
  
  // Assertion helpers
  expectSuccessResponse,
  expectErrorResponse,
  expectPagination,
  
  // Utility helpers
  delay,
  generateUUID,
  generateRandomEmail,
  generateRandomPhone,
};

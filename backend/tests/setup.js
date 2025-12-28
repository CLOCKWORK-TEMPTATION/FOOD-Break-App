/**
 * Test Setup
 * إعداد بيئة الاختبارات
 */

// تحميل متغيرات البيئة للاختبار
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.QR_SECRET_KEY = 'test-qr-secret-key';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/breakapp_test';

// إيقاف console.log في الاختبارات (اختياري)
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Global test helpers
global.mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'REGULAR',
  isActive: true
};

global.mockAdmin = {
  id: 'test-admin-id',
  email: 'admin@example.com',
  firstName: 'Admin',
  lastName: 'User',
  role: 'ADMIN',
  isActive: true
};

// Cleanup after all tests
afterAll(async () => {
  // Close any open connections
  await new Promise(resolve => setTimeout(resolve, 500));
});

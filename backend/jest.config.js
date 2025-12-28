/**
 * Jest Configuration
 * تكوين اختبارات Jest للمشروع
 */

module.exports = {
  // بيئة الاختبار
  testEnvironment: 'node',

  // مسارات البحث عن الاختبارات
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/*.test.js',
    '**/*.spec.js'
  ],

  // استبعاد المجلدات التالية
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/'
  ],

  // ملفات الإعداد
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // تغطية الكود
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/**/__tests__/**',
    '!src/**/node_modules/**'
  ],

  // حدود التغطية المطلوبة
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },

  // تقرير التغطية
  coverageReporters: ['text', 'lcov', 'html'],

  // timeout للاختبارات
  testTimeout: 10000,

  // verbose output
  verbose: true,

  // تنظيف mocks تلقائياً
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};

/**
 * Jest Configuration
 * تكوين اختبارات Jest الشامل
 */

module.exports = {
  testEnvironment: 'node',
  
  // مسارات الاختبارات
  testMatch: [
    '**/tests/**/*.test.js',
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],
  
  // استثناء المجلدات
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/'
  ],
  
  // تغطية الكود
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
    '!src/server.js', // الخادم الرئيسي يُختبر منفصلاً
    '!src/jobs/**', // الوظائف المجدولة
  ],
  
  coverageDirectory: 'coverage',
  
  // Note: Coverage thresholds are set to 80% for production quality
  // تشجيع مستوى تغطية إنتاجي عالي الجودة
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  
  // ملفات الإعداد
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // مهلة الاختبار
  testTimeout: 15000,
  
  // تقارير الاختبار
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'test-results',
      outputName: 'junit.xml',
    }]
  ],
  
  // ترتيب تشغيل الاختبارات
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/tests/unit/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/integration/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    },
    {
      displayName: 'e2e',
      testMatch: ['<rootDir>/tests/e2e/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    },
  ],
  
  // تنظيف الـ mocks تلقائياً
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  
  // معلومات مفصلة
  verbose: true,
};

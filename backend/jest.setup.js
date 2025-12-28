/**
 * Jest Setup File - إعداد بيئة الاختبار
 * يتم تشغيل هذا الملف قبل كل اختبار
 */

// تحميل ملف الإعداد الرئيسي
require('./tests/setup');

// إعداد إضافي للاختبارات
beforeEach(() => {
  // تنظيف جميع المحاكيات قبل كل اختبار
  jest.clearAllMocks();
});

afterEach(() => {
  // تنظيف إضافي بعد كل اختبار
  jest.restoreAllMocks();
});

// معالجة الأخطاء غير المتوقعة
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// إعداد timeout عالمي للاختبارات
jest.setTimeout(30000);
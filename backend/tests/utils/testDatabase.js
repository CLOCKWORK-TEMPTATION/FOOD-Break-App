/**
 * Test Database Setup
 * Why: إعداد قاعدة بيانات منفصلة للاختبارات
 */

const { PrismaClient } = require('@prisma/client');

// استخدام قاعدة بيانات منفصلة للاختبارات
const testDatabaseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: testDatabaseUrl
    }
  }
});

/**
 * تهيئة قاعدة البيانات للاختبارات
 */
async function setupTestDatabase() {
  try {
    // التحقق من الاتصال
    await prisma.$connect();
    console.log('✅ Test database connected');
  } catch (error) {
    console.error('❌ Failed to connect to test database:', error);
    throw error;
  }
}

/**
 * تنظيف قاعدة البيانات بعد كل اختبار
 */
async function cleanupDatabase() {
  try {
    // حذف جميع البيانات بترتيب صحيح
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.menuItem.deleteMany({});
    await prisma.restaurant.deleteMany({});
    await prisma.user.deleteMany({});
  } catch (error) {
    console.error('Error cleaning up database:', error);
  }
}

/**
 * إغلاق الاتصال
 */
async function closeDatabase() {
  await prisma.$disconnect();
}

module.exports = {
  prisma,
  setupTestDatabase,
  cleanupDatabase,
  closeDatabase
};

/**
 * Auth Test Helper
 * مساعدات للاختبارات المتعلقة بالمصادقة
 */

const jwt = require('jsonwebtoken');

/**
 * توليد JWT token للاختبار
 */
const generateTestToken = (userId, role = 'REGULAR') => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

/**
 * إنشاء مستخدم وهمي مع token
 */
const createTestUser = (overrides = {}) => {
  const user = {
    id: 'test-user-' + Date.now(),
    email: `test-${Date.now()}@example.com`,
    firstName: 'Test',
    lastName: 'User',
    role: 'REGULAR',
    isActive: true,
    ...overrides
  };

  const token = generateTestToken(user.id, user.role);

  return { user, token };
};

/**
 * إنشاء admin وهمي مع token
 */
const createTestAdmin = (overrides = {}) => {
  return createTestUser({
    email: `admin-${Date.now()}@example.com`,
    firstName: 'Admin',
    lastName: 'User',
    role: 'ADMIN',
    ...overrides
  });
};

/**
 * mock Prisma user findUnique
 */
const mockPrismaFindUser = (prisma, user) => {
  prisma.user.findUnique = jest.fn().mockResolvedValue(user);
};

module.exports = {
  generateTestToken,
  createTestUser,
  createTestAdmin,
  mockPrismaFindUser
};

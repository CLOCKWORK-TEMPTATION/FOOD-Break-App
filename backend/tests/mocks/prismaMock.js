/**
 * Prisma Client Mock
 * Mock للـ Prisma Client للاختبارات
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
      aggregate: jest.fn(),
      groupBy: jest.fn()
    },
    order: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn()
    },
    restaurant: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn()
    },
    menuItem: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn()
    },
    payment: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      aggregate: jest.fn()
    },
    project: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn()
    },
    userMoodLog: {
      findMany: jest.fn(),
      create: jest.fn()
    },
    emotionProfile: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    },
    $disconnect: jest.fn()
  };
};

module.exports = { createPrismaMock };

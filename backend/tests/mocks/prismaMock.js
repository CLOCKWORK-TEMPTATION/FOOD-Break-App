/**
 * Prisma Client Mock
 * Mock للـ Prisma Client للاختبارات
 */

const createPrismaMock = () => {
  const standardMethods = {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn()
  };

  return {
    user: { ...standardMethods },
    order: { ...standardMethods },
    restaurant: { ...standardMethods },
    menuItem: { ...standardMethods },
    payment: { ...standardMethods },
    project: { ...standardMethods },
    userMoodLog: { ...standardMethods },
    emotionProfile: { ...standardMethods },
    emotionLog: { ...standardMethods },
    userConsent: { ...standardMethods },
    notification: { ...standardMethods },
    medicalProfile: { ...standardMethods },
    exception: { ...standardMethods },
    costAlert: { ...standardMethods },
    budget: { ...standardMethods },
    dietaryProfile: { ...standardMethods },
    nutritionGoal: { ...standardMethods },
    mealPlan: { ...standardMethods },
    production: { ...standardMethods },
    invoice: { ...standardMethods },
    qRCode: { ...standardMethods },
    reminder: { ...standardMethods },
    mlModel: { ...standardMethods },
    prediction: { ...standardMethods },
    workflow: { ...standardMethods },
    admin: { ...standardMethods },
    analytics: { ...standardMethods },
    $disconnect: jest.fn(),
    $connect: jest.fn(),
    $transaction: jest.fn((callback) => callback ? callback({}) : Promise.resolve([]))
  };
};

module.exports = { createPrismaMock };

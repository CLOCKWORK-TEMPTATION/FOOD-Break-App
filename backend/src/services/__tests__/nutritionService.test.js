const nutritionService = require('../../nutritionService');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('NutritionService', () => {
  let testUser;

  beforeAll(async () => {
    testUser = await prisma.user.create({
      data: { email: 'nutrition@test.com', passwordHash: 'hash', firstName: 'Test', lastName: 'User' }
    });
  });

  afterAll(async () => {
    await prisma.userNutritionLog.deleteMany();
    await prisma.nutritionGoal.deleteMany();
    await prisma.user.deleteMany({ where: { email: 'nutrition@test.com' } });
    await prisma.$disconnect();
  });

  it('should log nutrition data', async () => {
    const log = await nutritionService.logNutrition(testUser.id, {
      date: new Date(),
      totalCalories: 2000,
      totalProtein: 100,
      totalCarbs: 250,
      totalFat: 70
    });

    expect(log).toBeDefined();
    expect(log.totalCalories).toBe(2000);
  });

  it('should create nutrition goal', async () => {
    const goal = await nutritionService.createGoal(testUser.id, {
      goalType: 'WEIGHT_LOSS',
      targetCalories: 1800,
      targetProtein: 120
    });

    expect(goal).toBeDefined();
    expect(goal.goalType).toBe('WEIGHT_LOSS');
  });

  it('should get user nutrition logs', async () => {
    const logs = await nutritionService.getUserLogs(testUser.id);
    expect(Array.isArray(logs)).toBe(true);
  });

  it('should calculate daily summary', async () => {
    const summary = await nutritionService.getDailySummary(testUser.id, new Date());
    expect(summary).toBeDefined();
  });
});

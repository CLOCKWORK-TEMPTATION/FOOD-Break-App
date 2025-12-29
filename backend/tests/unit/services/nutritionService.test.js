/**
 * Nutrition Service Tests
 * اختبارات خدمة التغذية
 */

const nutritionService = require('../../../src/services/nutritionService');

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => global.mockPrisma)
}));

describe('Nutrition Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getNutritionInfo', () => {
    it('should get nutrition info for menu item', async () => {
      const mockItem = {
        id: 'item-123',
        nutritionInfo: { calories: 500, protein: 20 }
      };
      global.mockPrisma.menuItem.findUnique.mockResolvedValue(mockItem);

      const result = await nutritionService.getNutritionInfo('item-123');

      expect(result).toHaveProperty('calories');
    });
  });

  describe('calculateDailyIntake', () => {
    it('should calculate daily nutrition intake', async () => {
      global.mockPrisma.order.findMany.mockResolvedValue([
        { orderItems: [{ menuItem: { nutritionInfo: { calories: 500 } } }] }
      ]);

      const result = await nutritionService.calculateDailyIntake('user-123');

      expect(result).toHaveProperty('totalCalories');
    });
  });

  describe('setNutritionGoals', () => {
    it('should set nutrition goals for user', async () => {
      const goals = { dailyCalories: 2000, protein: 100 };
      global.mockPrisma.nutritionGoal.create.mockResolvedValue({ id: '1', ...goals });

      const result = await nutritionService.setNutritionGoals('user-123', goals);

      expect(result).toHaveProperty('dailyCalories');
    });
  });

  describe('getNutritionGoals', () => {
    it('should get nutrition goals for user', async () => {
      global.mockPrisma.nutritionGoal.findUnique.mockResolvedValue({
        id: '1',
        dailyCalories: 2000
      });

      const result = await nutritionService.getNutritionGoals('user-123');

      expect(result).toHaveProperty('dailyCalories');
    });
  });

  describe('generateMealPlan', () => {
    it('should generate meal plan based on goals', async () => {
      global.mockPrisma.nutritionGoal.findUnique.mockResolvedValue({ dailyCalories: 2000 });
      global.mockPrisma.menuItem.findMany.mockResolvedValue([
        { id: '1', nutritionInfo: { calories: 500 } }
      ]);

      const result = await nutritionService.generateMealPlan('user-123');

      expect(result).toHaveProperty('meals');
    });
  });

  describe('trackNutrition', () => {
    it('should track nutrition progress', async () => {
      global.mockPrisma.order.findMany.mockResolvedValue([]);

      const result = await nutritionService.trackNutrition('user-123');

      expect(result).toHaveProperty('progress');
    });
  });
});

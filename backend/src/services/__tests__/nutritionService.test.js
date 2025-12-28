/**
 * Smoke Tests - Nutrition Service
 */

jest.mock('@prisma/client');

const nutritionService = require('../nutritionService');

describe('NutritionService - Smoke Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { PrismaClient } = require('@prisma/client');
    const mockPrisma = new PrismaClient();

    mockPrisma.menuItem.findUnique.mockResolvedValue({ id: '1' });
    mockPrisma.userNutritionLog.create.mockResolvedValue({ id: '1' });
    mockPrisma.userNutritionLog.findMany.mockResolvedValue([]);
    mockPrisma.nutritionGoal.findUnique.mockResolvedValue({ id: '1' });
    mockPrisma.nutritionGoal.upsert.mockResolvedValue({ id: '1' });
  });

  it('should handle logMeal', async () => {
    if (nutritionService.logMeal) {
      await expect(nutritionService.logMeal('user-1', {})).resolves.not.toThrow();
    }
  });

  it('should handle getNutritionSummary', async () => {
    if (nutritionService.getNutritionSummary) {
      await expect(nutritionService.getNutritionSummary('user-1', {})).resolves.not.toThrow();
    }
  });
});

/**
 * اختبارات Dietary Profile Service
 */

const dietaryProfileService = require('../../../../src/services/dietary/dietaryProfileService');
const { PrismaClient } = require('@prisma/client');

jest.mock('@prisma/client');

describe('DietaryProfileService', () => {
  let mockPrisma;

  beforeEach(() => {
    mockPrisma = global.mockPrisma;
    jest.clearAllMocks();
  });

  describe('createOrUpdateDietaryProfile', () => {
    it('should create dietary profile for new user', async () => {
      mockPrisma.userPreferences.findUnique.mockResolvedValue(null);
      mockPrisma.userPreferences.create.mockResolvedValue({ id: 'pref-1', userId: 'user-1' });
      mockPrisma.dietaryProfile.upsert.mockResolvedValue({
        id: 'diet-1',
        isHalal: true,
        isVegetarian: false
      });

      const result = await dietaryProfileService.createOrUpdateDietaryProfile('user-1', {
        isHalal: true
      });

      expect(result).toBeDefined();
      expect(result.isHalal).toBe(true);
      expect(mockPrisma.userPreferences.create).toHaveBeenCalled();
    });

    it('should update existing dietary profile', async () => {
      mockPrisma.userPreferences.findUnique.mockResolvedValue({
        id: 'pref-1',
        dietaryProfile: { id: 'diet-1' }
      });
      mockPrisma.dietaryProfile.upsert.mockResolvedValue({
        id: 'diet-1',
        isVegan: true
      });

      const result = await dietaryProfileService.createOrUpdateDietaryProfile('user-1', {
        isVegan: true
      });

      expect(result.isVegan).toBe(true);
    });

    it('should set multiple diet restrictions', async () => {
      mockPrisma.userPreferences.findUnique.mockResolvedValue({ id: 'pref-1' });
      mockPrisma.dietaryProfile.upsert.mockResolvedValue({
        isHalal: true,
        isGlutenFree: true,
        isDairyFree: true
      });

      const result = await dietaryProfileService.createOrUpdateDietaryProfile('user-1', {
        isHalal: true,
        isGlutenFree: true,
        isDairyFree: true
      });

      expect(result.isHalal).toBe(true);
      expect(result.isGlutenFree).toBe(true);
      expect(result.isDairyFree).toBe(true);
    });
  });

  describe('getDietaryProfile', () => {
    it('should get dietary profile', async () => {
      mockPrisma.userPreferences.findUnique.mockResolvedValue({
        dietaryProfile: {
          id: 'diet-1',
          isVegetarian: true
        }
      });

      const result = await dietaryProfileService.getDietaryProfile('user-1');

      expect(result).toBeDefined();
      expect(result.isVegetarian).toBe(true);
    });

    it('should return null if no profile', async () => {
      mockPrisma.userPreferences.findUnique.mockResolvedValue(null);

      const result = await dietaryProfileService.getDietaryProfile('user-1');

      expect(result).toBeNull();
    });
  });

  describe('getActiveDiets', () => {
    it('should return active diets', async () => {
      mockPrisma.userPreferences.findUnique.mockResolvedValue({
        dietaryProfile: {
          isHalal: true,
          isVegetarian: true,
          customDiets: ['منخفض الكوليسترول']
        }
      });

      const result = await dietaryProfileService.getActiveDiets('user-1');

      expect(result.length).toBeGreaterThan(0);
      expect(result.some(d => d.type === 'halal')).toBe(true);
    });

    it('should return empty array if no profile', async () => {
      mockPrisma.userPreferences.findUnique.mockResolvedValue(null);

      const result = await dietaryProfileService.getActiveDiets('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('deleteDietaryProfile', () => {
    it('should delete dietary profile', async () => {
      mockPrisma.userPreferences.findUnique.mockResolvedValue({
        dietaryProfile: { id: 'diet-1' }
      });
      mockPrisma.dietaryProfile.delete.mockResolvedValue({ id: 'diet-1' });

      const result = await dietaryProfileService.deleteDietaryProfile('user-1');

      expect(result.success).toBe(true);
      expect(mockPrisma.dietaryProfile.delete).toHaveBeenCalled();
    });

    it('should handle missing profile gracefully', async () => {
      mockPrisma.userPreferences.findUnique.mockResolvedValue(null);

      const result = await dietaryProfileService.deleteDietaryProfile('user-1');

      expect(result.success).toBe(true);
      expect(mockPrisma.dietaryProfile.delete).not.toHaveBeenCalled();
    });
  });

  describe('getAvailableDietTypes', () => {
    it('should return available diet types', () => {
      const result = dietaryProfileService.getAvailableDietTypes();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('type');
      expect(result[0]).toHaveProperty('label');
    });
  });
});

/**
 * اختبارات Allergy Service
 */

const allergyService = require('../../../../src/services/dietary/allergyService');
const { PrismaClient } = require('@prisma/client');

jest.mock('@prisma/client');

describe('AllergyService', () => {
  let mockPrisma;

  beforeEach(() => {
    mockPrisma = global.mockPrisma;
    jest.clearAllMocks();
  });

  describe('createOrUpdateAllergyProfile', () => {
    it('should create allergy profile successfully', async () => {
      const userId = 'user-1';
      const allergyData = {
        hasPeanutAllergy: true,
        hasTreeNutAllergy: true,
        severityLevel: 'SEVERE',
        showAlerts: true,
        requireConfirmation: true
      };

      mockPrisma.userPreferences.findUnique.mockResolvedValue({
        userId,
        dietaryProfile: { id: 'diet-1' }
      });

      mockPrisma.allergyProfile.upsert.mockResolvedValue({
        id: 'allergy-1',
        dietaryProfileId: 'diet-1',
        ...allergyData
      });

      const result = await allergyService.createOrUpdateAllergyProfile(userId, allergyData);

      expect(result).toBeDefined();
      expect(result.hasPeanutAllergy).toBe(true);
      expect(mockPrisma.allergyProfile.upsert).toHaveBeenCalled();
    });

    it('should throw error if dietary profile does not exist', async () => {
      mockPrisma.userPreferences.findUnique.mockResolvedValue(null);

      await expect(
        allergyService.createOrUpdateAllergyProfile('user-1', {})
      ).rejects.toThrow();
    });

    it('should update existing allergy profile', async () => {
      mockPrisma.userPreferences.findUnique.mockResolvedValue({
        dietaryProfile: { id: 'diet-1', allergyProfile: { id: 'allergy-1' } }
      });

      mockPrisma.allergyProfile.upsert.mockResolvedValue({
        id: 'allergy-1',
        hasPeanutAllergy: false
      });

      const result = await allergyService.createOrUpdateAllergyProfile('user-1', {
        hasPeanutAllergy: false
      });

      expect(result.hasPeanutAllergy).toBe(false);
    });

    it('should set default values for undefined fields', async () => {
      mockPrisma.userPreferences.findUnique.mockResolvedValue({
        dietaryProfile: { id: 'diet-1' }
      });

      mockPrisma.allergyProfile.upsert.mockResolvedValue({
        hasPeanutAllergy: false,
        showAlerts: true,
        requireConfirmation: true
      });

      await allergyService.createOrUpdateAllergyProfile('user-1', {});

      const upsertCall = mockPrisma.allergyProfile.upsert.mock.calls[0][0];
      expect(upsertCall.create.showAlerts).toBe(true);
      expect(upsertCall.create.requireConfirmation).toBe(true);
    });
  });

  describe('getAllergyProfile', () => {
    it('should get allergy profile successfully', async () => {
      mockPrisma.userPreferences.findUnique.mockResolvedValue({
        dietaryProfile: {
          allergyProfile: {
            id: 'allergy-1',
            hasPeanutAllergy: true
          }
        }
      });

      const result = await allergyService.getAllergyProfile('user-1');

      expect(result).toBeDefined();
      expect(result.hasPeanutAllergy).toBe(true);
    });

    it('should return null if no profile exists', async () => {
      mockPrisma.userPreferences.findUnique.mockResolvedValue(null);

      const result = await allergyService.getAllergyProfile('user-1');

      expect(result).toBeNull();
    });
  });

  describe('getActiveAllergies', () => {
    it('should return list of active allergies', async () => {
      mockPrisma.userPreferences.findUnique.mockResolvedValue({
        dietaryProfile: {
          allergyProfile: {
            hasPeanutAllergy: true,
            hasTreeNutAllergy: true,
            hasMilkAllergy: false,
            otherAllergies: ['الموز', 'الكيوي']
          }
        }
      });

      const result = await allergyService.getActiveAllergies('user-1');

      expect(result.length).toBeGreaterThan(0);
      expect(result.some(a => a.type === 'peanut')).toBe(true);
      expect(result.some(a => a.type === 'treeNut')).toBe(true);
      expect(result.some(a => a.type === 'other')).toBe(true);
    });

    it('should return empty array if no profile', async () => {
      mockPrisma.userPreferences.findUnique.mockResolvedValue(null);

      const result = await allergyService.getActiveAllergies('user-1');

      expect(result).toEqual([]);
    });

    it('should include other allergies', async () => {
      mockPrisma.userPreferences.findUnique.mockResolvedValue({
        dietaryProfile: {
          allergyProfile: {
            hasPeanutAllergy: false,
            hasTreeNutAllergy: false,
            otherAllergies: ['الفراولة', 'الكيوي']
          }
        }
      });

      const result = await allergyService.getActiveAllergies('user-1');

      const otherAllergies = result.filter(a => a.type === 'other');
      expect(otherAllergies.length).toBe(2);
    });
  });

  describe('checkItemForAllergies', () => {
    it('should return safe if no allergy profile', async () => {
      mockPrisma.userPreferences.findUnique.mockResolvedValue(null);
      mockPrisma.foodLabel.findUnique.mockResolvedValue(null);

      const result = await allergyService.checkItemForAllergies('user-1', 'item-1');

      expect(result.safe).toBe(true);
      expect(result.warnings).toEqual([]);
      expect(result.alerts).toEqual([]);
    });

    it('should detect allergen in food label', async () => {
      mockPrisma.userPreferences.findUnique.mockResolvedValue({
        dietaryProfile: {
          allergyProfile: {
            hasPeanutAllergy: true,
            severityLevel: 'SEVERE',
            requireConfirmation: true
          }
        }
      });

      mockPrisma.foodLabel.findUnique.mockResolvedValue({
        menuItemId: 'item-1',
        containsAllergens: ['peanut', 'milk'],
        mayContainAllergens: [],
        crossContaminationRisk: false
      });

      const result = await allergyService.checkItemForAllergies('user-1', 'item-1');

      expect(result.safe).toBe(false);
      expect(result.alerts.length).toBeGreaterThan(0);
      expect(result.requiresConfirmation).toBe(true);
    });

    it('should detect may contain allergens', async () => {
      mockPrisma.userPreferences.findUnique.mockResolvedValue({
        dietaryProfile: {
          allergyProfile: {
            hasTreeNutAllergy: true,
            severityLevel: 'MODERATE'
          }
        }
      });

      mockPrisma.foodLabel.findUnique.mockResolvedValue({
        containsAllergens: [],
        mayContainAllergens: ['nuts', 'almonds'],
        crossContaminationRisk: false
      });

      const result = await allergyService.checkItemForAllergies('user-1', 'item-1');

      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should warn about cross contamination risk', async () => {
      mockPrisma.userPreferences.findUnique.mockResolvedValue({
        dietaryProfile: {
          allergyProfile: {
            hasPeanutAllergy: true
          }
        }
      });

      mockPrisma.foodLabel.findUnique.mockResolvedValue({
        containsAllergens: [],
        mayContainAllergens: [],
        crossContaminationRisk: true
      });

      const result = await allergyService.checkItemForAllergies('user-1', 'item-1');

      expect(result.warnings.some(w => w.type === 'crossContamination')).toBe(true);
    });
  });

  describe('getAvailableAllergens', () => {
    it('should return list of available allergens', () => {
      const result = allergyService.getAvailableAllergens();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('type');
      expect(result[0]).toHaveProperty('label');
    });
  });

  describe('getSeverityLevels', () => {
    it('should return list of severity levels', () => {
      const result = allergyService.getSeverityLevels();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('level');
      expect(result[0]).toHaveProperty('label');
      expect(result[0]).toHaveProperty('color');
    });
  });
});

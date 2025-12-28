/**
 * Dietary Controller Unit Tests
 * اختبارات وحدة متحكم الحمية الغذائية
 */

const dietaryController = require('../../../src/controllers/dietaryController');
const dietaryService = require('../../../src/services/dietaryService');

jest.mock('../../../src/services/dietaryService');

describe('Dietary Controller', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      user: { id: 'test-user-id' },
      body: {},
      params: {},
      query: {}
    };
    mockRes = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('getDietaryProfile', () => {
    it('should return user dietary profile', async () => {
      const mockProfile = {
        id: 'profile-1',
        userId: 'test-user-id',
        isHalal: true,
        isVegetarian: false,
        isVegan: false,
        isGlutenFree: true
      };

      dietaryService.getDietaryProfile.mockResolvedValue(mockProfile);

      await dietaryController.getDietaryProfile(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockProfile
      });
    });

    it('should create profile if not exists', async () => {
      const mockProfile = {
        id: 'profile-1',
        userId: 'test-user-id',
        isHalal: false
      };

      dietaryService.getDietaryProfile.mockResolvedValue(mockProfile);

      await dietaryController.getDietaryProfile(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('createDietaryProfile', () => {
    it('should create dietary profile successfully', async () => {
      const mockProfile = {
        id: 'profile-1',
        userId: 'test-user-id',
        isHalal: true,
        isVegetarian: false,
        isKeto: true,
        maxCaloriesPerMeal: 600
      };

      mockReq.body = {
        isHalal: true,
        isKeto: true,
        maxCaloriesPerMeal: 600
      };

      dietaryService.createDietaryProfile.mockResolvedValue(mockProfile);

      await dietaryController.createDietaryProfile(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockProfile
      });
    });

    it('should validate dietary constraints', async () => {
      mockReq.body = {
        maxCaloriesPerMeal: -100 // Invalid value
      };

      await dietaryController.createDietaryProfile(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('updateDietaryProfile', () => {
    it('should update dietary profile', async () => {
      const mockProfile = {
        id: 'profile-1',
        userId: 'test-user-id',
        isHalal: true,
        isVegetarian: true
      };

      mockReq.body = {
        isHalal: true,
        isVegetarian: true
      };

      dietaryService.updateDietaryProfile.mockResolvedValue(mockProfile);

      await dietaryController.updateDietaryProfile(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockProfile
      });
    });
  });

  describe('getAllergyProfile', () => {
    it('should return allergy profile', async () => {
      const mockProfile = {
        id: 'allergy-1',
        userId: 'test-user-id',
        hasPeanutAllergy: true,
        severity: 'SEVERE',
        showAlerts: true
      };

      dietaryService.getAllergyProfile.mockResolvedValue(mockProfile);

      await dietaryController.getAllergyProfile(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('createAllergyProfile', () => {
    it('should create allergy profile', async () => {
      const mockProfile = {
        id: 'allergy-1',
        hasPeanutAllergy: true,
        hasMilkAllergy: false,
        severity: 'HIGH',
        showAlerts: true
      };

      mockReq.body = {
        hasPeanutAllergy: true,
        severity: 'HIGH'
      };

      dietaryService.createAllergyProfile.mockResolvedValue(mockProfile);

      await dietaryController.createAllergyProfile(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });

  describe('checkMenuItemSafety', () => {
    it('should check if menu item is safe for user', async () => {
      const mockSafetyCheck = {
        menuItemId: 'menu-1',
        isSafe: false,
        riskLevel: 'HIGH',
        unsafeIngredients: ['peanuts', 'milk'],
        warnings: ['يحتوي على فول السوداني']
      };

      mockReq.params.menuItemId = 'menu-1';

      dietaryService.checkMenuItemSafety.mockResolvedValue(mockSafetyCheck);

      await dietaryController.checkMenuItemSafety(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockSafetyCheck
      });
    });

    it('should return safe result for allergen-free items', async () => {
      const mockSafetyCheck = {
        menuItemId: 'menu-1',
        isSafe: true,
        riskLevel: 'LOW',
        unsafeIngredients: []
      };

      mockReq.params.menuItemId = 'menu-1';

      dietaryService.checkMenuItemSafety.mockResolvedValue(mockSafetyCheck);

      await dietaryController.checkMenuItemSafety(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockSafetyCheck
      });
    });
  });

  describe('getSafeMenuItems', () => {
    it('should return safe menu items for user', async () => {
      const mockItems = [
        {
          id: 'menu-1',
          name: 'آمن للحساسية',
          isSafe: true
        },
        {
          id: 'menu-2',
          name: 'خالي من الغلوتين',
          isSafe: true
        }
      ];

      mockReq.params.restaurantId = 'restaurant-1';

      dietaryService.getSafeMenuItems.mockResolvedValue(mockItems);

      await dietaryController.getSafeMenuItems(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('addCustomDiet', () => {
    it('should add custom diet', async () => {
      const mockProfile = {
        id: 'profile-1',
        customDiets: ['low-fodmap']
      };

      mockReq.body = {
        dietName: 'low-fodmap',
        description: 'حمية قليلة الفودماب'
      };

      dietaryService.addCustomDiet.mockResolvedValue(mockProfile);

      await dietaryController.addCustomDiet(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('removeCustomDiet', () => {
    it('should remove custom diet', async () => {
      const mockProfile = {
        id: 'profile-1',
        customDiets: []
      };

      mockReq.body = {
        dietName: 'low-fodmap'
      };

      dietaryService.removeCustomDiet.mockResolvedValue(mockProfile);

      await dietaryController.removeCustomDiet(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('addAvoidedIngredient', () => {
    it('should add ingredient to avoid list', async () => {
      const mockProfile = {
        id: 'profile-1',
        avoidIngredients: ['garlic', 'onion']
      };

      mockReq.body = {
        ingredient: 'garlic',
        reason: 'يسبب عسر هضم'
      };

      dietaryService.addAvoidedIngredient.mockResolvedValue(mockProfile);

      await dietaryController.addAvoidedIngredient(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getDietaryRecommendations', () => {
    it('should get dietary recommendations', async () => {
      const mockRecommendations = [
        {
          menuItemId: 'menu-1',
          reason: 'يناسب حميتك الغذائية',
          matchPercentage: 95
        }
      ];

      mockReq.params.restaurantId = 'restaurant-1';

      dietaryService.getDietaryRecommendations.mockResolvedValue(mockRecommendations);

      await dietaryController.getDietaryRecommendations(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });
});

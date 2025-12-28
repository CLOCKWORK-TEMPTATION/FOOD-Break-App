/**
 * اختبارات شاملة لخدمة الحمية الغذائية
 * Comprehensive tests for Dietary Service
 */

import dietaryService, {
  DietaryProfile,
  AllergyProfile,
  MenuItemAnalysis,
  FoodLabel,
  AllergenInfo,
} from '../dietaryService';

// Mock apiClient
jest.mock('../apiClient', () => ({
  get: jest.fn(),
  post: jest.fn(),
  delete: jest.fn(),
}));

import apiClient from '../apiClient';

describe('DietaryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // Dietary Profile Tests
  // ==========================================
  describe('Dietary Profile Management', () => {
    describe('getDietaryProfile', () => {
      it('should return dietary profile when it exists', async () => {
        const mockProfile: DietaryProfile = {
          id: 'profile-1',
          isHalal: true,
          isVegetarian: false,
          isVegan: false,
          isGlutenFree: true,
          isKeto: false,
          isLowSodium: false,
          isLowCarb: false,
          isDairyFree: false,
          isNutFree: true,
          isPescatarian: false,
          maxCaloriesPerMeal: 800,
          customDiets: [],
          avoidIngredients: ['peanuts', 'gluten'],
          preferredIngredients: ['chicken', 'vegetables'],
          strictMode: true,
          showWarnings: true,
        };

        (apiClient.get as jest.Mock).mockResolvedValueOnce({
          data: { success: true, data: mockProfile },
        });

        const result = await dietaryService.getDietaryProfile();

        expect(apiClient.get).toHaveBeenCalledWith('/dietary/profile');
        expect(result).toEqual(mockProfile);
      });

      it('should return null when profile does not exist (404)', async () => {
        const error = { response: { status: 404 } };
        (apiClient.get as jest.Mock).mockRejectedValueOnce(error);

        const result = await dietaryService.getDietaryProfile();

        expect(result).toBeNull();
      });

      it('should throw error for non-404 errors', async () => {
        const error = { response: { status: 500 }, message: 'Server error' };
        (apiClient.get as jest.Mock).mockRejectedValueOnce(error);

        await expect(dietaryService.getDietaryProfile()).rejects.toEqual(error);
      });
    });

    describe('updateDietaryProfile', () => {
      it('should update dietary profile successfully', async () => {
        const updateData: Partial<DietaryProfile> = {
          isHalal: true,
          isVegetarian: true,
          maxCaloriesPerMeal: 700,
        };

        const mockResponse: DietaryProfile = {
          id: 'profile-1',
          ...updateData,
          isVegan: false,
          isGlutenFree: false,
          isKeto: false,
          isLowSodium: false,
          isLowCarb: false,
          isDairyFree: false,
          isNutFree: false,
          isPescatarian: false,
          customDiets: [],
          avoidIngredients: [],
          preferredIngredients: [],
          strictMode: false,
          showWarnings: true,
        } as DietaryProfile;

        (apiClient.post as jest.Mock).mockResolvedValueOnce({
          data: { success: true, data: mockResponse },
        });

        const result = await dietaryService.updateDietaryProfile(updateData);

        expect(apiClient.post).toHaveBeenCalledWith('/dietary/profile', updateData);
        expect(result).toEqual(mockResponse);
      });

      it('should throw error when update fails', async () => {
        (apiClient.post as jest.Mock).mockResolvedValueOnce({
          data: { success: false, error: { message: 'Update failed' } },
        });

        await expect(
          dietaryService.updateDietaryProfile({ isHalal: true })
        ).rejects.toThrow('Update failed');
      });

      it('should throw error when response has no data', async () => {
        (apiClient.post as jest.Mock).mockResolvedValueOnce({
          data: { success: true, data: null },
        });

        await expect(
          dietaryService.updateDietaryProfile({ isHalal: true })
        ).rejects.toThrow('فشل تحديث الملف الشخصي');
      });
    });

    describe('deleteDietaryProfile', () => {
      it('should delete dietary profile successfully', async () => {
        (apiClient.delete as jest.Mock).mockResolvedValueOnce({});

        await dietaryService.deleteDietaryProfile();

        expect(apiClient.delete).toHaveBeenCalledWith('/dietary/profile');
      });

      it('should handle delete errors', async () => {
        const error = new Error('Delete failed');
        (apiClient.delete as jest.Mock).mockRejectedValueOnce(error);

        await expect(dietaryService.deleteDietaryProfile()).rejects.toThrow('Delete failed');
      });
    });

    describe('getActiveDiets', () => {
      it('should return active diets', async () => {
        const mockDiets = [
          { type: 'halal', label: 'حلال', labelEn: 'Halal' },
          { type: 'vegetarian', label: 'نباتي', labelEn: 'Vegetarian' },
        ];

        (apiClient.get as jest.Mock).mockResolvedValueOnce({
          data: { success: true, data: mockDiets },
        });

        const result = await dietaryService.getActiveDiets();

        expect(apiClient.get).toHaveBeenCalledWith('/dietary/active-diets');
        expect(result).toEqual(mockDiets);
      });

      it('should return empty array when no active diets', async () => {
        (apiClient.get as jest.Mock).mockResolvedValueOnce({
          data: { success: true, data: null },
        });

        const result = await dietaryService.getActiveDiets();

        expect(result).toEqual([]);
      });
    });

    describe('getAvailableDietTypes', () => {
      it('should return available diet types', async () => {
        const mockTypes = [
          { type: 'halal', label: 'حلال', labelEn: 'Halal' },
          { type: 'vegan', label: 'نباتي صرف', labelEn: 'Vegan' },
          { type: 'keto', label: 'كيتو', labelEn: 'Keto' },
        ];

        (apiClient.get as jest.Mock).mockResolvedValueOnce({
          data: { success: true, data: mockTypes },
        });

        const result = await dietaryService.getAvailableDietTypes();

        expect(result).toEqual(mockTypes);
      });
    });
  });

  // ==========================================
  // Allergy Profile Tests
  // ==========================================
  describe('Allergy Profile Management', () => {
    describe('getAllergyProfile', () => {
      it('should return allergy profile when it exists', async () => {
        const mockProfile: AllergyProfile = {
          id: 'allergy-1',
          hasPeanutAllergy: true,
          hasTreeNutAllergy: false,
          hasMilkAllergy: false,
          hasEggAllergy: false,
          hasWheatAllergy: true,
          hasSoyAllergy: false,
          hasFishAllergy: false,
          hasShellfishAllergy: false,
          hasSesameAllergy: false,
          severityLevel: 'SEVERE',
          otherAllergies: ['shellfish'],
          intolerances: ['lactose'],
          emergencyContact: 'Dr. Smith',
          emergencyPhone: '01234567890',
          requireConfirmation: true,
          notifyRestaurant: true,
        };

        (apiClient.get as jest.Mock).mockResolvedValueOnce({
          data: { success: true, data: mockProfile },
        });

        const result = await dietaryService.getAllergyProfile();

        expect(apiClient.get).toHaveBeenCalledWith('/dietary/allergies');
        expect(result).toEqual(mockProfile);
      });

      it('should return null when profile does not exist (404)', async () => {
        const error = { response: { status: 404 } };
        (apiClient.get as jest.Mock).mockRejectedValueOnce(error);

        const result = await dietaryService.getAllergyProfile();

        expect(result).toBeNull();
      });

      it('should throw error for non-404 errors', async () => {
        const error = { response: { status: 500 } };
        (apiClient.get as jest.Mock).mockRejectedValueOnce(error);

        await expect(dietaryService.getAllergyProfile()).rejects.toEqual(error);
      });
    });

    describe('updateAllergyProfile', () => {
      it('should update allergy profile successfully', async () => {
        const updateData: Partial<AllergyProfile> = {
          hasPeanutAllergy: true,
          severityLevel: 'CRITICAL',
          emergencyPhone: '01234567890',
        };

        const mockResponse: AllergyProfile = {
          ...updateData,
          hasTreeNutAllergy: false,
          hasMilkAllergy: false,
          hasEggAllergy: false,
          hasWheatAllergy: false,
          hasSoyAllergy: false,
          hasFishAllergy: false,
          hasShellfishAllergy: false,
          hasSesameAllergy: false,
          otherAllergies: [],
          intolerances: [],
          requireConfirmation: true,
          notifyRestaurant: true,
        } as AllergyProfile;

        (apiClient.post as jest.Mock).mockResolvedValueOnce({
          data: { success: true, data: mockResponse },
        });

        const result = await dietaryService.updateAllergyProfile(updateData);

        expect(apiClient.post).toHaveBeenCalledWith('/dietary/allergies', updateData);
        expect(result).toEqual(mockResponse);
      });

      it('should throw error when update fails', async () => {
        (apiClient.post as jest.Mock).mockResolvedValueOnce({
          data: { success: false, error: { message: 'Update failed' } },
        });

        await expect(
          dietaryService.updateAllergyProfile({ hasPeanutAllergy: true })
        ).rejects.toThrow('Update failed');
      });
    });

    describe('getActiveAllergies', () => {
      it('should return active allergies', async () => {
        const mockAllergies = [
          { type: 'peanut', label: 'فول سوداني', labelEn: 'Peanut' },
          { type: 'wheat', label: 'قمح', labelEn: 'Wheat' },
        ];

        (apiClient.get as jest.Mock).mockResolvedValueOnce({
          data: { success: true, data: mockAllergies },
        });

        const result = await dietaryService.getActiveAllergies();

        expect(result).toEqual(mockAllergies);
      });
    });

    describe('getAvailableAllergens', () => {
      it('should return all available allergens', async () => {
        const mockAllergens = [
          { type: 'peanut', label: 'فول سوداني', labelEn: 'Peanut' },
          { type: 'treenut', label: 'مكسرات', labelEn: 'Tree Nuts' },
          { type: 'milk', label: 'حليب', labelEn: 'Milk' },
        ];

        (apiClient.get as jest.Mock).mockResolvedValueOnce({
          data: { success: true, data: mockAllergens },
        });

        const result = await dietaryService.getAvailableAllergens();

        expect(result).toEqual(mockAllergens);
      });
    });

    describe('checkItemForAllergies', () => {
      it('should return safe status for compatible item', async () => {
        const mockResult = {
          safe: true,
          matchedAllergies: [],
          warnings: [],
        };

        (apiClient.get as jest.Mock).mockResolvedValueOnce({
          data: { success: true, data: mockResult },
        });

        const result = await dietaryService.checkItemForAllergies('item-123');

        expect(apiClient.get).toHaveBeenCalledWith('/dietary/check-item/item-123');
        expect(result).toEqual(mockResult);
      });

      it('should return unsafe status for incompatible item', async () => {
        const mockResult = {
          safe: false,
          matchedAllergies: ['peanut', 'wheat'],
          warnings: ['Contains peanuts', 'Contains wheat'],
        };

        (apiClient.get as jest.Mock).mockResolvedValueOnce({
          data: { success: true, data: mockResult },
        });

        const result = await dietaryService.checkItemForAllergies('item-456');

        expect(result.safe).toBe(false);
        expect(result.matchedAllergies).toHaveLength(2);
      });

      it('should return default safe object on error', async () => {
        (apiClient.get as jest.Mock).mockResolvedValueOnce({
          data: { success: true, data: null },
        });

        const result = await dietaryService.checkItemForAllergies('item-789');

        expect(result).toEqual({ safe: true, matchedAllergies: [], warnings: [] });
      });
    });
  });

  // ==========================================
  // Menu Filtering Tests
  // ==========================================
  describe('Menu Filtering', () => {
    describe('filterMenuItems', () => {
      it('should filter menu items and return analysis', async () => {
        const menuItems = [
          { id: 'item-1', name: 'Chicken Salad' },
          { id: 'item-2', name: 'Beef Burger' },
        ];

        const mockAnalysis: MenuItemAnalysis[] = [
          {
            menuItemId: 'item-1',
            isCompatible: true,
            compatibilityScore: 95,
            dietWarnings: [],
            allergyWarnings: [],
            labels: [],
          },
          {
            menuItemId: 'item-2',
            isCompatible: false,
            compatibilityScore: 40,
            dietWarnings: ['Not halal'],
            allergyWarnings: ['Contains wheat'],
            labels: [],
          },
        ];

        (apiClient.post as jest.Mock).mockResolvedValueOnce({
          data: { success: true, data: mockAnalysis },
        });

        const result = await dietaryService.filterMenuItems(menuItems);

        expect(apiClient.post).toHaveBeenCalledWith('/dietary/filter-menu', { menuItems });
        expect(result).toEqual(mockAnalysis);
      });

      it('should return empty array when no items provided', async () => {
        (apiClient.post as jest.Mock).mockResolvedValueOnce({
          data: { success: true, data: [] },
        });

        const result = await dietaryService.filterMenuItems([]);

        expect(result).toEqual([]);
      });
    });

    describe('findCompatibleItems', () => {
      it('should find compatible items with diet filters', async () => {
        const mockItemIds = ['item-1', 'item-2', 'item-3'];

        (apiClient.get as jest.Mock).mockResolvedValueOnce({
          data: { success: true, data: mockItemIds },
        });

        const result = await dietaryService.findCompatibleItems(
          'restaurant-1',
          ['halal', 'vegetarian']
        );

        expect(apiClient.get).toHaveBeenCalledWith(
          expect.stringContaining('diets=halal,vegetarian')
        );
        expect(result).toEqual(mockItemIds);
      });

      it('should find compatible items with allergen filters', async () => {
        const mockItemIds = ['item-1'];

        (apiClient.get as jest.Mock).mockResolvedValueOnce({
          data: { success: true, data: mockItemIds },
        });

        const result = await dietaryService.findCompatibleItems(
          'restaurant-1',
          undefined,
          ['peanut', 'wheat']
        );

        expect(apiClient.get).toHaveBeenCalledWith(
          expect.stringContaining('allergens=peanut,wheat')
        );
        expect(result).toEqual(mockItemIds);
      });

      it('should find compatible items with both filters', async () => {
        (apiClient.get as jest.Mock).mockResolvedValueOnce({
          data: { success: true, data: [] },
        });

        await dietaryService.findCompatibleItems(
          'restaurant-1',
          ['halal'],
          ['peanut']
        );

        expect(apiClient.get).toHaveBeenCalledWith(
          expect.stringMatching(/diets=halal.*allergens=peanut/)
        );
      });

      it('should find compatible items without filters', async () => {
        (apiClient.get as jest.Mock).mockResolvedValueOnce({
          data: { success: true, data: ['item-1', 'item-2'] },
        });

        const result = await dietaryService.findCompatibleItems('restaurant-1');

        expect(result).toHaveLength(2);
      });
    });
  });

  // ==========================================
  // Food Labels Tests
  // ==========================================
  describe('Food Labels', () => {
    describe('getFoodLabels', () => {
      it('should return food labels for menu item', async () => {
        const mockLabels: FoodLabel[] = [
          {
            type: 'halal',
            text: 'حلال',
            textEn: 'Halal',
            icon: '🥩',
            color: '#28a745',
          },
          {
            type: 'spicy',
            text: 'حار',
            textEn: 'Spicy',
            icon: '🌶️',
            color: '#dc3545',
            spicyLevel: 3,
          },
        ];

        (apiClient.get as jest.Mock).mockResolvedValueOnce({
          data: { success: true, data: mockLabels },
        });

        const result = await dietaryService.getFoodLabels('item-123');

        expect(apiClient.get).toHaveBeenCalledWith('/dietary/labels/item-123/active');
        expect(result).toEqual(mockLabels);
      });

      it('should return empty array when no labels exist', async () => {
        (apiClient.get as jest.Mock).mockResolvedValueOnce({
          data: { success: true, data: null },
        });

        const result = await dietaryService.getFoodLabels('item-456');

        expect(result).toEqual([]);
      });
    });

    describe('getAllergenInfo', () => {
      it('should return allergen info for menu item', async () => {
        const mockInfo: AllergenInfo = {
          contains: ['wheat', 'milk'],
          mayContain: ['soy'],
          crossContaminationRisk: true,
          warnings: ['Processed in facility with nuts'],
        };

        (apiClient.get as jest.Mock).mockResolvedValueOnce({
          data: { success: true, data: mockInfo },
        });

        const result = await dietaryService.getAllergenInfo('item-123');

        expect(result).toEqual(mockInfo);
      });

      it('should return null when info not found (404)', async () => {
        const error = { response: { status: 404 } };
        (apiClient.get as jest.Mock).mockRejectedValueOnce(error);

        const result = await dietaryService.getAllergenInfo('item-456');

        expect(result).toBeNull();
      });

      it('should throw error for non-404 errors', async () => {
        const error = { response: { status: 500 } };
        (apiClient.get as jest.Mock).mockRejectedValueOnce(error);

        await expect(dietaryService.getAllergenInfo('item-789')).rejects.toEqual(error);
      });
    });

    describe('getAvailableLabelTypes', () => {
      it('should return available label types', async () => {
        const mockTypes = [
          { type: 'halal', icon: '🥩', color: '#28a745' },
          { type: 'vegetarian', icon: '🥗', color: '#20c997' },
          { type: 'spicy', icon: '🌶️', color: '#dc3545' },
        ];

        (apiClient.get as jest.Mock).mockResolvedValueOnce({
          data: { success: true, data: mockTypes },
        });

        const result = await dietaryService.getAvailableLabelTypes();

        expect(result).toEqual(mockTypes);
      });
    });
  });

  // ==========================================
  // Custom Order Messages Tests
  // ==========================================
  describe('Custom Order Messages', () => {
    describe('createAutoMessages', () => {
      it('should create automatic messages for order', async () => {
        const mockMessages = [
          { message: 'No peanuts please', language: 'en' },
          { message: 'بدون فول سوداني من فضلك', language: 'ar' },
        ];

        (apiClient.post as jest.Mock).mockResolvedValueOnce({
          data: { success: true, data: mockMessages },
        });

        const result = await dietaryService.createAutoMessages('order-1', 'rest-1');

        expect(apiClient.post).toHaveBeenCalledWith(
          '/dietary/messages/auto/order-1',
          { restaurantId: 'rest-1' }
        );
        expect(result).toEqual(mockMessages);
      });

      it('should return empty array when no messages created', async () => {
        (apiClient.post as jest.Mock).mockResolvedValueOnce({
          data: { success: true, data: null },
        });

        const result = await dietaryService.createAutoMessages('order-2', 'rest-2');

        expect(result).toEqual([]);
      });
    });

    describe('getOrderMessages', () => {
      it('should get messages for order', async () => {
        const mockMessages = [
          { id: 'msg-1', text: 'Special dietary requirements' },
        ];

        (apiClient.get as jest.Mock).mockResolvedValueOnce({
          data: { success: true, data: mockMessages },
        });

        const result = await dietaryService.getOrderMessages('order-1');

        expect(apiClient.get).toHaveBeenCalledWith('/dietary/messages/order/order-1');
        expect(result).toEqual(mockMessages);
      });
    });
  });

  // ==========================================
  // Helper Methods Tests
  // ==========================================
  describe('Helper Methods', () => {
    describe('analyzeCartItems', () => {
      it('should analyze cart items and return compatibility status', async () => {
        const cartItems = [
          { menuItemId: 'item-1', quantity: 2 },
          { menuItemId: 'item-2', quantity: 1 },
        ];

        const mockAnalyses: MenuItemAnalysis[] = [
          {
            menuItemId: 'item-1',
            isCompatible: true,
            compatibilityScore: 100,
            dietWarnings: [],
            allergyWarnings: [],
            labels: [],
          },
          {
            menuItemId: 'item-2',
            isCompatible: false,
            compatibilityScore: 50,
            dietWarnings: ['Not vegetarian'],
            allergyWarnings: ['Contains nuts'],
            labels: [],
          },
        ];

        (apiClient.post as jest.Mock).mockResolvedValueOnce({
          data: { success: true, data: mockAnalyses },
        });

        const result = await dietaryService.analyzeCartItems(cartItems);

        expect(result.allCompatible).toBe(false);
        expect(result.warnings).toContain('Not vegetarian');
        expect(result.warnings).toContain('Contains nuts');
        expect(result.analyses).toEqual(mockAnalyses);
      });

      it('should return all compatible when all items are safe', async () => {
        const cartItems = [{ menuItemId: 'item-1', quantity: 1 }];

        const mockAnalyses: MenuItemAnalysis[] = [
          {
            menuItemId: 'item-1',
            isCompatible: true,
            compatibilityScore: 100,
            dietWarnings: [],
            allergyWarnings: [],
            labels: [],
          },
        ];

        (apiClient.post as jest.Mock).mockResolvedValueOnce({
          data: { success: true, data: mockAnalyses },
        });

        const result = await dietaryService.analyzeCartItems(cartItems);

        expect(result.allCompatible).toBe(true);
        expect(result.warnings).toHaveLength(0);
      });

      it('should deduplicate warnings', async () => {
        const cartItems = [
          { menuItemId: 'item-1', quantity: 1 },
          { menuItemId: 'item-2', quantity: 1 },
        ];

        const mockAnalyses: MenuItemAnalysis[] = [
          {
            menuItemId: 'item-1',
            isCompatible: false,
            compatibilityScore: 50,
            dietWarnings: ['Contains meat'],
            allergyWarnings: [],
            labels: [],
          },
          {
            menuItemId: 'item-2',
            isCompatible: false,
            compatibilityScore: 50,
            dietWarnings: ['Contains meat'],
            allergyWarnings: [],
            labels: [],
          },
        ];

        (apiClient.post as jest.Mock).mockResolvedValueOnce({
          data: { success: true, data: mockAnalyses },
        });

        const result = await dietaryService.analyzeCartItems(cartItems);

        expect(result.warnings).toEqual(['Contains meat']);
      });
    });

    describe('validateOrderForDiet', () => {
      it('should validate order with strict mode enabled', async () => {
        const mockProfile: DietaryProfile = {
          isHalal: true,
          isVegetarian: true,
          isVegan: false,
          isGlutenFree: false,
          isKeto: false,
          isLowSodium: false,
          isLowCarb: false,
          isDairyFree: false,
          isNutFree: false,
          isPescatarian: false,
          customDiets: [],
          avoidIngredients: [],
          preferredIngredients: [],
          strictMode: true,
          showWarnings: true,
        };

        const mockAnalyses: MenuItemAnalysis[] = [
          {
            menuItemId: 'item-1',
            isCompatible: false,
            compatibilityScore: 30,
            dietWarnings: ['Contains meat'],
            allergyWarnings: [],
            labels: [],
          },
        ];

        (apiClient.get as jest.Mock)
          .mockResolvedValueOnce({ data: { success: true, data: mockProfile } })
          .mockResolvedValueOnce({ data: { success: true, data: null } });

        (apiClient.post as jest.Mock).mockResolvedValueOnce({
          data: { success: true, data: mockAnalyses },
        });

        const result = await dietaryService.validateOrderForDiet([{ id: 'item-1' }]);

        expect(result.valid).toBe(false);
        expect(result.blockers).toContain('Contains meat');
        expect(result.warnings).toHaveLength(0);
      });

      it('should validate order with strict mode disabled', async () => {
        const mockProfile: DietaryProfile = {
          isHalal: true,
          isVegetarian: true,
          isVegan: false,
          isGlutenFree: false,
          isKeto: false,
          isLowSodium: false,
          isLowCarb: false,
          isDairyFree: false,
          isNutFree: false,
          isPescatarian: false,
          customDiets: [],
          avoidIngredients: [],
          preferredIngredients: [],
          strictMode: false,
          showWarnings: true,
        };

        const mockAnalyses: MenuItemAnalysis[] = [
          {
            menuItemId: 'item-1',
            isCompatible: false,
            compatibilityScore: 60,
            dietWarnings: ['Contains meat'],
            allergyWarnings: [],
            labels: [],
          },
        ];

        (apiClient.get as jest.Mock)
          .mockResolvedValueOnce({ data: { success: true, data: mockProfile } })
          .mockResolvedValueOnce({ data: { success: true, data: null } });

        (apiClient.post as jest.Mock).mockResolvedValueOnce({
          data: { success: true, data: mockAnalyses },
        });

        const result = await dietaryService.validateOrderForDiet([{ id: 'item-1' }]);

        expect(result.valid).toBe(true);
        expect(result.blockers).toHaveLength(0);
        expect(result.warnings).toContain('Contains meat');
      });

      it('should return valid when no dietary profile exists', async () => {
        (apiClient.get as jest.Mock)
          .mockResolvedValueOnce({ data: { success: true, data: null } })
          .mockResolvedValueOnce({ data: { success: true, data: null } });

        const result = await dietaryService.validateOrderForDiet([]);

        expect(result.valid).toBe(true);
        expect(result.blockers).toHaveLength(0);
        expect(result.warnings).toHaveLength(0);
      });

      it('should combine diet and allergy warnings', async () => {
        const mockProfile: DietaryProfile = {
          isHalal: true,
          isVegetarian: false,
          isVegan: false,
          isGlutenFree: false,
          isKeto: false,
          isLowSodium: false,
          isLowCarb: false,
          isDairyFree: false,
          isNutFree: false,
          isPescatarian: false,
          customDiets: [],
          avoidIngredients: [],
          preferredIngredients: [],
          strictMode: true,
          showWarnings: true,
        };

        const mockAnalyses: MenuItemAnalysis[] = [
          {
            menuItemId: 'item-1',
            isCompatible: false,
            compatibilityScore: 20,
            dietWarnings: ['Not halal'],
            allergyWarnings: ['Contains peanuts'],
            labels: [],
          },
        ];

        (apiClient.get as jest.Mock)
          .mockResolvedValueOnce({ data: { success: true, data: mockProfile } })
          .mockResolvedValueOnce({ data: { success: true, data: null } });

        (apiClient.post as jest.Mock).mockResolvedValueOnce({
          data: { success: true, data: mockAnalyses },
        });

        const result = await dietaryService.validateOrderForDiet([{ id: 'item-1' }]);

        expect(result.blockers).toContain('Not halal');
        expect(result.blockers).toContain('Contains peanuts');
      });
    });
  });

  // ==========================================
  // Edge Cases Tests
  // ==========================================
  describe('Edge Cases', () => {
    it('should handle empty menu items array', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        data: { success: true, data: [] },
      });

      const result = await dietaryService.filterMenuItems([]);

      expect(result).toEqual([]);
    });

    it('should handle null allergen info gracefully', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: { success: true, data: null },
      });

      const result = await dietaryService.getAllergenInfo('item-999');

      expect(result).toBeNull();
    });

    it('should handle network errors in profile operations', async () => {
      const networkError = new Error('Network request failed');
      (apiClient.get as jest.Mock).mockRejectedValueOnce(networkError);

      await expect(dietaryService.getActiveDiets()).rejects.toThrow('Network request failed');
    });

    it('should handle very large cart analysis', async () => {
      const largeCart = Array(100).fill(null).map((_, i) => ({
        menuItemId: `item-${i}`,
        quantity: 1,
      }));

      const mockAnalyses = largeCart.map(item => ({
        menuItemId: item.menuItemId,
        isCompatible: true,
        compatibilityScore: 100,
        dietWarnings: [],
        allergyWarnings: [],
        labels: [],
      }));

      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        data: { success: true, data: mockAnalyses },
      });

      const result = await dietaryService.analyzeCartItems(largeCart);

      expect(result.analyses).toHaveLength(100);
      expect(result.allCompatible).toBe(true);
    });
  });
});

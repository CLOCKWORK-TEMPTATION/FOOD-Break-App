/**
 * Dietary Controller Tests
 * اختبارات وحدة التحكم بالنظام الغذائي
 */

const dietaryController = require('../../../src/controllers/dietaryController');

// Mock dependencies
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => global.mockPrisma)
}));

describe('Dietary Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      user: { id: 'user-123' },
      t: jest.fn((key) => key)
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('getDietaryProfile', () => {
    it('should return dietary profile for user', async () => {
      const mockProfile = {
        id: '1',
        userId: 'user-123',
        dietaryRestrictions: ['VEGETARIAN'],
        allergies: ['NUTS']
      };
      global.mockPrisma.dietaryProfile.findUnique.mockResolvedValue(mockProfile);

      await dietaryController.getDietaryProfile(req, res, next);

      expect(global.mockPrisma.dietaryProfile.findUnique).toHaveBeenCalledWith({
        where: { userId: req.user.id }
      });
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockProfile
        })
      );
    });

    it('should handle profile not found', async () => {
      global.mockPrisma.dietaryProfile.findUnique.mockResolvedValue(null);

      await dietaryController.getDietaryProfile(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('createDietaryProfile', () => {
    it('should create dietary profile successfully', async () => {
      const profileData = {
        dietaryRestrictions: ['VEGAN'],
        allergies: ['DAIRY'],
        preferences: ['ORGANIC']
      };
      const mockProfile = { id: '1', userId: 'user-123', ...profileData };
      global.mockPrisma.dietaryProfile.create.mockResolvedValue(mockProfile);

      req.body = profileData;

      await dietaryController.createDietaryProfile(req, res, next);

      expect(global.mockPrisma.dietaryProfile.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: req.user.id,
          ...profileData
        })
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockProfile
        })
      );
    });
  });

  describe('updateDietaryProfile', () => {
    it('should update dietary profile successfully', async () => {
      const updateData = { allergies: ['GLUTEN'] };
      const mockProfile = { id: '1', userId: 'user-123', ...updateData };
      global.mockPrisma.dietaryProfile.update.mockResolvedValue(mockProfile);

      req.body = updateData;

      await dietaryController.updateDietaryProfile(req, res, next);

      expect(global.mockPrisma.dietaryProfile.update).toHaveBeenCalledWith({
        where: { userId: req.user.id },
        data: updateData
      });
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockProfile
        })
      );
    });
  });

  describe('getRecommendedMenuItems', () => {
    it('should return recommended menu items based on dietary profile', async () => {
      const mockProfile = {
        userId: 'user-123',
        dietaryRestrictions: ['VEGETARIAN']
      };
      const mockItems = [
        { id: '1', name: 'Salad', isVegetarian: true },
        { id: '2', name: 'Pasta', isVegetarian: true }
      ];
      global.mockPrisma.dietaryProfile.findUnique.mockResolvedValue(mockProfile);
      global.mockPrisma.menuItem.findMany.mockResolvedValue(mockItems);

      await dietaryController.getRecommendedMenuItems(req, res, next);

      expect(global.mockPrisma.menuItem.findMany).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockItems
        })
      );
    });
  });

  describe('checkMenuItemCompatibility', () => {
    it('should check if menu item is compatible with dietary profile', async () => {
      const mockProfile = {
        allergies: ['NUTS'],
        dietaryRestrictions: ['VEGAN']
      };
      const mockItem = {
        id: '1',
        name: 'Salad',
        allergens: [],
        isVegan: true
      };
      global.mockPrisma.dietaryProfile.findUnique.mockResolvedValue(mockProfile);
      global.mockPrisma.menuItem.findUnique.mockResolvedValue(mockItem);

      req.params.menuItemId = '1';

      await dietaryController.checkMenuItemCompatibility(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            compatible: expect.any(Boolean)
          })
        })
      );
    });
  });

  describe('deleteDietaryProfile', () => {
    it('should delete dietary profile successfully', async () => {
      global.mockPrisma.dietaryProfile.delete.mockResolvedValue({ id: '1' });

      await dietaryController.deleteDietaryProfile(req, res, next);

      expect(global.mockPrisma.dietaryProfile.delete).toHaveBeenCalledWith({
        where: { userId: req.user.id }
      });
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );
    });
  });
});

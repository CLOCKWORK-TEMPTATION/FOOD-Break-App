/**
 * Unit Tests - Menu Service
 * Why: اختبار منطق خدمة القوائم بشكل منفصل
 */

const menuService = require('../../../src/services/menuService');
const { PrismaClient } = require('@prisma/client');

// Mock Prisma Client
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    menuItem: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    restaurant: {
      findMany: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

describe('Menu Service - Unit Tests', () => {
  let mockPrisma;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma = new PrismaClient();
  });

  describe('getAllMenuItems', () => {
    test('should return paginated menu items', async () => {
      const mockMenuItems = [
        { id: '1', name: 'Item 1', price: 50 },
        { id: '2', name: 'Item 2', price: 75 },
      ];

      mockPrisma.menuItem.findMany.mockResolvedValue(mockMenuItems);
      mockPrisma.menuItem.count.mockResolvedValue(2);

      const result = await menuService.getAllMenuItems({ page: 1, limit: 20 });

      expect(result.menuItems).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
    });

    test('should filter by restaurantId', async () => {
      const restaurantId = 'restaurant-1';
      mockPrisma.menuItem.findMany.mockResolvedValue([]);
      mockPrisma.menuItem.count.mockResolvedValue(0);

      await menuService.getAllMenuItems({ restaurantId });

      expect(mockPrisma.menuItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ restaurantId }),
        })
      );
    });
  });

  describe('getMenuItemById', () => {
    test('should return menu item by id', async () => {
      const mockItem = {
        id: 'item-1',
        name: 'Test Item',
        price: 50,
        restaurant: { id: 'rest-1', name: 'Test Restaurant' }
      };

      mockPrisma.menuItem.findUnique.mockResolvedValue(mockItem);

      const result = await menuService.getMenuItemById('item-1');

      expect(result).toEqual(mockItem);
      expect(mockPrisma.menuItem.findUnique).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        include: { restaurant: true }
      });
    });

    test('should throw error if item not found', async () => {
      mockPrisma.menuItem.findUnique.mockResolvedValue(null);

      await expect(menuService.getMenuItemById('non-existent')).rejects.toThrow('عنصر القائمة غير موجود');
    });
  });

  describe('getCoreMenu', () => {
    test('should return core menu items from partner restaurants', async () => {
      const mockRestaurants = [
        { id: 'rest-1' },
        { id: 'rest-2' }
      ];

      const mockMenuItems = [
        { id: 'item-1', name: 'Item 1', category: 'Main', restaurant: { id: 'rest-1', name: 'Rest 1' } },
        { id: 'item-2', name: 'Item 2', category: 'Dessert', restaurant: { id: 'rest-2', name: 'Rest 2' } }
      ];

      mockPrisma.restaurant.findMany.mockResolvedValue(mockRestaurants);
      mockPrisma.menuItem.findMany.mockResolvedValue(mockMenuItems);

      const result = await menuService.getCoreMenu();

      expect(result.totalItems).toBe(2);
      expect(result.categories).toBeGreaterThan(0);
      expect(mockPrisma.restaurant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            isPartner: true,
            isActive: true
          }
        })
      );
    });

    test('should return empty result if no partner restaurants', async () => {
      mockPrisma.restaurant.findMany.mockResolvedValue([]);

      const result = await menuService.getCoreMenu();

      expect(result.totalItems).toBe(0);
      expect(result.categories).toBe(0);
    });
  });
});

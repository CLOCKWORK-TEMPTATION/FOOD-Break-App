/**
 * Tests for Menu Service
 */

jest.mock('@prisma/client');

const { PrismaClient } = require('@prisma/client');
const menuService = require('../menuService');

describe('Menu Service', () => {
  let mockPrisma;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPrisma = {
      menuItem: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn()
      },
      category: {
        findMany: jest.fn()
      }
    };

    PrismaClient.mockImplementation(() => mockPrisma);
  });

  describe('getRestaurantMenu', () => {
    it('should get all menu items for restaurant', async () => {
      const restaurantId = 'restaurant123';

      mockPrisma.menuItem.findMany.mockResolvedValue([
        { id: 'item1', name: 'Pizza', price: 150, category: 'Main Course' },
        { id: 'item2', name: 'Burger', price: 100, category: 'Main Course' }
      ]);

      const menu = await menuService.getRestaurantMenu(restaurantId);

      expect(Array.isArray(menu)).toBe(true);
      expect(menu.length).toBe(2);
    });

    it('should filter by availability', async () => {
      const restaurantId = 'restaurant123';

      mockPrisma.menuItem.findMany.mockResolvedValue([
        { id: 'item1', isAvailable: true }
      ]);

      await menuService.getRestaurantMenu(restaurantId, { isAvailable: true });

      expect(mockPrisma.menuItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            restaurantId,
            isAvailable: true
          })
        })
      );
    });
  });

  describe('getMenuItemById', () => {
    it('should get menu item by ID', async () => {
      const itemId = 'item123';

      mockPrisma.menuItem.findUnique.mockResolvedValue({
        id: itemId,
        name: 'Pizza',
        price: 150
      });

      const item = await menuService.getMenuItemById(itemId);

      expect(item.id).toBe(itemId);
    });

    it('should return null if item not found', async () => {
      mockPrisma.menuItem.findUnique.mockResolvedValue(null);

      const item = await menuService.getMenuItemById('invalid_id');

      expect(item).toBeNull();
    });
  });

  describe('createMenuItem', () => {
    it('should create menu item successfully', async () => {
      const itemData = {
        restaurantId: 'restaurant123',
        name: 'New Pizza',
        description: 'Delicious pizza',
        price: 150,
        category: 'Main Course'
      };

      mockPrisma.menuItem.create.mockResolvedValue({
        id: 'item123',
        ...itemData
      });

      const item = await menuService.createMenuItem(itemData);

      expect(item).toHaveProperty('id');
      expect(item.name).toBe('New Pizza');
    });
  });

  describe('updateMenuItem', () => {
    it('should update menu item', async () => {
      const itemId = 'item123';
      const updateData = { price: 175, isAvailable: false };

      mockPrisma.menuItem.update.mockResolvedValue({
        id: itemId,
        ...updateData
      });

      const updated = await menuService.updateMenuItem(itemId, updateData);

      expect(updated.price).toBe(175);
      expect(updated.isAvailable).toBe(false);
    });
  });

  describe('deleteMenuItem', () => {
    it('should delete menu item', async () => {
      const itemId = 'item123';

      mockPrisma.menuItem.delete.mockResolvedValue({ id: itemId });

      const deleted = await menuService.deleteMenuItem(itemId);

      expect(deleted.id).toBe(itemId);
    });
  });

  describe('searchMenuItems', () => {
    it('should search menu items by name', async () => {
      mockPrisma.menuItem.findMany.mockResolvedValue([
        { id: 'item1', name: 'Margherita Pizza' },
        { id: 'item2', name: 'Pepperoni Pizza' }
      ]);

      const results = await menuService.searchMenuItems('pizza');

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(2);
    });
  });

  describe('getMenuItemsByCategory', () => {
    it('should get items by category', async () => {
      mockPrisma.menuItem.findMany.mockResolvedValue([
        { id: 'item1', category: 'Dessert', name: 'Ice Cream' },
        { id: 'item2', category: 'Dessert', name: 'Cake' }
      ]);

      const items = await menuService.getMenuItemsByCategory(
        'restaurant123',
        'Dessert'
      );

      expect(Array.isArray(items)).toBe(true);
      expect(items.every((item) => item.category === 'Dessert')).toBe(true);
    });
  });

  describe('getPopularItems', () => {
    it('should get popular menu items', async () => {
      mockPrisma.menuItem.findMany.mockResolvedValue([
        { id: 'item1', name: 'Popular Pizza', orderCount: 150 },
        { id: 'item2', name: 'Popular Burger', orderCount: 120 }
      ]);

      const popular = await menuService.getPopularItems('restaurant123', 10);

      expect(Array.isArray(popular)).toBe(true);
    });
  });

  describe('updateAvailability', () => {
    it('should update item availability', async () => {
      const itemId = 'item123';

      mockPrisma.menuItem.update.mockResolvedValue({
        id: itemId,
        isAvailable: false
      });

      const updated = await menuService.updateAvailability(itemId, false);

      expect(updated.isAvailable).toBe(false);
    });
  });

  describe('bulkUpdateAvailability', () => {
    it('should update availability for multiple items', async () => {
      const itemIds = ['item1', 'item2', 'item3'];

      mockPrisma.menuItem.updateMany = jest.fn().mockResolvedValue({
        count: 3
      });

      const result = await menuService.bulkUpdateAvailability(itemIds, false);

      expect(result.count).toBe(3);
    });
  });

  describe('getCategories', () => {
    it('should get all categories for restaurant', async () => {
      mockPrisma.category.findMany.mockResolvedValue([
        { id: 'cat1', name: 'Appetizers' },
        { id: 'cat2', name: 'Main Course' },
        { id: 'cat3', name: 'Desserts' }
      ]);

      const categories = await menuService.getCategories('restaurant123');

      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBe(3);
    });
  });

  describe('validatePrice', () => {
    it('should validate positive price', () => {
      const isValid = menuService.validatePrice(150);

      expect(isValid).toBe(true);
    });

    it('should reject negative price', () => {
      const isValid = menuService.validatePrice(-10);

      expect(isValid).toBe(false);
    });

    it('should reject zero price', () => {
      const isValid = menuService.validatePrice(0);

      expect(isValid).toBe(false);
    });
  });

  describe('calculateDiscountedPrice', () => {
    it('should calculate discounted price', () => {
      const originalPrice = 100;
      const discount = 20; // 20%

      const discounted = menuService.calculateDiscountedPrice(
        originalPrice,
        discount
      );

      expect(discounted).toBe(80);
    });

    it('should handle 0% discount', () => {
      const discounted = menuService.calculateDiscountedPrice(100, 0);

      expect(discounted).toBe(100);
    });

    it('should handle 100% discount', () => {
      const discounted = menuService.calculateDiscountedPrice(100, 100);

      expect(discounted).toBe(0);
    });
  });
});

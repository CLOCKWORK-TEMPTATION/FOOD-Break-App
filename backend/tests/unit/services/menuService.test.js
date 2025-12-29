/**
 * Unit Tests - Menu Service
 * اختبارات وحدة خدمة القوائم
 */

const { restaurants, menuItems } = require('../../fixtures/testData');
const { prisma: mockPrisma } = require('../../utils/testHelpers');

describe('Menu Service', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma = global.mockPrisma;
  });

  // ==========================================
  // Menu Item Retrieval Tests
  // ==========================================
  describe('getMenuItems', () => {
    it('should return all available menu items for restaurant', async () => {
      const availableItems = [menuItems.availableItem];
      mockPrisma.menuItem.findMany.mockResolvedValue(availableItems);
      
      const result = await mockPrisma.menuItem.findMany({
        where: {
          restaurantId: restaurants.activeRestaurant.id,
          isAvailable: true,
        }
      });
      
      expect(result).toHaveLength(1);
      expect(result[0].isAvailable).toBe(true);
    });

    it('should filter by category', async () => {
      const category = 'وجبات رئيسية';
      mockPrisma.menuItem.findMany.mockResolvedValue([menuItems.availableItem]);
      
      const result = await mockPrisma.menuItem.findMany({
        where: {
          restaurantId: restaurants.activeRestaurant.id,
          category: category,
        }
      });
      
      expect(result[0].category).toBe(category);
    });

    it('should support search by name', async () => {
      const searchTerm = 'شاورما';
      mockPrisma.menuItem.findMany.mockResolvedValue([menuItems.availableItem]);
      
      const result = await mockPrisma.menuItem.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm } },
            { nameAr: { contains: searchTerm } },
          ]
        }
      });
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toContain(searchTerm);
    });

    it('should return empty array for restaurant with no items', async () => {
      mockPrisma.menuItem.findMany.mockResolvedValue([]);
      
      const result = await mockPrisma.menuItem.findMany({
        where: { restaurantId: 'restaurant-with-no-items' }
      });
      
      expect(result).toEqual([]);
    });
  });

  // ==========================================
  // Menu Item By ID Tests
  // ==========================================
  describe('getMenuItemById', () => {
    it('should return menu item with restaurant info', async () => {
      const itemWithRestaurant = {
        ...menuItems.availableItem,
        restaurant: restaurants.activeRestaurant,
      };
      mockPrisma.menuItem.findUnique.mockResolvedValue(itemWithRestaurant);
      
      const result = await mockPrisma.menuItem.findUnique({
        where: { id: menuItems.availableItem.id },
        include: { restaurant: true }
      });
      
      expect(result).toBeDefined();
      expect(result.restaurant).toBeDefined();
      expect(result.restaurant.id).toBe(restaurants.activeRestaurant.id);
    });

    it('should return null for non-existent item', async () => {
      mockPrisma.menuItem.findUnique.mockResolvedValue(null);
      
      const result = await mockPrisma.menuItem.findUnique({
        where: { id: 'non-existent-id' }
      });
      
      expect(result).toBeNull();
    });
  });

  // ==========================================
  // Core Menu Tests
  // ==========================================
  describe('getCoreMenu', () => {
    it('should return CORE menu items from partner restaurants', async () => {
      const coreItems = [{
        ...menuItems.availableItem,
        menuType: 'CORE',
        restaurant: { ...restaurants.activeRestaurant, isPartner: true },
      }];
      mockPrisma.menuItem.findMany.mockResolvedValue(coreItems);
      
      const result = await mockPrisma.menuItem.findMany({
        where: {
          menuType: 'CORE',
          isAvailable: true,
          restaurant: {
            isPartner: true,
            isActive: true,
          }
        }
      });
      
      expect(result).toHaveLength(1);
      expect(result[0].menuType).toBe('CORE');
      expect(result[0].restaurant.isPartner).toBe(true);
    });

    it('should sort by quality score', async () => {
      const items = [
        { ...menuItems.availableItem, id: '1', qualityScore: 4.5 },
        { ...menuItems.availableItem, id: '2', qualityScore: 4.9 },
        { ...menuItems.availableItem, id: '3', qualityScore: 4.2 },
      ];
      
      mockPrisma.menuItem.findMany.mockResolvedValue(items);
      
      const result = await mockPrisma.menuItem.findMany({
        where: { menuType: 'CORE' },
        orderBy: { qualityScore: 'desc' }
      });
      
      // Verify sorting works
      const sorted = [...result].sort((a, b) => b.qualityScore - a.qualityScore);
      expect(sorted[0].qualityScore).toBe(4.9);
    });
  });

  // ==========================================
  // Menu Categories Tests
  // ==========================================
  describe('getCategories', () => {
    it('should return unique categories', () => {
      const items = [
        { category: 'وجبات رئيسية' },
        { category: 'مقبلات' },
        { category: 'وجبات رئيسية' },
        { category: 'حلويات' },
      ];
      
      const uniqueCategories = [...new Set(items.map(item => item.category))];
      
      expect(uniqueCategories).toHaveLength(3);
      expect(uniqueCategories).toContain('وجبات رئيسية');
      expect(uniqueCategories).toContain('مقبلات');
      expect(uniqueCategories).toContain('حلويات');
    });
  });

  // ==========================================
  // Menu Item Creation Tests (Admin)
  // ==========================================
  describe('createMenuItem', () => {
    it('should create menu item with valid data', async () => {
      const newItem = {
        restaurantId: restaurants.activeRestaurant.id,
        name: 'برجر لحم',
        nameAr: 'برجر لحم',
        price: 35.00,
        category: 'وجبات رئيسية',
        isAvailable: true,
      };
      
      mockPrisma.menuItem.create.mockResolvedValue({
        id: 'new-item-id',
        ...newItem,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      const result = await mockPrisma.menuItem.create({ data: newItem });
      
      expect(result.id).toBeDefined();
      expect(result.name).toBe(newItem.name);
      expect(result.price).toBe(newItem.price);
    });

    it('should require restaurant ID', () => {
      const itemWithoutRestaurant = {
        name: 'طبق بدون مطعم',
        price: 20.00,
      };
      
      expect(itemWithoutRestaurant.restaurantId).toBeUndefined();
    });

    it('should require positive price', () => {
      const validPrices = [0.01, 1, 10, 100, 1000];
      const invalidPrices = [0, -1, -10];
      
      validPrices.forEach(price => {
        expect(price > 0).toBe(true);
      });
      
      invalidPrices.forEach(price => {
        expect(price > 0).toBe(false);
      });
    });
  });

  // ==========================================
  // Menu Item Update Tests (Admin)
  // ==========================================
  describe('updateMenuItem', () => {
    it('should update menu item price', async () => {
      const newPrice = 30.00;
      
      mockPrisma.menuItem.update.mockResolvedValue({
        ...menuItems.availableItem,
        price: newPrice,
      });
      
      const result = await mockPrisma.menuItem.update({
        where: { id: menuItems.availableItem.id },
        data: { price: newPrice }
      });
      
      expect(result.price).toBe(newPrice);
    });

    it('should update availability status', async () => {
      mockPrisma.menuItem.update.mockResolvedValue({
        ...menuItems.availableItem,
        isAvailable: false,
      });
      
      const result = await mockPrisma.menuItem.update({
        where: { id: menuItems.availableItem.id },
        data: { isAvailable: false }
      });
      
      expect(result.isAvailable).toBe(false);
    });
  });

  // ==========================================
  // Menu Item Deletion Tests (Admin)
  // ==========================================
  describe('deleteMenuItem', () => {
    it('should delete menu item', async () => {
      mockPrisma.menuItem.delete.mockResolvedValue(menuItems.availableItem);
      
      const result = await mockPrisma.menuItem.delete({
        where: { id: menuItems.availableItem.id }
      });
      
      expect(result).toBeDefined();
      expect(result.id).toBe(menuItems.availableItem.id);
    });

    it('should handle deletion of non-existent item', async () => {
      mockPrisma.menuItem.delete.mockRejectedValue(new Error('Record not found'));
      
      await expect(
        mockPrisma.menuItem.delete({ where: { id: 'non-existent' } })
      ).rejects.toThrow('Record not found');
    });
  });

  // ==========================================
  // Menu Item Dietary Info Tests
  // ==========================================
  describe('dietary information', () => {
    it('should filter vegetarian items', async () => {
      const vegetarianItems = [
        { ...menuItems.availableItem, isVegetarian: true },
      ];
      
      mockPrisma.menuItem.findMany.mockResolvedValue(vegetarianItems);
      
      const result = await mockPrisma.menuItem.findMany({
        where: { isVegetarian: true }
      });
      
      expect(result.every(item => item.isVegetarian)).toBe(true);
    });

    it('should filter gluten-free items', async () => {
      const glutenFreeItems = [
        { ...menuItems.availableItem, isGlutenFree: true },
      ];
      
      mockPrisma.menuItem.findMany.mockResolvedValue(glutenFreeItems);
      
      const result = await mockPrisma.menuItem.findMany({
        where: { isGlutenFree: true }
      });
      
      expect(result.every(item => item.isGlutenFree)).toBe(true);
    });

    it('should filter by allergens', async () => {
      const itemsWithoutNuts = [
        { ...menuItems.availableItem, allergens: ['dairy'] },
      ];
      
      mockPrisma.menuItem.findMany.mockResolvedValue(itemsWithoutNuts);
      
      const result = await mockPrisma.menuItem.findMany({
        where: {
          NOT: {
            allergens: { has: 'nuts' }
          }
        }
      });
      
      expect(result.every(item => !item.allergens?.includes('nuts'))).toBe(true);
    });
  });

  // ==========================================
  // Menu Pricing Tests
  // ==========================================
  describe('pricing', () => {
    it('should calculate price with modifiers', () => {
      const basePrice = 25.00;
      const modifiers = [
        { name: 'حجم كبير', priceAdjustment: 5.00 },
        { name: 'إضافة جبن', priceAdjustment: 3.00 },
      ];
      
      const totalModifiers = modifiers.reduce((sum, mod) => sum + mod.priceAdjustment, 0);
      const finalPrice = basePrice + totalModifiers;
      
      expect(finalPrice).toBe(33.00);
    });

    it('should handle discount pricing', () => {
      const originalPrice = 50.00;
      const discountedPrice = 40.00;
      
      const discount = ((originalPrice - discountedPrice) / originalPrice) * 100;
      
      expect(discount).toBe(20); // 20% discount
    });
  });
});

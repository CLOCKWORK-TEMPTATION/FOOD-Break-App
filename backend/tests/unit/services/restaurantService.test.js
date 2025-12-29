/**
 * Restaurant Service Tests
 * اختبارات خدمة المطاعم
 */

const restaurantService = require('../../../src/services/restaurantService');

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => global.mockPrisma)
}));

describe('Restaurant Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllRestaurants', () => {
    it('should return all restaurants', async () => {
      const mockRestaurants = [{ id: '1' }, { id: '2' }];
      global.mockPrisma.restaurant.findMany.mockResolvedValue(mockRestaurants);

      const result = await restaurantService.getAllRestaurants();

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getRestaurantById', () => {
    it('should get restaurant by id', async () => {
      const mockRestaurant = { id: '1', name: 'Test Restaurant' };
      global.mockPrisma.restaurant.findUnique.mockResolvedValue(mockRestaurant);

      const result = await restaurantService.getRestaurantById('1');

      expect(result).toEqual(mockRestaurant);
    });
  });

  describe('createRestaurant', () => {
    it('should create restaurant', async () => {
      const restaurantData = { name: 'New Restaurant', address: '123 Street' };
      global.mockPrisma.restaurant.create.mockResolvedValue({ id: '1', ...restaurantData });

      const result = await restaurantService.createRestaurant(restaurantData);

      expect(result).toHaveProperty('id');
    });
  });

  describe('updateRestaurant', () => {
    it('should update restaurant', async () => {
      global.mockPrisma.restaurant.update.mockResolvedValue({ id: '1', name: 'Updated' });

      const result = await restaurantService.updateRestaurant('1', { name: 'Updated' });

      expect(result.name).toBe('Updated');
    });
  });

  describe('deleteRestaurant', () => {
    it('should delete restaurant', async () => {
      global.mockPrisma.restaurant.delete.mockResolvedValue({ id: '1' });

      await restaurantService.deleteRestaurant('1');

      expect(global.mockPrisma.restaurant.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    });
  });

  describe('searchRestaurants', () => {
    it('should search restaurants by criteria', async () => {
      global.mockPrisma.restaurant.findMany.mockResolvedValue([{ id: '1' }]);

      const result = await restaurantService.searchRestaurants({ name: 'Test' });

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getRestaurantStats', () => {
    it('should get restaurant statistics', async () => {
      global.mockPrisma.order.count.mockResolvedValue(100);
      global.mockPrisma.order.aggregate.mockResolvedValue({ _sum: { total: 5000 } });

      const result = await restaurantService.getRestaurantStats('1');

      expect(result).toHaveProperty('totalOrders');
      expect(result).toHaveProperty('totalRevenue');
    });
  });
});

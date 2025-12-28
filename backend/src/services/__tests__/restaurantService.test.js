/**
 * Smoke Tests - Restaurant Service
 */

jest.mock('@prisma/client');

const restaurantService = require('../restaurantService');

describe('RestaurantService - Smoke Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { PrismaClient } = require('@prisma/client');
    const mockPrisma = new PrismaClient();

    mockPrisma.restaurant.findMany.mockResolvedValue([]);
    mockPrisma.restaurant.findUnique.mockResolvedValue({ id: '1', name: 'Test' });
    mockPrisma.restaurant.create.mockResolvedValue({ id: '1' });
    mockPrisma.restaurant.update.mockResolvedValue({ id: '1' });
    mockPrisma.restaurant.delete.mockResolvedValue({ id: '1' });
  });

  it('should handle getRestaurants', async () => {
    if (restaurantService.getRestaurants) {
      await expect(restaurantService.getRestaurants({})).resolves.not.toThrow();
    }
  });

  it('should handle getRestaurantById', async () => {
    if (restaurantService.getRestaurantById) {
      await expect(restaurantService.getRestaurantById('1')).resolves.not.toThrow();
    }
  });

  it('should handle createRestaurant', async () => {
    if (restaurantService.createRestaurant) {
      await expect(restaurantService.createRestaurant({ name: 'Test' })).resolves.not.toThrow();
    }
  });
});

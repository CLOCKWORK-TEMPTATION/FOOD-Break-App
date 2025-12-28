const restaurantService = require('../../restaurantService');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('RestaurantService', () => {
  let testRestaurant;

  beforeAll(async () => {
    testRestaurant = await prisma.restaurant.create({
      data: { name: 'Test Restaurant', address: 'Test Address', latitude: 0, longitude: 0 }
    });
  });

  afterAll(async () => {
    await prisma.menuItem.deleteMany();
    await prisma.restaurant.deleteMany();
    await prisma.$disconnect();
  });

  it('should get all restaurants', async () => {
    const restaurants = await restaurantService.getRestaurants();
    expect(Array.isArray(restaurants)).toBe(true);
    expect(restaurants.length).toBeGreaterThan(0);
  });

  it('should get restaurant by id', async () => {
    const restaurant = await restaurantService.getRestaurantById(testRestaurant.id);
    expect(restaurant.id).toBe(testRestaurant.id);
  });

  it('should create menu item', async () => {
    const menuItem = await restaurantService.createMenuItem(testRestaurant.id, {
      name: 'Test Item',
      price: 50,
      category: 'Main'
    });

    expect(menuItem).toBeDefined();
    expect(menuItem.name).toBe('Test Item');
  });

  it('should get restaurant menu', async () => {
    const menu = await restaurantService.getRestaurantMenu(testRestaurant.id);
    expect(Array.isArray(menu)).toBe(true);
  });

  it('should update restaurant', async () => {
    const updated = await restaurantService.updateRestaurant(testRestaurant.id, {
      name: 'Updated Restaurant'
    });

    expect(updated.name).toBe('Updated Restaurant');
  });

  it('should search restaurants by location', async () => {
    const results = await restaurantService.searchByLocation(0, 0, 5);
    expect(Array.isArray(results)).toBe(true);
  });
});

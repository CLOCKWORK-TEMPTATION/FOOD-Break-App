const menuService = require('../../menuService');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('MenuService', () => {
  let testRestaurant, testMenuItem;

  beforeAll(async () => {
    testRestaurant = await prisma.restaurant.create({
      data: { name: 'Menu Test Restaurant', address: 'Test', latitude: 0, longitude: 0 }
    });
    testMenuItem = await prisma.menuItem.create({
      data: { restaurantId: testRestaurant.id, name: 'Test Item', price: 50 }
    });
  });

  afterAll(async () => {
    await prisma.menuItem.deleteMany();
    await prisma.restaurant.deleteMany();
    await prisma.$disconnect();
  });

  it('should get menu items', async () => {
    const items = await menuService.getMenuItems({ restaurantId: testRestaurant.id });
    expect(Array.isArray(items)).toBe(true);
  });

  it('should get menu item by id', async () => {
    const item = await menuService.getMenuItemById(testMenuItem.id);
    expect(item.id).toBe(testMenuItem.id);
  });

  it('should update menu item', async () => {
    const updated = await menuService.updateMenuItem(testMenuItem.id, { price: 60 });
    expect(updated.price).toBe(60);
  });

  it('should filter by category', async () => {
    await prisma.menuItem.create({
      data: { restaurantId: testRestaurant.id, name: 'Pizza', price: 80, category: 'Italian' }
    });

    const items = await menuService.getMenuItems({ category: 'Italian' });
    expect(items.every(i => i.category === 'Italian')).toBe(true);
  });

  it('should search menu items', async () => {
    const results = await menuService.searchMenuItems('Test');
    expect(Array.isArray(results)).toBe(true);
  });
});

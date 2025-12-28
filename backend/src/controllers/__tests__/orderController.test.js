const request = require('supertest');
const app = require('../../app');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('Order Controller', () => {
  let authToken, testUser, testMenuItem;

  beforeAll(async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'ordertest@test.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User'
      });

    authToken = response.body.token;
    testUser = response.body.user;

    const restaurant = await prisma.restaurant.create({
      data: { name: 'Test Restaurant', address: 'Test', latitude: 0, longitude: 0 }
    });

    testMenuItem = await prisma.menuItem.create({
      data: { restaurantId: restaurant.id, name: 'Test Item', price: 50 }
    });
  });

  afterAll(async () => {
    await prisma.order.deleteMany();
    await prisma.menuItem.deleteMany();
    await prisma.restaurant.deleteMany();
    await prisma.user.deleteMany({ where: { email: 'ordertest@test.com' } });
    await prisma.$disconnect();
  });

  describe('POST /api/v1/orders', () => {
    it('should create order', async () => {
      const response = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [{ menuItemId: testMenuItem.id, quantity: 2, price: 50 }],
          totalAmount: 100
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should return 400 for missing items', async () => {
      const response = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ totalAmount: 100 });

      expect(response.status).toBe(400);
    });

    it('should return 401 without auth', async () => {
      const response = await request(app)
        .post('/api/v1/orders')
        .send({ items: [], totalAmount: 100 });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/orders', () => {
    it('should get user orders', async () => {
      const response = await request(app)
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});

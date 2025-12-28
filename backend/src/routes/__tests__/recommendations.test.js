const request = require('supertest');
const express = require('express');
const recommendationRoutes = require('../../recommendationsOptimized');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
app.use(express.json());
app.use('/api/recommendations', recommendationRoutes);

describe('Recommendation Routes', () => {
  let authToken, testUser;

  beforeAll(async () => {
    testUser = await prisma.user.create({
      data: { email: 'recom@test.com', passwordHash: 'hash', firstName: 'Test', lastName: 'User' }
    });
    const jwt = require('../../utils/jwt');
    authToken = jwt.generateToken({ userId: testUser.id });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: 'recom@test.com' } });
    await prisma.$disconnect();
  });

  it('GET /api/recommendations should return recommendations', async () => {
    const response = await request(app)
      .get('/api/recommendations')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it('GET /api/recommendations/personalized should return personalized', async () => {
    const response = await request(app)
      .get('/api/recommendations/personalized')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
  });

  it('GET /api/recommendations/trending should return trending', async () => {
    const response = await request(app)
      .get('/api/recommendations/trending')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
  });

  it('DELETE /api/recommendations/cache should clear cache', async () => {
    const response = await request(app)
      .delete('/api/recommendations/cache')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app).get('/api/recommendations');
    expect(response.status).toBe(401);
  });
});

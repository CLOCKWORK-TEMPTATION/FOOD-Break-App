/**
 * Recommendation Service Tests
 */

const recommendationService = require('../recommendationServiceOptimized');
const cache = require('../cacheService');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('RecommendationService', () => {
  beforeAll(async () => {
    await cache.connect();
  });

  afterAll(async () => {
    await cache.disconnect();
    await prisma.$disconnect();
  });

  describe('getPersonalizedRecommendations', () => {
    it('should return recommendations for user with order history', async () => {
      const userId = 'test-user-1';
      const recommendations = await recommendationService.getPersonalizedRecommendations(userId, 5);
      
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeLessThanOrEqual(5);
      
      if (recommendations.length > 0) {
        expect(recommendations[0]).toHaveProperty('menuItem');
        expect(recommendations[0]).toHaveProperty('score');
        expect(recommendations[0]).toHaveProperty('reason');
      }
    });

    it('should use cache on second call', async () => {
      const userId = 'test-user-2';
      
      const start1 = Date.now();
      await recommendationService.getPersonalizedRecommendations(userId, 5);
      const time1 = Date.now() - start1;
      
      const start2 = Date.now();
      await recommendationService.getPersonalizedRecommendations(userId, 5);
      const time2 = Date.now() - start2;
      
      // Cache should be faster
      expect(time2).toBeLessThan(time1);
    });
  });

  describe('getTrendingRecommendations', () => {
    it('should return trending items', async () => {
      const recommendations = await recommendationService.getTrendingRecommendations(5);
      
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeLessThanOrEqual(5);
    });
  });

  describe('clearUserCache', () => {
    it('should clear user cache', async () => {
      const userId = 'test-user-3';
      
      await recommendationService.getPersonalizedRecommendations(userId, 5);
      await recommendationService.clearUserCache(userId);
      
      const cached = await cache.get(`recommendations:personalized:${userId}:5`);
      expect(cached).toBeNull();
    });
  });
});

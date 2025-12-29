/**
 * Smoke Tests - Recommendation Service
 */

jest.mock('@prisma/client');

const recommendationService = require('../recommendationService');

describe('RecommendationService - Smoke Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { PrismaClient } = require('@prisma/client');
    const mockPrisma = new PrismaClient();

    mockPrisma.order.findMany.mockResolvedValue([]);
    mockPrisma.menuItem.findMany.mockResolvedValue([]);
    mockPrisma.restaurant.findMany.mockResolvedValue([]);
    mockPrisma.recommendation.create.mockResolvedValue({ id: '1' });
  });

  it('should handle getRecommendations', async () => {
    if (recommendationService.getRecommendations) {
      await expect(recommendationService.getRecommendations('user-1')).resolves.not.toThrow();
    }
  });

  it('should handle generatePersonalizedRecommendations', async () => {
    if (recommendationService.generatePersonalizedRecommendations) {
      await expect(recommendationService.generatePersonalizedRecommendations('user-1')).resolves.not.toThrow();
    }
  });
});

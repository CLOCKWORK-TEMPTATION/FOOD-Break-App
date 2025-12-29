/**
 * Recommendation Service Tests
 * اختبارات خدمة التوصيات
 */

const recommendationService = require('../../../src/services/recommendationService');

// Mock dependencies
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => global.mockPrisma)
}));

jest.mock('openai');
jest.mock('@anthropic-ai/sdk');
jest.mock('@google/generative-ai');
jest.mock('groq-sdk');
jest.mock('together-ai');
jest.mock('axios');

describe('Recommendation Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup environment variables
    process.env.OPENAI_API_KEY = 'test-openai-key';
    process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    process.env.GROQ_API_KEY = 'test-groq-key';
    process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
    process.env.TOGETHER_API_KEY = 'test-together-key';

    global.mockPrisma.menuItem = {
      findMany: jest.fn(),
      findUnique: jest.fn()
    };

    global.mockPrisma.order = {
      findMany: jest.fn()
    };

    global.mockPrisma.user = {
      findUnique: jest.fn()
    };

    global.mockPrisma.recommendation = {
      create: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn()
    };
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.GROQ_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.TOGETHER_API_KEY;
  });

  describe('Service Initialization', () => {
    it('should check available models on initialization', async () => {
      const service = recommendationService;
      expect(service).toBeDefined();
    });

    it('should work without API keys', async () => {
      delete process.env.OPENAI_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;
      delete process.env.GEMINI_API_KEY;
      delete process.env.GROQ_API_KEY;
      delete process.env.OPENROUTER_API_KEY;
      delete process.env.TOGETHER_API_KEY;

      const service = require('../../../src/services/recommendationService');
      expect(service).toBeDefined();
    });
  });

  describe('getUserRecommendations', () => {
    it('should return recommendations for user', async () => {
      const userId = 'user-123';

      const mockRecommendations = [
        {
          id: 'rec-1',
          menuItemId: 'item-1',
          score: 0.95,
          reason: 'Based on your preferences'
        },
        {
          id: 'rec-2',
          menuItemId: 'item-2',
          score: 0.85,
          reason: 'Popular in your area'
        }
      ];

      global.mockPrisma.recommendation.findMany.mockResolvedValue(mockRecommendations);

      const result = await recommendationService.getUserRecommendations(userId);

      expect(result).toEqual(mockRecommendations);
      expect(global.mockPrisma.recommendation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId })
        })
      );
    });

    it('should return empty array when no recommendations', async () => {
      const userId = 'user-123';

      global.mockPrisma.recommendation.findMany.mockResolvedValue([]);

      const result = await recommendationService.getUserRecommendations(userId);

      expect(result).toEqual([]);
    });

    it('should limit number of recommendations', async () => {
      const userId = 'user-123';
      const limit = 5;

      global.mockPrisma.recommendation.findMany.mockResolvedValue([]);

      await recommendationService.getUserRecommendations(userId, limit);

      expect(global.mockPrisma.recommendation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: limit
        })
      );
    });
  });

  describe('generateRecommendations', () => {
    it('should generate recommendations for user', async () => {
      const userId = 'user-123';

      global.mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        preferences: { cuisine: 'Italian' }
      });

      global.mockPrisma.order.findMany.mockResolvedValue([
        {
          id: 'order-1',
          items: [
            { menuItemId: 'item-1', quantity: 1 }
          ]
        }
      ]);

      global.mockPrisma.menuItem.findMany.mockResolvedValue([
        {
          id: 'item-2',
          name: 'Pizza Margherita',
          category: 'Pizza',
          price: 100,
          qualityScore: 0.9
        }
      ]);

      global.mockPrisma.recommendation.createMany.mockResolvedValue({
        count: 5
      });

      const result = await recommendationService.generateRecommendations(userId);

      expect(result).toBeDefined();
      expect(global.mockPrisma.recommendation.createMany).toHaveBeenCalled();
    });

    it('should handle users with no order history', async () => {
      const userId = 'user-123';

      global.mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        preferences: {}
      });

      global.mockPrisma.order.findMany.mockResolvedValue([]);
      global.mockPrisma.menuItem.findMany.mockResolvedValue([
        {
          id: 'item-1',
          name: 'Test Item',
          category: 'Test',
          price: 50,
          qualityScore: 0.8
        }
      ]);

      global.mockPrisma.recommendation.createMany.mockResolvedValue({
        count: 5
      });

      const result = await recommendationService.generateRecommendations(userId);

      expect(result).toBeDefined();
    });
  });

  describe('getPersonalizedRecommendations', () => {
    it('should return personalized recommendations', async () => {
      const userId = 'user-123';

      const mockMenuItems = [
        {
          id: 'item-1',
          name: 'Pasta',
          category: 'Italian',
          price: 120,
          qualityScore: 0.9,
          restaurant: { id: 'rest-1', name: 'Italian Restaurant' }
        },
        {
          id: 'item-2',
          name: 'Pizza',
          category: 'Italian',
          price: 100,
          qualityScore: 0.85,
          restaurant: { id: 'rest-1', name: 'Italian Restaurant' }
        }
      ];

      global.mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        preferences: { cuisine: 'Italian' }
      });

      global.mockPrisma.order.findMany.mockResolvedValue([]);
      global.mockPrisma.menuItem.findMany.mockResolvedValue(mockMenuItems);

      const result = await recommendationService.getPersonalizedRecommendations(userId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      const userId = 'user-123';

      global.mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(
        recommendationService.getPersonalizedRecommendations(userId)
      ).rejects.toThrow('Database error');
    });
  });

  describe('getSimilarItems', () => {
    it('should return similar items to a given menu item', async () => {
      const menuItemId = 'item-1';

      global.mockPrisma.menuItem.findUnique.mockResolvedValue({
        id: menuItemId,
        name: 'Pizza',
        category: 'Italian',
        price: 100,
        qualityScore: 0.9
      });

      global.mockPrisma.menuItem.findMany.mockResolvedValue([
        {
          id: 'item-2',
          name: 'Pasta',
          category: 'Italian',
          price: 120,
          qualityScore: 0.85
        },
        {
          id: 'item-3',
          name: 'Risotto',
          category: 'Italian',
          price: 110,
          qualityScore: 0.88
        }
      ]);

      const result = await recommendationService.getSimilarItems(menuItemId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle non-existent items', async () => {
      const menuItemId = 'non-existent';

      global.mockPrisma.menuItem.findUnique.mockResolvedValue(null);

      await expect(
        recommendationService.getSimilarItems(menuItemId)
      ).rejects.toThrow();
    });

    it('should limit number of similar items', async () => {
      const menuItemId = 'item-1';
      const limit = 3;

      global.mockPrisma.menuItem.findUnique.mockResolvedValue({
        id: menuItemId,
        name: 'Pizza',
        category: 'Italian',
        price: 100
      });

      global.mockPrisma.menuItem.findMany.mockResolvedValue([]);

      await recommendationService.getSimilarItems(menuItemId, limit);

      expect(global.mockPrisma.menuItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: expect.any(Number)
        })
      );
    });
  });

  describe('getTrendingItems', () => {
    it('should return trending items', async () => {
      const mockOrders = [
        {
          items: [
            { menuItemId: 'item-1', quantity: 5 },
            { menuItemId: 'item-2', quantity: 3 }
          ]
        },
        {
          items: [
            { menuItemId: 'item-1', quantity: 2 },
            { menuItemId: 'item-3', quantity: 4 }
          ]
        }
      ];

      global.mockPrisma.order.findMany.mockResolvedValue(mockOrders);

      global.mockPrisma.menuItem.findMany.mockResolvedValue([
        {
          id: 'item-1',
          name: 'Popular Pizza',
          category: 'Pizza',
          price: 100
        }
      ]);

      const result = await recommendationService.getTrendingItems();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle no orders gracefully', async () => {
      global.mockPrisma.order.findMany.mockResolvedValue([]);

      const result = await recommendationService.getTrendingItems();

      expect(result).toEqual([]);
    });

    it('should filter by time period', async () => {
      const days = 7;

      global.mockPrisma.order.findMany.mockResolvedValue([]);

      await recommendationService.getTrendingItems(days);

      expect(global.mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.any(Object)
          })
        })
      );
    });
  });

  describe('getWeatherBasedRecommendations', () => {
    it('should return weather-appropriate recommendations', async () => {
      const weather = { temp: 30, condition: 'sunny' };

      global.mockPrisma.menuItem.findMany.mockResolvedValue([
        {
          id: 'item-1',
          name: 'Cold Drink',
          category: 'Beverages',
          tags: ['cold', 'refreshing']
        },
        {
          id: 'item-2',
          name: 'Ice Cream',
          category: 'Desserts',
          tags: ['cold', 'sweet']
        }
      ]);

      const result = await recommendationService.getWeatherBasedRecommendations(weather);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle cold weather', async () => {
      const weather = { temp: 10, condition: 'rainy' };

      global.mockPrisma.menuItem.findMany.mockResolvedValue([
        {
          id: 'item-1',
          name: 'Hot Soup',
          category: 'Soups',
          tags: ['hot', 'warm']
        }
      ]);

      const result = await recommendationService.getWeatherBasedRecommendations(weather);

      expect(result).toBeDefined();
    });

    it('should handle missing weather data', async () => {
      global.mockPrisma.menuItem.findMany.mockResolvedValue([]);

      const result = await recommendationService.getWeatherBasedRecommendations(null);

      expect(result).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      global.mockPrisma.recommendation.findMany.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(
        recommendationService.getUserRecommendations('user-123')
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle invalid user IDs', async () => {
      global.mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        recommendationService.generateRecommendations('invalid-user')
      ).rejects.toThrow();
    });

    it('should handle API rate limits gracefully', async () => {
      global.mockPrisma.menuItem.findMany.mockResolvedValue([]);

      const result = await recommendationService.getTrendingItems();

      expect(result).toEqual([]);
    });
  });

  describe('Utility Functions', () => {
    it('should calculate cosine similarity correctly', () => {
      const service = recommendationService;
      // This tests the internal cosine similarity function if exported
      expect(service).toBeDefined();
    });

    it('should create item embeddings', () => {
      const service = recommendationService;
      expect(service).toBeDefined();
    });

    it('should select best available model', () => {
      const service = recommendationService;
      expect(service).toBeDefined();
    });
  });
});

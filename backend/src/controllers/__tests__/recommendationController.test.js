/**
 * Tests for Recommendation Controller
 */

jest.mock('../../services/recommendationService');

const recommendationController = require('../recommendationController');
const recommendationService = require('../../services/recommendationService');

describe('Recommendation Controller', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      user: { id: 'user123', role: 'USER' },
      params: {},
      query: {},
      body: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('getPersonalizedRecommendations', () => {
    it('should get personalized recommendations', async () => {
      recommendationService.getPersonalizedRecommendations = jest.fn().mockResolvedValue([
        { id: 'item1', name: 'Pizza', score: 0.95 },
        { id: 'item2', name: 'Burger', score: 0.85 }
      ]);

      await recommendationController.getPersonalizedRecommendations(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array)
        })
      );
    });

    it('should limit results', async () => {
      req.query = { limit: '5' };

      recommendationService.getPersonalizedRecommendations = jest.fn().mockResolvedValue([]);

      await recommendationController.getPersonalizedRecommendations(req, res);

      expect(recommendationService.getPersonalizedRecommendations).toHaveBeenCalledWith(
        'user123',
        expect.objectContaining({ limit: 5 })
      );
    });
  });

  describe('getRecommendationsByCategory', () => {
    it('should get recommendations by category', async () => {
      req.params = { category: 'Main Course' };

      recommendationService.getRecommendationsByCategory = jest.fn().mockResolvedValue([
        { id: 'item1', category: 'Main Course', name: 'Pizza' }
      ]);

      await recommendationController.getRecommendationsByCategory(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array)
        })
      );
    });
  });

  describe('getTrendingItems', () => {
    it('should get trending menu items', async () => {
      req.query = { period: 'week' };

      recommendationService.getTrendingItems = jest.fn().mockResolvedValue([
        { id: 'item1', name: 'Trending Pizza', orderCount: 150 },
        { id: 'item2', name: 'Popular Burger', orderCount: 120 }
      ]);

      await recommendationController.getTrendingItems(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array)
        })
      );
    });
  });

  describe('getSimilarItems', () => {
    it('should get similar items', async () => {
      req.params = { menuItemId: 'item123' };

      recommendationService.getSimilarItems = jest.fn().mockResolvedValue([
        { id: 'item2', name: 'Similar Item 1', similarity: 0.9 },
        { id: 'item3', name: 'Similar Item 2', similarity: 0.85 }
      ]);

      await recommendationController.getSimilarItems(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array)
        })
      );
    });
  });

  describe('recordInteraction', () => {
    it('should record user interaction', async () => {
      req.body = {
        menuItemId: 'item123',
        interactionType: 'VIEW',
        metadata: { duration: 30 }
      };

      recommendationService.recordInteraction = jest.fn().mockResolvedValue({
        id: 'interaction123',
        ...req.body
      });

      await recommendationController.recordInteraction(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });
  });

  describe('getRecommendationExplanation', () => {
    it('should get recommendation explanation', async () => {
      req.params = { menuItemId: 'item123' };

      recommendationService.getRecommendationExplanation = jest.fn().mockResolvedValue({
        reasons: [
          'You ordered similar items before',
          'Highly rated by other users',
          'Matches your dietary preferences'
        ],
        score: 0.92
      });

      await recommendationController.getRecommendationExplanation(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });
  });

  describe('refreshRecommendations', () => {
    it('should refresh user recommendations', async () => {
      recommendationService.refreshUserRecommendations = jest.fn().mockResolvedValue({
        updated: true,
        count: 20
      });

      await recommendationController.refreshRecommendations(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });
  });
});

/**
 * Recommendation Controller Tests
 * اختبارات شاملة لمتحكم التوصيات
 */

jest.mock('../../../src/services/recommendationService');
jest.mock('../../../src/services/weatherService');
jest.mock('../../../src/utils/logger');

const recommendationController = require('../../../src/controllers/recommendationController');
const recommendationService = require('../../../src/services/recommendationService');
const weatherService = require('../../../src/services/weatherService');
const logger = require('../../../src/utils/logger');

describe('Recommendation Controller Tests', () => {
  let req, res;

  beforeEach(() => {
    req = {
      query: {},
      body: {},
      user: { id: 'user-123' }
    };
    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('getUserRecommendations', () => {
    it('should get user recommendations successfully', async () => {
      const mockRecommendations = [
        { id: 'rec-1', menuItemId: 'item-1', score: 0.95 },
        { id: 'rec-2', menuItemId: 'item-2', score: 0.90 },
        { id: 'rec-3', menuItemId: 'item-3', score: 0.85 }
      ];

      recommendationService.getUserRecommendations.mockResolvedValue(mockRecommendations);

      await recommendationController.getUserRecommendations(req, res);

      expect(recommendationService.getUserRecommendations).toHaveBeenCalledWith('user-123', null);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockRecommendations.slice(0, 20)
      });
    });

    it('should get recommendations with location', async () => {
      const mockRecommendations = [];
      req.query = { lat: '40.7128', lon: '-74.0060' };

      recommendationService.getUserRecommendations.mockResolvedValue(mockRecommendations);

      await recommendationController.getUserRecommendations(req, res);

      expect(recommendationService.getUserRecommendations).toHaveBeenCalledWith(
        'user-123',
        { lat: 40.7128, lon: -74.0060 }
      );
    });

    it('should handle errors', async () => {
      const error = new Error('Recommendation fetch failed');
      recommendationService.getUserRecommendations.mockRejectedValue(error);

      await recommendationController.getUserRecommendations(req, res);

      expect(logger.error).toHaveBeenCalledWith('Error getting recommendations:', error);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getWeatherRecommendations', () => {
    it('should get weather recommendations successfully', async () => {
      const mockWeatherRecs = {
        weather: { temp: 25, condition: 'sunny' },
        recommendations: [{ id: 'item-1', name: 'Ice Cream', score: 0.95 }]
      };

      req.query = { lat: '40.7128', lon: '-74.0060' };
      weatherService.getWeatherRecommendations.mockResolvedValue(mockWeatherRecs);

      await recommendationController.getWeatherRecommendations(req, res);

      expect(weatherService.getWeatherRecommendations).toHaveBeenCalledWith(40.7128, -74.0060);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockWeatherRecs
      });
    });

    it('should return error if location is missing', async () => {
      req.query = {};

      await recommendationController.getWeatherRecommendations(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(weatherService.getWeatherRecommendations).not.toHaveBeenCalled();
    });
  });

  describe('recordInteraction', () => {
    it('should record interaction successfully', async () => {
      req.body = { recommendationId: 'rec-123', action: 'click', menuItemId: 'item-456' };

      await recommendationController.recordInteraction(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'تم تسجيل التفاعل بنجاح'
      });
    });
  });

  describe('getSavedRecommendations', () => {
    it('should get saved recommendations successfully', async () => {
      const mockSaved = [
        { id: 'saved-1', menuItemId: 'item-1', savedAt: new Date() },
        { id: 'saved-2', menuItemId: 'item-2', savedAt: new Date() }
      ];

      recommendationService.getSavedRecommendations.mockResolvedValue(mockSaved);

      await recommendationController.getSavedRecommendations(req, res);

      expect(recommendationService.getSavedRecommendations).toHaveBeenCalledWith('user-123');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockSaved
      });
    });
  });
});

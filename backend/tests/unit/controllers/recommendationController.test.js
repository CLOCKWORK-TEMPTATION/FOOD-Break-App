/**
 * Recommendation Controller Unit Tests
 * اختبارات وحدة متحكم التوصيات
 */

const recommendationController = require('../../../src/controllers/recommendationController');
const recommendationService = require('../../../src/services/recommendationService');

jest.mock('../../../src/services/recommendationService');

describe('Recommendation Controller', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      user: { id: 'test-user-id' },
      body: {},
      params: {},
      query: {}
    };
    mockRes = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('getRecommendations', () => {
    it('should return personalized recommendations', async () => {
      const mockRecommendations = [
        {
          id: 'rec-1',
          menuItemId: 'menu-1',
          score: 0.95,
          reason: 'يفضل الأطباق الإيطالية'
        }
      ];

      recommendationService.getPersonalizedRecommendations.mockResolvedValue(mockRecommendations);

      await recommendationController.getRecommendations(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockRecommendations
      });
    });

    it('should filter by type when provided', async () => {
      mockReq.query.type = 'WEATHER_BASED';

      recommendationService.getRecommendationsByType.mockResolvedValue([]);

      await recommendationController.getRecommendations(mockReq, mockRes, mockNext);

      expect(recommendationService.getRecommendationsByType).toHaveBeenCalledWith(
        'test-user-id',
        'WEATHER_BASED'
      );
    });

    it('should handle service errors', async () => {
      recommendationService.getPersonalizedRecommendations.mockRejectedValue(
        new Error('Service unavailable')
      );

      await recommendationController.getRecommendations(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('generateRecommendations', () => {
    it('should generate new recommendations', async () => {
      const mockGenerated = [
        {
          id: 'new-rec-1',
          menuItemId: 'menu-2',
          recommendationType: 'PERSONALIZED'
        }
      ];

      recommendationService.generateRecommendations.mockResolvedValue(mockGenerated);

      await recommendationController.generateRecommendations(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockGenerated,
        count: mockGenerated.length
      });
    });
  });

  describe('getRecommendationById', () => {
    it('should return recommendation by id', async () => {
      const mockRec = {
        id: 'rec-1',
        menuItemId: 'menu-1',
        score: 0.95
      };

      mockReq.params.id = 'rec-1';

      recommendationService.getRecommendationById.mockResolvedValue(mockRec);

      await recommendationController.getRecommendationById(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockRec
      });
    });

    it('should return 404 for non-existent recommendation', async () => {
      mockReq.params.id = 'non-existent';

      recommendationService.getRecommendationById.mockResolvedValue(null);

      await recommendationController.getRecommendationById(mockReq, mockRes, mockNext);

      const error = mockNext.mock.calls[0][0];
      expect(error.statusCode).toBe(404);
    });
  });

  describe('dismissRecommendation', () => {
    it('should mark recommendation as inactive', async () => {
      mockReq.params.id = 'rec-1';

      recommendationService.dismissRecommendation.mockResolvedValue(true);

      await recommendationController.dismissRecommendation(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'تم تجاهل التوصية'
      });
    });
  });

  describe('updateRecommendationPreferences', () => {
    it('should update user preferences', async () => {
      const mockPrefs = {
        allowRecommendations: true,
        diversityFactor: 0.7
      };

      mockReq.body = mockPrefs;

      recommendationService.updatePreferences.mockResolvedValue(mockPrefs);

      await recommendationController.updateRecommendationPreferences(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockPrefs
      });
    });
  });

  describe('getTrendingItems', () => {
    it('should return trending menu items', async () => {
      const mockTrending = [
        { menuItemId: 'menu-1', orderCount: 150 },
        { menuItemId: 'menu-2', orderCount: 125 }
      ];

      recommendationService.getTrendingItems.mockResolvedValue(mockTrending);

      await recommendationController.getTrendingItems(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockTrending
      });
    });

    it('should limit results when limit query is provided', async () => {
      mockReq.query.limit = '10';

      recommendationService.getTrendingItems.mockResolvedValue([]);

      await recommendationController.getTrendingItems(mockReq, mockRes, mockNext);

      expect(recommendationService.getTrendingItems).toHaveBeenCalledWith(10);
    });
  });
});

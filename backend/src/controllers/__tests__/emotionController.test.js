/**
 * Tests for Emotion Controller
 */

jest.mock('../../services/emotionService');

const emotionController = require('../emotionController');
const emotionService = require('../../services/emotionService');

describe('Emotion Controller', () => {
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

  describe('logEmotion', () => {
    it('should log user emotion successfully', async () => {
      req.body = {
        emotion: 'HAPPY',
        intensity: 8,
        notes: 'Feeling great today'
      };

      emotionService.logEmotion = jest.fn().mockResolvedValue({
        id: 'emotion123',
        userId: 'user123',
        ...req.body,
        createdAt: new Date()
      });

      await emotionController.logEmotion(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });

    it('should validate emotion type', async () => {
      req.body = {
        emotion: 'INVALID_EMOTION',
        intensity: 5
      };

      await emotionController.logEmotion(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getEmotionHistory', () => {
    it('should get user emotion history', async () => {
      req.query = { startDate: '2025-01-01', endDate: '2025-01-31' };

      emotionService.getEmotionHistory = jest.fn().mockResolvedValue([
        { id: 'emotion1', emotion: 'HAPPY', intensity: 8 },
        { id: 'emotion2', emotion: 'SAD', intensity: 3 }
      ]);

      await emotionController.getEmotionHistory(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array)
        })
      );
    });
  });

  describe('getEmotionAnalytics', () => {
    it('should get emotion analytics', async () => {
      emotionService.analyzeEmotions = jest.fn().mockResolvedValue({
        mostCommon: 'HAPPY',
        averageIntensity: 6.5,
        emotionBreakdown: {
          HAPPY: 60,
          NEUTRAL: 30,
          SAD: 10
        }
      });

      await emotionController.getEmotionAnalytics(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });
  });

  describe('getMoodRecommendations', () => {
    it('should get food recommendations based on mood', async () => {
      req.body = { emotion: 'SAD', intensity: 7 };

      emotionService.getMoodBasedRecommendations = jest.fn().mockResolvedValue([
        { id: 'item1', name: 'Comfort Food', category: 'Main Course' },
        { id: 'item2', name: 'Chocolate Cake', category: 'Dessert' }
      ]);

      await emotionController.getMoodRecommendations(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array)
        })
      );
    });
  });

  describe('getEmotionTrends', () => {
    it('should get emotion trends over time', async () => {
      req.query = { period: 'week' };

      emotionService.getEmotionTrends = jest.fn().mockResolvedValue({
        trend: 'improving',
        weeklyAverage: 7.2,
        data: [
          { date: '2025-01-01', averageIntensity: 6.5 },
          { date: '2025-01-08', averageIntensity: 7.8 }
        ]
      });

      await emotionController.getEmotionTrends(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });
  });
});

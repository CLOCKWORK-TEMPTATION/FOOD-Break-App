const emotionController = require('../../../src/controllers/emotionController');
const emotionService = require('../../../src/services/emotionService');

jest.mock('../../../src/services/emotionService');
jest.mock('../../../src/utils/logger');

describe('Emotion Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: { id: 'user-123' },
      body: {},
      query: {},
      ip: '127.0.0.1',
      headers: { 'user-agent': 'test-agent' },
      t: jest.fn((key) => key) // Mock localization function
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('logMood', () => {
    it('should log mood successfully', async () => {
      req.body = { mood: 'HAPPY', intensity: 8, notes: 'Great day' };
      emotionService.logMood.mockResolvedValue({ id: 'log-1', mood: 'HAPPY' });

      await emotionController.logMood(req, res);

      expect(emotionService.logMood).toHaveBeenCalledWith('user-123', {
        mood: 'HAPPY',
        intensity: 8,
        notes: 'Great day',
        context: undefined
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { id: 'log-1', mood: 'HAPPY' }
      });
    });

    it('should use userId from token only', async () => {
      req.body = { userId: 'hacker-id', mood: 'HAPPY', intensity: 8 };
      emotionService.logMood.mockResolvedValue({ id: 'log-1' });

      await emotionController.logMood(req, res);

      expect(emotionService.logMood).toHaveBeenCalledWith('user-123', expect.any(Object));
    });
  });

  describe('getRecommendations', () => {
    it('should get recommendations successfully', async () => {
      req.query = { mood: 'STRESSED' };
      emotionService.getMoodRecommendations.mockResolvedValue([
        { name: 'Comfort Food', score: 0.9 }
      ]);

      await emotionController.getRecommendations(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [{ name: 'Comfort Food', score: 0.9 }]
      });
    });

    it('should reject request without mood', async () => {
      req.query = {};

      await emotionController.getRecommendations(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Mood is required'
      });
    });
  });

  describe('updateConsent', () => {
    it('should update consent successfully', async () => {
      req.body = { type: 'EMOTION_TRACKING', status: true, version: '1.0' };
      emotionService.recordConsent.mockResolvedValue({ id: 'consent-1' });

      await emotionController.updateConsent(req, res);

      expect(emotionService.recordConsent).toHaveBeenCalledWith(
        'user-123',
        'EMOTION_TRACKING',
        true,
        {
          ip: '127.0.0.1',
          agent: 'test-agent',
          version: '1.0'
        }
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { id: 'consent-1' }
      });
    });
  });
});

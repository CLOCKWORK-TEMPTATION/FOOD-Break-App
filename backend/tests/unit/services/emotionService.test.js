const emotionService = require('../../../src/services/emotionService');

describe('Emotion Service', () => {
  let mockPrisma;

  beforeEach(() => {
    mockPrisma = global.mockPrisma;
    jest.clearAllMocks();
  });

  describe('logMood', () => {
    it('should log mood successfully', async () => {
      const moodData = { mood: 'HAPPY', intensity: 8, notes: 'Great day' };
      mockPrisma.userMoodLog.create.mockResolvedValue({ id: 'log-1', ...moodData });

      const result = await emotionService.logMood('user-123', moodData);

      expect(mockPrisma.userMoodLog.create).toHaveBeenCalled();
      expect(result.mood).toBe('HAPPY');
    });
  });

  describe('getMoodRecommendations', () => {
    it('should return recommendations based on mood', async () => {
      mockPrisma.menuItem.findMany.mockResolvedValue([
        { id: 'item-1', name: 'Comfort Burger', description: 'Warm comfort food' }
      ]);

      const result = await emotionService.getMoodRecommendations('user-123', 'STRESSED');

      expect(result.mood).toBe('STRESSED');
      expect(result.recommendationType).toBe('EMOTIONAL_COMFORT');
      expect(Array.isArray(result.items)).toBe(true);
    });
  });

  describe('recordConsent', () => {
    it('should record user consent', async () => {
      const consentData = { type: 'EMOTION_TRACKING', status: true };
      mockPrisma.consentRecord.create.mockResolvedValue({ id: 'consent-1', ...consentData });

      const result = await emotionService.recordConsent('user-123', 'EMOTION_TRACKING', true, {});

      expect(mockPrisma.consentRecord.create).toHaveBeenCalled();
    });
  });
});

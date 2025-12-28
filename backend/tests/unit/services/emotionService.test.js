const emotionService = require('../../../src/services/emotionService');
const { PrismaClient } = require('@prisma/client');

jest.mock('@prisma/client');

describe('Emotion Service', () => {
  let mockPrisma;

  beforeEach(() => {
    mockPrisma = new PrismaClient();
    jest.clearAllMocks();
  });

  describe('logMood', () => {
    it('should log mood successfully', async () => {
      const moodData = { mood: 'HAPPY', intensity: 8, notes: 'Great day' };
      mockPrisma.emotionLog.create.mockResolvedValue({ id: 'log-1', ...moodData });

      const result = await emotionService.logMood('user-123', moodData);

      expect(mockPrisma.emotionLog.create).toHaveBeenCalled();
      expect(result.mood).toBe('HAPPY');
    });
  });

  describe('getMoodRecommendations', () => {
    it('should return recommendations based on mood', async () => {
      mockPrisma.emotionLog.findMany.mockResolvedValue([
        { mood: 'STRESSED', menuItemId: 'item-1' }
      ]);

      const result = await emotionService.getMoodRecommendations('user-123', 'STRESSED');

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('recordConsent', () => {
    it('should record user consent', async () => {
      const consentData = { type: 'EMOTION_TRACKING', status: true };
      mockPrisma.userConsent.create.mockResolvedValue({ id: 'consent-1', ...consentData });

      const result = await emotionService.recordConsent('user-123', 'EMOTION_TRACKING', true, {});

      expect(mockPrisma.userConsent.create).toHaveBeenCalled();
    });
  });
});

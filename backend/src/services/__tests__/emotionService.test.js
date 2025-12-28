const emotionService = require('../../emotionService');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('EmotionService', () => {
  let testUser;

  beforeAll(async () => {
    testUser = await prisma.user.create({
      data: { email: 'emotion@test.com', passwordHash: 'hash', firstName: 'Test', lastName: 'User' }
    });
  });

  afterAll(async () => {
    await prisma.userMoodLog.deleteMany();
    await prisma.consentRecord.deleteMany();
    await prisma.user.deleteMany({ where: { email: 'emotion@test.com' } });
    await prisma.$disconnect();
  });

  describe('logMood', () => {
    it('should log mood successfully', async () => {
      const log = await emotionService.logMood(testUser.id, {
        mood: 'HAPPY',
        intensity: 8,
        notes: 'Great day!',
        context: 'break'
      });

      expect(log).toBeDefined();
      expect(log.mood).toBe('HAPPY');
      expect(log.sentimentScore).toBeDefined();
    });

    it('should analyze sentiment for negative mood', async () => {
      const log = await emotionService.logMood(testUser.id, {
        mood: 'STRESSED',
        intensity: 7,
        notes: 'Hard day',
        context: 'shooting'
      });

      expect(log.sentimentScore).toBeLessThan(0);
    });

    it('should generate suggestions', async () => {
      const log = await emotionService.logMood(testUser.id, {
        mood: 'TIRED',
        intensity: 6,
        notes: 'Need energy'
      });

      expect(log.suggestedAction).toBeDefined();
      expect(log.suggestedAction).toContain('protein');
    });
  });

  describe('getMoodRecommendations', () => {
    it('should return recommendations for stressed mood', async () => {
      const recommendations = await emotionService.getMoodRecommendations(testUser.id, 'STRESSED');

      expect(recommendations).toHaveProperty('mood');
      expect(recommendations).toHaveProperty('items');
      expect(Array.isArray(recommendations.items)).toBe(true);
    });

    it('should return energy recommendations for tired mood', async () => {
      const recommendations = await emotionService.getMoodRecommendations(testUser.id, 'TIRED');

      expect(recommendations.recommendationType).toBe('ENERGY_BOOST');
    });
  });

  describe('analyzeSentiment', () => {
    it('should return negative score for negative text', () => {
      const score = emotionService.analyzeSentiment('bad hard tired', 'SAD');
      expect(score).toBeLessThan(0);
    });

    it('should return positive score for positive text', () => {
      const score = emotionService.analyzeSentiment('good great love', 'HAPPY');
      expect(score).toBeGreaterThan(0);
    });

    it('should handle null text', () => {
      const score = emotionService.analyzeSentiment(null, 'CALM');
      expect(score).toBeDefined();
    });
  });

  describe('recordConsent', () => {
    it('should record consent', async () => {
      const consent = await emotionService.recordConsent(
        testUser.id,
        'AI_ANALYSIS',
        'GRANTED',
        { ip: '127.0.0.1', agent: 'test', version: '1.0' }
      );

      expect(consent).toBeDefined();
      expect(consent.type).toBe('AI_ANALYSIS');
      expect(consent.status).toBe('GRANTED');
    });
  });

  describe('getUserConsents', () => {
    it('should get user consents', async () => {
      await emotionService.recordConsent(testUser.id, 'PRIVACY_POLICY', 'GRANTED');

      const consents = await emotionService.getUserConsents(testUser.id);

      expect(Array.isArray(consents)).toBe(true);
      expect(consents.length).toBeGreaterThan(0);
    });
  });
});

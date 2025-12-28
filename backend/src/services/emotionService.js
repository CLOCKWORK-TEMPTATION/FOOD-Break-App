const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class EmotionService {

  /**
   * Log a user's mood
   */
  async logMood(userId, data) {
    // 1. Simulating Sentiment Analysis (in real app, use NLP lib or API)
    const sentimentScore = this.analyzeSentiment(data.notes, data.mood);

    // 2. Save Log
    const log = await prisma.userMoodLog.create({
      data: {
        userId,
        mood: data.mood,
        intensity: data.intensity,
        notes: data.notes,
        context: data.context,
        sentimentScore,
        suggestedAction: this.generateSuggestion(data.mood, sentimentScore)
      }
    });

    // 3. Update Profile stats (async)
    // this.updateEmotionProfile(userId, log);

    return log;
  }

  /**
   * Get Recommendations based on Mood
   */
  async getMoodRecommendations(userId, mood) {
    // Feature #28: Comfort food for stress, Energy for tired
    let tags = [];
    let category = '';

    switch (mood) {
      case 'STRESSED':
      case 'SAD':
      case 'ANXIOUS':
        tags = ['comfort', 'warm', 'chocolate', 'sweet'];
        break;
      case 'TIRED':
        tags = ['energy', 'protein', 'coffee', 'vitamin'];
        category = 'Health';
        break;
      case 'EXCITED':
      case 'HAPPY':
        tags = ['treat', 'shareable', 'premium'];
        break;
      default:
        tags = ['balanced'];
    }

    // Find Menu Items matching these "virtual" tags 
    // (In real app, MenuItem should have tags field or description search)
    const items = await prisma.menuItem.findMany({
      where: {
        OR: [
          { description: { contains: tags[0], mode: 'insensitive' } },
          { name: { contains: tags[0], mode: 'insensitive' } }
        ],
        isAvailable: true
      },
      take: 5
    });

    return {
      mood,
      recommendationType: mood === 'TIRED' ? 'ENERGY_BOOST' : 'EMOTIONAL_COMFORT',
      items
    };
  }

  /**
   * Internal: Simple Sentiment Analysis Mock
   */
  analyzeSentiment(text, moodBase) {
    // -1 (Negative) to 1 (Positive)
    const negativeMoods = ['SAD', 'STRESSED', 'ANXIOUS', 'TIRED', 'HUNGRY'];
    const positiveMoods = ['HAPPY', 'EXCITED', 'CALM', 'FOCUSED'];

    let score = 0;
    if (negativeMoods.includes(moodBase)) score -= 0.5;
    if (positiveMoods.includes(moodBase)) score += 0.5;

    // Basic heuristic
    if (text) {
      if (text.includes('bad') || text.includes('hard') || text.includes('tired')) score -= 0.3;
      if (text.includes('good') || text.includes('great') || text.includes('love')) score += 0.3;
    }

    return Math.max(-1, Math.min(1, score));
  }

  generateSuggestion(mood, score) {
    if (mood === 'STRESSED') return "Take a 5 min breathing break.";
    if (mood === 'TIRED') return "Hydrate and get a protein snack.";
    if (mood === 'HUNGRY') return "Order a nutritious meal now.";
    return "Keep up the good work!";
  }

  // --- Compliance Methods ---

  async recordConsent(userId, type, status, meta = {}) {
    return await prisma.consentRecord.create({
      data: {
        userId,
        type,
        status,
        ipAddress: meta.ip,
        userAgent: meta.agent,
        version: meta.version || '1.0'
      }
    });
  }

  async getUserConsents(userId) {
    return await prisma.consentRecord.findMany({
      where: { userId },
      orderBy: { consentedAt: 'desc' },
      distinct: ['type'] // Get latest per type
    });
  }
}

module.exports = new EmotionService();

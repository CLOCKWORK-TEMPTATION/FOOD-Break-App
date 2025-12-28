const emotionService = require('../services/emotionService');

class EmotionController {

  // POST /api/emotion/log
  async logMood(req, res) {
    try {
      const { mood, intensity, notes, context } = req.body;
      // Assuming req.user is populated by auth middleware
      const userId = req.user?.id || req.body.userId; // Fallback for dev

      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const log = await emotionService.logMood(userId, { mood, intensity, notes, context });
      res.json({ success: true, data: log });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Failed to log mood' });
    }
  }

  // GET /api/emotion/recommendations
  async getRecommendations(req, res) {
    try {
      const { mood } = req.query;
      const userId = req.user?.id || req.query.userId;

      if (!mood) return res.status(400).json({ message: 'Mood is required' });

      const recs = await emotionService.getMoodRecommendations(userId, mood);
      res.json({ success: true, data: recs });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Failed to get recommendations' });
    }
  }

  // POST /api/emotion/consent
  async updateConsent(req, res) {
    try {
      const { type, status, version } = req.body;
      const userId = req.user?.id || req.body.userId;

      const meta = {
        ip: req.ip,
        agent: req.headers['user-agent'],
        version
      };

      const record = await emotionService.recordConsent(userId, type, status, meta);
      res.json({ success: true, data: record });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Failed to update consent' });
    }
  }
}

module.exports = new EmotionController();

const emotionService = require('../services/emotionService');

class EmotionController {

  // POST /api/emotion/log
  async logMood(req, res) {
    try {
      const { mood, intensity, notes, context } = req.body;
      // SECURITY: userId MUST come from authenticated token only
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ 
          success: false,
          message: 'Unauthorized: Authentication required' 
        });
      }

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
      // SECURITY: userId MUST come from authenticated token only
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ 
          success: false,
          message: 'Unauthorized: Authentication required' 
        });
      }

      if (!mood) {
        return res.status(400).json({ 
          success: false,
          message: 'Mood is required' 
        });
      }

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
      // SECURITY: userId MUST come from authenticated token only
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ 
          success: false,
          message: 'Unauthorized: Authentication required' 
        });
      }

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

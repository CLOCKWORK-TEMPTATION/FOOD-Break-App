const emotionService = require('../services/emotionService');
const logger = require('../utils/logger');

class EmotionController {

  // POST /api/emotion/log
  async logMood(req, res) {
    try {
      const { mood, intensity, notes, context } = req.body;
      // Security: استخدام userId من الـ token فقط - لا نقبله من body
      // Why: منع المستخدمين من تسجيل حالات مزاجية باسم آخرين
      const userId = req.user.id;

      const log = await emotionService.logMood(userId, { mood, intensity, notes, context });
      res.json({ success: true, data: log });
    } catch (error) {
      logger.error('خطأ في تسجيل الحالة المزاجية:', error.message);
      res.status(500).json({ success: false, message: 'Failed to log mood' });
    }
  }

  // GET /api/emotion/recommendations
  async getRecommendations(req, res) {
    try {
      const { mood } = req.query;
      // Security: استخدام userId من الـ token فقط
      const userId = req.user.id;

      if (!mood) return res.status(400).json({ message: 'Mood is required' });

      const recs = await emotionService.getMoodRecommendations(userId, mood);
      res.json({ success: true, data: recs });
    } catch (error) {
      logger.error('خطأ في جلب التوصيات:', error.message);
      res.status(500).json({ success: false, message: 'Failed to get recommendations' });
    }
  }

  // POST /api/emotion/consent
  async updateConsent(req, res) {
    try {
      const { type, status, version } = req.body;
      // Security: استخدام userId من الـ token فقط
      const userId = req.user.id;

      const meta = {
        ip: req.ip,
        agent: req.headers['user-agent'],
        version
      };

      const record = await emotionService.recordConsent(userId, type, status, meta);
      res.json({ success: true, data: record });
    } catch (error) {
      logger.error('خطأ في تحديث الموافقة:', error.message);
      res.status(500).json({ success: false, message: 'Failed to update consent' });
    }
  }
}

module.exports = new EmotionController();

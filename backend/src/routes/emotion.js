const express = require('express');
const router = express.Router();
const emotionController = require('../controllers/emotionController');
const { authenticateToken } = require('../middleware/auth');

// جميع المسارات تحتاج إلى مصادقة
router.use(authenticateToken);

// Mood Routes
router.post('/log', emotionController.logMood);
router.get('/recommendations', emotionController.getRecommendations);

// Consent/Privacy Routes
router.post('/consent', emotionController.updateConsent);

module.exports = router;

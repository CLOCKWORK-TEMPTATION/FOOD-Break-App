const express = require('express');
const router = express.Router();
const emotionController = require('../controllers/emotionController');

// Mood Routes
router.post('/log', emotionController.logMood);
router.get('/recommendations', emotionController.getRecommendations);

// Consent/Privacy Routes
router.post('/consent', emotionController.updateConsent);

module.exports = router;

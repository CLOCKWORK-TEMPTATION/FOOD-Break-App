/**
 * Voice Routes - مسارات الطلب الصوتي
 * Feature #15: Voice Ordering
 */

const express = require('express');
const voiceController = require('../controllers/voiceController');
const { authenticateToken } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { body, query, param } = require('express-validator');

const router = express.Router();

// تطبيق المصادقة على جميع المسارات
router.use(authenticateToken);

/**
 * معالجة أمر صوتي
 * POST /api/voice/process
 */
router.post('/process',
  [
    body('audioData').notEmpty().withMessage('بيانات الصوت مطلوبة'),
    body('language').optional().isIn(['ar', 'en']).withMessage('اللغة غير مدعومة'),
    body('sessionId').optional().isUUID()
  ],
  validateRequest,
  voiceController.processVoiceCommand
);

/**
 * تأكيد الطلب الصوتي
 * POST /api/voice/confirm
 */
router.post('/confirm',
  [
    body('sessionId').isUUID().withMessage('معرف الجلسة مطلوب'),
    body('confirmed').isBoolean().withMessage('حالة التأكيد مطلوبة')
  ],
  validateRequest,
  voiceController.confirmVoiceOrder
);

/**
 * الحصول على الطلب المعتاد
 * GET /api/voice/usual-order
 */
router.get('/usual-order',
  voiceController.getUsualOrder
);

/**
 * البحث الصوتي في القائمة
 * POST /api/voice/search-menu
 */
router.post('/search-menu',
  [
    body('query').notEmpty().withMessage('نص البحث مطلوب'),
    body('restaurantId').optional().isUUID(),
    body('language').optional().isIn(['ar', 'en'])
  ],
  validateRequest,
  voiceController.voiceSearchMenu
);

/**
 * تحويل النص إلى صوت
 * POST /api/voice/text-to-speech
 */
router.post('/text-to-speech',
  [
    body('text').notEmpty().withMessage('النص مطلوب'),
    body('language').optional().isIn(['ar', 'en']),
    body('voice').optional().isIn(['male', 'female'])
  ],
  validateRequest,
  voiceController.textToSpeech
);

/**
 * إعداد تفضيلات الصوت
 * POST /api/voice/preferences
 */
router.post('/preferences',
  [
    body('preferredLanguage').optional().isIn(['ar', 'en']),
    body('voiceSpeed').optional().isIn(['slow', 'normal', 'fast']),
    body('voiceType').optional().isIn(['male', 'female']),
    body('enableVoiceConfirmation').optional().isBoolean(),
    body('enableVoiceShortcuts').optional().isBoolean()
  ],
  validateRequest,
  voiceController.setVoicePreferences
);

/**
 * الحصول على تفضيلات الصوت
 * GET /api/voice/preferences
 */
router.get('/preferences',
  voiceController.getVoicePreferences
);

/**
 * إنشاء اختصار صوتي مخصص
 * POST /api/voice/shortcuts
 */
router.post('/shortcuts',
  [
    body('phrase').notEmpty().withMessage('العبارة الصوتية مطلوبة'),
    body('action').isIn(['ORDER_ITEM', 'ORDER_USUAL', 'SEARCH_MENU', 'CANCEL_ORDER', 'GET_RECOMMENDATIONS']).withMessage('نوع الإجراء غير صحيح'),
    body('parameters').optional().isObject()
  ],
  validateRequest,
  voiceController.createVoiceShortcut
);

/**
 * الحصول على الاختصارات الصوتية
 * GET /api/voice/shortcuts
 */
router.get('/shortcuts',
  voiceController.getVoiceShortcuts
);

/**
 * تدريب نموذج التعرف على الصوت الشخصي
 * POST /api/voice/train-personal-model
 */
router.post('/train-personal-model',
  [
    body('voiceSamples').isArray({ min: 5 }).withMessage('يجب توفير 5 عينات صوتية على الأقل')
  ],
  validateRequest,
  voiceController.trainPersonalVoiceModel
);

/**
 * الحصول على إحصائيات استخدام الصوت
 * GET /api/voice/analytics
 */
router.get('/analytics',
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ],
  validateRequest,
  voiceController.getVoiceAnalytics
);

module.exports = router;
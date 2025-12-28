/**
 * Voice Controller - متحكم الطلب الصوتي
 * Feature #15: Voice Ordering (نظام الطلب الصوتي)
 * 
 * يوفر نظام طلب صوتي متقدم مع:
 * - Voice command processing
 * - Siri/Google Assistant integration
 * - Voice confirmation system
 * - Natural language understanding
 * - Arabic voice support
 */

const voiceService = require('../services/voiceService');
const orderService = require('../services/orderService');
const menuService = require('../services/menuService');
const logger = require('../utils/logger');

/**
 * معالجة أمر صوتي
 * POST /api/voice/process
 */
const processVoiceCommand = async (req, res) => {
  try {
    const { audioData, language = 'ar', sessionId } = req.body;
    const userId = req.user.id;

    if (!audioData) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'AUDIO_DATA_REQUIRED',
          message: req.__('voice.audioDataRequired')
        }
      });
    }

    // تحويل الصوت إلى نص
    const transcription = await voiceService.speechToText(audioData, language);
    
    if (!transcription.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'TRANSCRIPTION_FAILED',
          message: req.__('voice.transcriptionFailed')
        }
      });
    }

    // معالجة الأمر الصوتي
    const commandResult = await voiceService.processVoiceCommand(
      userId,
      transcription.text,
      language,
      sessionId
    );

    res.json({
      success: true,
      data: {
        transcription: transcription.text,
        command: commandResult,
        sessionId: commandResult.sessionId
      }
    });
  } catch (error) {
    logger.error('Error processing voice command:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'VOICE_PROCESSING_ERROR',
        message: req.__('voice.processingFailed')
      }
    });
  }
};

/**
 * تأكيد الطلب الصوتي
 * POST /api/voice/confirm
 */
const confirmVoiceOrder = async (req, res) => {
  try {
    const { sessionId, confirmed } = req.body;
    const userId = req.user.id;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'SESSION_ID_REQUIRED',
          message: req.__('voice.sessionIdRequired')
        }
      });
    }

    const result = await voiceService.confirmVoiceOrder(userId, sessionId, confirmed);

    if (confirmed && result.order) {
      // إنشاء الطلب الفعلي
      const order = await orderService.createOrder(userId, {
        items: result.order.items,
        restaurantId: result.order.restaurantId,
        specialInstructions: result.order.specialInstructions,
        orderSource: 'VOICE'
      });

      res.json({
        success: true,
        data: {
          order,
          message: req.__('voice.orderConfirmed')
        }
      });
    } else {
      res.json({
        success: true,
        data: {
          message: req.__('voice.orderCancelled')
        }
      });
    }
  } catch (error) {
    logger.error('Error confirming voice order:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'VOICE_CONFIRMATION_ERROR',
        message: req.__('voice.confirmationFailed')
      }
    });
  }
};

/**
 * الحصول على الطلب المعتاد للمستخدم
 * GET /api/voice/usual-order
 */
const getUsualOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const usualOrder = await voiceService.getUserUsualOrder(userId);

    if (!usualOrder) {
      return res.json({
        success: true,
        data: null,
        message: req.__('voice.noUsualOrder')
      });
    }

    res.json({
      success: true,
      data: usualOrder
    });
  } catch (error) {
    logger.error('Error getting usual order:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'USUAL_ORDER_ERROR',
        message: req.__('general.serverError')
      }
    });
  }
};

/**
 * البحث الصوتي في القائمة
 * POST /api/voice/search-menu
 */
const voiceSearchMenu = async (req, res) => {
  try {
    const { query, restaurantId, language = 'ar' } = req.body;
    const userId = req.user.id;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'SEARCH_QUERY_REQUIRED',
          message: req.__('validation.searchQueryRequired')
        }
      });
    }

    const searchResults = await voiceService.voiceSearchMenu(
      query,
      restaurantId,
      language,
      userId
    );

    res.json({
      success: true,
      data: searchResults
    });
  } catch (error) {
    logger.error('Error in voice menu search:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'VOICE_SEARCH_ERROR',
        message: req.__('voice.searchFailed')
      }
    });
  }
};

/**
 * تحويل النص إلى صوت (للردود)
 * POST /api/voice/text-to-speech
 */
const textToSpeech = async (req, res) => {
  try {
    const { text, language = 'ar', voice = 'female' } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'TEXT_REQUIRED',
          message: req.__('voice.textRequired')
        }
      });
    }

    const audioResult = await voiceService.textToSpeech(text, language, voice);

    if (!audioResult.success) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'TTS_FAILED',
          message: req.__('voice.ttsGenerationFailed')
        }
      });
    }

    res.json({
      success: true,
      data: {
        audioUrl: audioResult.audioUrl,
        duration: audioResult.duration
      }
    });
  } catch (error) {
    logger.error('Error in text-to-speech:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'TTS_ERROR',
        message: req.__('voice.ttsGenerationFailed')
      }
    });
  }
};

/**
 * إعداد تفضيلات الصوت
 * POST /api/voice/preferences
 */
const setVoicePreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      preferredLanguage,
      voiceSpeed,
      voiceType,
      enableVoiceConfirmation,
      enableVoiceShortcuts
    } = req.body;

    const preferences = await voiceService.setVoicePreferences(userId, {
      preferredLanguage,
      voiceSpeed,
      voiceType,
      enableVoiceConfirmation,
      enableVoiceShortcuts
    });

    res.json({
      success: true,
      data: preferences,
      message: req.__('voice.preferencesUpdated')
    });
  } catch (error) {
    logger.error('Error setting voice preferences:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'PREFERENCES_ERROR',
        message: req.__('voice.preferencesUpdateFailed')
      }
    });
  }
};

/**
 * الحصول على تفضيلات الصوت
 * GET /api/voice/preferences
 */
const getVoicePreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const preferences = await voiceService.getVoicePreferences(userId);

    res.json({
      success: true,
      data: preferences || {
        preferredLanguage: 'ar',
        voiceSpeed: 'normal',
        voiceType: 'female',
        enableVoiceConfirmation: true,
        enableVoiceShortcuts: true
      }
    });
  } catch (error) {
    logger.error('Error getting voice preferences:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'PREFERENCES_FETCH_ERROR',
        message: req.__('general.serverError')
      }
    });
  }
};

/**
 * إنشاء اختصار صوتي مخصص
 * POST /api/voice/shortcuts
 */
const createVoiceShortcut = async (req, res) => {
  try {
    const userId = req.user.id;
    const { phrase, action, parameters } = req.body;

    if (!phrase || !action) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: req.__('validation.required')
        }
      });
    }

    const shortcut = await voiceService.createVoiceShortcut(userId, {
      phrase,
      action,
      parameters
    });

    res.status(201).json({
      success: true,
      data: shortcut,
      message: req.__('voice.shortcutCreated')
    });
  } catch (error) {
    logger.error('Error creating voice shortcut:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SHORTCUT_CREATION_ERROR',
        message: req.__('voice.shortcutCreationFailed')
      }
    });
  }
};

/**
 * الحصول على الاختصارات الصوتية
 * GET /api/voice/shortcuts
 */
const getVoiceShortcuts = async (req, res) => {
  try {
    const userId = req.user.id;
    const shortcuts = await voiceService.getVoiceShortcuts(userId);

    res.json({
      success: true,
      data: shortcuts
    });
  } catch (error) {
    logger.error('Error getting voice shortcuts:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SHORTCUTS_FETCH_ERROR',
        message: req.__('general.serverError')
      }
    });
  }
};

/**
 * تدريب نموذج التعرف على الصوت الشخصي
 * POST /api/voice/train-personal-model
 */
const trainPersonalVoiceModel = async (req, res) => {
  try {
    const userId = req.user.id;
    const { voiceSamples } = req.body;

    if (!voiceSamples || voiceSamples.length < 5) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_VOICE_SAMPLES',
          message: req.__('voice.insufficientVoiceSamples')
        }
      });
    }

    const trainingResult = await voiceService.trainPersonalVoiceModel(
      userId,
      voiceSamples
    );

    res.json({
      success: true,
      data: trainingResult,
      message: req.__('voice.personalModelTrained')
    });
  } catch (error) {
    logger.error('Error training personal voice model:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'VOICE_TRAINING_ERROR',
        message: req.__('voice.trainingFailed')
      }
    });
  }
};

/**
 * الحصول على إحصائيات استخدام الصوت
 * GET /api/voice/analytics
 */
const getVoiceAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    const analytics = await voiceService.getVoiceAnalytics(userId, {
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null
    });

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error('Error getting voice analytics:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ANALYTICS_ERROR',
        message: req.__('general.serverError')
      }
    });
  }
};

module.exports = {
  processVoiceCommand,
  confirmVoiceOrder,
  getUsualOrder,
  voiceSearchMenu,
  textToSpeech,
  setVoicePreferences,
  getVoicePreferences,
  createVoiceShortcut,
  getVoiceShortcuts,
  trainPersonalVoiceModel,
  getVoiceAnalytics
};
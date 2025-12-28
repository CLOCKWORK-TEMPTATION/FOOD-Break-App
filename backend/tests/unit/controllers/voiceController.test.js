/**
 * Voice Controller Tests
 * اختبارات متحكم الطلب الصوتي - Phase 4 Feature
 */

const voiceController = require('../../../src/controllers/voiceController');
const voiceService = require('../../../src/services/voiceService');
const { createMockRequest, createMockResponse, createMockNext } = require('../../utils/testHelpers');

// Mock the voice service
jest.mock('../../../src/services/voiceService');

describe('Voice Controller', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockNext = createMockNext();
    jest.clearAllMocks();
  });

  describe('processVoiceCommand', () => {
    it('should process voice command successfully', async () => {
      const mockResult = {
        sessionId: 'session-1',
        transcription: 'أريد برجر مع بطاطس',
        intent: 'ORDER_ITEM',
        confidence: 0.95,
        extractedItems: [
          { name: 'برجر', quantity: 1 },
          { name: 'بطاطس', quantity: 1 }
        ],
        requiresConfirmation: true
      };

      mockReq.body = {
        audioData: 'base64-audio-data',
        language: 'ar',
        sessionId: 'session-1'
      };

      voiceService.processVoiceCommand.mockResolvedValue(mockResult);

      await voiceController.processVoiceCommand(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult
      });
    });

    it('should handle low confidence transcription', async () => {
      const mockResult = {
        sessionId: 'session-1',
        transcription: 'unclear audio',
        intent: 'UNCLEAR',
        confidence: 0.3,
        requiresClarification: true
      };

      mockReq.body = {
        audioData: 'base64-audio-data',
        language: 'ar'
      };

      voiceService.processVoiceCommand.mockResolvedValue(mockResult);

      await voiceController.processVoiceCommand(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult
      });
    });

    it('should handle voice processing errors', async () => {
      mockReq.body = {
        audioData: 'invalid-audio-data'
      };

      voiceService.processVoiceCommand.mockRejectedValue(new Error('Audio processing failed'));

      await voiceController.processVoiceCommand(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          code: 'VOICE_PROCESSING_FAILED',
          message: expect.any(String)
        })
      });
    });
  });

  describe('confirmVoiceOrder', () => {
    it('should confirm voice order successfully', async () => {
      const mockOrder = {
        id: 'order-1',
        sessionId: 'session-1',
        status: 'CONFIRMED',
        items: [
          { name: 'برجر', quantity: 1, price: 25 }
        ],
        totalAmount: 25
      };

      mockReq.body = {
        sessionId: 'session-1',
        confirmed: true
      };

      voiceService.confirmVoiceOrder.mockResolvedValue(mockOrder);

      await voiceController.confirmVoiceOrder(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockOrder,
        message: expect.any(String)
      });
    });

    it('should handle order cancellation', async () => {
      mockReq.body = {
        sessionId: 'session-1',
        confirmed: false
      };

      voiceService.confirmVoiceOrder.mockResolvedValue({ cancelled: true });

      await voiceController.confirmVoiceOrder(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { cancelled: true },
        message: expect.any(String)
      });
    });
  });

  describe('getUsualOrder', () => {
    it('should return user usual order', async () => {
      const mockUsualOrder = {
        id: 'usual-order-1',
        userId: 'user-1',
        items: [
          { name: 'برجر كلاسيك', quantity: 1, price: 25 },
          { name: 'بطاطس مقلية', quantity: 1, price: 10 }
        ],
        totalAmount: 35,
        frequency: 15
      };

      voiceService.getUsualOrder.mockResolvedValue(mockUsualOrder);

      await voiceController.getUsualOrder(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockUsualOrder
      });
    });

    it('should handle no usual order found', async () => {
      voiceService.getUsualOrder.mockResolvedValue(null);

      await voiceController.getUsualOrder(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          code: 'USUAL_ORDER_NOT_FOUND',
          message: expect.any(String)
        })
      });
    });
  });

  describe('voiceSearchMenu', () => {
    it('should search menu items by voice query', async () => {
      const mockResults = [
        {
          id: 'item-1',
          name: 'برجر كلاسيك',
          description: 'برجر لحم مع خضار',
          price: 25,
          matchScore: 0.9
        }
      ];

      mockReq.body = {
        query: 'برجر',
        restaurantId: 'restaurant-1',
        language: 'ar'
      };

      voiceService.voiceSearchMenu.mockResolvedValue(mockResults);

      await voiceController.voiceSearchMenu(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockResults
      });
    });
  });

  describe('textToSpeech', () => {
    it('should convert text to speech successfully', async () => {
      const mockAudio = {
        audioData: 'base64-audio-data',
        format: 'mp3',
        duration: 3.5,
        language: 'ar'
      };

      mockReq.body = {
        text: 'تم تأكيد طلبك بنجاح',
        language: 'ar',
        voice: 'female'
      };

      voiceService.textToSpeech.mockResolvedValue(mockAudio);

      await voiceController.textToSpeech(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockAudio
      });
    });
  });

  describe('setVoicePreferences', () => {
    it('should set voice preferences successfully', async () => {
      const mockPreferences = {
        id: 'pref-1',
        userId: 'user-1',
        preferredLanguage: 'ar',
        voiceSpeed: 'normal',
        voiceType: 'female',
        enableVoiceConfirmation: true,
        enableVoiceShortcuts: true
      };

      mockReq.body = {
        preferredLanguage: 'ar',
        voiceSpeed: 'normal',
        voiceType: 'female',
        enableVoiceConfirmation: true,
        enableVoiceShortcuts: true
      };

      voiceService.setVoicePreferences.mockResolvedValue(mockPreferences);

      await voiceController.setVoicePreferences(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockPreferences,
        message: expect.any(String)
      });
    });
  });

  describe('getVoicePreferences', () => {
    it('should return voice preferences', async () => {
      const mockPreferences = {
        preferredLanguage: 'ar',
        voiceSpeed: 'normal',
        voiceType: 'female',
        enableVoiceConfirmation: true
      };

      voiceService.getVoicePreferences.mockResolvedValue(mockPreferences);

      await voiceController.getVoicePreferences(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockPreferences
      });
    });
  });

  describe('createVoiceShortcut', () => {
    it('should create voice shortcut successfully', async () => {
      const mockShortcut = {
        id: 'shortcut-1',
        userId: 'user-1',
        phrase: 'اطلب لي المعتاد',
        action: 'ORDER_USUAL',
        parameters: {},
        isActive: true
      };

      mockReq.body = {
        phrase: 'اطلب لي المعتاد',
        action: 'ORDER_USUAL',
        parameters: {}
      };

      voiceService.createVoiceShortcut.mockResolvedValue(mockShortcut);

      await voiceController.createVoiceShortcut(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockShortcut,
        message: expect.any(String)
      });
    });
  });

  describe('getVoiceShortcuts', () => {
    it('should return user voice shortcuts', async () => {
      const mockShortcuts = [
        {
          id: 'shortcut-1',
          phrase: 'اطلب لي المعتاد',
          action: 'ORDER_USUAL',
          isActive: true
        },
        {
          id: 'shortcut-2',
          phrase: 'ألغي الطلب',
          action: 'CANCEL_ORDER',
          isActive: true
        }
      ];

      voiceService.getVoiceShortcuts.mockResolvedValue(mockShortcuts);

      await voiceController.getVoiceShortcuts(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockShortcuts
      });
    });
  });

  describe('trainPersonalVoiceModel', () => {
    it('should train personal voice model successfully', async () => {
      const mockTraining = {
        id: 'training-1',
        userId: 'user-1',
        status: 'TRAINING',
        samplesCount: 5,
        estimatedCompletion: new Date()
      };

      mockReq.body = {
        voiceSamples: [
          'sample1-base64',
          'sample2-base64',
          'sample3-base64',
          'sample4-base64',
          'sample5-base64'
        ]
      };

      voiceService.trainPersonalVoiceModel.mockResolvedValue(mockTraining);

      await voiceController.trainPersonalVoiceModel(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockTraining,
        message: expect.any(String)
      });
    });

    it('should require minimum voice samples', async () => {
      mockReq.body = {
        voiceSamples: ['sample1', 'sample2'] // أقل من 5 عينات
      };

      voiceService.trainPersonalVoiceModel.mockRejectedValue(
        new Error('Minimum 5 voice samples required')
      );

      await voiceController.trainPersonalVoiceModel(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getVoiceAnalytics', () => {
    it('should return voice usage analytics', async () => {
      const mockAnalytics = {
        totalCommands: 150,
        successfulCommands: 142,
        failedCommands: 8,
        averageConfidence: 0.87,
        mostUsedCommands: [
          { command: 'ORDER_ITEM', count: 45 },
          { command: 'ORDER_USUAL', count: 32 }
        ],
        languageUsage: {
          ar: 120,
          en: 30
        },
        period: {
          startDate: new Date(),
          endDate: new Date()
        }
      };

      mockReq.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      voiceService.getVoiceAnalytics.mockResolvedValue(mockAnalytics);

      await voiceController.getVoiceAnalytics(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockAnalytics
      });
    });
  });
});
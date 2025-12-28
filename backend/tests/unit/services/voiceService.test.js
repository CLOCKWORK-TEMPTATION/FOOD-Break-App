/**
 * Voice Service Tests
 * اختبارات خدمة الطلب الصوتي - Phase 4 Feature
 */

const voiceService = require('../../../src/services/voiceService');
const { PrismaClient } = require('@prisma/client');

// Mock Prisma Client
jest.mock('@prisma/client');

// Mock external voice processing services
jest.mock('speech-to-text', () => ({
  SpeechToTextV1: jest.fn(() => ({
    recognize: jest.fn().mockResolvedValue({
      result: {
        results: [{
          alternatives: [{
            transcript: 'أريد برجر مع بطاطس',
            confidence: 0.95
          }]
        }]
      }
    })
  }))
}));

jest.mock('text-to-speech', () => ({
  TextToSpeechV1: jest.fn(() => ({
    synthesize: jest.fn().mockResolvedValue({
      result: Buffer.from('audio-data')
    })
  }))
}));

const mockPrisma = {
  voiceSession: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn()
  },
  voicePreferences: {
    findUnique: jest.fn(),
    upsert: jest.fn()
  },
  voiceShortcut: {
    create: jest.fn(),
    findMany: jest.fn()
  },
  voiceAnalytics: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn()
  },
  order: {
    findMany: jest.fn(),
    create: jest.fn()
  },
  menuItem: {
    findMany: jest.fn()
  },
  user: {
    findUnique: jest.fn()
  }
};

PrismaClient.mockImplementation(() => mockPrisma);

describe('Voice Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('processVoiceCommand', () => {
    it('should process Arabic voice command successfully', async () => {
      const voiceData = {
        audioData: 'base64-audio-data',
        language: 'ar',
        sessionId: 'session-1'
      };

      const mockSession = {
        id: 'session-1',
        userId: 'user-1',
        status: 'ACTIVE'
      };

      mockPrisma.voiceSession.findUnique.mockResolvedValue(mockSession);
      mockPrisma.voiceSession.update.mockResolvedValue({
        ...mockSession,
        transcription: 'أريد برجر مع بطاطس',
        confidence: 0.95
      });

      const result = await voiceService.processVoiceCommand('user-1', voiceData);

      expect(result).toEqual({
        sessionId: 'session-1',
        transcription: 'أريد برجر مع بطاطس',
        intent: 'ORDER_ITEM',
        confidence: 0.95,
        extractedItems: expect.arrayContaining([
          expect.objectContaining({
            name: expect.stringContaining('برجر'),
            quantity: 1
          })
        ]),
        requiresConfirmation: true
      });
    });

    it('should handle English voice commands', async () => {
      const voiceData = {
        audioData: 'base64-audio-data',
        language: 'en'
      };

      // Mock English transcription
      const mockTranscription = 'I want a burger with fries';
      
      const result = await voiceService.processVoiceCommand('user-1', voiceData);

      expect(result.intent).toBe('ORDER_ITEM');
      expect(result.language).toBe('en');
    });

    it('should handle low confidence transcription', async () => {
      const voiceData = {
        audioData: 'unclear-audio-data',
        language: 'ar'
      };

      // Mock low confidence transcription
      const mockSession = {
        id: 'session-1',
        transcription: 'unclear speech',
        confidence: 0.3
      };

      mockPrisma.voiceSession.create.mockResolvedValue(mockSession);

      const result = await voiceService.processVoiceCommand('user-1', voiceData);

      expect(result.confidence).toBeLessThan(0.5);
      expect(result.intent).toBe('UNCLEAR');
      expect(result.requiresClarification).toBe(true);
    });

    it('should extract multiple items from complex commands', async () => {
      const voiceData = {
        audioData: 'base64-audio-data',
        language: 'ar'
      };

      // Mock complex command transcription
      const mockTranscription = 'أريد برجرين و ثلاث بطاطس و كوكا كولا';

      const result = await voiceService.processVoiceCommand('user-1', voiceData);

      expect(result.extractedItems).toHaveLength(3);
      expect(result.extractedItems).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: expect.stringContaining('برجر'), quantity: 2 }),
          expect.objectContaining({ name: expect.stringContaining('بطاطس'), quantity: 3 }),
          expect.objectContaining({ name: expect.stringContaining('كوكا'), quantity: 1 })
        ])
      );
    });
  });

  describe('confirmVoiceOrder', () => {
    it('should confirm voice order and create actual order', async () => {
      const confirmationData = {
        sessionId: 'session-1',
        confirmed: true
      };

      const mockSession = {
        id: 'session-1',
        userId: 'user-1',
        extractedItems: [
          { name: 'برجر', quantity: 1, menuItemId: 'item-1' }
        ],
        status: 'PENDING_CONFIRMATION'
      };

      const mockOrder = {
        id: 'order-1',
        userId: 'user-1',
        status: 'CONFIRMED',
        totalAmount: 25,
        items: [
          { menuItemId: 'item-1', quantity: 1, price: 25 }
        ]
      };

      mockPrisma.voiceSession.findUnique.mockResolvedValue(mockSession);
      mockPrisma.order.create.mockResolvedValue(mockOrder);
      mockPrisma.voiceSession.update.mockResolvedValue({
        ...mockSession,
        status: 'CONFIRMED'
      });

      const result = await voiceService.confirmVoiceOrder('user-1', confirmationData);

      expect(result).toEqual(mockOrder);
      expect(mockPrisma.order.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          orderType: 'VOICE',
          items: expect.objectContaining({
            create: expect.arrayContaining([
              expect.objectContaining({
                menuItemId: 'item-1',
                quantity: 1
              })
            ])
          })
        })
      });
    });

    it('should handle order cancellation', async () => {
      const confirmationData = {
        sessionId: 'session-1',
        confirmed: false
      };

      const mockSession = {
        id: 'session-1',
        status: 'PENDING_CONFIRMATION'
      };

      mockPrisma.voiceSession.findUnique.mockResolvedValue(mockSession);
      mockPrisma.voiceSession.update.mockResolvedValue({
        ...mockSession,
        status: 'CANCELLED'
      });

      const result = await voiceService.confirmVoiceOrder('user-1', confirmationData);

      expect(result.cancelled).toBe(true);
      expect(mockPrisma.voiceSession.update).toHaveBeenCalledWith({
        where: { id: 'session-1' },
        data: { status: 'CANCELLED' }
      });
    });
  });

  describe('getUsualOrder', () => {
    it('should return user most frequent order', async () => {
      const mockOrders = [
        {
          items: [
            { menuItem: { name: 'برجر كلاسيك' }, quantity: 1, price: 25 }
          ],
          totalAmount: 25
        },
        {
          items: [
            { menuItem: { name: 'برجر كلاسيك' }, quantity: 1, price: 25 }
          ],
          totalAmount: 25
        }
      ];

      mockPrisma.order.findMany.mockResolvedValue(mockOrders);

      const result = await voiceService.getUsualOrder('user-1');

      expect(result).toEqual({
        items: expect.arrayContaining([
          expect.objectContaining({
            name: 'برجر كلاسيك',
            quantity: 1,
            price: 25
          })
        ]),
        totalAmount: 25,
        frequency: 2
      });
    });

    it('should return null if no frequent orders found', async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);

      const result = await voiceService.getUsualOrder('user-1');

      expect(result).toBeNull();
    });
  });

  describe('voiceSearchMenu', () => {
    it('should search menu items by voice query', async () => {
      const searchData = {
        query: 'برجر',
        restaurantId: 'restaurant-1',
        language: 'ar'
      };

      const mockMenuItems = [
        {
          id: 'item-1',
          name: 'برجر كلاسيك',
          description: 'برجر لحم مع خضار طازجة',
          price: 25,
          isAvailable: true
        },
        {
          id: 'item-2',
          name: 'برجر دجاج',
          description: 'برجر دجاج مشوي',
          price: 22,
          isAvailable: true
        }
      ];

      mockPrisma.menuItem.findMany.mockResolvedValue(mockMenuItems);

      const result = await voiceService.voiceSearchMenu('user-1', searchData);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(
        expect.objectContaining({
          id: 'item-1',
          name: 'برجر كلاسيك',
          matchScore: expect.any(Number)
        })
      );
      
      // التحقق من أن النتائج مرتبة حسب درجة التطابق
      expect(result[0].matchScore).toBeGreaterThanOrEqual(result[1].matchScore);
    });

    it('should handle fuzzy matching for similar words', async () => {
      const searchData = {
        query: 'برقر', // خطأ إملائي
        language: 'ar'
      };

      const mockMenuItems = [
        {
          id: 'item-1',
          name: 'برجر كلاسيك',
          price: 25
        }
      ];

      mockPrisma.menuItem.findMany.mockResolvedValue(mockMenuItems);

      const result = await voiceService.voiceSearchMenu('user-1', searchData);

      expect(result).toHaveLength(1);
      expect(result[0].matchScore).toBeGreaterThan(0.7); // Should still match despite typo
    });
  });

  describe('textToSpeech', () => {
    it('should convert Arabic text to speech', async () => {
      const textData = {
        text: 'تم تأكيد طلبك بنجاح',
        language: 'ar',
        voice: 'female'
      };

      const result = await voiceService.textToSpeech('user-1', textData);

      expect(result).toEqual({
        audioData: expect.any(String),
        format: 'mp3',
        duration: expect.any(Number),
        language: 'ar',
        voice: 'female'
      });
    });

    it('should handle English text to speech', async () => {
      const textData = {
        text: 'Your order has been confirmed successfully',
        language: 'en',
        voice: 'male'
      };

      const result = await voiceService.textToSpeech('user-1', textData);

      expect(result.language).toBe('en');
      expect(result.voice).toBe('male');
    });
  });

  describe('setVoicePreferences', () => {
    it('should set user voice preferences', async () => {
      const preferences = {
        preferredLanguage: 'ar',
        voiceSpeed: 'normal',
        voiceType: 'female',
        enableVoiceConfirmation: true,
        enableVoiceShortcuts: true
      };

      const mockPreferences = {
        id: 'pref-1',
        userId: 'user-1',
        ...preferences,
        updatedAt: new Date()
      };

      mockPrisma.voicePreferences.upsert.mockResolvedValue(mockPreferences);

      const result = await voiceService.setVoicePreferences('user-1', preferences);

      expect(result).toEqual(mockPreferences);
      expect(mockPrisma.voicePreferences.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        update: preferences,
        create: { userId: 'user-1', ...preferences }
      });
    });
  });

  describe('getVoicePreferences', () => {
    it('should return user voice preferences', async () => {
      const mockPreferences = {
        preferredLanguage: 'ar',
        voiceSpeed: 'normal',
        voiceType: 'female',
        enableVoiceConfirmation: true
      };

      mockPrisma.voicePreferences.findUnique.mockResolvedValue(mockPreferences);

      const result = await voiceService.getVoicePreferences('user-1');

      expect(result).toEqual(mockPreferences);
    });

    it('should return default preferences if none exist', async () => {
      mockPrisma.voicePreferences.findUnique.mockResolvedValue(null);

      const result = await voiceService.getVoicePreferences('user-1');

      expect(result).toEqual({
        preferredLanguage: 'ar',
        voiceSpeed: 'normal',
        voiceType: 'female',
        enableVoiceConfirmation: true,
        enableVoiceShortcuts: true
      });
    });
  });

  describe('createVoiceShortcut', () => {
    it('should create custom voice shortcut', async () => {
      const shortcutData = {
        phrase: 'اطلب لي المعتاد',
        action: 'ORDER_USUAL',
        parameters: {}
      };

      const mockShortcut = {
        id: 'shortcut-1',
        userId: 'user-1',
        ...shortcutData,
        isActive: true,
        createdAt: new Date()
      };

      mockPrisma.voiceShortcut.create.mockResolvedValue(mockShortcut);

      const result = await voiceService.createVoiceShortcut('user-1', shortcutData);

      expect(result).toEqual(mockShortcut);
      expect(mockPrisma.voiceShortcut.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          ...shortcutData,
          isActive: true
        }
      });
    });

    it('should validate shortcut phrase uniqueness', async () => {
      const shortcutData = {
        phrase: 'اطلب لي المعتاد',
        action: 'ORDER_USUAL'
      };

      // Mock existing shortcut with same phrase
      mockPrisma.voiceShortcut.findFirst = jest.fn().mockResolvedValue({
        id: 'existing-shortcut',
        phrase: 'اطلب لي المعتاد'
      });

      await expect(voiceService.createVoiceShortcut('user-1', shortcutData))
        .rejects.toThrow('Voice shortcut with this phrase already exists');
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

      mockPrisma.voiceShortcut.findMany.mockResolvedValue(mockShortcuts);

      const result = await voiceService.getVoiceShortcuts('user-1');

      expect(result).toEqual(mockShortcuts);
      expect(mockPrisma.voiceShortcut.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          isActive: true
        },
        orderBy: { createdAt: 'desc' }
      });
    });
  });

  describe('trainPersonalVoiceModel', () => {
    it('should initiate personal voice model training', async () => {
      const trainingData = {
        voiceSamples: [
          'sample1-base64',
          'sample2-base64',
          'sample3-base64',
          'sample4-base64',
          'sample5-base64'
        ]
      };

      const result = await voiceService.trainPersonalVoiceModel('user-1', trainingData);

      expect(result).toEqual({
        id: expect.any(String),
        userId: 'user-1',
        status: 'TRAINING',
        samplesCount: 5,
        estimatedCompletion: expect.any(Date),
        progress: 0
      });
    });

    it('should require minimum voice samples', async () => {
      const trainingData = {
        voiceSamples: ['sample1', 'sample2'] // أقل من 5 عينات
      };

      await expect(voiceService.trainPersonalVoiceModel('user-1', trainingData))
        .rejects.toThrow('Minimum 5 voice samples required for training');
    });
  });

  describe('getVoiceAnalytics', () => {
    it('should return comprehensive voice usage analytics', async () => {
      const filters = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31')
      };

      const mockAnalytics = [
        { command: 'ORDER_ITEM', count: 45, language: 'ar', success: true },
        { command: 'ORDER_USUAL', count: 32, language: 'ar', success: true },
        { command: 'SEARCH_MENU', count: 18, language: 'en', success: true },
        { command: 'ORDER_ITEM', count: 8, language: 'ar', success: false }
      ];

      mockPrisma.voiceAnalytics.findMany.mockResolvedValue(mockAnalytics);

      const result = await voiceService.getVoiceAnalytics('user-1', filters);

      expect(result).toEqual({
        totalCommands: 103,
        successfulCommands: 95,
        failedCommands: 8,
        successRate: expect.closeTo(0.92, 2),
        averageConfidence: expect.any(Number),
        mostUsedCommands: [
          { command: 'ORDER_ITEM', count: 53 },
          { command: 'ORDER_USUAL', count: 32 },
          { command: 'SEARCH_MENU', count: 18 }
        ],
        languageUsage: {
          ar: 85,
          en: 18
        },
        period: {
          startDate: filters.startDate,
          endDate: filters.endDate
        }
      });
    });

    it('should handle empty analytics data', async () => {
      mockPrisma.voiceAnalytics.findMany.mockResolvedValue([]);

      const result = await voiceService.getVoiceAnalytics('user-1', {});

      expect(result.totalCommands).toBe(0);
      expect(result.successfulCommands).toBe(0);
      expect(result.failedCommands).toBe(0);
      expect(result.mostUsedCommands).toEqual([]);
    });
  });
});
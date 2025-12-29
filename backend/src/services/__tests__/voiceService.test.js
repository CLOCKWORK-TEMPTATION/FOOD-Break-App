/**
 * Tests for Voice Service
 */

jest.mock('openai');
jest.mock('@prisma/client');

const { OpenAI } = require('openai');
const { PrismaClient } = require('@prisma/client');
const voiceService = require('../voiceService');

describe('Voice Service', () => {
  let mockOpenAI;
  let mockPrisma;

  beforeEach(() => {
    jest.clearAllMocks();

    mockOpenAI = {
      audio: {
        transcriptions: {
          create: jest.fn()
        },
        speech: {
          create: jest.fn()
        }
      }
    };

    OpenAI.mockImplementation(() => mockOpenAI);

    mockPrisma = {
      voiceCommand: {
        create: jest.fn(),
        findMany: jest.fn()
      },
      order: {
        create: jest.fn()
      },
      restaurant: {
        findMany: jest.fn()
      },
      menuItem: {
        findMany: jest.fn()
      }
    };

    PrismaClient.mockImplementation(() => mockPrisma);
  });

  describe('transcribeAudio', () => {
    it('should transcribe audio successfully', async () => {
      const audioBuffer = Buffer.from('audio data');

      mockOpenAI.audio.transcriptions.create.mockResolvedValue({
        text: 'I want to order a pizza'
      });

      const transcript = await voiceService.transcribeAudio(audioBuffer);

      expect(transcript).toBe('I want to order a pizza');
      expect(mockOpenAI.audio.transcriptions.create).toHaveBeenCalled();
    });

    it('should handle transcription errors', async () => {
      const audioBuffer = Buffer.from('invalid audio');

      mockOpenAI.audio.transcriptions.create.mockRejectedValue(
        new Error('Transcription failed')
      );

      await expect(voiceService.transcribeAudio(audioBuffer)).rejects.toThrow(
        'Transcription failed'
      );
    });
  });

  describe('processVoiceCommand', () => {
    it('should process order command', async () => {
      const userId = 'user123';
      const transcript = 'I want to order a large pizza and cola';

      mockOpenAI.audio.transcriptions.create.mockResolvedValue({
        text: transcript
      });

      mockPrisma.voiceCommand.create.mockResolvedValue({
        id: 'command123',
        userId,
        transcript,
        intent: 'ORDER'
      });

      mockPrisma.restaurant.findMany.mockResolvedValue([
        { id: 'restaurant1', name: 'Pizza Place' }
      ]);

      mockPrisma.menuItem.findMany.mockResolvedValue([
        { id: 'item1', name: 'Large Pizza', price: 150 },
        { id: 'item2', name: 'Cola', price: 20 }
      ]);

      const result = await voiceService.processVoiceCommand(userId, transcript);

      expect(result).toHaveProperty('intent');
      expect(result).toHaveProperty('entities');
    });

    it('should process search command', async () => {
      const userId = 'user123';
      const transcript = 'Find Italian restaurants near me';

      mockPrisma.voiceCommand.create.mockResolvedValue({
        id: 'command123',
        userId,
        transcript,
        intent: 'SEARCH'
      });

      mockPrisma.restaurant.findMany.mockResolvedValue([
        { id: 'r1', name: 'Italian Bistro', cuisineType: 'Italian' }
      ]);

      const result = await voiceService.processVoiceCommand(userId, transcript);

      expect(result.intent).toBe('SEARCH');
      expect(result).toHaveProperty('results');
    });
  });

  describe('textToSpeech', () => {
    it('should convert text to speech', async () => {
      const text = 'Your order has been confirmed';
      const audioBuffer = Buffer.from('audio data');

      mockOpenAI.audio.speech.create.mockResolvedValue({
        arrayBuffer: () => Promise.resolve(audioBuffer.buffer)
      });

      const result = await voiceService.textToSpeech(text);

      expect(Buffer.isBuffer(result)).toBe(true);
      expect(mockOpenAI.audio.speech.create).toHaveBeenCalledWith(
        expect.objectContaining({
          input: text
        })
      );
    });

    it('should support different voices', async () => {
      const text = 'Hello';
      const voice = 'nova';

      mockOpenAI.audio.speech.create.mockResolvedValue({
        arrayBuffer: () => Promise.resolve(Buffer.from('audio').buffer)
      });

      await voiceService.textToSpeech(text, voice);

      expect(mockOpenAI.audio.speech.create).toHaveBeenCalledWith(
        expect.objectContaining({
          voice
        })
      );
    });
  });

  describe('extractIntent', () => {
    it('should extract ORDER intent', () => {
      const transcript = 'I want to order pizza';

      const intent = voiceService.extractIntent(transcript);

      expect(intent).toBe('ORDER');
    });

    it('should extract SEARCH intent', () => {
      const transcript = 'Find Chinese restaurants';

      const intent = voiceService.extractIntent(transcript);

      expect(intent).toBe('SEARCH');
    });

    it('should extract TRACK intent', () => {
      const transcript = 'Where is my order';

      const intent = voiceService.extractIntent(transcript);

      expect(intent).toBe('TRACK');
    });

    it('should extract CANCEL intent', () => {
      const transcript = 'Cancel my order';

      const intent = voiceService.extractIntent(transcript);

      expect(intent).toBe('CANCEL');
    });

    it('should return UNKNOWN for unclear intent', () => {
      const transcript = 'What is the weather today';

      const intent = voiceService.extractIntent(transcript);

      expect(intent).toBe('UNKNOWN');
    });
  });

  describe('extractEntities', () => {
    it('should extract food items from transcript', () => {
      const transcript = 'I want a large pizza and two burgers';

      const entities = voiceService.extractEntities(transcript);

      expect(entities).toHaveProperty('items');
      expect(Array.isArray(entities.items)).toBe(true);
    });

    it('should extract quantities', () => {
      const transcript = 'Order two pizzas and three colas';

      const entities = voiceService.extractEntities(transcript);

      expect(entities).toHaveProperty('quantities');
    });

    it('should extract restaurant type', () => {
      const transcript = 'Find Italian restaurants';

      const entities = voiceService.extractEntities(transcript);

      expect(entities).toHaveProperty('cuisineType');
    });
  });

  describe('getVoiceCommandHistory', () => {
    it('should get user voice command history', async () => {
      const userId = 'user123';

      mockPrisma.voiceCommand.findMany.mockResolvedValue([
        {
          id: 'cmd1',
          transcript: 'Order pizza',
          intent: 'ORDER',
          createdAt: new Date()
        },
        {
          id: 'cmd2',
          transcript: 'Find restaurants',
          intent: 'SEARCH',
          createdAt: new Date()
        }
      ]);

      const history = await voiceService.getVoiceCommandHistory(userId);

      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBe(2);
    });

    it('should limit results', async () => {
      const userId = 'user123';
      const limit = 5;

      mockPrisma.voiceCommand.findMany.mockResolvedValue([]);

      await voiceService.getVoiceCommandHistory(userId, limit);

      expect(mockPrisma.voiceCommand.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: limit
        })
      );
    });
  });

  describe('validateAudioFormat', () => {
    it('should validate supported audio formats', () => {
      const validFormats = ['mp3', 'wav', 'ogg', 'm4a'];

      validFormats.forEach((format) => {
        const isValid = voiceService.validateAudioFormat(format);
        expect(isValid).toBe(true);
      });
    });

    it('should reject unsupported formats', () => {
      const invalidFormats = ['txt', 'pdf', 'exe'];

      invalidFormats.forEach((format) => {
        const isValid = voiceService.validateAudioFormat(format);
        expect(isValid).toBe(false);
      });
    });
  });

  describe('createVoiceResponse', () => {
    it('should create voice response for order confirmation', async () => {
      const responseData = {
        type: 'ORDER_CONFIRMATION',
        orderId: 'order123',
        totalAmount: 250
      };

      mockOpenAI.audio.speech.create.mockResolvedValue({
        arrayBuffer: () => Promise.resolve(Buffer.from('audio').buffer)
      });

      const response = await voiceService.createVoiceResponse(responseData);

      expect(response).toHaveProperty('text');
      expect(response).toHaveProperty('audioBuffer');
    });

    it('should create voice response for search results', async () => {
      const responseData = {
        type: 'SEARCH_RESULTS',
        results: [
          { name: 'Restaurant 1' },
          { name: 'Restaurant 2' }
        ]
      };

      mockOpenAI.audio.speech.create.mockResolvedValue({
        arrayBuffer: () => Promise.resolve(Buffer.from('audio').buffer)
      });

      const response = await voiceService.createVoiceResponse(responseData);

      expect(response.text).toContain('found');
    });
  });
});

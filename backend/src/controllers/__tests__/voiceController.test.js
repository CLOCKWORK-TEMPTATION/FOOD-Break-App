/**
 * Tests for Voice Controller
 */

jest.mock('../../services/voiceService');

const voiceController = require('../voiceController');
const voiceService = require('../../services/voiceService');

describe('Voice Controller', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      user: { id: 'user123', role: 'USER' },
      params: {},
      query: {},
      body: {},
      file: null
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis()
    };
  });

  describe('processVoiceCommand', () => {
    it('should process voice command from audio file', async () => {
      req.file = {
        buffer: Buffer.from('audio data'),
        mimetype: 'audio/wav'
      };

      voiceService.transcribeAudio = jest.fn().mockResolvedValue(
        'I want to order a large pizza'
      );

      voiceService.processVoiceCommand = jest.fn().mockResolvedValue({
        intent: 'ORDER',
        entities: { items: ['large pizza'] },
        confidence: 0.95
      });

      await voiceController.processVoiceCommand(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            intent: 'ORDER'
          })
        })
      );
    });

    it('should require audio file', async () => {
      req.file = null;

      await voiceController.processVoiceCommand(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should handle transcription errors', async () => {
      req.file = {
        buffer: Buffer.from('invalid audio'),
        mimetype: 'audio/wav'
      };

      voiceService.transcribeAudio = jest.fn().mockRejectedValue(
        new Error('Transcription failed')
      );

      await voiceController.processVoiceCommand(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('textToSpeech', () => {
    it('should convert text to speech', async () => {
      req.body = {
        text: 'Your order has been confirmed',
        voice: 'nova'
      };

      const audioBuffer = Buffer.from('audio data');
      voiceService.textToSpeech = jest.fn().mockResolvedValue(audioBuffer);

      await voiceController.textToSpeech(req, res);

      expect(res.set).toHaveBeenCalledWith('Content-Type', 'audio/mpeg');
      expect(res.send).toHaveBeenCalledWith(audioBuffer);
    });

    it('should require text input', async () => {
      req.body = {};

      await voiceController.textToSpeech(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getVoiceCommandHistory', () => {
    it('should get voice command history', async () => {
      voiceService.getVoiceCommandHistory = jest.fn().mockResolvedValue([
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

      await voiceController.getVoiceCommandHistory(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array)
        })
      );
    });

    it('should limit results', async () => {
      req.query = { limit: '10' };

      voiceService.getVoiceCommandHistory = jest.fn().mockResolvedValue([]);

      await voiceController.getVoiceCommandHistory(req, res);

      expect(voiceService.getVoiceCommandHistory).toHaveBeenCalledWith(
        'user123',
        10
      );
    });
  });

  describe('getSupportedVoices', () => {
    it('should get list of supported voices', async () => {
      voiceService.getSupportedVoices = jest.fn().mockResolvedValue([
        { id: 'nova', name: 'Nova', language: 'en-US' },
        { id: 'alloy', name: 'Alloy', language: 'en-US' }
      ]);

      await voiceController.getSupportedVoices(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array)
        })
      );
    });
  });

  describe('getSupportedLanguages', () => {
    it('should get supported languages', async () => {
      voiceService.getSupportedLanguages = jest.fn().mockResolvedValue([
        { code: 'en-US', name: 'English (US)' },
        { code: 'ar-EG', name: 'Arabic (Egypt)' }
      ]);

      await voiceController.getSupportedLanguages(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array)
        })
      );
    });
  });

  describe('validateAudioFormat', () => {
    it('should validate supported audio format', async () => {
      req.query = { format: 'mp3' };

      voiceService.validateAudioFormat = jest.fn().mockReturnValue(true);

      await voiceController.validateAudioFormat(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            isValid: true
          })
        })
      );
    });

    it('should reject unsupported format', async () => {
      req.query = { format: 'txt' };

      voiceService.validateAudioFormat = jest.fn().mockReturnValue(false);

      await voiceController.validateAudioFormat(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            isValid: false
          })
        })
      );
    });
  });
});

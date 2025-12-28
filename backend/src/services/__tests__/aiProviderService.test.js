const aiProvider = require('../../aiProviderService');

describe('AIProviderService', () => {
  describe('loadProvider', () => {
    it('should load provider if API key exists', async () => {
      if (process.env.GROQ_API_KEY) {
        const provider = await aiProvider.loadProvider('groq');
        expect(provider).toBeDefined();
      }
    });

    it('should return undefined for missing API key', async () => {
      const originalKey = process.env.FAKE_API_KEY;
      delete process.env.FAKE_API_KEY;

      const provider = await aiProvider.loadProvider('fake');
      expect(provider).toBeUndefined();

      if (originalKey) process.env.FAKE_API_KEY = originalKey;
    });

    it('should cache loaded provider', async () => {
      if (process.env.GROQ_API_KEY) {
        const provider1 = await aiProvider.loadProvider('groq');
        const provider2 = await aiProvider.loadProvider('groq');
        expect(provider1).toBe(provider2);
      }
    });
  });

  describe('selectBestProvider', () => {
    it('should select available provider', async () => {
      const provider = await aiProvider.selectBestProvider();
      if (process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY) {
        expect(provider).toBeDefined();
        expect(['groq', 'gemini', 'openai']).toContain(provider);
      } else {
        expect(provider).toBeNull();
      }
    });
  });

  describe('callAI', () => {
    it('should throw error if no provider available', async () => {
      const originalProviders = { ...aiProvider.providers };
      aiProvider.providers = {};

      const originalEnv = {
        GROQ_API_KEY: process.env.GROQ_API_KEY,
        GEMINI_API_KEY: process.env.GEMINI_API_KEY,
        OPENAI_API_KEY: process.env.OPENAI_API_KEY
      };

      delete process.env.GROQ_API_KEY;
      delete process.env.GEMINI_API_KEY;
      delete process.env.OPENAI_API_KEY;

      await expect(aiProvider.callAI('test prompt')).rejects.toThrow('No AI provider available');

      aiProvider.providers = originalProviders;
      Object.assign(process.env, originalEnv);
    });

    it('should call AI with valid provider', async () => {
      if (process.env.GROQ_API_KEY) {
        const response = await aiProvider.callAI('Return JSON: {"test": true}', 'groq');
        expect(response).toBeDefined();
        expect(typeof response).toBe('string');
      }
    }, 30000);
  });

  describe('_callGroq', () => {
    it('should format groq request correctly', async () => {
      if (process.env.GROQ_API_KEY) {
        const client = await aiProvider.loadProvider('groq');
        const response = await aiProvider._callGroq(client, 'Say "test"');
        expect(response).toBeDefined();
      }
    }, 30000);
  });

  describe('_callGemini', () => {
    it('should format gemini request correctly', async () => {
      if (process.env.GEMINI_API_KEY) {
        const client = await aiProvider.loadProvider('gemini');
        const response = await aiProvider._callGemini(client, 'Say "test"');
        expect(response).toBeDefined();
      }
    }, 30000);
  });

  describe('_callOpenAI', () => {
    it('should format openai request correctly', async () => {
      if (process.env.OPENAI_API_KEY) {
        const client = await aiProvider.loadProvider('openai');
        const response = await aiProvider._callOpenAI(client, 'Say "test"');
        expect(response).toBeDefined();
      }
    }, 30000);
  });
});

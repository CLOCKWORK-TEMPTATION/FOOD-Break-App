/**
 * AI Provider Service - Dynamic Loading
 * تحميل ديناميكي للـ AI SDKs لتقليل الحجم
 */

const logger = require('../utils/logger');

class AIProviderService {
  constructor() {
    this.providers = {};
    this.initialized = false;
  }

  // تحميل المزود فقط عند الحاجة
  async loadProvider(providerName) {
    if (this.providers[providerName]) {
      return this.providers[providerName];
    }

    try {
      switch (providerName) {
        case 'openai':
          if (process.env.OPENAI_API_KEY) {
            const OpenAI = require('openai');
            this.providers.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
            logger.info('OpenAI provider loaded');
          }
          break;

        case 'groq':
          if (process.env.GROQ_API_KEY) {
            const Groq = require('groq-sdk');
            this.providers.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
            logger.info('Groq provider loaded');
          }
          break;

        case 'gemini':
          if (process.env.GEMINI_API_KEY) {
            const { GoogleGenerativeAI } = require('@google/generative-ai');
            this.providers.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            logger.info('Gemini provider loaded');
          }
          break;

        default:
          logger.warn(`Unknown provider: ${providerName}`);
      }
    } catch (error) {
      logger.error(`Failed to load ${providerName}:`, error.message);
    }

    return this.providers[providerName];
  }

  // اختيار أفضل مزود متاح
  async selectBestProvider() {
    // ترتيب الأولوية: مجاني أولاً
    const priority = ['groq', 'gemini', 'openai'];
    
    for (const provider of priority) {
      const loaded = await this.loadProvider(provider);
      if (loaded) return provider;
    }
    
    return null;
  }

  // استدعاء AI مع المزود المحدد
  async callAI(prompt, provider = null) {
    const selectedProvider = provider || await this.selectBestProvider();
    
    if (!selectedProvider) {
      throw new Error('No AI provider available');
    }

    const client = await this.loadProvider(selectedProvider);
    
    try {
      switch (selectedProvider) {
        case 'groq':
          return await this._callGroq(client, prompt);
        case 'gemini':
          return await this._callGemini(client, prompt);
        case 'openai':
          return await this._callOpenAI(client, prompt);
        default:
          throw new Error(`Unsupported provider: ${selectedProvider}`);
      }
    } catch (error) {
      logger.error(`AI call failed for ${selectedProvider}:`, error.message);
      throw error;
    }
  }

  async _callGroq(client, prompt) {
    const completion = await client.chat.completions.create({
      model: "llama-3.1-70b-versatile",
      messages: [
        { role: "system", content: "أنت خبير في التوصيات الغذائية. أرجع JSON فقط." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });
    return completion.choices[0].message.content;
  }

  async _callGemini(client, prompt) {
    const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    return result.response.text();
  }

  async _callOpenAI(client, prompt) {
    const completion = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "أنت خبير في التوصيات الغذائية. أرجع JSON فقط." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });
    return completion.choices[0].message.content;
  }
}

module.exports = new AIProviderService();

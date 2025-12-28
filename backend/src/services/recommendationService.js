const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const OpenAI = require('openai');
const { Anthropic } = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');
const Together = require('together-ai');

const prisma = new PrismaClient();

// تهيئة جميع النماذج
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// OpenRouter (يستخدم OpenAI SDK)
const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Together AI
const together = new Together({
  apiKey: process.env.TOGETHER_API_KEY
});

// محرك التوصيات الذكي باستخدام النماذج الكبيرة
class RecommendationEngine {
  constructor() {
    this.userProfiles = new Map();
    this.itemEmbeddings = new Map();
    this.availableModels = this._checkAvailableModels();
  }

  // فحص النماذج المتاحة
  _checkAvailableModels() {
    const models = {
      openai: !!process.env.OPENAI_API_KEY,
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      gemini: !!process.env.GEMINI_API_KEY,
      groq: !!process.env.GROQ_API_KEY,
      openrouter: !!process.env.OPENROUTER_API_KEY,
      together: !!process.env.TOGETHER_API_KEY
    };
    
    console.log('النماذج المتاحة:', models);
    return models;
  }

  // اختيار أفضل نموذج متاح
  _selectBestModel() {
    // ترتيب الأولوية: السرعة والتكلفة والجودة
    if (this.availableModels.groq) return 'groq'; // الأسرع ومجاني
    if (this.availableModels.together) return 'together'; // نماذج متنوعة وسريعة
    if (this.availableModels.openrouter) return 'openrouter'; // وصول لجميع النماذج
    if (this.availableModels.gemini) return 'gemini'; // مجاني من Google
    if (this.availableModels.openai) return 'openai'; // الأكثر موثوقية
    if (this.availableModels.anthropic) return 'anthropic'; // الأذكى
    return null;
  }

  // تهيئة النظام
  async initializeModel() {
    try {
      const availableCount = Object.values(this.availableModels).filter(Boolean).length;
      console.log(`تهيئة نظام التوصيات الذكي مع ${availableCount} نموذج متاح...`);
      
      if (availableCount === 0) {
        console.warn('⚠️ لا توجد مفاتيح API للنماذج الكبيرة - سيتم استخدام النظام التقليدي');
      }
    } catch (error) {
      console.log('خطأ في تهيئة النظام:', error);
    }
  }

  // حساب تشابه العناصر
  cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (normA * normB);
  }

  // إنشاء تمثيلات للعناصر
  createItemEmbedding(menuItem) {
    // إنشاء متجه تمثيل للعنصر بناءً على خصائصه
    const embedding = [
      menuItem.price / 100, // تطبيع السعر
      menuItem.category ? menuItem.category.length / 10 : 0,
      menuItem.qualityScore || 0,
      menuItem.nutritionalInfo ? (menuItem.nutritionalInfo.calories || 0) / 1000 : 0,
      menuItem.nutritionalInfo ? (menuItem.nutritionalInfo.protein || 0) / 100 : 0,
      // إضافة المزيد من الخصائص...
    ];

    // ملء المتجه إلى 100 عنصر
    while (embedding.length < 100) {
      embedding.push(0);
    }

    return embedding.slice(0, 100);
  }

  // الحصول على التوصيات الشخصية باستخدام OpenAI
  async getPersonalizedRecommendations(userId, limit = 10) {
    try {
      // الحصول على تاريخ الطلبات للمستخدم
      const userOrders = await prisma.order.findMany({
        where: { userId },
        include: {
          items: {
            include: { menuItem: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 20 // آخر 20 طلب
      });

      // الحصول على جميع العناصر المتاحة
      const allItems = await prisma.menuItem.findMany({
        where: { isAvailable: true },
        include: { nutritionalInfo: true }
      });

      // إنشاء ملف تعريف المستخدم
      const userProfile = this._createUserProfile(userOrders);
      
      // استخدام OpenAI للحصول على التوصيات
      const recommendations = await this._getAIRecommendations(userProfile, allItems, limit);

      return recommendations;

    } catch (error) {
      console.error('خطأ في الحصول على التوصيات الشخصية:', error);
      return [];
    }
  }

  // إنشاء ملف تعريف المستخدم
  _createUserProfile(userOrders) {
    const favoriteItems = new Map();
    const categories = new Map();
    const cuisineTypes = new Map();
    let totalSpent = 0;
    let avgOrderValue = 0;

    userOrders.forEach(order => {
      totalSpent += order.totalAmount;
      order.items.forEach(item => {
        const itemId = item.menuItemId;
        favoriteItems.set(itemId, (favoriteItems.get(itemId) || 0) + item.quantity);
        
        if (item.menuItem.category) {
          categories.set(item.menuItem.category, (categories.get(item.menuItem.category) || 0) + 1);
        }
      });
    });

    avgOrderValue = userOrders.length > 0 ? totalSpent / userOrders.length : 0;

    return {
      favoriteItems: Array.from(favoriteItems.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10),
      favoriteCategories: Array.from(categories.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5),
      avgOrderValue,
      totalOrders: userOrders.length,
      recentOrdersCount: userOrders.length
    };
  }

  // الحصول على التوصيات من AI
  async _getAIRecommendations(userProfile, allItems, limit) {
    try {
      const selectedModel = this._selectBestModel();
      
      if (!selectedModel) {
        console.warn('لا توجد مفاتيح API للنماذج الكبيرة، سيتم استخدام التوصيات التقليدية');
        return this._getFallbackRecommendations(userProfile, allItems, limit);
      }

      console.log(`استخدام نموذج: ${selectedModel}`);

      // إعداد البيانات للنموذج
      const userContext = `
المستخدم لديه التفضيلات التالية:
- الأطباق المفضلة: ${userProfile.favoriteItems.map(([id, count]) => `${id} (${count} مرات)`).join(', ')}
- الفئات المفضلة: ${userProfile.favoriteCategories.map(([cat, count]) => `${cat} (${count} مرات)`).join(', ')}
- متوسط قيمة الطلب: ${userProfile.avgOrderValue} ريال
- عدد الطلبات السابقة: ${userProfile.totalOrders}
      `;

      const availableItems = allItems.slice(0, 50).map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        price: item.price,
        description: item.description
      }));

      const prompt = `
أنت خبير في التوصيات الغذائية. بناءً على تفضيلات المستخدم التالية:

${userContext}

والأطباق المتاحة:
${JSON.stringify(availableItems, null, 2)}

اقترح ${limit} أطباق مناسبة للمستخدم مع تبرير كل اقتراح.

أرجع الإجابة بصيغة JSON فقط:
{
  "recommendations": [
    {
      "menuItemId": "id",
      "score": 0.9,
      "reason": "سبب التوصية"
    }
  ]
}
      `;

      let response;
      
      switch (selectedModel) {
        case 'groq':
          response = await this._getGroqRecommendations(prompt);
          break;
        case 'together':
          response = await this._getTogetherRecommendations(prompt);
          break;
        case 'openrouter':
          response = await this._getOpenRouterRecommendations(prompt);
          break;
        case 'gemini':
          response = await this._getGeminiRecommendations(prompt);
          break;
        case 'openai':
          response = await this._getOpenAIRecommendations(prompt);
          break;
        case 'anthropic':
          response = await this._getAnthropicRecommendations(prompt);
          break;
        default:
          throw new Error(`نموذج غير مدعوم: ${selectedModel}`);
      }

      const aiRecommendations = JSON.parse(response);

      // تحويل التوصيات إلى الصيغة المطلوبة
      const recommendations = [];
      for (const rec of aiRecommendations.recommendations) {
        const menuItem = allItems.find(item => item.id === rec.menuItemId);
        if (menuItem) {
          recommendations.push({
            menuItem,
            score: rec.score,
            reason: rec.reason,
            type: `AI_${selectedModel.toUpperCase()}`
          });
        }
      }

      return recommendations;

    } catch (error) {
      console.error('خطأ في استخدام AI:', error);
      return this._getFallbackRecommendations(userProfile, allItems, limit);
    }
  }

  // Groq API
  async _getGroqRecommendations(prompt) {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-70b-versatile", // أو "mixtral-8x7b-32768"
      messages: [
        {
          role: "system",
          content: "أنت خبير في التوصيات الغذائية. أرجع إجابات بصيغة JSON صحيحة فقط."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    return completion.choices[0].message.content;
  }

  // Together AI
  async _getTogetherRecommendations(prompt) {
    const completion = await together.chat.completions.create({
      model: "meta-llama/Llama-3-70b-chat-hf", // أو "mistralai/Mixtral-8x7B-Instruct-v0.1"
      messages: [
        {
          role: "system",
          content: "أنت خبير في التوصيات الغذائية. أرجع إجابات بصيغة JSON صحيحة فقط."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    return completion.choices[0].message.content;
  }

  // OpenRouter API
  async _getOpenRouterRecommendations(prompt) {
    const completion = await openrouter.chat.completions.create({
      model: "anthropic/claude-3-haiku", // أو "meta-llama/llama-3.1-8b-instruct:free"
      messages: [
        {
          role: "system",
          content: "أنت خبير في التوصيات الغذائية. أرجع إجابات بصيغة JSON صحيحة فقط."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    return completion.choices[0].message.content;
  }

  // Google Gemini
  async _getGeminiRecommendations(prompt) {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const systemPrompt = "أنت خبير في التوصيات الغذائية. أرجع إجابات بصيغة JSON صحيحة فقط.";
    const fullPrompt = `${systemPrompt}\n\n${prompt}`;
    
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
  }

  // OpenAI API
  async _getOpenAIRecommendations(prompt) {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "أنت خبير في التوصيات الغذائية. أرجع إجابات بصيغة JSON صحيحة فقط."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    return completion.choices[0].message.content;
  }

  // Anthropic Claude
  async _getAnthropicRecommendations(prompt) {
    const message = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1000,
      temperature: 0.7,
      system: "أنت خبير في التوصيات الغذائية. أرجع إجابات بصيغة JSON صحيحة فقط.",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    return message.content[0].text;
  }

  // التوصيات الاحتياطية (بدون AI)
  _getFallbackRecommendations(userProfile, allItems, limit) {
    const recommendations = [];
    
    // التوصية بناءً على الفئات المفضلة
    const favoriteCategories = userProfile.favoriteCategories.map(([cat]) => cat);
    
    const categoryItems = allItems.filter(item => 
      favoriteCategories.includes(item.category)
    );

    categoryItems.slice(0, limit).forEach(item => {
      recommendations.push({
        menuItem: item,
        score: 0.8,
        reason: `من فئة ${item.category} المفضلة لديك`,
        type: 'CATEGORY_BASED'
      });
    });

    return recommendations;
  }

  // الحصول على التوصيات بناءً على الطقس
  async getWeatherBasedRecommendations(userLocation, limit = 5) {
    try {
      // الحص��ل على بيانات الطقس
      const weatherData = await this.getWeatherData(userLocation);

      let recommendations = [];
      const reason = this.getWeatherReason(weatherData);

      if (reason) {
        // الحصول على العناصر المناسبة للطقس
        const suitableItems = await this.getItemsForWeather(weatherData);

        recommendations = suitableItems.map(item => ({
          menuItem: item,
          score: 0.8, // نتيجة ثابتة للتوصيات الجوية
          reason,
          weatherData
        })).slice(0, limit);
      }

      return recommendations;

    } catch (error) {
      console.error('خطأ في الحصول على التوصيات الجوية:', error);
      return [];
    }
  }

  // الحصول على بيانات الطقس
  async getWeatherData(location) {
    try {
      const apiKey = process.env.OPENWEATHER_API_KEY;
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=metric`
      );
      return response.data;
    } catch (error) {
      console.error('خطأ في الحصول على بيانات الطقس:', error);
      return null;
    }
  }

  // تحديد السبب بناءً على الطقس
  getWeatherReason(weatherData) {
    if (!weatherData) return null;

    const temp = weatherData.main.temp;
    const weather = weatherData.weather[0].main.toLowerCase();

    if (temp < 15) {
      return 'الطقس بارد، نوصي بأطباق ساخنة مريحة';
    } else if (temp > 25) {
      return 'الطقس حار، نوصي بأطباق خفيفة وباردة';
    } else if (weather.includes('rain')) {
      return 'ممطر، نوصي بأطباق داخلية دافئة';
    }

    return null;
  }

  // الحصول على العناصر المناسبة للطقس
  async getItemsForWeather(weatherData) {
    const temp = weatherData.main.temp;
    const weather = weatherData.weather[0].main.toLowerCase();

    let categoryFilter = {};

    if (temp < 15) {
      // أطباق ساخنة
      categoryFilter = {
        category: {
          in: ['شوربة', 'حساء', 'مشاوي', 'مقليات']
        }
      };
    } else if (temp > 25) {
      // أطباق خفيفة
      categoryFilter = {
        category: {
          in: ['سلطات', 'عصائر', 'حلويات باردة']
        }
      };
    }

    return await prisma.menuItem.findMany({
      where: {
        isAvailable: true,
        ...categoryFilter
      },
      include: { nutritionalInfo: true }
    });
  }

  // التحقق من تنوع التغذية
  async checkDietaryDiversity(userId) {
    try {
      // الحصول على الطلبات الأخيرة (آخر أسبوع)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const recentOrders = await prisma.order.findMany({
        where: {
          userId,
          createdAt: { gte: oneWeekAgo }
        },
        include: {
          items: {
            include: {
              menuItem: {
                include: { nutritionalInfo: true }
              }
            }
          }
        }
      });

      // حساب استهلاك المغذيات
      const nutrients = { vegetables: 0, proteins: 0, carbs: 0 };

      recentOrders.forEach(order => {
        order.items.forEach(item => {
          const nutrition = item.menuItem.nutritionalInfo;
          if (nutrition) {
            // منطق بسيط لتصنيف العناصر
            if (nutrition.fiber && nutrition.fiber > 2) nutrients.vegetables++;
            if (nutrition.protein && nutrition.protein > 10) nutrients.proteins++;
            if (nutrition.carbs && nutrition.carbs > 20) nutrients.carbs++;
          }
        });
      });

      // التحقق من التنوع
      const alerts = [];
      if (nutrients.vegetables < 3) {
        alerts.push({
          type: 'DIETARY_DIVERSITY',
          message: 'لم تطلب خضروات منذ أسبوع، جرب سلطة أو طبق صحي',
          severity: 'medium'
        });
      }
      if (nutrients.proteins < 2) {
        alerts.push({
          type: 'DIETARY_DIVERSITY',
          message: 'قلة البروتين في نظامك الغذائي، جرب طبق دجاج أو سمك',
          severity: 'high'
        });
      }

      return alerts;

    } catch (error) {
      console.error('خطأ في التحقق من تنوع التغذية:', error);
      return [];
    }
  }

  // الحصول على التوصيات الشاملة
  async getRecommendations(userId, userLocation = null, limit = 20) {
    const recommendations = [];

    // التوصيات الشخصية
    const personalized = await this.getPersonalizedRecommendations(userId, limit / 2);
    recommendations.push(...personalized.map(r => ({ ...r, type: 'PERSONALIZED' })));

    // التوصيات الجوية
    if (userLocation) {
      const weatherBased = await this.getWeatherBasedRecommendations(userLocation, limit / 4);
      recommendations.push(...weatherBased.map(r => ({ ...r, type: 'WEATHER_BASED' })));
    }

    // التحقق من التنوع التغذائي
    const dietaryAlerts = await this.checkDietaryDiversity(userId);
    if (dietaryAlerts.length > 0) {
      // الحصول على عناصر لتحسين التنوع
      const diversityItems = await this.getDiversityRecommendations(dietaryAlerts);
      recommendations.push(...diversityItems.map(r => ({ ...r, type: 'DIETARY_DIVERSITY' })));
    }

    // التوصيات الشائعة
    const trending = await this.getTrendingRecommendations(limit / 4);
    recommendations.push(...trending.map(r => ({ ...r, type: 'TRENDING' })));

    // إزالة التكرارات وترتيب حسب النتيجة
    const uniqueRecommendations = this.removeDuplicates(recommendations);

    return uniqueRecommendations.slice(0, limit);
  }

  // إزالة التكرارات من التوصيات
  removeDuplicates(recommendations) {
    const seen = new Set();
    return recommendations.filter(rec => {
      const id = rec.menuItem.id;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }

  // الحصول على التوصيات لتحسين التنوع التغذائي
  async getDiversityRecommendations(alerts) {
    const recommendations = [];

    for (const alert of alerts) {
      let categoryFilter = {};

      if (alert.message.includes('خضروات')) {
        categoryFilter = { category: { in: ['سلطات', 'خضروات'] } };
      } else if (alert.message.includes('بروتين')) {
        categoryFilter = { category: { in: ['دجاج', 'لحم', 'سمك'] } };
      }

      const items = await prisma.menuItem.findMany({
        where: {
          isAvailable: true,
          ...categoryFilter
        },
        include: { nutritionalInfo: true },
        take: 3
      });

      items.forEach(item => {
        recommendations.push({
          menuItem: item,
          score: 0.9,
          reason: alert.message
        });
      });
    }

    return recommendations;
  }

  // الحصول على التوصيات الشائعة
  async getTrendingRecommendations(limit = 5) {
    try {
      // حساب العناصر الأكثر طلباً في الأسبوع الماضي
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const trendingItems = await prisma.orderItem.groupBy({
        by: ['menuItemId'],
        where: {
          order: {
            createdAt: { gte: oneWeekAgo }
          }
        },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: limit
      });

      const itemIds = trendingItems.map(t => t.menuItemId);
      const items = await prisma.menuItem.findMany({
        where: { id: { in: itemIds } },
        include: { nutritionalInfo: true }
      });

      return items.map(item => ({
        menuItem: item,
        score: 0.7,
        reason: 'من أكثر الأطباق طلباً هذا الأسبوع'
      }));

    } catch (error) {
      console.error('خطأ في الحصول على التوصيات الشائعة:', error);
      return [];
    }
  }
}

// إنشاء مثيل واحد من محرك التوصيات
const recommendationEngine = new RecommendationEngine();

// تهيئة النموذج عند بدء التطبيق
recommendationEngine.initializeModel().catch(console.error);

// دوال الخدمة
const recommendationService = {
  // الحصول على التوصيات للمستخدم
  async getUserRecommendations(userId, location = null) {
    return await recommendationEngine.getRecommendations(userId, location);
  },

  // حفظ التوصية في قاعدة البيانات
  async saveRecommendation(userId, menuItemId, type, score, reason, weatherData = null) {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // تنتهي بعد 24 ساعة

      return await prisma.recommendation.create({
        data: {
          userId,
          menuItemId,
          recommendationType: type,
          score,
          reason,
          weatherData: weatherData ? JSON.stringify(weatherData) : null,
          expiresAt
        }
      });
    } catch (error) {
      console.error('خطأ في حفظ التوصية:', error);
      throw error;
    }
  },

  // الحصول على التوصيات المحفوظة
  async getSavedRecommendations(userId) {
    try {
      return await prisma.recommendation.findMany({
        where: {
          userId,
          isActive: true,
          expiresAt: { gt: new Date() }
        },
        include: {
          menuItem: {
            include: { nutritionalInfo: true }
          }
        },
        orderBy: { score: 'desc' }
      });
    } catch (error) {
      console.error('خطأ في الحصول على التوصيات المحفوظة:', error);
      throw error;
    }
  },

  // تحديث تفضيلات المستخدم
  async updateUserPreferences(userId, preferences) {
    try {
      return await prisma.userPreferences.upsert({
        where: { userId },
        update: preferences,
        create: { userId, ...preferences }
      });
    } catch (error) {
      console.error('خطأ في تحديث تفضيلات المستخدم:', error);
      throw error;
    }
  },

  // الحصول على تفضيلات المستخدم
  async getUserPreferences(userId) {
    try {
      return await prisma.userPreferences.findUnique({
        where: { userId }
      });
    } catch (error) {
      console.error('خطأ في الحصول على تفضيلات المستخدم:', error);
      throw error;
    }
  }
};

module.exports = recommendationService;
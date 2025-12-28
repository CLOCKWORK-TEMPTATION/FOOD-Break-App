/**
 * خدمة تدريب نماذج التعلم الآلي
 * ML Model Training Service
 *
 * تدريب وتحديث نماذج:
 * - Recommendation System
 * - Predictive Ordering
 * - Restaurant Quality Prediction
 */

const OpenAI = require('openai');
const { Anthropic } = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');
const Together = require('together-ai');
const logger = require('../../utils/logger');
const trainingDataService = require('./trainingDataService');
const { PrismaClient } = require('@prisma/client');

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

const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const together = new Together({
  apiKey: process.env.TOGETHER_API_KEY
});

class ModelTrainer {
  constructor() {
    this.models = {
      recommendation: 'multi-model',
      prediction: 'multi-model', 
      quality: 'multi-model'
    };
    
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
    
    const availableCount = Object.values(models).filter(Boolean).length;
    logger.info(`النماذج المتاحة للتدريب: ${availableCount}/6`);
    
    return models;
  }

  // اختيار أفضل نموذج للتحليل
  _selectAnalysisModel() {
    // للتحليل المعقد نفضل النماذج الأقوى
    if (this.availableModels.anthropic) return 'anthropic'; // الأفضل للتحليل
    if (this.availableModels.openai) return 'openai'; // موثوق
    if (this.availableModels.groq) return 'groq'; // سريع
    if (this.availableModels.together) return 'together'; // متنوع
    if (this.availableModels.openrouter) return 'openrouter'; // وصول شامل
    if (this.availableModels.gemini) return 'gemini'; // مجاني
    return null;
  }

  /**
   * تدريب نموذج التوصيات (باستخدام النماذج الكبيرة)
   * Train recommendation model using LLMs
   */
  async trainRecommendationModel(options = {}) {
    try {
      logger.info('تحليل بيانات التوصيات باستخدام النماذج الكبيرة المتعددة...');

      const selectedModel = this._selectAnalysisModel();
      
      if (!selectedModel) {
        logger.warn('لا توجد مفاتيح API للنماذج الكبيرة');
        return {
          success: false,
          message: 'مفاتيح API للنماذج الكبيرة مطلوبة'
        };
      }

      logger.info(`استخدام نموذج ${selectedModel} للتحليل`);

      // جمع بيانات التدريب
      const data = await trainingDataService.prepareRecommendationTrainingData();

      if (data.interactions.length < 10) {
        logger.warn('بيانات التفاعل قليلة جداً');
        return {
          success: false,
          message: 'بيانات غير كافية للتحليل'
        };
      }

      // تحليل الأنماط باستخدام النموذج المختار
      const patterns = await this._analyzeUserPatterns(data, selectedModel);

      // حفظ الأنماط المكتشفة
      await this._saveDiscoveredPatterns(patterns, selectedModel);

      logger.info(`تم تحليل أنماط المستخدمين بنجاح باستخدام ${selectedModel}`);

      return {
        success: true,
        model: selectedModel,
        patterns: patterns.length || Object.keys(patterns).length,
        userCount: data.users.length,
        itemCount: data.items.length,
        interactionCount: data.interactions.length
      };
    } catch (error) {
      logger.error(`خطأ في تحليل نموذج التوصيات: ${error.message}`);
      throw error;
    }
  }

  // تحليل أنماط المستخدمين باستخدام النموذج المحدد
  async _analyzeUserPatterns(data, modelType) {
    try {
      const prompt = `
تحليل أنماط الطلبات التالية واستخراج الأنماط المهمة:

البيانات:
- عدد المستخدمين: ${data.users.length}
- عدد العناصر: ${data.items.length}  
- عدد التفاعلات: ${data.interactions.length}

عينة من التفاعلات:
${JSON.stringify(data.interactions.slice(0, 20), null, 2)}

استخرج الأنماط التالية:
1. الأوقات المفضلة للطلب
2. الفئات الأكثر شعبية
3. أنماط الطلب حسب اليوم
4. العلاقات بين العناصر
5. توصيات لتحسين النظام

أرجع النتيجة بصيغة JSON:
{
  "timePatterns": [],
  "categoryPatterns": [],
  "dayPatterns": [],
  "itemRelations": [],
  "recommendations": []
}
      `;

      let response;
      
      switch (modelType) {
        case 'groq':
          response = await this._getGroqAnalysis(prompt);
          break;
        case 'together':
          response = await this._getTogetherAnalysis(prompt);
          break;
        case 'openrouter':
          response = await this._getOpenRouterAnalysis(prompt);
          break;
        case 'gemini':
          response = await this._getGeminiAnalysis(prompt);
          break;
        case 'openai':
          response = await this._getOpenAIAnalysis(prompt);
          break;
        case 'anthropic':
          response = await this._getAnthropicAnalysis(prompt);
          break;
        default:
          throw new Error(`نموذج غير مدعوم: ${modelType}`);
      }

      return JSON.parse(response);

    } catch (error) {
      logger.error(`خطأ في تحليل الأنماط باستخدام ${modelType}: ${error.message}`);
      return {
        timePatterns: [],
        categoryPatterns: [],
        dayPatterns: [],
        itemRelations: [],
        recommendations: []
      };
    }
  }

  // دوال التحليل لكل نموذج
  async _getGroqAnalysis(prompt) {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-70b-versatile",
      messages: [
        {
          role: "system", 
          content: "أنت محلل بيانات خبير في أنماط الطلبات الغذائية. أرجع JSON صحيح فقط."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    return completion.choices[0].message.content;
  }

  async _getTogetherAnalysis(prompt) {
    const completion = await together.chat.completions.create({
      model: "meta-llama/Llama-3-70b-chat-hf",
      messages: [
        {
          role: "system",
          content: "أنت محلل بيانات خبير في أنماط الطلبات الغذائية. أرجع JSON صحيح فقط."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    return completion.choices[0].message.content;
  }

  async _getOpenRouterAnalysis(prompt) {
    const completion = await openrouter.chat.completions.create({
      model: "anthropic/claude-3-haiku",
      messages: [
        {
          role: "system",
          content: "أنت محلل بيانات خبير في أنماط الطلبات الغذائية. أرجع JSON صحيح فقط."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    return completion.choices[0].message.content;
  }

  async _getGeminiAnalysis(prompt) {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const systemPrompt = "أنت محلل بيانات خبير في أنماط الطلبات الغذائية. أرجع JSON صحيح فقط.";
    const fullPrompt = `${systemPrompt}\n\n${prompt}`;
    
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
  }

  async _getOpenAIAnalysis(prompt) {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "أنت محلل بيانات خبير في أنماط الطلبات الغذائية. أرجع JSON صحيح فقط."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    return completion.choices[0].message.content;
  }

  async _getAnthropicAnalysis(prompt) {
    const message = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 2000,
      temperature: 0.3,
      system: "أنت محلل بيانات خبير في أنماط الطلبات الغذائية. أرجع JSON صحيح فقط.",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    return message.content[0].text;
  }

  // حفظ الأنماط المكتشفة
  async _saveDiscoveredPatterns(patterns, modelUsed) {
    try {
      // حفظ في قاعدة البيانات أو ملف
      const fs = require('fs').promises;
      const path = require('path');

      const patternsDir = path.join(__dirname, '../../../data/patterns');
      await fs.mkdir(patternsDir, { recursive: true });

      const timestamp = Date.now();
      const filepath = path.join(patternsDir, `patterns-${modelUsed}-${timestamp}.json`);
      
      const dataToSave = {
        model: modelUsed,
        timestamp: new Date().toISOString(),
        patterns
      };
      
      await fs.writeFile(filepath, JSON.stringify(dataToSave, null, 2));

      logger.info(`تم حفظ الأنماط من ${modelUsed} في ${filepath}`);
    } catch (error) {
      logger.error(`خطأ في حفظ الأنماط: ${error.message}`);
    }
  }

  /**
   * إعداد بيانات التوصيات للتدريب
   * Prepare recommendation data for training
   */
  _prepareRecommendationData(data) {
    const { interactions, users, items } = data;

    // إنشاء تعيين لـ users و items
    const userMap = new Map(users.map((id, idx) => [id, idx]));
    const itemMap = new Map(items.map((id, idx) => [id, idx]));

    // تحويل interactions إلى tensors
    const features = [];
    const labels = [];

    interactions.forEach(interaction => {
      const userIdx = userMap.get(interaction.userId);
      const itemIdx = itemMap.get(interaction.menuItemId);

      if (userIdx !== undefined && itemIdx !== undefined) {
        // Feature vector: [user_idx, item_idx, day_of_week, time_slot_encoded]
        const timeSlotMap = { morning: 0, lunch: 1, afternoon: 2, evening: 3 };

        features.push([
          userIdx / users.length, // تطبيع
          itemIdx / items.length,
          interaction.context.dayOfWeek / 7,
          timeSlotMap[interaction.context.timeSlot] / 4
        ]);

        // Label: normalized rating
        labels.push([interaction.rating / 5]);
      }
    });

    const X = tf.tensor2d(features);
    const y = tf.tensor2d(labels);

    return { X, y, userIds: users, itemIds: items };
  }

  /**
   * إنشاء نموذج التوصيات
   * Create recommendation model
   */
  _createRecommendationModel(inputDim) {
    const model = tf.sequential();

    // Input layer
    model.add(tf.layers.dense({
      inputShape: [inputDim],
      units: 128,
      activation: 'relu',
      kernelInitializer: 'heNormal'
    }));

    model.add(tf.layers.dropout({ rate: 0.3 }));

    // Hidden layers
    model.add(tf.layers.dense({
      units: 64,
      activation: 'relu'
    }));

    model.add(tf.layers.dropout({ rate: 0.2 }));

    model.add(tf.layers.dense({
      units: 32,
      activation: 'relu'
    }));

    // Output layer
    model.add(tf.layers.dense({
      units: 1,
      activation: 'sigmoid'
    }));

    // Compile
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae', 'acc']
    });

    return model;
  }

  /**
   * تدريب نموذج التنبؤ بالطلبات
   * Train predictive ordering model
   */
  async trainPredictiveModel(options = {}) {
    try {
      logger.info('بدء تدريب نموذج التنبؤ...');

      const {
        epochs = 30,
        batchSize = 32
      } = options;

      // جمع بيانات الأنماط
      const patterns = await this._collectPatternData();

      if (patterns.length < 50) {
        logger.warn('بيانات الأنماط قليلة جداً');
        return null;
      }

      // إعداد البيانات
      const { X, y } = this._preparePredictiveData(patterns);

      // إنشاء النموذج
      const model = this._createPredictiveModel(X.shape[1]);

      // تدريب
      const history = await model.fit(X, y, {
        epochs,
        batchSize,
        validationSplit: 0.2,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (epoch % 5 === 0) {
              logger.info(`Epoch ${epoch}: loss=${logs.loss.toFixed(4)}`);
            }
          }
        }
      });

      // حفظ النموذج
      await this._saveModel(model, 'prediction');

      this.models.prediction = model;

      logger.info('تم تدريب نموذج التنبؤ بنجاح');

      return {
        success: true,
        history: history.history,
        patternsCount: patterns.length
      };
    } catch (error) {
      logger.error(`خطأ في تدريب نموذج التنبؤ: ${error.message}`);
      throw error;
    }
  }

  /**
   * جمع بيانات الأنماط
   * Collect pattern data
   */
  async _collectPatternData() {
    const behaviors = await prisma.userBehavior.findMany({
      where: {
        totalOrders: { gte: 3 }
      }
    });

    return behaviors;
  }

  /**
   * إعداد بيانات التنبؤ
   * Prepare predictive data
   */
  _preparePredictiveData(patterns) {
    const features = [];
    const labels = [];

    patterns.forEach(pattern => {
      features.push([
        pattern.dayOfWeek / 7,
        pattern.avgOrderValue / 1000, // تطبيع
        pattern.orderFrequency / 10,
        pattern.totalOrders / 100
      ]);

      // التنبؤ بقيمة الطلب القادم
      labels.push([pattern.avgOrderValue / 1000]);
    });

    const X = tf.tensor2d(features);
    const y = tf.tensor2d(labels);

    return { X, y };
  }

  /**
   * إنشاء نموذج التنبؤ
   * Create predictive model
   */
  _createPredictiveModel(inputDim) {
    const model = tf.sequential();

    model.add(tf.layers.dense({
      inputShape: [inputDim],
      units: 64,
      activation: 'relu'
    }));

    model.add(tf.layers.dropout({ rate: 0.2 }));

    model.add(tf.layers.dense({
      units: 32,
      activation: 'relu'
    }));

    model.add(tf.layers.dense({
      units: 1,
      activation: 'linear'
    }));

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae']
    });

    return model;
  }

  /**
   * تدريب نموذج جودة المطاعم
   * Train restaurant quality model
   */
  async trainQualityModel(options = {}) {
    try {
      logger.info('بدء تدريب نموذج جودة المطاعم...');

      const { epochs = 40, batchSize = 16 } = options;

      // جمع بيانات المطاعم
      const restaurants = await prisma.restaurant.findMany({
        include: {
          reviews: true,
          orders: {
            where: { status: 'DELIVERED' }
          },
          menuItems: true
        }
      });

      if (restaurants.length < 20) {
        logger.warn('بيانات المطاعم قليلة جداً');
        return null;
      }

      // إعداد البيانات
      const { X, y } = this._prepareQualityData(restaurants);

      // إنشاء النموذج
      const model = this._createQualityModel(X.shape[1]);

      // تدريب
      const history = await model.fit(X, y, {
        epochs,
        batchSize,
        validationSplit: 0.2,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (epoch % 10 === 0) {
              logger.info(`Epoch ${epoch}: loss=${logs.loss.toFixed(4)}`);
            }
          }
        }
      });

      // حفظ النموذج
      await this._saveModel(model, 'quality');

      this.models.quality = model;

      logger.info('تم تدريب نموذج الجودة بنجاح');

      return {
        success: true,
        history: history.history,
        restaurantCount: restaurants.length
      };
    } catch (error) {
      logger.error(`خطأ في تدريب نموذج الجودة: ${error.message}`);
      throw error;
    }
  }

  /**
   * إعداد بيانات الجودة
   * Prepare quality data
   */
  _prepareQualityData(restaurants) {
    const features = [];
    const labels = [];

    restaurants.forEach(restaurant => {
      const avgRating = restaurant.reviews.length > 0
        ? restaurant.reviews.reduce((sum, r) => sum + r.rating, 0) / restaurant.reviews.length
        : 0;

      features.push([
        restaurant.rating / 5,
        restaurant.reviews.length / 100,
        restaurant.orders.length / 100,
        restaurant.menuItems.length / 50,
        restaurant.isPartner ? 1 : 0
      ]);

      labels.push([avgRating / 5]);
    });

    const X = tf.tensor2d(features);
    const y = tf.tensor2d(labels);

    return { X, y };
  }

  /**
   * إنشاء نموذج الجودة
   * Create quality model
   */
  _createQualityModel(inputDim) {
    const model = tf.sequential();

    model.add(tf.layers.dense({
      inputShape: [inputDim],
      units: 32,
      activation: 'relu'
    }));

    model.add(tf.layers.dropout({ rate: 0.2 }));

    model.add(tf.layers.dense({
      units: 16,
      activation: 'relu'
    }));

    model.add(tf.layers.dense({
      units: 1,
      activation: 'sigmoid'
    }));

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });

    return model;
  }

  /**
   * حفظ النموذج
   * Save model
   */
  async _saveModel(model, modelName) {
    try {
      const fs = require('fs').promises;
      const path = require('path');

      const modelDir = path.join(__dirname, '../../../models');
      await fs.mkdir(modelDir, { recursive: true });

      const savePath = `file://${modelDir}/${modelName}-model`;
      await model.save(savePath);

      logger.info(`تم حفظ النموذج في ${savePath}`);
    } catch (error) {
      logger.error(`خطأ في حفظ النموذج: ${error.message}`);
      throw error;
    }
  }

  /**
   * تحميل النموذج
   * Load model
   */
  async loadModel(modelName) {
    try {
      const modelPath = this.modelPaths[modelName];
      const model = await tf.loadLayersModel(modelPath + '/model.json');

      this.models[modelName] = model;

      logger.info(`تم تحميل النموذج ${modelName}`);
      return model;
    } catch (error) {
      logger.error(`خطأ في تحميل النموذج ${modelName}: ${error.message}`);
      return null;
    }
  }

  /**
   * تدريب جميع النماذج
   * Train all models
   */
  async trainAllModels(options = {}) {
    try {
      logger.info('بدء تدريب جميع النماذج...');

      const results = {
        recommendation: null,
        prediction: null,
        quality: null,
        errors: []
      };

      // تدريب نموذج التوصيات
      try {
        results.recommendation = await this.trainRecommendationModel(options);
      } catch (error) {
        results.errors.push({ model: 'recommendation', error: error.message });
      }

      // تدريب نموذج التنبؤ
      try {
        results.prediction = await this.trainPredictiveModel(options);
      } catch (error) {
        results.errors.push({ model: 'prediction', error: error.message });
      }

      // تدريب نموذج الجودة
      try {
        results.quality = await this.trainQualityModel(options);
      } catch (error) {
        results.errors.push({ model: 'quality', error: error.message });
      }

      logger.info('انتهى تدريب جميع النماذج');

      return results;
    } catch (error) {
      logger.error(`خطأ في تدريب جميع النماذج: ${error.message}`);
      throw error;
    }
  }

  /**
   * تقييم أداء النموذج
   * Evaluate model performance
   */
  async evaluateModel(modelName, testData) {
    try {
      const model = this.models[modelName] || await this.loadModel(modelName);

      if (!model) {
        throw new Error(`النموذج ${modelName} غير متاح`);
      }

      const predictions = model.predict(testData.X);
      const loss = tf.losses.meanSquaredError(testData.y, predictions);

      const lossValue = await loss.data();

      logger.info(`تقييم النموذج ${modelName}: loss=${lossValue[0]}`);

      return {
        modelName,
        loss: lossValue[0],
        metrics: {
          // يمكن إضافة مقاييس إضافية
        }
      };
    } catch (error) {
      logger.error(`خطأ في تقييم النموذج: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new ModelTrainer();

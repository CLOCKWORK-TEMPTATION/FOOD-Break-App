const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const tf = require('@tensorflow/tfjs-node');

const prisma = new PrismaClient();

// تهيئة نموذج التعلم الآلي للتوصيات
class RecommendationEngine {
  constructor() {
    this.model = null;
    this.itemEmbeddings = new Map();
    this.userEmbeddings = new Map();
  }

  // تحميل أو تدريب النموذج
  async initializeModel() {
    try {
      // محاولة تحميل النموذج المدرب مسبقاً
      this.model = await tf.loadLayersModel('file://./models/recommendation-model.json');
    } catch (error) {
      console.log('لم يتم العثور على نموذج مدرب، سيتم إنشاء نموذج جديد');
      this.model = this.createModel();
    }
  }

  // إنشاء نموذج التعلم الآلي
  createModel() {
    const model = tf.sequential();

    // طبقة الإدخال
    model.add(tf.layers.dense({ inputShape: [100], units: 64, activation: 'relu' }));
    model.add(tf.layers.dropout({ rate: 0.2 }));

    // طبقات مخفية
    model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
    model.add(tf.layers.dropout({ rate: 0.2 }));

    // طبقة الإخراج
    model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binary_crossentropy',
      metrics: ['accuracy']
    });

    return model;
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

  // الحصول على التوصيات الشخصية
  async getPersonalizedRecommendations(userId, limit = 10) {
    try {
      // الحصول على تاريخ الطلبات للمستخدم
      const userOrders = await prisma.order.findMany({
        where: { userId },
        include: {
          items: {
            include: { menuItem: true }
          }
        }
      });

      // استخراج العناصر المفضلة
      const favoriteItems = new Map();
      userOrders.forEach(order => {
        order.items.forEach(item => {
          const itemId = item.menuItemId;
          favoriteItems.set(itemId, (favoriteItems.get(itemId) || 0) + item.quantity);
        });
      });

      // الحصول على جميع العناصر المتاحة
      const allItems = await prisma.menuItem.findMany({
        where: { isAvailable: true },
        include: { nutritionalInfo: true }
      });

      // حساب التشابه مع العناصر المفضلة
      const recommendations = [];
      const favoriteEmbeddings = Array.from(favoriteItems.keys()).map(itemId => {
        const item = allItems.find(i => i.id === itemId);
        return item ? this.createItemEmbedding(item) : null;
      }).filter(e => e);

      allItems.forEach(item => {
        if (favoriteItems.has(item.id)) return; // لا توصية بالعناصر المطلوبة مسبقاً

        const itemEmbedding = this.createItemEmbedding(item);
        let maxSimilarity = 0;

        favoriteEmbeddings.forEach(favEmbedding => {
          const similarity = this.cosineSimilarity(itemEmbedding, favEmbedding);
          maxSimilarity = Math.max(maxSimilarity, similarity);
        });

        if (maxSimilarity > 0.3) { // حد أدنى للتشابه
          recommendations.push({
            menuItem: item,
            score: maxSimilarity,
            reason: 'مشابه للعناصر المفضلة لديك'
          });
        }
      });

      // ترتيب حسب النتيجة وإرجاع العدد المطلوب
      return recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    } catch (error) {
      console.error('خطأ في الحصول على التوصيات الشخصية:', error);
      return [];
    }
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
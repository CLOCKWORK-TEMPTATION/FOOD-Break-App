/**
 * خدمة اكتشاف المطاعم الذكية
 * Smart Restaurant Discovery Service
 *
 * Item 10 من TODO: Smart Restaurant Discovery
 * - Web scraping system (إن كان قانونياً)
 * - التكامل مع APIs تقييم المطاعم
 * - خوارزمية تحليل الجودة
 * - نظام اقتراح المطاعم التلقائي
 */

const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const logger = require('../../utils/logger');

const prisma = new PrismaClient();

class RestaurantDiscoveryService {
  constructor() {
    this.googlePlacesApiKey = process.env.GOOGLE_PLACES_API_KEY;
    this.ratingsCache = new Map();
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * البحث عن مطاعم جديدة باستخدام Google Places API
   * Search for new restaurants using Google Places API
   */
  async searchNewRestaurants(location, radius = 5000, cuisineType = null) {
    try {
      if (!this.googlePlacesApiKey) {
        logger.warn('GOOGLE_PLACES_API_KEY غير محدد');
        return [];
      }

      const params = {
        location: `${location.latitude},${location.longitude}`,
        radius,
        type: 'restaurant',
        key: this.googlePlacesApiKey
      };

      if (cuisineType) {
        params.keyword = cuisineType;
      }

      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
        { params }
      );

      if (response.data.status !== 'OK') {
        logger.error(`خطأ في Google Places API: ${response.data.status}`);
        return [];
      }

      const restaurants = response.data.results;
      logger.info(`تم العثور على ${restaurants.length} مطعم جديد`);

      // معالجة النتائج
      return await Promise.all(
        restaurants.map(r => this._processPlaceResult(r))
      );
    } catch (error) {
      logger.error(`خطأ في البحث عن المطاعم: ${error.message}`);
      return [];
    }
  }

  /**
   * معالجة نتيجة من Google Places
   * Process a Google Places result
   */
  async _processPlaceResult(place) {
    try {
      // جلب التفاصيل الكاملة
      const details = await this._getPlaceDetails(place.place_id);

      return {
        externalId: place.place_id,
        name: place.name,
        address: place.vicinity || details.formatted_address,
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        rating: place.rating || 0,
        totalReviews: place.user_ratings_total || 0,
        priceLevel: place.price_level || 2,
        cuisineType: this._extractCuisineType(place.types),
        phoneNumber: details.formatted_phone_number,
        website: details.website,
        openingHours: details.opening_hours,
        photos: place.photos ? place.photos.slice(0, 3).map(p => p.photo_reference) : [],
        reviews: details.reviews || []
      };
    } catch (error) {
      logger.error(`خطأ في معالجة نتيجة المطعم: ${error.message}`);
      return null;
    }
  }

  /**
   * جلب تفاصيل مكان من Google Places
   * Get place details from Google Places
   */
  async _getPlaceDetails(placeId) {
    try {
      if (!this.googlePlacesApiKey) return {};

      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/place/details/json',
        {
          params: {
            place_id: placeId,
            fields: 'formatted_address,formatted_phone_number,website,opening_hours,reviews,photos',
            key: this.googlePlacesApiKey
          }
        }
      );

      return response.data.result || {};
    } catch (error) {
      logger.error(`خطأ في جلب تفاصيل المكان: ${error.message}`);
      return {};
    }
  }

  /**
   * استخراج نوع المطبخ من الأنواع
   * Extract cuisine type from place types
   */
  _extractCuisineType(types) {
    const cuisineMap = {
      'italian': 'إيطالي',
      'chinese': 'صيني',
      'japanese': 'ياباني',
      'indian': 'هندي',
      'mexican': 'مكسيكي',
      'thai': 'تايلندي',
      'french': 'فرنسي',
      'american': 'أمريكي',
      'mediterranean': 'متوسطي',
      'middle_eastern': 'شرق أوسطي'
    };

    for (const type of types) {
      if (cuisineMap[type]) {
        return cuisineMap[type];
      }
    }

    return 'متنوع';
  }

  /**
   * تجميع التقييمات من منصات متعددة
   * Aggregate ratings from multiple platforms
   */
  async aggregateMultiPlatformRatings(restaurantName, location) {
    try {
      const cacheKey = `${restaurantName}-${location.latitude}-${location.longitude}`;

      // التحقق من الكاش
      if (this.ratingsCache.has(cacheKey)) {
        const cached = this.ratingsCache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheExpiry) {
          return cached.data;
        }
      }

      const ratings = {
        google: await this._getGoogleRating(restaurantName, location),
        // يمكن إضافة منصات أخرى هنا
        // facebook: await this._getFacebookRating(restaurantName),
        // zomato: await this._getZomatoRating(restaurantName),
        aggregated: null
      };

      // حساب التقييم المجمع
      ratings.aggregated = this._calculateAggregatedRating(ratings);

      // حفظ في الكاش
      this.ratingsCache.set(cacheKey, {
        data: ratings,
        timestamp: Date.now()
      });

      return ratings;
    } catch (error) {
      logger.error(`خطأ في تجميع التقييمات: ${error.message}`);
      return null;
    }
  }

  /**
   * جلب تقييم من Google
   * Get Google rating
   */
  async _getGoogleRating(restaurantName, location) {
    try {
      const restaurants = await this.searchNewRestaurants(location, 1000);
      const match = restaurants.find(r =>
        r.name.toLowerCase().includes(restaurantName.toLowerCase())
      );

      return match ? {
        rating: match.rating,
        totalReviews: match.totalReviews,
        source: 'Google'
      } : null;
    } catch (error) {
      logger.error(`خطأ في جلب تقييم Google: ${error.message}`);
      return null;
    }
  }

  /**
   * حساب التقييم المجمع من منصات متعددة
   * Calculate aggregated rating from multiple platforms
   */
  _calculateAggregatedRating(ratings) {
    const sources = [];

    if (ratings.google && ratings.google.rating) {
      sources.push({
        rating: ratings.google.rating,
        weight: ratings.google.totalReviews || 1
      });
    }

    if (sources.length === 0) return 0;

    // متوسط مرجح
    const totalWeight = sources.reduce((sum, s) => sum + s.weight, 0);
    const weightedSum = sources.reduce((sum, s) => sum + (s.rating * s.weight), 0);

    return parseFloat((weightedSum / totalWeight).toFixed(2));
  }

  /**
   * تحليل جودة المطعم
   * Analyze restaurant quality
   */
  async analyzeRestaurantQuality(restaurantId) {
    try {
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId },
        include: {
          reviews: {
            orderBy: { createdAt: 'desc' },
            take: 50
          },
          menuItems: true,
          orders: {
            where: { status: 'DELIVERED' },
            orderBy: { createdAt: 'desc' },
            take: 100
          }
        }
      });

      if (!restaurant) {
        throw new Error('المطعم غير موجود');
      }

      // معايير تحليل الجودة
      const qualityScore = {
        rating: this._analyzeRating(restaurant),
        consistency: this._analyzeConsistency(restaurant.reviews),
        freshness: this._analyzeReviewFreshness(restaurant.reviews),
        sentiment: await this._analyzeSentiment(restaurant.reviews),
        menuQuality: this._analyzeMenuQuality(restaurant.menuItems),
        orderVolume: this._analyzeOrderVolume(restaurant.orders),
        overallScore: 0
      };

      // حساب النتيجة الإجمالية (من 100)
      qualityScore.overallScore = this._calculateOverallQualityScore(qualityScore);

      // حفظ النتيجة
      await this._saveQualityAnalysis(restaurantId, qualityScore);

      return qualityScore;
    } catch (error) {
      logger.error(`خطأ في تحليل جودة المطعم: ${error.message}`);
      throw error;
    }
  }

  /**
   * تحليل التقييم
   * Analyze rating
   */
  _analyzeRating(restaurant) {
    return {
      score: (restaurant.rating / 5) * 100,
      rating: restaurant.rating,
      totalReviews: restaurant.reviews.length
    };
  }

  /**
   * تحليل اتساق التقييمات
   * Analyze review consistency
   */
  _analyzeConsistency(reviews) {
    if (reviews.length < 5) return { score: 50, variance: 0 };

    const ratings = reviews.map(r => r.rating);
    const mean = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
    const variance = ratings.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / ratings.length;

    // تقييمات متسقة = variance منخفض = نتيجة عالية
    const score = Math.max(0, 100 - (variance * 20));

    return { score, variance };
  }

  /**
   * تحليل حداثة التقييمات
   * Analyze review freshness
   */
  _analyzeReviewFreshness(reviews) {
    if (reviews.length === 0) return { score: 0, avgDaysOld: Infinity };

    const now = new Date();
    const avgDaysOld = reviews.reduce((sum, r) => {
      const daysOld = (now - new Date(r.createdAt)) / (24 * 60 * 60 * 1000);
      return sum + daysOld;
    }, 0) / reviews.length;

    // تقييمات حديثة = نتيجة عالية
    const score = Math.max(0, 100 - (avgDaysOld / 10));

    return { score, avgDaysOld };
  }

  /**
   * تحليل المشاعر في التقييمات (مبسط)
   * Sentiment analysis of reviews (simplified)
   */
  async _analyzeSentiment(reviews) {
    // تحليل مبسط بناءً على الكلمات المفتاحية
    const positiveWords = ['ممتاز', 'رائع', 'جميل', 'لذيذ', 'نظيف', 'سريع', 'excellent', 'great', 'delicious'];
    const negativeWords = ['سيء', 'قذر', 'متأخر', 'بارد', 'bad', 'terrible', 'awful', 'late'];

    let positiveCount = 0;
    let negativeCount = 0;

    reviews.forEach(review => {
      if (!review.comment) return;

      const comment = review.comment.toLowerCase();

      positiveWords.forEach(word => {
        if (comment.includes(word)) positiveCount++;
      });

      negativeWords.forEach(word => {
        if (comment.includes(word)) negativeCount++;
      });
    });

    const total = positiveCount + negativeCount;
    const sentimentScore = total > 0 ? (positiveCount / total) * 100 : 50;

    return {
      score: sentimentScore,
      positiveCount,
      negativeCount
    };
  }

  /**
   * تحليل جودة القائمة
   * Analyze menu quality
   */
  _analyzeMenuQuality(menuItems) {
    const availableItems = menuItems.filter(item => item.isAvailable);
    const itemsWithNutrition = menuItems.filter(item => item.nutritionalInfo);

    const varietyScore = Math.min(100, (availableItems.length / 20) * 100);
    const nutritionScore = menuItems.length > 0
      ? (itemsWithNutrition.length / menuItems.length) * 100
      : 0;

    return {
      score: (varietyScore + nutritionScore) / 2,
      totalItems: menuItems.length,
      availableItems: availableItems.length,
      itemsWithNutrition: itemsWithNutrition.length
    };
  }

  /**
   * تحليل حجم الطلبات
   * Analyze order volume
   */
  _analyzeOrderVolume(orders) {
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentOrders = orders.filter(o => new Date(o.createdAt) >= last30Days);

    const score = Math.min(100, (recentOrders.length / 50) * 100);

    return {
      score,
      totalOrders: orders.length,
      recentOrders: recentOrders.length
    };
  }

  /**
   * حساب النتيجة الإجمالية للجودة
   * Calculate overall quality score
   */
  _calculateOverallQualityScore(qualityScore) {
    const weights = {
      rating: 0.30,
      consistency: 0.15,
      freshness: 0.10,
      sentiment: 0.20,
      menuQuality: 0.15,
      orderVolume: 0.10
    };

    let total = 0;
    total += qualityScore.rating.score * weights.rating;
    total += qualityScore.consistency.score * weights.consistency;
    total += qualityScore.freshness.score * weights.freshness;
    total += qualityScore.sentiment.score * weights.sentiment;
    total += qualityScore.menuQuality.score * weights.menuQuality;
    total += qualityScore.orderVolume.score * weights.orderVolume;

    return parseFloat(total.toFixed(2));
  }

  /**
   * حفظ تحليل الجودة
   * Save quality analysis
   */
  async _saveQualityAnalysis(restaurantId, qualityScore) {
    try {
      // تحديث qualityScore في المطعم
      await prisma.restaurant.update({
        where: { id: restaurantId },
        data: {
          qualityScore: qualityScore.overallScore,
          lastReviewed: new Date()
        }
      });

      logger.info(`تم حفظ تحليل الجودة للمطعم ${restaurantId}: ${qualityScore.overallScore}`);
    } catch (error) {
      logger.error(`خطأ في حفظ تحليل الجودة: ${error.message}`);
    }
  }

  /**
   * اقتراح مطاعم جديدة تلقائياً
   * Automatically suggest new restaurants
   */
  async suggestNewRestaurants(location, criteria = {}) {
    try {
      const {
        minRating = 4.0,
        minReviews = 10,
        maxDistance = 5000,
        cuisineTypes = null
      } = criteria;

      logger.info('البحث عن مطاعم جديدة للاقتراح...');

      // البحث عن مطاعم
      const candidates = await this.searchNewRestaurants(location, maxDistance);

      // تصفية المطاعم
      const filtered = candidates.filter(restaurant => {
        if (!restaurant) return false;
        if (restaurant.rating < minRating) return false;
        if (restaurant.totalReviews < minReviews) return false;
        if (cuisineTypes && !cuisineTypes.includes(restaurant.cuisineType)) return false;

        return true;
      });

      logger.info(`تم العثور على ${filtered.length} مطعم مقترح`);

      // ترتيب حسب التقييم والمراجعات
      const sorted = filtered.sort((a, b) => {
        const scoreA = a.rating * Math.log(a.totalReviews + 1);
        const scoreB = b.rating * Math.log(b.totalReviews + 1);
        return scoreB - scoreA;
      });

      return sorted.slice(0, 10); // أفضل 10 مطاعم
    } catch (error) {
      logger.error(`خطأ في اقتراح مطاعم جديدة: ${error.message}`);
      return [];
    }
  }

  /**
   * سير عمل الاختبار والتجريب للمطاعم الجديدة
   * Testing and trial workflow for new restaurants
   */
  async createTrialWorkflow(restaurantData) {
    try {
      logger.info(`إنشاء سير عمل تجريبي للمطعم: ${restaurantData.name}`);

      // إنشاء المطعم بحالة "تحت التجربة"
      const restaurant = await prisma.restaurant.create({
        data: {
          ...restaurantData,
          isActive: false, // غير مفعل حتى ينجح الاختبار
          isPartner: false,
          rating: restaurantData.rating || 0
        }
      });

      // إنشاء خطة الاختبار
      const trialPlan = {
        restaurantId: restaurant.id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // تجربة لمدة 14 يوم
        status: 'TRIAL',
        criteria: {
          minOrders: 10,
          minAverageRating: 4.0,
          maxComplaintRate: 0.1
        },
        checkpoints: [
          { day: 7, status: 'PENDING', note: 'مراجعة منتصف الفترة' },
          { day: 14, status: 'PENDING', note: 'مراجعة نهائية' }
        ]
      };

      logger.info(`تم إنشاء سير عمل تجريبي للمطعم ${restaurant.id}`);

      return {
        restaurant,
        trialPlan
      };
    } catch (error) {
      logger.error(`خطأ في إنشاء سير عمل التجريب: ${error.message}`);
      throw error;
    }
  }

  /**
   * تقييم نتائج التجربة
   * Evaluate trial results
   */
  async evaluateTrialResults(restaurantId) {
    try {
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId },
        include: {
          orders: {
            where: { status: 'DELIVERED' }
          },
          reviews: true
        }
      });

      if (!restaurant) {
        throw new Error('المطعم غير موجود');
      }

      const totalOrders = restaurant.orders.length;
      const avgRating = restaurant.reviews.length > 0
        ? restaurant.reviews.reduce((sum, r) => sum + r.rating, 0) / restaurant.reviews.length
        : 0;

      const complaints = restaurant.reviews.filter(r => r.rating < 3).length;
      const complaintRate = restaurant.reviews.length > 0
        ? complaints / restaurant.reviews.length
        : 0;

      const passed = totalOrders >= 10 && avgRating >= 4.0 && complaintRate <= 0.1;

      logger.info(`تقييم التجربة للمطعم ${restaurantId}: ${passed ? 'نجح' : 'فشل'}`);

      if (passed) {
        // تفعيل المطعم
        await prisma.restaurant.update({
          where: { id: restaurantId },
          data: {
            isActive: true,
            isPartner: true
          }
        });
      }

      return {
        passed,
        metrics: {
          totalOrders,
          avgRating,
          complaintRate
        }
      };
    } catch (error) {
      logger.error(`خطأ في تقييم نتائج التجربة: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new RestaurantDiscoveryService();

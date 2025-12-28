/**
 * خدمة جمع وإعداد بيانات التدريب للتعلم الآلي
 * ML Training Data Collection and Preparation Service
 *
 * هذه الخدمة مسؤولة عن جمع وتحضير البيانات للتدريب:
 * - Order history data
 * - User preferences
 * - Weather data
 * - Nutritional preferences
 * - Restaurant ratings
 */

const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const logger = require('../../utils/logger');

const prisma = new PrismaClient();

class TrainingDataService {
  /**
   * جمع بيانات تاريخ الطلبات للتدريب
   * Collect order history data for training
   */
  async collectOrderHistoryData(startDate = null, endDate = null) {
    try {
      const whereClause = {
        status: 'DELIVERED'
      };

      if (startDate && endDate) {
        whereClause.createdAt = {
          gte: new Date(startDate),
          lte: new Date(endDate)
        };
      }

      const orders = await prisma.order.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              role: true,
              preferences: true
            }
          },
          items: {
            include: {
              menuItem: {
                include: {
                  nutritionalInfo: true,
                  restaurant: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      logger.info(`جمع ${orders.length} طلب للتدريب`);

      return orders.map(order => this._transformOrderToTrainingData(order));
    } catch (error) {
      logger.error(`خطأ في جمع بيانات الطلبات: ${error.message}`);
      throw error;
    }
  }

  /**
   * تحويل الطلب إلى بيانات تدريب
   * Transform order to training data format
   */
  _transformOrderToTrainingData(order) {
    const orderDate = new Date(order.createdAt);

    return {
      orderId: order.id,
      userId: order.user.id,
      userRole: order.user.role,
      orderDate: order.createdAt,
      dayOfWeek: orderDate.getDay(),
      hourOfDay: orderDate.getHours(),
      timeSlot: this._getTimeSlot(orderDate.getHours()),
      totalAmount: order.totalAmount,
      itemCount: order.items.length,
      items: order.items.map(item => ({
        menuItemId: item.menuItemId,
        menuItemName: item.menuItem.name,
        quantity: item.quantity,
        price: item.price,
        category: item.menuItem.category,
        cuisineType: item.menuItem.restaurant?.cuisineType,
        restaurantId: item.menuItem.restaurantId,
        nutrition: item.menuItem.nutritionalInfo ? {
          calories: item.menuItem.nutritionalInfo.calories,
          protein: item.menuItem.nutritionalInfo.protein,
          carbs: item.menuItem.nutritionalInfo.carbs,
          fat: item.menuItem.nutritionalInfo.fat
        } : null
      })),
      userPreferences: order.user.preferences ? {
        dietaryRestrictions: order.user.preferences.dietaryRestrictions,
        favoriteCuisines: order.user.preferences.favoriteCuisines,
        spiceLevel: order.user.preferences.spiceLevel,
        allergies: order.user.preferences.allergies,
        healthGoals: order.user.preferences.healthGoals
      } : null
    };
  }

  /**
   * جمع بيانات الطقس التاريخية
   * Collect historical weather data
   */
  async collectWeatherData(location, startDate, endDate) {
    try {
      // استخدام OpenWeatherMap API للبيانات التاريخية
      const apiKey = process.env.OPENWEATHER_API_KEY;

      if (!apiKey) {
        logger.warn('OPENWEATHER_API_KEY غير محدد، سيتم تخطي بيانات الطقس');
        return [];
      }

      const weatherData = [];
      const start = new Date(startDate);
      const end = new Date(endDate);

      // جمع البيانات يوم بيوم
      for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        const timestamp = Math.floor(date.getTime() / 1000);

        try {
          const response = await axios.get(
            `https://api.openweathermap.org/data/2.5/onecall/timemachine`,
            {
              params: {
                lat: location.latitude,
                lon: location.longitude,
                dt: timestamp,
                appid: apiKey,
                units: 'metric'
              }
            }
          );

          if (response.data && response.data.current) {
            weatherData.push({
              date: new Date(date),
              temperature: response.data.current.temp,
              feelsLike: response.data.current.feels_like,
              humidity: response.data.current.humidity,
              weather: response.data.current.weather[0].main,
              weatherDescription: response.data.current.weather[0].description,
              windSpeed: response.data.current.wind_speed
            });
          }
        } catch (error) {
          logger.error(`خطأ في جمع بيانات الطقس لتاريخ ${date}: ${error.message}`);
        }

        // تأخير لتجنب تجاوز حد الطلبات
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      logger.info(`جمع ${weatherData.length} سجل طقس`);
      return weatherData;
    } catch (error) {
      logger.error(`خطأ في جمع بيانات الطقس: ${error.message}`);
      return [];
    }
  }

  /**
   * جمع بيانات تفضيلات المستخدمين
   * Collect user preferences data
   */
  async collectUserPreferencesData() {
    try {
      const users = await prisma.user.findMany({
        where: { isActive: true },
        include: {
          preferences: {
            include: {
              dietaryProfile: true
            }
          },
          behaviors: true,
          orderPatterns: true
        }
      });

      logger.info(`جمع تفضيلات ${users.length} مستخدم`);

      return users.map(user => ({
        userId: user.id,
        role: user.role,
        preferences: user.preferences,
        behaviors: user.behaviors,
        patterns: user.orderPatterns
      }));
    } catch (error) {
      logger.error(`خطأ في جمع تفضيلات المستخدمين: ${error.message}`);
      throw error;
    }
  }

  /**
   * جمع بيانات تقييمات المطاعم
   * Collect restaurant ratings data
   */
  async collectRestaurantRatingsData() {
    try {
      const restaurants = await prisma.restaurant.findMany({
        where: { isActive: true },
        include: {
          reviews: {
            include: {
              user: {
                select: { id: true, role: true }
              }
            }
          },
          _count: {
            select: {
              orders: true,
              menuItems: true
            }
          }
        }
      });

      logger.info(`جمع تقييمات ${restaurants.length} مطعم`);

      return restaurants.map(restaurant => ({
        restaurantId: restaurant.id,
        name: restaurant.name,
        cuisineType: restaurant.cuisineType,
        rating: restaurant.rating,
        totalOrders: restaurant._count.orders,
        totalMenuItems: restaurant._count.menuItems,
        reviews: restaurant.reviews.map(review => ({
          rating: review.rating,
          comment: review.comment,
          userRole: review.user.role,
          createdAt: review.createdAt
        }))
      }));
    } catch (error) {
      logger.error(`خطأ في جمع تقييمات المطاعم: ${error.message}`);
      throw error;
    }
  }

  /**
   * إنشاء dataset كامل للتدريب
   * Create complete training dataset
   */
  async createTrainingDataset(options = {}) {
    try {
      const {
        includeWeather = false,
        location = { latitude: 24.7136, longitude: 46.6753 }, // Riyadh default
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // last 90 days
        endDate = new Date()
      } = options;

      logger.info('بدء إنشاء dataset للتدريب...');

      const dataset = {
        metadata: {
          createdAt: new Date(),
          startDate,
          endDate,
          includesWeather: includeWeather
        },
        orders: await this.collectOrderHistoryData(startDate, endDate),
        userPreferences: await this.collectUserPreferencesData(),
        restaurantRatings: await this.collectRestaurantRatingsData()
      };

      if (includeWeather) {
        dataset.weather = await this.collectWeatherData(location, startDate, endDate);
      }

      // إحصائيات Dataset
      dataset.metadata.stats = {
        totalOrders: dataset.orders.length,
        totalUsers: dataset.userPreferences.length,
        totalRestaurants: dataset.restaurantRatings.length,
        weatherRecords: dataset.weather ? dataset.weather.length : 0
      };

      logger.info(`تم إنشاء dataset: ${JSON.stringify(dataset.metadata.stats)}`);

      return dataset;
    } catch (error) {
      logger.error(`خطأ في إنشاء training dataset: ${error.message}`);
      throw error;
    }
  }

  /**
   * تحضير بيانات لتدريب نموذج التوصيات
   * Prepare data for recommendation model training
   */
  async prepareRecommendationTrainingData() {
    try {
      const orders = await this.collectOrderHistoryData();

      // إنشاء user-item interactions matrix
      const interactions = [];

      orders.forEach(order => {
        order.items.forEach(item => {
          interactions.push({
            userId: order.userId,
            menuItemId: item.menuItemId,
            rating: this._calculateImplicitRating(item, order),
            timestamp: order.orderDate,
            context: {
              dayOfWeek: order.dayOfWeek,
              timeSlot: order.timeSlot,
              weather: null // يمكن إضافة بيانات الطقس
            }
          });
        });
      });

      logger.info(`تم تحضير ${interactions.length} interaction للتدريب`);

      return {
        interactions,
        users: [...new Set(interactions.map(i => i.userId))],
        items: [...new Set(interactions.map(i => i.menuItemId))]
      };
    } catch (error) {
      logger.error(`خطأ في تحضير بيانات التوصيات: ${error.message}`);
      throw error;
    }
  }

  /**
   * حساب تقييم ضمني من بيانات الطلب
   * Calculate implicit rating from order data
   */
  _calculateImplicitRating(item, order) {
    let rating = 3.0; // baseline

    // زيادة التقييم بناءً على الكمية
    if (item.quantity > 1) rating += 0.5;
    if (item.quantity > 2) rating += 0.5;

    // زيادة بناءً على إعادة الطلب (يتطلب تحقق إضافي)
    // يمكن إضافة منطق أكثر تعقيداً هنا

    return Math.min(rating, 5.0);
  }

  /**
   * تحديد الفترة الزمنية
   */
  _getTimeSlot(hour) {
    if (hour >= 6 && hour < 11) return 'morning';
    if (hour >= 11 && hour < 15) return 'lunch';
    if (hour >= 15 && hour < 18) return 'afternoon';
    return 'evening';
  }

  /**
   * حفظ dataset إلى ملف (للتدريب offline)
   */
  async saveDatasetToFile(dataset, filename) {
    const fs = require('fs').promises;
    const path = require('path');

    try {
      const dataDir = path.join(__dirname, '../../../data/training');
      await fs.mkdir(dataDir, { recursive: true });

      const filepath = path.join(dataDir, filename);
      await fs.writeFile(filepath, JSON.stringify(dataset, null, 2));

      logger.info(`تم حفظ dataset في ${filepath}`);
      return filepath;
    } catch (error) {
      logger.error(`خطأ في حفظ dataset: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new TrainingDataService();

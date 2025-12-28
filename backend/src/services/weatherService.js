const axios = require('axios');
const logger = require('../utils/logger');

/**
 * خدمة الطقس - Weather Service
 * الحصول على بيانات الطقس من OpenWeatherMap API
 */
class WeatherService {
  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY;
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
  }

  // الحصول على الطقس الحالي
  async getCurrentWeather(lat, lon) {
    try {
      if (!this.apiKey) {
        logger.warn('OpenWeather API key not configured');
        return this.getMockWeather();
      }

      const response = await axios.get(`${this.baseUrl}/weather`, {
        params: {
          lat,
          lon,
          appid: this.apiKey,
          units: 'metric',
          lang: 'ar'
        }
      });

      return this.formatWeatherData(response.data);
    } catch (error) {
      logger.error('Error fetching weather:', error);
      return this.getMockWeather();
    }
  }

  // تنسيق بيانات الطقس
  formatWeatherData(data) {
    return {
      temp: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      condition: data.weather[0].main,
      description: data.weather[0].description,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      icon: data.weather[0].icon,
      timestamp: new Date()
    };
  }

  // بيانات طقس افتراضية
  getMockWeather() {
    return {
      temp: 25,
      feelsLike: 27,
      condition: 'Clear',
      description: 'سماء صافية',
      humidity: 60,
      windSpeed: 5,
      icon: '01d',
      timestamp: new Date()
    };
  }

  // تحديد نوع الطعام المناسب حسب الطقس
  getWeatherBasedFoodType(weather) {
    const temp = weather.temp;
    const condition = weather.condition.toLowerCase();

    if (temp < 15 || condition.includes('rain') || condition.includes('cold')) {
      return {
        type: 'warm',
        categories: ['soup', 'hot_drinks', 'stew', 'pasta'],
        description: 'طعام دافئ ومريح'
      };
    } else if (temp > 30 || condition.includes('hot')) {
      return {
        type: 'cool',
        categories: ['salad', 'cold_drinks', 'ice_cream', 'fruits'],
        description: 'طعام منعش وخفيف'
      };
    } else {
      return {
        type: 'moderate',
        categories: ['balanced', 'grilled', 'sandwiches'],
        description: 'طعام متوازن'
      };
    }
  }

  // الحصول على توصيات بناءً على الطقس
  async getWeatherRecommendations(lat, lon) {
    try {
      const weather = await this.getCurrentWeather(lat, lon);
      const foodType = this.getWeatherBasedFoodType(weather);

      return {
        weather,
        foodType,
        recommendations: this.generateRecommendations(weather, foodType)
      };
    } catch (error) {
      logger.error('Error getting weather recommendations:', error);
      throw error;
    }
  }

  // توليد توصيات محددة
  generateRecommendations(weather, foodType) {
    const recommendations = [];

    if (foodType.type === 'warm') {
      recommendations.push(
        'شوربة ساخنة',
        'مشروبات دافئة',
        'وجبات مطبوخة'
      );
    } else if (foodType.type === 'cool') {
      recommendations.push(
        'سلطات طازجة',
        'عصائر باردة',
        'فواكه موسمية'
      );
    } else {
      recommendations.push(
        'وجبات متوازنة',
        'مشويات',
        'سندويشات'
      );
    }

    return recommendations;
  }
}

module.exports = new WeatherService();

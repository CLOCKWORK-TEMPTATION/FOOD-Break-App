/**
 * Weather Service Tests
 * اختبارات خدمة الطقس
 */

const weatherService = require('../../../src/services/weatherService');

// Mock axios
jest.mock('axios');
const axios = require('axios');

describe('Weather Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getWeather', () => {
    it('should get weather data for location', async () => {
      axios.get = jest.fn().mockResolvedValue({
        data: {
          main: { temp: 25, humidity: 60 },
          weather: [{ description: 'Clear sky' }]
        }
      });

      const result = await weatherService.getWeather({ lat: 40.7128, lon: -74.0060 });

      expect(result).toHaveProperty('temp');
    });

    it('should handle API errors', async () => {
      axios.get = jest.fn().mockRejectedValue(new Error('API error'));

      await expect(weatherService.getWeather({ lat: 0, lon: 0 })).rejects.toThrow();
    });
  });

  describe('getForecast', () => {
    it('should get weather forecast', async () => {
      axios.get = jest.fn().mockResolvedValue({
        data: {
          list: [
            { dt: 1234567890, main: { temp: 20 } }
          ]
        }
      });

      const result = await weatherService.getForecast({ lat: 40.7128, lon: -74.0060 });

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getWeatherAlerts', () => {
    it('should get weather alerts', async () => {
      axios.get = jest.fn().mockResolvedValue({
        data: {
          alerts: [{ event: 'Thunderstorm', description: 'Severe thunderstorm' }]
        }
      });

      const result = await weatherService.getWeatherAlerts({ lat: 40.7128, lon: -74.0060 });

      expect(result).toBeDefined();
    });
  });

  describe('shouldRecommendDelivery', () => {
    it('should recommend delivery based on weather', async () => {
      axios.get = jest.fn().mockResolvedValue({
        data: {
          main: { temp: 25 },
          weather: [{ description: 'Clear sky' }]
        }
      });

      const result = await weatherService.shouldRecommendDelivery({ lat: 40.7128, lon: -74.0060 });

      expect(typeof result).toBe('boolean');
    });
  });
});

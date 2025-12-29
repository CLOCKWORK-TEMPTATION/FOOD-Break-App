/**
 * Smoke Tests - Weather Service
 */

jest.mock('axios');
jest.mock('@prisma/client');

const weatherService = require('../weatherService');

describe('WeatherService - Smoke Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const axios = require('axios');
    axios.get.mockResolvedValue({ data: { main: { temp: 25 }, weather: [{ description: 'clear' }] } });
  });

  it('should handle getWeather', async () => {
    if (weatherService.getWeather) {
      await expect(weatherService.getWeather(24.7136, 46.6753)).resolves.not.toThrow();
    }
  });

  it('should handle getCurrentWeather', async () => {
    if (weatherService.getCurrentWeather) {
      await expect(weatherService.getCurrentWeather()).resolves.not.toThrow();
    }
  });
});

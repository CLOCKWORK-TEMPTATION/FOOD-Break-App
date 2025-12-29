/**
 * Tests for Nutrition Routes
 */

jest.mock('../../controllers/nutritionController');
jest.mock('../../middleware/auth');

const express = require('express');
const request = require('supertest');
const nutritionController = require('../../controllers/nutritionController');
const { authenticate, authorize } = require('../../middleware/auth');

describe('Nutrition Routes', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();

    app = express();
    app.use(express.json());

    // Mock authentication middleware
    authenticate.mockImplementation((req, res, next) => {
      req.user = { id: 'user123', role: 'USER' };
      next();
    });

    authorize.mockImplementation(() => (req, res, next) => next());

    // Mock all controller functions
    Object.keys(nutritionController).forEach((key) => {
      if (typeof nutritionController[key] === 'function') {
        nutritionController[key].mockImplementation((req, res) => {
          res.status(200).json({ success: true, data: {} });
        });
      }
    });

    // Load routes
    const nutritionRoutes = require('../../routes/nutrition');
    app.use('/api/nutrition', nutritionRoutes);
  });

  describe('POST /api/nutrition/log', () => {
    it('should log nutrition data', async () => {
      const nutritionData = {
        calories: 500,
        protein: 25,
        carbs: 60,
        fat: 15
      };

      const response = await request(app)
        .post('/api/nutrition/log')
        .send(nutritionData);

      expect(response.status).toBe(200);
      expect(nutritionController.logNutrition).toHaveBeenCalled();
    });
  });

  describe('GET /api/nutrition/today', () => {
    it('should get today nutrition', async () => {
      const response = await request(app).get('/api/nutrition/today');

      expect(response.status).toBe(200);
      expect(nutritionController.getTodayNutrition).toHaveBeenCalled();
    });
  });

  describe('GET /api/nutrition/logs', () => {
    it('should get nutrition logs', async () => {
      const response = await request(app).get(
        '/api/nutrition/logs?startDate=2025-01-01&endDate=2025-01-31'
      );

      expect(response.status).toBe(200);
      expect(nutritionController.getNutritionLogs).toHaveBeenCalled();
    });
  });

  describe('POST /api/nutrition/goals', () => {
    it('should set nutrition goal', async () => {
      const goalData = {
        goalType: 'WEIGHT_LOSS',
        targetCalories: 1800,
        targetProtein: 90
      };

      const response = await request(app)
        .post('/api/nutrition/goals')
        .send(goalData);

      expect(response.status).toBe(200);
      expect(nutritionController.setGoal).toHaveBeenCalled();
    });
  });

  describe('GET /api/nutrition/goals', () => {
    it('should get nutrition goals', async () => {
      const response = await request(app).get('/api/nutrition/goals');

      expect(response.status).toBe(200);
      expect(nutritionController.getGoals).toHaveBeenCalled();
    });
  });

  describe('POST /api/nutrition/reports/weekly', () => {
    it('should generate weekly report', async () => {
      const response = await request(app).post(
        '/api/nutrition/reports/weekly'
      );

      expect(response.status).toBe(200);
      expect(nutritionController.generateReport).toHaveBeenCalled();
    });
  });

  describe('GET /api/nutrition/reports/weekly', () => {
    it('should get weekly reports', async () => {
      const response = await request(app).get(
        '/api/nutrition/reports/weekly'
      );

      expect(response.status).toBe(200);
      expect(nutritionController.getReports).toHaveBeenCalled();
    });
  });

  describe('POST /api/nutrition/challenges', () => {
    it('should create challenge', async () => {
      const challengeData = {
        name: 'Summer Challenge',
        description: 'Get fit',
        startDate: '2025-06-01',
        endDate: '2025-08-31'
      };

      const response = await request(app)
        .post('/api/nutrition/challenges')
        .send(challengeData);

      expect(response.status).toBe(200);
      expect(nutritionController.createChallenge).toHaveBeenCalled();
    });
  });

  describe('GET /api/nutrition/challenges', () => {
    it('should get challenges', async () => {
      const response = await request(app).get('/api/nutrition/challenges');

      expect(response.status).toBe(200);
      expect(nutritionController.getChallenges).toHaveBeenCalled();
    });
  });

  describe('POST /api/nutrition/challenges/:id/join', () => {
    it('should join challenge', async () => {
      const response = await request(app).post(
        '/api/nutrition/challenges/challenge123/join'
      );

      expect(response.status).toBe(200);
      expect(nutritionController.joinChallenge).toHaveBeenCalled();
    });
  });

  describe('PATCH /api/nutrition/challenges/:id/progress', () => {
    it('should update challenge progress', async () => {
      const response = await request(app)
        .patch('/api/nutrition/challenges/challenge123/progress')
        .send({ progress: 75 });

      expect(response.status).toBe(200);
      expect(nutritionController.updateProgress).toHaveBeenCalled();
    });
  });

  describe('GET /api/nutrition/challenges/:id/leaderboard', () => {
    it('should get challenge leaderboard', async () => {
      const response = await request(app).get(
        '/api/nutrition/challenges/challenge123/leaderboard'
      );

      expect(response.status).toBe(200);
      expect(nutritionController.getLeaderboard).toHaveBeenCalled();
    });
  });

  describe('GET /api/nutrition/user/challenges', () => {
    it('should get user challenges', async () => {
      const response = await request(app).get(
        '/api/nutrition/user/challenges'
      );

      expect(response.status).toBe(200);
      expect(nutritionController.getUserChallenges).toHaveBeenCalled();
    });
  });
});

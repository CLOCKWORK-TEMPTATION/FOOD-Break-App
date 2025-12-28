/**
 * Tests for Nutrition Controller
 */

jest.mock('../../services/nutritionService');
jest.mock('../../utils/logger');

const nutritionController = require('../nutritionController');
const nutritionService = require('../../services/nutritionService');

describe('Nutrition Controller', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      user: { id: 'user123', role: 'USER' },
      params: {},
      query: {},
      body: {},
      t: (key) => key
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('logNutrition', () => {
    it('should log nutrition successfully', async () => {
      req.body = {
        calories: 500,
        protein: 25,
        carbs: 60,
        fat: 15,
        fiber: 5,
        sugar: 10,
        sodium: 400,
        orderId: 'order123'
      };

      nutritionService.logDailyNutrition = jest.fn().mockResolvedValue({
        id: 'log123',
        userId: 'user123',
        ...req.body
      });

      nutritionService.updateGoalProgress = jest.fn().mockResolvedValue();

      await nutritionController.logNutrition(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });

    it('should handle errors', async () => {
      req.body = { calories: 500 };

      nutritionService.logDailyNutrition = jest.fn().mockRejectedValue(
        new Error('Database error')
      );

      await nutritionController.logNutrition(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getTodayNutrition', () => {
    it('should get today nutrition and goals', async () => {
      nutritionService.getTodayNutrition = jest.fn().mockResolvedValue({
        calories: 1500,
        protein: 75,
        carbs: 180,
        fat: 50
      });

      nutritionService.getActiveGoals = jest.fn().mockResolvedValue([
        {
          id: 'goal123',
          targetCalories: 2000,
          targetProtein: 100
        }
      ]);

      await nutritionController.getTodayNutrition(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            nutrition: expect.any(Object),
            goals: expect.any(Object)
          })
        })
      );
    });

    it('should handle no goals', async () => {
      nutritionService.getTodayNutrition = jest.fn().mockResolvedValue({});
      nutritionService.getActiveGoals = jest.fn().mockResolvedValue([]);

      await nutritionController.getTodayNutrition(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            goals: null
          })
        })
      );
    });
  });

  describe('getNutritionLogs', () => {
    it('should get nutrition logs for date range', async () => {
      req.query = {
        startDate: '2025-01-01',
        endDate: '2025-01-07'
      };

      nutritionService.getNutritionLogs = jest.fn().mockResolvedValue([
        { id: 'log1', date: '2025-01-01' },
        { id: 'log2', date: '2025-01-02' }
      ]);

      await nutritionController.getNutritionLogs(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array)
        })
      );
    });

    it('should reject missing date parameters', async () => {
      req.query = {};

      await nutritionController.getNutritionLogs(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('setGoal', () => {
    it('should set nutrition goal successfully', async () => {
      req.body = {
        goalType: 'WEIGHT_LOSS',
        targetCalories: 1800,
        targetProtein: 90,
        targetCarbs: 200,
        targetFat: 60
      };

      nutritionService.setNutritionGoal = jest.fn().mockResolvedValue({
        id: 'goal123',
        userId: 'user123',
        ...req.body
      });

      await nutritionController.setGoal(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });

    it('should reject missing goal type', async () => {
      req.body = { targetCalories: 2000 };

      await nutritionController.setGoal(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getGoals', () => {
    it('should get active goals', async () => {
      nutritionService.getActiveGoals = jest.fn().mockResolvedValue([
        { id: 'goal1', goalType: 'WEIGHT_LOSS' },
        { id: 'goal2', goalType: 'MUSCLE_GAIN' }
      ]);

      await nutritionController.getGoals(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array)
        })
      );
    });
  });

  describe('generateReport', () => {
    it('should generate weekly report', async () => {
      nutritionService.generateWeeklyReport = jest.fn().mockResolvedValue({
        id: 'report123',
        weekStart: new Date(),
        weekEnd: new Date(),
        avgCalories: 1800,
        avgProtein: 85
      });

      await nutritionController.generateReport(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });
  });

  describe('getReports', () => {
    it('should get weekly reports with limit', async () => {
      req.query = { limit: '5' };

      nutritionService.getWeeklyReports = jest.fn().mockResolvedValue([
        { id: 'report1' },
        { id: 'report2' },
        { id: 'report3' }
      ]);

      await nutritionController.getReports(req, res);

      expect(nutritionService.getWeeklyReports).toHaveBeenCalledWith('user123', 5);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should use default limit', async () => {
      req.query = {};

      nutritionService.getWeeklyReports = jest.fn().mockResolvedValue([]);

      await nutritionController.getReports(req, res);

      expect(nutritionService.getWeeklyReports).toHaveBeenCalledWith('user123', 4);
    });
  });

  describe('createChallenge', () => {
    it('should create team challenge', async () => {
      req.body = {
        name: 'Summer Challenge',
        description: 'Get fit for summer',
        startDate: '2025-06-01',
        endDate: '2025-08-31',
        goalType: 'WEIGHT_LOSS'
      };

      nutritionService.createTeamChallenge = jest.fn().mockResolvedValue({
        id: 'challenge123',
        ...req.body,
        createdBy: 'user123'
      });

      await nutritionController.createChallenge(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });
  });

  describe('getChallenges', () => {
    it('should get active challenges', async () => {
      nutritionService.getActiveChallenges = jest.fn().mockResolvedValue([
        { id: 'challenge1', name: 'Challenge 1' },
        { id: 'challenge2', name: 'Challenge 2' }
      ]);

      await nutritionController.getChallenges(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array)
        })
      );
    });
  });

  describe('joinChallenge', () => {
    it('should join challenge successfully', async () => {
      req.params = { id: 'challenge123' };

      nutritionService.joinChallenge = jest.fn().mockResolvedValue({
        id: 'participant123',
        challengeId: 'challenge123',
        userId: 'user123',
        progress: 0
      });

      await nutritionController.joinChallenge(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });

    it('should handle join errors', async () => {
      req.params = { id: 'challenge123' };

      nutritionService.joinChallenge = jest.fn().mockRejectedValue(
        new Error('Already joined')
      );

      await nutritionController.joinChallenge(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('updateProgress', () => {
    it('should update challenge progress', async () => {
      req.params = { id: 'challenge123' };
      req.body = { progress: 75 };

      nutritionService.updateChallengeProgress = jest.fn().mockResolvedValue({
        id: 'participant123',
        progress: 75
      });

      await nutritionController.updateProgress(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Object)
        })
      );
    });

    it('should reject invalid progress', async () => {
      req.params = { id: 'challenge123' };
      req.body = { progress: 'invalid' };

      await nutritionController.updateProgress(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getLeaderboard', () => {
    it('should get challenge leaderboard', async () => {
      req.params = { id: 'challenge123' };

      nutritionService.getChallengeLeaderboard = jest.fn().mockResolvedValue([
        { userId: 'user1', progress: 100, rank: 1 },
        { userId: 'user2', progress: 85, rank: 2 },
        { userId: 'user3', progress: 70, rank: 3 }
      ]);

      await nutritionController.getLeaderboard(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array)
        })
      );
    });
  });

  describe('getUserChallenges', () => {
    it('should get user challenges', async () => {
      nutritionService.getUserChallenges = jest.fn().mockResolvedValue([
        { id: 'challenge1', name: 'Challenge 1', progress: 60 },
        { id: 'challenge2', name: 'Challenge 2', progress: 40 }
      ]);

      await nutritionController.getUserChallenges(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array)
        })
      );
    });
  });
});

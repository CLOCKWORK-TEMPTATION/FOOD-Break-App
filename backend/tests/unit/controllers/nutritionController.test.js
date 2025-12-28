/**
 * Nutrition Controller Unit Tests
 * اختبارات وحدة متحكم التغذية
 */

const request = require('supertest');
const nutritionController = require('../../../src/controllers/nutritionController');
const nutritionService = require('../../../src/services/nutritionService');

// Mock the service
jest.mock('../../../src/services/nutritionService');

describe('Nutrition Controller', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      user: { id: 'test-user-id' },
      body: {},
      params: {},
      query: {}
    };
    mockRes = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('getDailyNutritionLog', () => {
    it('should return daily nutrition log successfully', async () => {
      const mockLog = {
        id: 'log-id',
        totalCalories: 2000,
        totalProtein: 150,
        totalCarbs: 250,
        totalFat: 70
      };

      nutritionService.getDailyLog.mockResolvedValue(mockLog);

      await nutritionController.getDailyNutritionLog(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockLog
      });
    });

    it('should handle service errors', async () => {
      nutritionService.getDailyLog.mockRejectedValue(new Error('Service error'));

      await nutritionController.getDailyNutritionLog(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('createNutritionGoal', () => {
    it('should create nutrition goal successfully', async () => {
      const mockGoal = {
        id: 'goal-id',
        goalType: 'WEIGHT_LOSS',
        targetCalories: 2000
      };

      mockReq.body = {
        goalType: 'WEIGHT_LOSS',
        targetCalories: 2000,
        targetProtein: 150
      };

      nutritionService.createGoal.mockResolvedValue(mockGoal);

      await nutritionController.createNutritionGoal(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockGoal
      });
    });

    it('should validate required fields', async () => {
      mockReq.body = {}; // Missing required fields

      await nutritionController.createNutritionGoal(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getNutritionGoals', () => {
    it('should return user nutrition goals', async () => {
      const mockGoals = [
        { id: 'goal-1', goalType: 'WEIGHT_LOSS' },
        { id: 'goal-2', goalType: 'MUSCLE_BUILD' }
      ];

      nutritionService.getUserGoals.mockResolvedValue(mockGoals);

      await nutritionController.getNutritionGoals(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockGoals
      });
    });
  });

  describe('updateNutritionGoal', () => {
    it('should update nutrition goal', async () => {
      const mockGoal = {
        id: 'goal-id',
        targetCalories: 2200
      };

      mockReq.params.id = 'goal-id';
      mockReq.body = { targetCalories: 2200 };

      nutritionService.updateGoal.mockResolvedValue(mockGoal);

      await nutritionController.updateNutritionGoal(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockGoal
      });
    });
  });

  describe('getWeeklyReport', () => {
    it('should return weekly nutrition report', async () => {
      const mockReport = {
        avgCalories: 1950,
        avgProtein: 145,
        overallScore: 85
      };

      nutritionService.generateWeeklyReport.mockResolvedValue(mockReport);

      await nutritionController.getWeeklyReport(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockReport
      });
    });
  });

  describe('logMeal', () => {
    it('should log meal successfully', async () => {
      const mockLog = {
        id: 'log-id',
        totalCalories: 500,
        mealsCount: 1
      };

      mockReq.body = {
        orderId: 'order-id',
        totalCalories: 500,
        totalProtein: 30
      };

      nutritionService.logMeal.mockResolvedValue(mockLog);

      await nutritionController.logMeal(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockLog
      });
    });
  });

  describe('deleteNutritionGoal', () => {
    it('should delete nutrition goal', async () => {
      mockReq.params.id = 'goal-id';

      nutritionService.deleteGoal.mockResolvedValue(true);

      await nutritionController.deleteNutritionGoal(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'تم حذف الهدف بنجاح'
      });
    });

    it('should handle not found error', async () => {
      mockReq.params.id = 'non-existent-id';

      nutritionService.deleteGoal.mockResolvedValue(false);

      await nutritionController.deleteNutritionGoal(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});

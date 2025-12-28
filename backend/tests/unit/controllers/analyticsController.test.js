/**
 * Analytics Controller Tests
 * اختبارات شاملة لمتحكم التحليلات
 */

jest.mock('../../../src/services/analyticsService');
jest.mock('../../../src/utils/logger');

const analyticsController = require('../../../src/controllers/analyticsController');
const analyticsService = require('../../../src/services/analyticsService');
const logger = require('../../../src/utils/logger');

describe('Analytics Controller Tests', () => {
  let req, res;

  beforeEach(() => {
    req = {
      query: {},
      params: {},
      body: {},
      user: { id: 'user-123' }
    };
    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('getDashboardStats', () => {
    it('should get dashboard stats successfully', async () => {
      const mockStats = {
        totalOrders: 100,
        totalSpent: 5000,
        averageOrderValue: 50
      };
      analyticsService.getDashboardStats.mockResolvedValue(mockStats);

      req.query = { projectId: 'project-123' };

      await analyticsController.getDashboardStats(req, res);

      expect(analyticsService.getDashboardStats).toHaveBeenCalledWith('project-123', null);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats
      });
    });

    it('should get dashboard stats with date range', async () => {
      const mockStats = { totalOrders: 50 };
      analyticsService.getDashboardStats.mockResolvedValue(mockStats);

      req.query = {
        projectId: 'project-123',
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      await analyticsController.getDashboardStats(req, res);

      expect(analyticsService.getDashboardStats).toHaveBeenCalledWith(
        'project-123',
        { start: '2024-01-01', end: '2024-01-31' }
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats
      });
    });

    it('should handle errors', async () => {
      const error = new Error('Service error');
      analyticsService.getDashboardStats.mockRejectedValue(error);

      await analyticsController.getDashboardStats(req, res);

      expect(logger.error).toHaveBeenCalledWith('Error getting dashboard stats:', error);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: { message: 'Service error' }
      });
    });
  });

  describe('getSpendingReport', () => {
    it('should get spending report successfully', async () => {
      const mockReport = {
        spending: [
          { date: '2024-01-01', amount: 100 },
          { date: '2024-01-02', amount: 150 }
        ]
      };
      analyticsService.getSpendingReport.mockResolvedValue(mockReport);

      req.params = { projectId: 'project-123' };
      req.query = { period: 'daily', limit: '30' };

      await analyticsController.getSpendingReport(req, res);

      expect(analyticsService.getSpendingReport).toHaveBeenCalledWith('project-123', 'daily', 30);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockReport
      });
    });

    it('should use default values for period and limit', async () => {
      const mockReport = { spending: [] };
      analyticsService.getSpendingReport.mockResolvedValue(mockReport);

      req.params = { projectId: 'project-123' };

      await analyticsController.getSpendingReport(req, res);

      expect(analyticsService.getSpendingReport).toHaveBeenCalledWith('project-123', 'daily', 30);
    });

    it('should handle errors', async () => {
      const error = new Error('Report error');
      analyticsService.getSpendingReport.mockRejectedValue(error);

      req.params = { projectId: 'project-123' };

      await analyticsController.getSpendingReport(req, res);

      expect(logger.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('forecastBudget', () => {
    it('should forecast budget successfully', async () => {
      const mockForecast = {
        projectedSpending: 10000,
        confidence: 0.85
      };
      analyticsService.forecastBudget.mockResolvedValue(mockForecast);

      req.params = { projectId: 'project-123' };
      req.query = { daysAhead: '60' };

      await analyticsController.forecastBudget(req, res);

      expect(analyticsService.forecastBudget).toHaveBeenCalledWith('project-123', 60);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockForecast
      });
    });

    it('should use default daysAhead value', async () => {
      const mockForecast = { projectedSpending: 5000 };
      analyticsService.forecastBudget.mockResolvedValue(mockForecast);

      req.params = { projectId: 'project-123' };

      await analyticsController.forecastBudget(req, res);

      expect(analyticsService.forecastBudget).toHaveBeenCalledWith('project-123', 30);
    });

    it('should handle errors', async () => {
      const error = new Error('Forecast error');
      analyticsService.forecastBudget.mockRejectedValue(error);

      req.params = { projectId: 'project-123' };

      await analyticsController.forecastBudget(req, res);

      expect(logger.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('compareProjects', () => {
    it('should compare projects successfully', async () => {
      const mockComparison = {
        projects: [
          { id: 'project-1', totalSpent: 5000 },
          { id: 'project-2', totalSpent: 7000 }
        ]
      };
      analyticsService.compareProjects.mockResolvedValue(mockComparison);

      req.body = {
        projectIds: ['project-1', 'project-2'],
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      await analyticsController.compareProjects(req, res);

      expect(analyticsService.compareProjects).toHaveBeenCalledWith(
        ['project-1', 'project-2'],
        { start: '2024-01-01', end: '2024-01-31' }
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockComparison
      });
    });

    it('should return error if projectIds is missing', async () => {
      req.body = {};

      await analyticsController.compareProjects(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: { message: 'projectIds array is required' }
      });
      expect(analyticsService.compareProjects).not.toHaveBeenCalled();
    });

    it('should return error if projectIds is not an array', async () => {
      req.body = { projectIds: 'not-an-array' };

      await analyticsController.compareProjects(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(analyticsService.compareProjects).not.toHaveBeenCalled();
    });

    it('should work without date range', async () => {
      const mockComparison = { projects: [] };
      analyticsService.compareProjects.mockResolvedValue(mockComparison);

      req.body = { projectIds: ['project-1'] };

      await analyticsController.compareProjects(req, res);

      expect(analyticsService.compareProjects).toHaveBeenCalledWith(['project-1'], null);
    });

    it('should handle errors', async () => {
      const error = new Error('Comparison error');
      analyticsService.compareProjects.mockRejectedValue(error);

      req.body = { projectIds: ['project-1'] };

      await analyticsController.compareProjects(req, res);

      expect(logger.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('analyzeExceptions', () => {
    it('should analyze exceptions successfully', async () => {
      const mockAnalysis = {
        totalExceptions: 15,
        approvedExceptions: 10,
        rejectedExceptions: 5
      };
      analyticsService.analyzeExceptions.mockResolvedValue(mockAnalysis);

      req.query = {
        projectId: 'project-123',
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      await analyticsController.analyzeExceptions(req, res);

      expect(analyticsService.analyzeExceptions).toHaveBeenCalledWith(
        'project-123',
        { start: '2024-01-01', end: '2024-01-31' }
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockAnalysis
      });
    });

    it('should work without date range', async () => {
      const mockAnalysis = { totalExceptions: 5 };
      analyticsService.analyzeExceptions.mockResolvedValue(mockAnalysis);

      req.query = { projectId: 'project-123' };

      await analyticsController.analyzeExceptions(req, res);

      expect(analyticsService.analyzeExceptions).toHaveBeenCalledWith('project-123', null);
    });

    it('should handle errors', async () => {
      const error = new Error('Analysis error');
      analyticsService.analyzeExceptions.mockRejectedValue(error);

      await analyticsController.analyzeExceptions(req, res);

      expect(logger.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getTopRestaurants', () => {
    it('should get top restaurants successfully', async () => {
      const mockRestaurants = [
        { id: 'rest-1', name: 'Restaurant 1', orderCount: 50 },
        { id: 'rest-2', name: 'Restaurant 2', orderCount: 30 }
      ];
      analyticsService.getTopRestaurants.mockResolvedValue(mockRestaurants);

      req.query = { projectId: 'project-123', limit: '5' };

      await analyticsController.getTopRestaurants(req, res);

      expect(analyticsService.getTopRestaurants).toHaveBeenCalledWith('project-123', 5);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockRestaurants
      });
    });

    it('should use default limit', async () => {
      const mockRestaurants = [];
      analyticsService.getTopRestaurants.mockResolvedValue(mockRestaurants);

      req.query = { projectId: 'project-123' };

      await analyticsController.getTopRestaurants(req, res);

      expect(analyticsService.getTopRestaurants).toHaveBeenCalledWith('project-123', 10);
    });

    it('should handle errors', async () => {
      const error = new Error('Restaurant error');
      analyticsService.getTopRestaurants.mockRejectedValue(error);

      req.query = { projectId: 'project-123' };

      await analyticsController.getTopRestaurants(req, res);

      expect(logger.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});

/**
 * Cost Alert Controller Tests
 * اختبارات شاملة لمتحكم تنبيهات الميزانية
 */

jest.mock('../../../src/services/costAlertService');
jest.mock('../../../src/utils/logger');

const costAlertService = require('../../../src/services/costAlertService');
const logger = require('../../../src/utils/logger');

// Load the controller module
let costAlertController;

describe('Cost Alert Controller Tests', () => {
  let req, res;

  beforeAll(() => {
    // Require the controller after mocks are set up
    costAlertController = require('../../../src/controllers/costAlertController');
  });

  beforeEach(() => {
    req = {
      query: {},
      params: {},
      body: {},
      user: { id: 'user-123' },
      t: jest.fn((key) => key) // Mock translation function
    };
    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('createBudget', () => {
    it('should create budget successfully', async () => {
      const budgetData = {
        name: 'Project Budget',
        amount: 10000,
        type: 'PROJECT'
      };
      const createdBudget = {
        id: 'budget-123',
        ...budgetData
      };

      req.body = budgetData;
      costAlertService.createCostBudget.mockResolvedValue(createdBudget);

      await costAlertController.createBudget(req, res);

      expect(costAlertService.createCostBudget).toHaveBeenCalledWith(budgetData);
      expect(logger.info).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'budget.budgetCreated',
        data: createdBudget
      });
    });

    it('should handle creation errors', async () => {
      const error = new Error('Creation failed');
      req.body = { name: 'Test Budget' };
      costAlertService.createCostBudget.mockRejectedValue(error);

      await costAlertController.createBudget(req, res);

      expect(logger.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Creation failed',
        error: undefined
      });
    });

    it('should include stack trace in development mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Test error');
      error.stack = 'Error stack trace';
      req.body = {};
      costAlertService.createCostBudget.mockRejectedValue(error);

      await costAlertController.createBudget(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Test error',
        error: 'Error stack trace'
      });

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('getBudgets', () => {
    it('should get budgets successfully with default pagination', async () => {
      const mockResult = {
        budgets: [
          { id: 'budget-1', name: 'Budget 1' },
          { id: 'budget-2', name: 'Budget 2' }
        ],
        stats: { total: 2, active: 2 },
        pagination: { page: 1, limit: 20, total: 2 }
      };

      costAlertService.getAllCostBudgets.mockResolvedValue(mockResult);

      await costAlertController.getBudgets(req, res);

      expect(costAlertService.getAllCostBudgets).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        type: undefined,
        isActive: undefined,
        targetUserId: undefined
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'budget.budgetsFetchSuccess',
        data: mockResult.budgets,
        stats: mockResult.stats,
        pagination: mockResult.pagination
      });
    });

    it('should get budgets with custom filters', async () => {
      const mockResult = {
        budgets: [],
        stats: {},
        pagination: {}
      };

      req.query = {
        page: '2',
        limit: '10',
        type: 'PROJECT',
        isActive: 'true',
        targetUserId: 'user-456'
      };

      costAlertService.getAllCostBudgets.mockResolvedValue(mockResult);

      await costAlertController.getBudgets(req, res);

      expect(costAlertService.getAllCostBudgets).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
        type: 'PROJECT',
        isActive: true,
        targetUserId: 'user-456'
      });
    });

    it('should handle isActive as false', async () => {
      req.query = { isActive: 'false' };
      costAlertService.getAllCostBudgets.mockResolvedValue({
        budgets: [],
        stats: {},
        pagination: {}
      });

      await costAlertController.getBudgets(req, res);

      expect(costAlertService.getAllCostBudgets).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: false
        })
      );
    });

    it('should handle errors', async () => {
      const error = new Error('Fetch failed');
      costAlertService.getAllCostBudgets.mockRejectedValue(error);

      await costAlertController.getBudgets(req, res);

      expect(logger.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'budget.budgetsFetchFailed',
        error: undefined
      });
    });
  });

  describe('getBudgetById', () => {
    it('should get budget by ID successfully', async () => {
      const mockBudget = {
        id: 'budget-123',
        name: 'Test Budget',
        amount: 5000
      };

      req.params = { budgetId: 'budget-123' };
      costAlertService.getCostBudget.mockResolvedValue(mockBudget);

      await costAlertController.getBudgetById(req, res);

      expect(costAlertService.getCostBudget).toHaveBeenCalledWith('budget-123');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'budget.budgetFetchSuccess',
        data: mockBudget
      });
    });

    it('should handle not found error', async () => {
      const error = new Error('Budget not found');
      req.params = { budgetId: 'invalid-id' };
      costAlertService.getCostBudget.mockRejectedValue(error);

      await costAlertController.getBudgetById(req, res);

      expect(logger.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Budget not found',
        error: 'Budget not found'
      });
    });
  });

  describe('updateBudget', () => {
    it('should update budget successfully', async () => {
      const updateData = { amount: 15000 };
      const updatedBudget = {
        id: 'budget-123',
        amount: 15000
      };

      req.params = { budgetId: 'budget-123' };
      req.body = updateData;
      costAlertService.updateCostBudget.mockResolvedValue(updatedBudget);

      await costAlertController.updateBudget(req, res);

      expect(costAlertService.updateCostBudget).toHaveBeenCalledWith('budget-123', updateData);
      expect(logger.info).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: updatedBudget
        })
      );
    });

    it('should handle update errors', async () => {
      const error = new Error('Update failed');
      req.params = { budgetId: 'budget-123' };
      req.body = { amount: 5000 };
      costAlertService.updateCostBudget.mockRejectedValue(error);

      await costAlertController.updateBudget(req, res);

      expect(logger.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false
        })
      );
    });
  });

  describe('Module exports', () => {
    it('should export all controller functions', () => {
      expect(costAlertController.createBudget).toBeDefined();
      expect(costAlertController.getBudgets).toBeDefined();
      expect(costAlertController.getBudgetById).toBeDefined();
      expect(costAlertController.updateBudget).toBeDefined();
    });

    it('all exported functions should be functions', () => {
      expect(typeof costAlertController.createBudget).toBe('function');
      expect(typeof costAlertController.getBudgets).toBe('function');
      expect(typeof costAlertController.getBudgetById).toBe('function');
      expect(typeof costAlertController.updateBudget).toBe('function');
    });
  });
});

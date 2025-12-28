/**
 * Unit Tests - Cost Alert Controller
 * اختبارات وحدة متحكم التنبيهات المالية
 */

const costAlertController = require('../../../src/controllers/costAlertController');
const costAlertService = require('../../../src/services/costAlertService');

jest.mock('../../../src/services/costAlertService');
jest.mock('../../../src/utils/logger');

describe('Cost Alert Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      query: {},
      params: {},
      user: { id: 'user-123' },
      t: jest.fn((key) => key)
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  // ==========================================
  // Create Budget Tests
  // ==========================================
  describe('createBudget', () => {
    it('should create budget successfully', async () => {
      req.body = {
        name: 'VIP Budget',
        type: 'VIP',
        targetUserId: 'vip-user-123',
        maxLimit: 1000,
        warningThreshold: 0.8
      };

      const mockBudget = {
        id: 'budget-123',
        name: 'VIP Budget',
        type: 'VIP',
        maxLimit: 1000,
        usedAmount: 0,
        warningThreshold: 0.8
      };

      costAlertService.createCostBudget.mockResolvedValue(mockBudget);

      await costAlertController.createBudget(req, res);

      expect(costAlertService.createCostBudget).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'budget.budgetCreated',
        data: mockBudget
      });
    });

    it('should handle service errors', async () => {
      req.body = { name: 'Test Budget' };
      costAlertService.createCostBudget.mockRejectedValue(
        new Error('البيانات الأساسية مطلوبة')
      );

      await costAlertController.createBudget(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'البيانات الأساسية مطلوبة',
        error: undefined
      });
    });

    it('should include stack trace in development mode', async () => {
      process.env.NODE_ENV = 'development';
      req.body = {};
      const error = new Error('Test error');
      costAlertService.createCostBudget.mockRejectedValue(error);

      await costAlertController.createBudget(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Test error',
        error: error.stack
      });
      process.env.NODE_ENV = 'test';
    });
  });

  // ==========================================
  // Get Budgets Tests
  // ==========================================
  describe('getBudgets', () => {
    it('should get all budgets successfully', async () => {
      req.query = { page: '1', limit: '20' };

      const mockResult = {
        budgets: [
          { id: 'budget-1', name: 'Budget 1' },
          { id: 'budget-2', name: 'Budget 2' }
        ],
        stats: { total: 2, active: 2, inactive: 0 },
        pagination: { page: 1, limit: 20, total: 2, totalPages: 1 }
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

    it('should filter budgets by type', async () => {
      req.query = { type: 'VIP', isActive: 'true' };

      costAlertService.getAllCostBudgets.mockResolvedValue({
        budgets: [],
        stats: {},
        pagination: {}
      });

      await costAlertController.getBudgets(req, res);

      expect(costAlertService.getAllCostBudgets).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'VIP',
          isActive: true
        })
      );
    });

    it('should handle service errors', async () => {
      costAlertService.getAllCostBudgets.mockRejectedValue(new Error('Database error'));

      await costAlertController.getBudgets(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'budget.budgetsFetchFailed',
        error: undefined
      });
    });
  });

  // ==========================================
  // Get Budget By ID Tests
  // ==========================================
  describe('getBudgetById', () => {
    it('should get budget by ID successfully', async () => {
      req.params = { budgetId: 'budget-123' };

      const mockBudget = {
        id: 'budget-123',
        name: 'Test Budget',
        maxLimit: 1000
      };

      costAlertService.getCostBudget.mockResolvedValue(mockBudget);

      await costAlertController.getBudgetById(req, res);

      expect(costAlertService.getCostBudget).toHaveBeenCalledWith('budget-123');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'budget.budgetFetchSuccess',
        data: mockBudget
      });
    });

    it('should handle budget not found', async () => {
      req.params = { budgetId: 'nonexistent' };
      costAlertService.getCostBudget.mockRejectedValue(
        new Error('الميزانية غير موجودة')
      );

      await costAlertController.getBudgetById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ==========================================
  // Update Budget Tests
  // ==========================================
  describe('updateBudget', () => {
    it('should update budget successfully', async () => {
      req.params = { budgetId: 'budget-123' };
      req.body = { maxLimit: 2000, warningThreshold: 0.9 };

      const mockUpdatedBudget = {
        id: 'budget-123',
        maxLimit: 2000,
        warningThreshold: 0.9
      };

      costAlertService.updateCostBudget.mockResolvedValue(mockUpdatedBudget);

      await costAlertController.updateBudget(req, res);

      expect(costAlertService.updateCostBudget).toHaveBeenCalledWith(
        'budget-123',
        req.body
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'تم تحديث الميزانية بنجاح',
        data: mockUpdatedBudget
      });
    });

    it('should handle update errors', async () => {
      req.params = { budgetId: 'budget-123' };
      req.body = { maxLimit: -100 };
      costAlertService.updateCostBudget.mockRejectedValue(
        new Error('الحد الأقصى يجب أن يكون أكبر من صفر')
      );

      await costAlertController.updateBudget(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ==========================================
  // Check Budget Tests
  // ==========================================
  describe('checkBudget', () => {
    it('should check budget successfully', async () => {
      req.params = { budgetId: 'budget-123' };
      req.body = { amount: 100 };

      const mockResult = {
        budget: { id: 'budget-123', usedAmount: 100 },
        alert: null,
        shouldCreateAlert: false,
        percentage: 0.1,
        canProceed: true
      };

      costAlertService.checkBudgetAndCreateAlert.mockResolvedValue(mockResult);

      await costAlertController.checkBudget(req, res);

      expect(costAlertService.checkBudgetAndCreateAlert).toHaveBeenCalledWith(
        'budget-123',
        100
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'تم فحص الميزانية بنجاح',
        data: mockResult
      });
    });

    it('should reject invalid amount (zero)', async () => {
      req.params = { budgetId: 'budget-123' };
      req.body = { amount: 0 };

      await costAlertController.checkBudget(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'budget.amountMustBePositive'
      });
      expect(costAlertService.checkBudgetAndCreateAlert).not.toHaveBeenCalled();
    });

    it('should reject negative amount', async () => {
      req.params = { budgetId: 'budget-123' };
      req.body = { amount: -50 };

      await costAlertController.checkBudget(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should handle service errors', async () => {
      req.params = { budgetId: 'budget-123' };
      req.body = { amount: 100 };
      costAlertService.checkBudgetAndCreateAlert.mockRejectedValue(
        new Error('الميزانية غير نشطة')
      );

      await costAlertController.checkBudget(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ==========================================
  // Get Budget Alerts Tests
  // ==========================================
  describe('getBudgetAlerts', () => {
    it('should get budget alerts successfully', async () => {
      req.params = { budgetId: 'budget-123' };
      req.query = { page: '1', limit: '20' };

      const mockResult = {
        alerts: [
          { id: 'alert-1', alertType: 'WARNING' },
          { id: 'alert-2', alertType: 'EXCEEDED' }
        ],
        pagination: { page: 1, limit: 20, total: 2 }
      };

      costAlertService.getBudgetAlerts.mockResolvedValue(mockResult);

      await costAlertController.getBudgetAlerts(req, res);

      expect(costAlertService.getBudgetAlerts).toHaveBeenCalledWith('budget-123', {
        page: 1,
        limit: 20,
        isResolved: undefined,
        severity: undefined,
        alertType: undefined
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'تم جلب تنبيهات الميزانية بنجاح',
        data: mockResult.alerts,
        pagination: mockResult.pagination
      });
    });

    it('should filter alerts by severity and type', async () => {
      req.params = { budgetId: 'budget-123' };
      req.query = { severity: 'HIGH', alertType: 'WARNING', isResolved: 'false' };

      costAlertService.getBudgetAlerts.mockResolvedValue({
        alerts: [],
        pagination: {}
      });

      await costAlertController.getBudgetAlerts(req, res);

      expect(costAlertService.getBudgetAlerts).toHaveBeenCalledWith(
        'budget-123',
        expect.objectContaining({
          severity: 'HIGH',
          alertType: 'WARNING',
          isResolved: false
        })
      );
    });

    it('should handle service errors', async () => {
      req.params = { budgetId: 'budget-123' };
      costAlertService.getBudgetAlerts.mockRejectedValue(new Error('Database error'));

      await costAlertController.getBudgetAlerts(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ==========================================
  // Resolve Alert Tests
  // ==========================================
  describe('resolveAlert', () => {
    it('should resolve alert successfully', async () => {
      req.params = { alertId: 'alert-123' };

      const mockResolvedAlert = {
        id: 'alert-123',
        isResolved: true,
        resolvedBy: 'user-123',
        resolvedAt: new Date()
      };

      costAlertService.resolveAlert.mockResolvedValue(mockResolvedAlert);

      await costAlertController.resolveAlert(req, res);

      expect(costAlertService.resolveAlert).toHaveBeenCalledWith(
        'alert-123',
        'user-123'
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'تم حل التنبيه بنجاح',
        data: mockResolvedAlert
      });
    });

    it('should handle already resolved alert', async () => {
      req.params = { alertId: 'alert-123' };
      costAlertService.resolveAlert.mockRejectedValue(
        new Error('التنبيه محلول بالفعل')
      );

      await costAlertController.resolveAlert(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ==========================================
  // Create Default Budget Tests
  // ==========================================
  describe('createDefaultBudget', () => {
    it('should create default budget for VIP user', async () => {
      req.body = { userId: 'vip-user-123', userRole: 'VIP' };

      const mockBudget = {
        id: 'budget-123',
        name: 'الميزانية الافتراضية - VIP',
        type: 'VIP',
        maxLimit: 1000
      };

      costAlertService.createDefaultBudgetForUser.mockResolvedValue(mockBudget);

      await costAlertController.createDefaultBudget(req, res);

      expect(costAlertService.createDefaultBudgetForUser).toHaveBeenCalledWith(
        'vip-user-123',
        'VIP'
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'تم إنشاء الميزانية الافتراضية بنجاح',
        data: mockBudget
      });
    });

    it('should reject without userId', async () => {
      req.body = { userRole: 'VIP' };

      await costAlertController.createDefaultBudget(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'معرف المستخدم ودوره مطلوبان'
      });
    });

    it('should reject without userRole', async () => {
      req.body = { userId: 'user-123' };

      await costAlertController.createDefaultBudget(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ==========================================
  // Reset Budget Tests
  // ==========================================
  describe('resetBudget', () => {
    it('should reset budget successfully', async () => {
      req.params = { budgetId: 'budget-123' };

      const mockResult = {
        budget: { id: 'budget-123', usedAmount: 0 },
        alert: { id: 'alert-123', alertType: 'RESET' }
      };

      costAlertService.resetBudget.mockResolvedValue(mockResult);

      await costAlertController.resetBudget(req, res);

      expect(costAlertService.resetBudget).toHaveBeenCalledWith(
        'budget-123',
        'user-123'
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'تم إعادة تعيين الميزانية بنجاح',
        data: mockResult
      });
    });

    it('should handle reset errors', async () => {
      req.params = { budgetId: 'nonexistent' };
      costAlertService.resetBudget.mockRejectedValue(
        new Error('الميزانية غير موجودة')
      );

      await costAlertController.resetBudget(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ==========================================
  // Generate Budget Report Tests
  // ==========================================
  describe('generateBudgetReport', () => {
    it('should generate budget report successfully', async () => {
      req.params = { budgetId: 'budget-123' };
      req.query = { startDate: '2024-01-01', endDate: '2024-01-31' };

      const mockReport = {
        budgetId: 'budget-123',
        period: { start: '2024-01-01', end: '2024-01-31' },
        totalSpent: 500,
        alerts: []
      };

      costAlertService.generateBudgetReport.mockResolvedValue(mockReport);

      await costAlertController.generateBudgetReport(req, res);

      expect(costAlertService.generateBudgetReport).toHaveBeenCalledWith(
        'budget-123',
        '2024-01-01',
        '2024-01-31'
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'تم إنشاء تقرير الميزانية بنجاح',
        data: mockReport
      });
    });

    it('should handle report generation errors', async () => {
      req.params = { budgetId: 'budget-123' };
      costAlertService.generateBudgetReport.mockRejectedValue(
        new Error('Report error')
      );

      await costAlertController.generateBudgetReport(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ==========================================
  // Get Budget Analytics Tests
  // ==========================================
  describe('getBudgetAnalytics', () => {
    it('should get budget analytics successfully', async () => {
      req.query = { startDate: '2024-01-01', endDate: '2024-01-31' };

      const mockAnalytics = {
        totalBudgets: 10,
        totalAlerts: 5,
        averageUsage: 0.75,
        trends: []
      };

      costAlertService.getBudgetAnalytics.mockResolvedValue(mockAnalytics);

      await costAlertController.getBudgetAnalytics(req, res);

      expect(costAlertService.getBudgetAnalytics).toHaveBeenCalledWith({
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'تم جلب الإحصائيات بنجاح',
        data: mockAnalytics
      });
    });

    it('should handle analytics errors', async () => {
      costAlertService.getBudgetAnalytics.mockRejectedValue(
        new Error('Analytics error')
      );

      await costAlertController.getBudgetAnalytics(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});

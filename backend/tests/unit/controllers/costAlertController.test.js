/**
 * Cost Alert Controller Unit Tests
 * اختبارات وحدة متحكم تنبيهات التكاليف
 */

const costAlertController = require('../../../src/controllers/costAlertController');
const costAlertService = require('../../../src/services/costAlertService');

jest.mock('../../../src/services/costAlertService');

describe('Cost Alert Controller', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      user: { id: 'test-user-id', role: 'ADMIN' },
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

  describe('getAlerts', () => {
    it('should return all alerts for admin', async () => {
      const mockAlerts = [
        {
          id: 'alert-1',
          alertType: 'WARNING',
          severity: 'MEDIUM',
          currentAmount: 800,
          budgetLimit: 1000
        },
        {
          id: 'alert-2',
          alertType: 'CRITICAL',
          severity: 'HIGH',
          currentAmount: 1200,
          budgetLimit: 1000
        }
      ];

      costAlertService.getAlerts.mockResolvedValue(mockAlerts);

      await costAlertController.getAlerts(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockAlerts
      });
    });

    it('should filter by severity when provided', async () => {
      mockReq.query.severity = 'HIGH';

      costAlertService.getAlertsBySeverity.mockResolvedValue([]);

      await costAlertController.getAlerts(mockReq, mockRes, mockNext);

      expect(costAlertService.getAlertsBySeverity).toHaveBeenCalledWith('HIGH');
    });

    it('should filter unread alerts', async () => {
      mockReq.query.unread = 'true';

      costAlertService.getUnreadAlerts.mockResolvedValue([]);

      await costAlertController.getAlerts(mockReq, mockRes, mockNext);

      expect(costAlertService.getUnreadAlerts).toHaveBeenCalled();
    });
  });

  describe('createAlert', () => {
    it('should create alert successfully', async () => {
      const mockAlert = {
        id: 'alert-1',
        budgetId: 'budget-1',
        alertType: 'WARNING',
        severity: 'MEDIUM',
        title: 'تنبيه: اقتراب الحد الأقصى',
        message: 'تم استخدام 80% من الميزانية'
      };

      mockReq.body = {
        budgetId: 'budget-1',
        alertType: 'WARNING',
        severity: 'MEDIUM',
        title: 'تنبيه: اقتراب الحد الأقصى',
        message: 'تم استخدام 80% من الميزانية',
        currentAmount: 800,
        budgetLimit: 1000
      };

      costAlertService.createAlert.mockResolvedValue(mockAlert);

      await costAlertController.createAlert(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockAlert
      });
    });

    it('should validate required fields', async () => {
      mockReq.body = {
        budgetId: 'budget-1'
        // Missing alertType, severity, title
      };

      await costAlertController.createAlert(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getAlertById', () => {
    it('should return alert by id', async () => {
      const mockAlert = {
        id: 'alert-1',
        budgetId: 'budget-1',
        alertType: 'WARNING'
      };

      mockReq.params.id = 'alert-1';

      costAlertService.getAlertById.mockResolvedValue(mockAlert);

      await costAlertController.getAlertById(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockAlert
      });
    });

    it('should return 404 for non-existent alert', async () => {
      mockReq.params.id = 'non-existent';

      costAlertService.getAlertById.mockResolvedValue(null);

      await costAlertController.getAlertById(mockReq, mockRes, mockNext);

      const error = mockNext.mock.calls[0][0];
      expect(error.statusCode).toBe(404);
    });
  });

  describe('markAsRead', () => {
    it('should mark alert as read', async () => {
      const mockAlert = {
        id: 'alert-1',
        isRead: true,
        readAt: new Date()
      };

      mockReq.params.id = 'alert-1';

      costAlertService.markAsRead.mockResolvedValue(mockAlert);

      await costAlertController.markAsRead(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockAlert
      });
    });
  });

  describe('markAsResolved', () => {
    it('should mark alert as resolved', async () => {
      const mockAlert = {
        id: 'alert-1',
        isResolved: true,
        resolvedBy: 'test-user-id',
        resolvedAt: new Date()
      };

      mockReq.params.id = 'alert-1';
      mockReq.body.resolution = 'تم تعديل الميزانية';

      costAlertService.markAsResolved.mockResolvedValue(mockAlert);

      await costAlertController.markAsResolved(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should require admin role', async () => {
      mockReq.user.role = 'REGULAR';
      mockReq.params.id = 'alert-1';

      await costAlertController.markAsResolved(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getBudgetAlerts', () => {
    it('should return alerts for specific budget', async () => {
      const mockAlerts = [
        { id: 'alert-1', budgetId: 'budget-1' },
        { id: 'alert-2', budgetId: 'budget-1' }
      ];

      mockReq.params.budgetId = 'budget-1';

      costAlertService.getBudgetAlerts.mockResolvedValue(mockAlerts);

      await costAlertController.getBudgetAlerts(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockAlerts
      });
    });
  });

  describe('deleteAlert', () => {
    it('should delete alert', async () => {
      mockReq.params.id = 'alert-1';

      costAlertService.deleteAlert.mockResolvedValue(true);

      await costAlertController.deleteAlert(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'تم حذف التنبيه'
      });
    });

    it('should return 404 if alert not found', async () => {
      mockReq.params.id = 'non-existent';

      costAlertService.deleteAlert.mockResolvedValue(false);

      await costAlertController.deleteAlert(mockReq, mockRes, mockNext);

      const error = mockNext.mock.calls[0][0];
      expect(error.statusCode).toBe(404);
    });
  });

  describe('checkBudgetThresholds', () => {
    it('should check all budget thresholds', async () => {
      const mockResults = [
        { budgetId: 'budget-1', percentage: 85, alert: true },
        { budgetId: 'budget-2', percentage: 45, alert: false }
      ];

      costAlertService.checkAllBudgetThresholds.mockResolvedValue(mockResults);

      await costAlertController.checkBudgetThresholds(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockResults
      });
    });
  });

  describe('getUserAlerts', () => {
    it('should return alerts for specific user', async () => {
      const mockAlerts = [
        { id: 'alert-1', userId: 'user-1' }
      ];

      mockReq.params.userId = 'user-1';

      costAlertService.getUserAlerts.mockResolvedValue(mockAlerts);

      await costAlertController.getUserAlerts(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getCriticalAlerts', () => {
    it('should return only critical alerts', async () => {
      const mockAlerts = [
        { id: 'alert-1', severity: 'CRITICAL' },
        { id: 'alert-2', severity: 'CRITICAL' }
      ];

      costAlertService.getCriticalAlerts.mockResolvedValue(mockAlerts);

      await costAlertController.getCriticalAlerts(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockAlerts
      });
    });
  });
});

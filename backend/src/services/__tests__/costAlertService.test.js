/**
 * Tests for Cost Alert Service
 */

jest.mock('@prisma/client');
jest.mock('../notificationService');

const { PrismaClient } = require('@prisma/client');
const costAlertService = require('../costAlertService');
const notificationService = require('../notificationService');

describe('Cost Alert Service', () => {
  let mockPrisma;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPrisma = {
      budget: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn()
      },
      order: {
        findMany: jest.fn(),
        aggregate: jest.fn()
      },
      costAlert: {
        create: jest.fn(),
        findMany: jest.fn()
      },
      user: {
        findUnique: jest.fn()
      }
    };

    PrismaClient.mockImplementation(() => mockPrisma);
    notificationService.sendBudgetAlert = jest.fn().mockResolvedValue();
  });

  describe('createBudget', () => {
    it('should create budget successfully', async () => {
      const budgetData = {
        userId: 'user123',
        name: 'Monthly Budget',
        amount: 3000,
        period: 'MONTHLY',
        alertThreshold: 80
      };

      mockPrisma.budget.create.mockResolvedValue({
        id: 'budget123',
        ...budgetData
      });

      const budget = await costAlertService.createBudget(budgetData);

      expect(budget).toHaveProperty('id');
      expect(budget.name).toBe('Monthly Budget');
      expect(budget.amount).toBe(3000);
    });
  });

  describe('getUserBudgets', () => {
    it('should get all user budgets', async () => {
      const userId = 'user123';

      mockPrisma.budget.findMany.mockResolvedValue([
        { id: 'budget1', name: 'Monthly Budget', amount: 3000 },
        { id: 'budget2', name: 'Weekly Budget', amount: 700 }
      ]);

      const budgets = await costAlertService.getUserBudgets(userId);

      expect(Array.isArray(budgets)).toBe(true);
      expect(budgets.length).toBe(2);
    });

    it('should filter by active status', async () => {
      mockPrisma.budget.findMany.mockResolvedValue([
        { id: 'budget1', isActive: true }
      ]);

      await costAlertService.getUserBudgets('user123', true);

      expect(mockPrisma.budget.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true
          })
        })
      );
    });
  });

  describe('checkBudgetStatus', () => {
    it('should calculate budget usage correctly', async () => {
      const budgetId = 'budget123';

      mockPrisma.budget.findUnique.mockResolvedValue({
        id: budgetId,
        userId: 'user123',
        amount: 3000,
        period: 'MONTHLY',
        alertThreshold: 80
      });

      mockPrisma.order.aggregate.mockResolvedValue({
        _sum: { totalAmount: 2400 }
      });

      const status = await costAlertService.checkBudgetStatus(budgetId);

      expect(status).toHaveProperty('budgetId');
      expect(status).toHaveProperty('spent');
      expect(status).toHaveProperty('remaining');
      expect(status).toHaveProperty('percentageUsed');
      expect(status.spent).toBe(2400);
      expect(status.remaining).toBe(600);
    });

    it('should trigger alert when threshold exceeded', async () => {
      const budgetId = 'budget123';

      mockPrisma.budget.findUnique.mockResolvedValue({
        id: budgetId,
        userId: 'user123',
        amount: 1000,
        period: 'WEEKLY',
        alertThreshold: 80
      });

      mockPrisma.order.aggregate.mockResolvedValue({
        _sum: { totalAmount: 850 } // 85% of budget
      });

      mockPrisma.costAlert.create.mockResolvedValue({
        id: 'alert123',
        budgetId
      });

      const status = await costAlertService.checkBudgetStatus(budgetId);

      expect(status.alertTriggered).toBe(true);
      expect(notificationService.sendBudgetAlert).toHaveBeenCalled();
    });

    it('should not trigger alert when under threshold', async () => {
      const budgetId = 'budget123';

      mockPrisma.budget.findUnique.mockResolvedValue({
        id: budgetId,
        userId: 'user123',
        amount: 1000,
        alertThreshold: 80
      });

      mockPrisma.order.aggregate.mockResolvedValue({
        _sum: { totalAmount: 500 } // 50% of budget
      });

      const status = await costAlertService.checkBudgetStatus(budgetId);

      expect(status.alertTriggered).toBe(false);
      expect(notificationService.sendBudgetAlert).not.toHaveBeenCalled();
    });
  });

  describe('getBudgetAlerts', () => {
    it('should get all budget alerts', async () => {
      const userId = 'user123';

      mockPrisma.costAlert.findMany.mockResolvedValue([
        {
          id: 'alert1',
          budgetId: 'budget1',
          percentageUsed: 85,
          createdAt: new Date()
        },
        {
          id: 'alert2',
          budgetId: 'budget2',
          percentageUsed: 90,
          createdAt: new Date()
        }
      ]);

      const alerts = await costAlertService.getBudgetAlerts(userId);

      expect(Array.isArray(alerts)).toBe(true);
      expect(alerts.length).toBe(2);
    });
  });

  describe('updateBudget', () => {
    it('should update budget successfully', async () => {
      const budgetId = 'budget123';
      const updateData = {
        amount: 3500,
        alertThreshold: 75
      };

      mockPrisma.budget.update.mockResolvedValue({
        id: budgetId,
        ...updateData
      });

      const updated = await costAlertService.updateBudget(
        budgetId,
        updateData
      );

      expect(updated.amount).toBe(3500);
      expect(updated.alertThreshold).toBe(75);
    });
  });

  describe('deactivateBudget', () => {
    it('should deactivate budget', async () => {
      const budgetId = 'budget123';

      mockPrisma.budget.update.mockResolvedValue({
        id: budgetId,
        isActive: false
      });

      const deactivated = await costAlertService.deactivateBudget(budgetId);

      expect(deactivated.isActive).toBe(false);
    });
  });

  describe('calculateSpendingTrend', () => {
    it('should calculate spending trend over time', async () => {
      const userId = 'user123';

      mockPrisma.order.findMany.mockResolvedValue([
        { totalAmount: 100, createdAt: new Date('2025-01-01') },
        { totalAmount: 150, createdAt: new Date('2025-01-08') },
        { totalAmount: 200, createdAt: new Date('2025-01-15') }
      ]);

      const trend = await costAlertService.calculateSpendingTrend(userId, 30);

      expect(trend).toHaveProperty('averageDailySpending');
      expect(trend).toHaveProperty('totalSpending');
      expect(trend).toHaveProperty('trend');
    });
  });

  describe('predictMonthlySpending', () => {
    it('should predict monthly spending based on trends', async () => {
      const userId = 'user123';

      mockPrisma.order.findMany.mockResolvedValue([
        { totalAmount: 100, createdAt: new Date() },
        { totalAmount: 120, createdAt: new Date() },
        { totalAmount: 110, createdAt: new Date() }
      ]);

      const prediction = await costAlertService.predictMonthlySpending(userId);

      expect(typeof prediction).toBe('number');
      expect(prediction).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getSpendingByCategory', () => {
    it('should breakdown spending by category', async () => {
      const userId = 'user123';

      mockPrisma.order.findMany.mockResolvedValue([
        {
          items: [
            { menuItem: { category: 'Main Course', price: 100 } },
            { menuItem: { category: 'Dessert', price: 50 } }
          ]
        }
      ]);

      const breakdown = await costAlertService.getSpendingByCategory(userId);

      expect(Array.isArray(breakdown)).toBe(true);
    });
  });

  describe('checkAllActiveBudgets', () => {
    it('should check all active budgets for user', async () => {
      const userId = 'user123';

      mockPrisma.budget.findMany.mockResolvedValue([
        { id: 'budget1', amount: 1000, alertThreshold: 80 },
        { id: 'budget2', amount: 2000, alertThreshold: 85 }
      ]);

      mockPrisma.order.aggregate.mockResolvedValue({
        _sum: { totalAmount: 500 }
      });

      const results = await costAlertService.checkAllActiveBudgets(userId);

      expect(Array.isArray(results)).toBe(true);
    });
  });
});

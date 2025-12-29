/**
 * Smoke Tests - Cost Alert Service
 * اختبارات بسيطة للتغطية السريعة
 */

const costAlertService = require('../costAlertService');

jest.mock('@prisma/client');

describe('CostAlertService - Smoke Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const { PrismaClient } = require('@prisma/client');
    const mockPrisma = new PrismaClient();

    mockPrisma.costBudget.findFirst.mockResolvedValue(null);
    mockPrisma.costBudget.create.mockResolvedValue({
      id: '1',
      name: 'Test Budget',
      maxLimit: 1000
    });
    mockPrisma.costBudget.findUnique.mockResolvedValue({
      id: '1',
      name: 'Test Budget',
      maxLimit: 1000,
      usedAmount: 500,
      warningThreshold: 0.8,
      isActive: true
    });
    mockPrisma.costBudget.update.mockResolvedValue({ id: '1' });
    mockPrisma.costBudget.findMany.mockResolvedValue([]);
    mockPrisma.costBudget.count.mockResolvedValue(0);
    mockPrisma.costAlert.findFirst.mockResolvedValue(null);
    mockPrisma.costAlert.create.mockResolvedValue({ id: '1' });
    mockPrisma.costAlert.findMany.mockResolvedValue([]);
    mockPrisma.costAlert.count.mockResolvedValue(0);
    mockPrisma.costAlert.findUnique.mockResolvedValue({
      id: '1',
      isResolved: false
    });
    mockPrisma.notification.create.mockResolvedValue({ id: '1' });
  });

  it('should not throw when calling createCostBudget', async () => {
    await expect(costAlertService.createCostBudget({
      name: 'Test Budget',
      type: 'VIP',
      maxLimit: 1000
    })).resolves.not.toThrow();
  });

  it('should not throw when calling updateCostBudget', async () => {
    await expect(costAlertService.updateCostBudget('budget-1', {
      name: 'Updated Budget'
    })).resolves.not.toThrow();
  });

  it('should not throw when calling checkBudgetAndCreateAlert', async () => {
    await expect(costAlertService.checkBudgetAndCreateAlert('budget-1', 100)).resolves.not.toThrow();
  });

  it('should not throw when calling createCostAlert', async () => {
    await expect(costAlertService.createCostAlert({
      budgetId: 'budget-1',
      userId: 'user-1',
      alertType: 'WARNING',
      severity: 'MEDIUM',
      title: 'Test Alert',
      message: 'Test Message',
      currentAmount: 800,
      budgetLimit: 1000,
      percentage: 0.8
    })).resolves.not.toThrow();
  });

  it('should not throw when calling getCostBudget', async () => {
    await expect(costAlertService.getCostBudget('budget-1')).resolves.not.toThrow();
  });

  it('should not throw when calling getAllCostBudgets', async () => {
    await expect(costAlertService.getAllCostBudgets({})).resolves.not.toThrow();
  });

  it('should not throw when calling getBudgetAlerts', async () => {
    await expect(costAlertService.getBudgetAlerts('budget-1', {})).resolves.not.toThrow();
  });

  it('should not throw when calling resolveAlert', async () => {
    await expect(costAlertService.resolveAlert('alert-1', 'user-1')).resolves.not.toThrow();
  });

  it('should not throw when calling createDefaultBudgetForUser', async () => {
    await expect(costAlertService.createDefaultBudgetForUser('user-1', 'VIP')).resolves.not.toThrow();
  });

  it('should not throw when calling resetBudget', async () => {
    await expect(costAlertService.resetBudget('budget-1', 'user-1')).resolves.not.toThrow();
  });
});

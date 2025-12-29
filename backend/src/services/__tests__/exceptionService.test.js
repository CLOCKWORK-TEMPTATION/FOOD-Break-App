/**
 * Smoke Tests - Exception Service
 * اختبارات بسيطة للتغطية السريعة
 */

const exceptionService = require('../exceptionService');

jest.mock('@prisma/client');
jest.mock('../costAlertService');

describe('ExceptionService - Smoke Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const { PrismaClient } = require('@prisma/client');
    const mockPrisma = new PrismaClient();

    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      role: 'REGULAR',
      email: 'test@example.com'
    });
    mockPrisma.exception.findMany.mockResolvedValue([]);
    mockPrisma.exception.create.mockResolvedValue({
      id: '1',
      userId: 'user-1',
      exceptionType: 'FULL',
      amount: 100
    });
    mockPrisma.exception.count.mockResolvedValue(0);
    mockPrisma.costBudget.findFirst.mockResolvedValue(null);
  });

  it('should not throw when calling checkExceptionEligibility', async () => {
    await expect(exceptionService.checkExceptionEligibility('user-1', 'FULL')).resolves.not.toThrow();
  });

  it('should not throw when calling createException', async () => {
    await expect(exceptionService.createException({
      userId: 'user-1',
      orderId: 'order-1',
      exceptionType: 'FULL',
      amount: 100
    })).resolves.not.toThrow();
  });

  it('should not throw when calling getUserExceptions', async () => {
    await expect(exceptionService.getUserExceptions('user-1', {})).resolves.not.toThrow();
  });

  it('should not throw when calling getAllExceptions', async () => {
    await expect(exceptionService.getAllExceptions({})).resolves.not.toThrow();
  });

  it('should not throw when calling calculateExceptionCost', () => {
    expect(() => exceptionService.calculateExceptionCost('FULL', 100, 50)).not.toThrow();
  });

  it('should not throw when calling generateFinancialReport', async () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');
    await expect(exceptionService.generateFinancialReport(startDate, endDate)).resolves.not.toThrow();
  });
});

const exceptionService = require('../../../src/services/exceptionService');
const { prisma: mockPrisma } = require("../../utils/testHelpers");
const { prisma: mockPrisma } = require("../../utils/testHelpers");

jest.mock('@prisma/client');

describe('Exception Service', () => {
  let mockPrisma;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkExceptionEligibility', () => {
    it('should check VIP unlimited eligibility', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ role: 'VIP' });

      const result = await exceptionService.checkExceptionEligibility('user-123', 'FULL');

      expect(result.eligible).toBe(true);
      expect(result.unlimited).toBe(true);
    });

    it('should check regular user quota', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ role: 'REGULAR' });
      mockPrisma.exception.count.mockResolvedValue(0);

      const result = await exceptionService.checkExceptionEligibility('user-123', 'FULL');

      expect(result.eligible).toBe(true);
      expect(result.remaining).toBeGreaterThan(0);
    });
  });

  describe('calculateExceptionCost', () => {
    it('should calculate full exception cost', () => {
      const result = exceptionService.calculateExceptionCost('FULL', 100, 50);

      expect(result.total).toBe(100);
      expect(result.userPays).toBe(0);
      expect(result.companyPays).toBe(100);
    });

    it('should calculate limited exception cost', () => {
      const result = exceptionService.calculateExceptionCost('LIMITED', 100, 50);

      expect(result.total).toBe(100);
      expect(result.userPays).toBe(50);
      expect(result.companyPays).toBe(50);
    });

    it('should calculate self-paid exception cost', () => {
      const result = exceptionService.calculateExceptionCost('SELF_PAID', 100, 50);

      expect(result.total).toBe(100);
      expect(result.userPays).toBe(100);
      expect(result.companyPays).toBe(0);
    });
  });

  describe('createException', () => {
    it('should create exception', async () => {
      const exceptionData = { userId: 'user-123', type: 'FULL', orderTotal: 100 };
      mockPrisma.exception.create.mockResolvedValue({ id: 'exc-1', ...exceptionData });

      const result = await exceptionService.createException(exceptionData);

      expect(mockPrisma.exception.create).toHaveBeenCalled();
      expect(result.id).toBe('exc-1');
    });
  });
});

const exceptionService = require('../../../src/services/exceptionService');

describe('Exception Service', () => {
  let mockPrisma;

  beforeEach(() => {
    mockPrisma = global.mockPrisma;
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
      mockPrisma.exception.findMany.mockResolvedValue([]);

      const result = await exceptionService.checkExceptionEligibility('user-123', 'FULL');

      expect(result.eligible).toBe(true);
      expect(result.remainingQuota).toBe(1);
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
      const exceptionData = { userId: 'user-123', orderId: 'order-1', exceptionType: 'FULL', amount: 100 };
      
      // Mock checkExceptionEligibility dependencies
      mockPrisma.user.findUnique.mockResolvedValue({ role: 'VIP' });
      mockPrisma.exception.findMany.mockResolvedValue([]);
      mockPrisma.exception.create.mockResolvedValue({ 
        id: 'exc-1', 
        ...exceptionData,
        user: { id: 'user-123', firstName: 'Test', lastName: 'User', email: 'test@test.com', role: 'VIP' }
      });

      const result = await exceptionService.createException(exceptionData);

      expect(mockPrisma.exception.create).toHaveBeenCalled();
      expect(result.exception.id).toBe('exc-1');
    });
  });
});

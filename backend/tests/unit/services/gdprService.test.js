/**
 * GDPR Service Tests
 * اختبارات خدمة حماية البيانات
 */

const gdprService = require('../../../src/services/gdprService');

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => global.mockPrisma)
}));

describe('GDPR Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('exportUserData', () => {
    it('should export all user data', async () => {
      global.mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-123', email: 'test@test.com' });
      global.mockPrisma.order.findMany.mockResolvedValue([]);
      global.mockPrisma.payment.findMany.mockResolvedValue([]);

      const result = await gdprService.exportUserData('user-123');

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('orders');
      expect(result).toHaveProperty('payments');
    });
  });

  describe('deleteUserData', () => {
    it('should delete all user data', async () => {
      global.mockPrisma.$transaction.mockResolvedValue([]);
      global.mockPrisma.order.deleteMany.mockResolvedValue({ count: 5 });
      global.mockPrisma.payment.deleteMany.mockResolvedValue({ count: 3 });
      global.mockPrisma.user.delete.mockResolvedValue({ id: 'user-123' });

      await gdprService.deleteUserData('user-123');

      expect(global.mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('anonymizeUserData', () => {
    it('should anonymize user data', async () => {
      global.mockPrisma.user.update.mockResolvedValue({
        id: 'user-123',
        email: 'anonymized@deleted.com'
      });

      const result = await gdprService.anonymizeUserData('user-123');

      expect(result.email).toContain('anonymized');
    });
  });

  describe('getDataRetentionPolicy', () => {
    it('should return data retention policy', () => {
      const policy = gdprService.getDataRetentionPolicy();

      expect(policy).toHaveProperty('orders');
      expect(policy).toHaveProperty('payments');
      expect(policy).toHaveProperty('personalData');
    });
  });

  describe('consentToDataProcessing', () => {
    it('should record user consent', async () => {
      global.mockPrisma.userConsent.create.mockResolvedValue({
        id: '1',
        userId: 'user-123',
        consentType: 'DATA_PROCESSING',
        granted: true
      });

      const result = await gdprService.consentToDataProcessing('user-123', true);

      expect(result.granted).toBe(true);
    });
  });

  describe('getUserConsents', () => {
    it('should get all user consents', async () => {
      const mockConsents = [
        { consentType: 'DATA_PROCESSING', granted: true },
        { consentType: 'MARKETING', granted: false }
      ];
      global.mockPrisma.userConsent.findMany.mockResolvedValue(mockConsents);

      const result = await gdprService.getUserConsents('user-123');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });
  });
});

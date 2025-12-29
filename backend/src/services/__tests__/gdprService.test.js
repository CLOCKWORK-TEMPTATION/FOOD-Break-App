/**
 * Smoke Tests - GDPR Service
 * اختبارات بسيطة للتغطية السريعة
 */

const gdprService = require('../gdprService');

jest.mock('@prisma/client');

describe('GDPRService - Smoke Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const { PrismaClient } = require('@prisma/client');
    const mockPrisma = new PrismaClient();

    mockPrisma.consentRecord.create.mockResolvedValue({
      id: '1',
      userId: 'user-1',
      type: 'DATA_PROCESSING',
      status: 'GRANTED'
    });
    mockPrisma.consentRecord.findFirst.mockResolvedValue({
      id: '1',
      status: 'GRANTED'
    });
    mockPrisma.consentRecord.update.mockResolvedValue({ id: '1' });
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User'
    });
    mockPrisma.order.findMany.mockResolvedValue([]);
    mockPrisma.userPreferences.findUnique.mockResolvedValue({});
    mockPrisma.consentRecord.findMany.mockResolvedValue([]);
    mockPrisma.$transaction.mockImplementation((callback) => callback(mockPrisma));
    mockPrisma.consentRecord.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.notification.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.userPreferences.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.order.updateMany.mockResolvedValue({ count: 0 });
    mockPrisma.user.update.mockResolvedValue({ id: 'user-1' });
  });

  it('should not throw when calling recordConsent', async () => {
    await expect(gdprService.recordConsent('user-1', 'DATA_PROCESSING', 'GRANTED', {})).resolves.not.toThrow();
  });

  it('should not throw when calling revokeConsent', async () => {
    await expect(gdprService.revokeConsent('user-1', 'DATA_PROCESSING')).resolves.not.toThrow();
  });

  it('should not throw when calling exportUserData', async () => {
    await expect(gdprService.exportUserData('user-1')).resolves.not.toThrow();
  });

  it('should not throw when calling deleteUserData', async () => {
    await expect(gdprService.deleteUserData('user-1')).resolves.not.toThrow();
  });

  it('should not throw when calling checkConsent', async () => {
    await expect(gdprService.checkConsent('user-1', 'DATA_PROCESSING')).resolves.not.toThrow();
  });
});

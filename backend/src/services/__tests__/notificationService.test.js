/**
 * Smoke Tests - Notification Service
 */

jest.mock('@prisma/client');

const notificationService = require('../notificationService');

describe('NotificationService - Smoke Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { PrismaClient } = require('@prisma/client');
    const mockPrisma = new PrismaClient();

    mockPrisma.notification.create.mockResolvedValue({ id: '1' });
    mockPrisma.notification.findMany.mockResolvedValue([]);
    mockPrisma.notification.update.mockResolvedValue({ id: '1' });
  });

  it('should handle sendNotification', async () => {
    if (notificationService.sendNotification) {
      await expect(notificationService.sendNotification('user-1', { title: 'Test' })).resolves.not.toThrow();
    }
  });

  it('should handle sendHalfHourlyReminder', async () => {
    if (notificationService.sendHalfHourlyReminder) {
      const user = { id: 'user-1', email: 'test@test.com' };
      const project = { id: 'project-1', name: 'Test' };
      await expect(notificationService.sendHalfHourlyReminder(user, project, {}, [])).resolves.not.toThrow();
    }
  });
});

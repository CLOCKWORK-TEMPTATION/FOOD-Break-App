/**
 * Smoke Tests - Reminder Scheduler Service
 * اختبارات بسيطة للتغطية السريعة
 */

jest.mock('node-cron');
jest.mock('@prisma/client');
jest.mock('../notificationService');

const reminderSchedulerService = require('../reminderSchedulerService');

describe('ReminderSchedulerService - Smoke Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const { PrismaClient } = require('@prisma/client');
    const mockPrisma = new PrismaClient();

    mockPrisma.project.findMany.mockResolvedValue([]);
    mockPrisma.projectReminderSettings.findUnique.mockResolvedValue({
      projectId: 'project-1',
      enableReminders: true,
      enableHalfHourlyReminders: true,
      orderWindowStart: '08:00',
      orderWindowEnd: '09:00',
      isActive: true
    });
    mockPrisma.projectMember.findMany.mockResolvedValue([]);
    mockPrisma.user.findMany.mockResolvedValue([]);
    mockPrisma.order.findFirst.mockResolvedValue(null);
    mockPrisma.userReminderPreferences.findUnique.mockResolvedValue({
      userId: 'user-1',
      enableReminders: true,
      enableHalfHourlyReminders: true,
      preferredChannels: ['push'],
      maxRemindersPerDay: 10
    });
    mockPrisma.reminderLog.count.mockResolvedValue(0);
    mockPrisma.reminderLog.create.mockResolvedValue({ id: '1' });
    mockPrisma.reminderLog.deleteMany.mockResolvedValue({ count: 0 });

    const cron = require('node-cron');
    cron.schedule.mockReturnValue({ stop: jest.fn() });
  });

  it('should not throw when calling initialize', async () => {
    await expect(reminderSchedulerService.initialize()).resolves.not.toThrow();
  });

  it('should not throw when calling sendHalfHourlyReminders', async () => {
    await expect(reminderSchedulerService.sendHalfHourlyReminders()).resolves.not.toThrow();
  });

  it('should not throw when calling cleanupOldReminders', async () => {
    await expect(reminderSchedulerService.cleanupOldReminders()).resolves.not.toThrow();
  });

  it('should not throw when calling stopAll', () => {
    expect(() => reminderSchedulerService.stopAll()).not.toThrow();
  });

  it('should not throw when calling getStatus', () => {
    expect(() => reminderSchedulerService.getStatus()).not.toThrow();
  });
});

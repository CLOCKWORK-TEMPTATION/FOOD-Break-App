const notificationService = require('../../notificationService');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('NotificationService', () => {
  let testUser;

  beforeAll(async () => {
    testUser = await prisma.user.create({
      data: { email: 'notif@test.com', passwordHash: 'hash', firstName: 'Test', lastName: 'User' }
    });
  });

  afterAll(async () => {
    await prisma.notification.deleteMany();
    await prisma.user.deleteMany({ where: { email: 'notif@test.com' } });
    await prisma.$disconnect();
  });

  it('should create notification', async () => {
    const notification = await notificationService.createNotification({
      userId: testUser.id,
      type: 'ORDER_CONFIRMED',
      title: 'Test',
      message: 'Test message'
    });

    expect(notification).toBeDefined();
    expect(notification.type).toBe('ORDER_CONFIRMED');
  });

  it('should get user notifications', async () => {
    const notifications = await notificationService.getUserNotifications(testUser.id);
    expect(Array.isArray(notifications)).toBe(true);
  });

  it('should mark as read', async () => {
    const notification = await notificationService.createNotification({
      userId: testUser.id,
      type: 'SYSTEM',
      title: 'Test',
      message: 'Test'
    });

    const marked = await notificationService.markAsRead(notification.id);
    expect(marked.isRead).toBe(true);
  });

  it('should send bulk notifications', async () => {
    const result = await notificationService.sendBulkNotifications([testUser.id], {
      type: 'SYSTEM',
      title: 'Bulk',
      message: 'Bulk message'
    });

    expect(result).toBeDefined();
  });
});

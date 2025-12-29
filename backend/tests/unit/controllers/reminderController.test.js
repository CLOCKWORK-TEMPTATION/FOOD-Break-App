/**
 * Reminder Controller Tests
 * اختبارات وحدة التذكيرات
 */

const reminderController = require('../../../src/controllers/reminderController');

// Mock dependencies
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => global.mockPrisma)
}));

describe('Reminder Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      user: { id: 'user-123' },
      t: jest.fn((key) => key)
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('getAllReminders', () => {
    it('should return all reminders for user', async () => {
      const mockReminders = [
        { id: '1', title: 'Reminder 1', userId: 'user-123' },
        { id: '2', title: 'Reminder 2', userId: 'user-123' }
      ];
      global.mockPrisma.reminder.findMany.mockResolvedValue(mockReminders);

      await reminderController.getAllReminders(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockReminders
        })
      );
    });
  });

  describe('createReminder', () => {
    it('should create reminder successfully', async () => {
      const reminderData = {
        title: 'New Reminder',
        message: 'Test message',
        scheduledFor: new Date()
      };
      const mockReminder = { id: '1', userId: 'user-123', ...reminderData };
      global.mockPrisma.reminder.create.mockResolvedValue(mockReminder);

      req.body = reminderData;

      await reminderController.createReminder(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockReminder
        })
      );
    });
  });

  describe('updateReminder', () => {
    it('should update reminder successfully', async () => {
      const updateData = { title: 'Updated Reminder' };
      const mockReminder = { id: '1', ...updateData };
      global.mockPrisma.reminder.update.mockResolvedValue(mockReminder);

      req.params.id = '1';
      req.body = updateData;

      await reminderController.updateReminder(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockReminder
        })
      );
    });
  });

  describe('deleteReminder', () => {
    it('should delete reminder successfully', async () => {
      global.mockPrisma.reminder.delete.mockResolvedValue({ id: '1' });

      req.params.id = '1';

      await reminderController.deleteReminder(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark reminder as read', async () => {
      global.mockPrisma.reminder.update.mockResolvedValue({ id: '1', isRead: true });

      req.params.id = '1';

      await reminderController.markAsRead(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );
    });
  });
});

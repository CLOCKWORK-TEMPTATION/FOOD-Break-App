/**
 * Unit Tests - Order Window Middleware
 * اختبارات وحدة middleware نافذة الطلب
 */

const {
  checkOrderWindow,
  checkDuplicateOrder,
  sendOrderReminders
} = require('../../../src/middleware/orderWindow');

jest.mock('../../../src/utils/logger');

describe('Order Window Middleware', () => {
  let req, res, next, mockPrisma;

  beforeEach(() => {
    req = {
      body: {},
      user: { id: 'user-123' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();

    const { PrismaClient } = require('@prisma/client');
    mockPrisma = new PrismaClient();
    jest.clearAllMocks();
  });

  // ==========================================
  // Check Order Window Tests
  // ==========================================
  describe('checkOrderWindow', () => {
    it('should allow order within window', async () => {
      req.body = { projectId: 'project-123' };

      const now = new Date();
      const startDate = new Date(now.getTime() - 30 * 60 * 1000); // 30 mins ago
      const orderWindow = 60; // 60 minutes

      mockPrisma.project.findUnique.mockResolvedValue({
        id: 'project-123',
        name: 'Test Project',
        isActive: true,
        startDate,
        orderWindow
      });

      await checkOrderWindow(req, res, next);

      expect(mockPrisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: 'project-123' }
      });
      expect(req.project).toBeDefined();
      expect(req.orderWindow).toBeDefined();
      expect(req.orderWindow.isOpen).toBe(true);
      expect(next).toHaveBeenCalled();
    });

    it('should reject without project ID', async () => {
      req.body = {};

      await checkOrderWindow(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'MISSING_PROJECT_ID',
          message: 'Project ID is required'
        }
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject for non-existent project', async () => {
      req.body = { projectId: 'nonexistent' };
      mockPrisma.project.findUnique.mockResolvedValue(null);

      await checkOrderWindow(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: 'Project not found'
        }
      });
    });

    it('should reject for inactive project', async () => {
      req.body = { projectId: 'project-123' };
      mockPrisma.project.findUnique.mockResolvedValue({
        id: 'project-123',
        isActive: false,
        startDate: new Date(),
        orderWindow: 60
      });

      await checkOrderWindow(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'PROJECT_INACTIVE',
          message: 'Project is inactive'
        }
      });
    });

    it('should reject before window starts', async () => {
      req.body = { projectId: 'project-123' };

      const futureStart = new Date(Date.now() + 60 * 60 * 1000); // 1 hour in future

      mockPrisma.project.findUnique.mockResolvedValue({
        id: 'project-123',
        isActive: true,
        startDate: futureStart,
        orderWindow: 60
      });

      await checkOrderWindow(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'ORDER_WINDOW_CLOSED',
            message: 'Order window has not started yet'
          })
        })
      );
    });

    it('should reject after window ends', async () => {
      req.body = { projectId: 'project-123' };

      const pastStart = new Date(Date.now() - 120 * 60 * 1000); // 2 hours ago
      const orderWindow = 30; // 30 minutes

      mockPrisma.project.findUnique.mockResolvedValue({
        id: 'project-123',
        isActive: true,
        startDate: pastStart,
        orderWindow
      });

      await checkOrderWindow(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'ORDER_WINDOW_CLOSED',
            message: 'Order window has ended'
          })
        })
      );
    });

    it('should include time remaining in response', async () => {
      req.body = { projectId: 'project-123' };

      const now = new Date();
      const startDate = new Date(now.getTime() - 10 * 60 * 1000); // 10 mins ago
      const orderWindow = 30; // 30 minutes

      mockPrisma.project.findUnique.mockResolvedValue({
        id: 'project-123',
        isActive: true,
        startDate,
        orderWindow
      });

      await checkOrderWindow(req, res, next);

      expect(req.orderWindow.minutesRemaining).toBeGreaterThan(0);
      expect(req.orderWindow.minutesRemaining).toBeLessThanOrEqual(20);
    });

    it('should handle database errors', async () => {
      req.body = { projectId: 'project-123' };
      mockPrisma.project.findUnique.mockRejectedValue(new Error('Database error'));

      await checkOrderWindow(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'ORDER_WINDOW_CHECK_FAILED',
          message: 'Error checking order window'
        }
      });
    });
  });

  // ==========================================
  // Check Duplicate Order Tests
  // ==========================================
  describe('checkDuplicateOrder', () => {
    it('should allow order when no duplicate exists', async () => {
      req.body = { projectId: 'project-123' };
      mockPrisma.order.findFirst.mockResolvedValue(null);

      await checkDuplicateOrder(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should reject duplicate order', async () => {
      req.body = { projectId: 'project-123' };

      const existingOrder = {
        id: 'order-123',
        userId: 'user-123',
        projectId: 'project-123',
        status: 'PENDING',
        createdAt: new Date()
      };

      mockPrisma.order.findFirst.mockResolvedValue(existingOrder);

      await checkDuplicateOrder(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'DUPLICATE_ORDER',
          message: 'Duplicate order for this project today',
          existingOrder: {
            id: 'order-123',
            status: 'PENDING',
            createdAt: existingOrder.createdAt
          }
        }
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow order if previous was cancelled', async () => {
      req.body = { projectId: 'project-123' };
      mockPrisma.order.findFirst.mockResolvedValue(null);

      await checkDuplicateOrder(req, res, next);

      expect(mockPrisma.order.findFirst).toHaveBeenCalledWith({
        where: expect.objectContaining({
          status: { not: 'CANCELLED' }
        })
      });
      expect(next).toHaveBeenCalled();
    });

    it('should check for orders from today only', async () => {
      req.body = { projectId: 'project-123' };
      mockPrisma.order.findFirst.mockResolvedValue(null);

      await checkDuplicateOrder(req, res, next);

      expect(mockPrisma.order.findFirst).toHaveBeenCalledWith({
        where: expect.objectContaining({
          createdAt: expect.objectContaining({
            gte: expect.any(Date)
          })
        })
      });
    });

    it('should handle database errors', async () => {
      req.body = { projectId: 'project-123' };
      mockPrisma.order.findFirst.mockRejectedValue(new Error('Database error'));

      await checkDuplicateOrder(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'DUPLICATE_CHECK_FAILED',
          message: 'Error checking duplicate orders'
        }
      });
    });
  });

  // ==========================================
  // Send Order Reminders Tests
  // ==========================================
  describe('sendOrderReminders', () => {
    it('should identify users without orders', async () => {
      const allUsers = [
        { id: 'user-1', email: 'user1@test.com', isActive: true, role: 'REGULAR' },
        { id: 'user-2', email: 'user2@test.com', isActive: true, role: 'VIP' },
        { id: 'user-3', email: 'user3@test.com', isActive: true, role: 'REGULAR' }
      ];

      const todaysOrders = [
        { userId: 'user-1' }
      ];

      mockPrisma.project.findUnique.mockResolvedValue({
        id: 'project-123',
        name: 'Test Project'
      });
      mockPrisma.user.findMany.mockResolvedValue(allUsers);
      mockPrisma.order.findMany.mockResolvedValue(todaysOrders);

      const result = await sendOrderReminders('project-123');

      expect(result.success).toBe(true);
      expect(result.totalUsers).toBe(3);
      expect(result.usersWithOrders).toBe(1);
      expect(result.usersWithoutOrders).toBe(2);
      expect(result.remindersSent).toBe(2);
    });

    it('should only send reminders to active users', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ id: 'project-123' });
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.order.findMany.mockResolvedValue([]);

      await sendOrderReminders('project-123');

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          isActive: true
        })
      });
    });

    it('should filter by REGULAR and VIP roles', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ id: 'project-123' });
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.order.findMany.mockResolvedValue([]);

      await sendOrderReminders('project-123');

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          role: { in: ['REGULAR', 'VIP'] }
        })
      });
    });

    it('should exclude cancelled orders', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ id: 'project-123' });
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.order.findMany.mockResolvedValue([]);

      await sendOrderReminders('project-123');

      expect(mockPrisma.order.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          status: { not: 'CANCELLED' }
        })
      });
    });

    it('should handle non-existent project', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);

      await expect(sendOrderReminders('nonexistent')).rejects.toThrow(
        'Project not found'
      );
    });

    it('should handle database errors', async () => {
      mockPrisma.project.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(sendOrderReminders('project-123')).rejects.toThrow(
        'Database error'
      );
    });
  });
});

/**
 * Order Window Middleware Tests
 * اختبارات شاملة لوسيط نافذة الطلبات
 */

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => global.mockPrisma)
}));

const {
  checkOrderWindow,
  checkDuplicateOrder,
  sendOrderReminders
} = require('../../../src/middleware/orderWindow');

describe('Order Window Middleware Tests', () => {
  let req, res, next;
  let mockPrisma;

  beforeEach(() => {
    mockPrisma = global.mockPrisma;
    req = {
      body: { projectId: 'project-123' },
      user: { id: 'user-123' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();

    // Reset all mocks
    Object.keys(mockPrisma).forEach(key => {
      if (mockPrisma[key] && typeof mockPrisma[key] === 'object') {
        Object.keys(mockPrisma[key]).forEach(method => {
          if (typeof mockPrisma[key][method] === 'function') {
            mockPrisma[key][method].mockReset();
          }
        });
      }
    });
  });

  describe('checkOrderWindow', () => {
    it('should return error when projectId is missing', async () => {
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

    it('should return error when project not found', async () => {
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
      expect(next).not.toHaveBeenCalled();
    });

    it('should return error when project is inactive', async () => {
      const inactiveProject = {
        id: 'project-123',
        isActive: false,
        startDate: new Date(),
        orderWindow: 30
      };

      mockPrisma.project.findUnique.mockResolvedValue(inactiveProject);

      await checkOrderWindow(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'PROJECT_INACTIVE',
          message: 'Project is inactive'
        }
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return error when order window has not started yet', async () => {
      const futureDate = new Date();
      futureDate.setMinutes(futureDate.getMinutes() + 60); // 1 hour in future

      const project = {
        id: 'project-123',
        isActive: true,
        startDate: futureDate,
        orderWindow: 30
      };

      mockPrisma.project.findUnique.mockResolvedValue(project);

      await checkOrderWindow(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          code: 'ORDER_WINDOW_CLOSED',
          message: 'Order window has not started yet'
        })
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return error when order window has ended', async () => {
      const pastDate = new Date();
      pastDate.setMinutes(pastDate.getMinutes() - 60); // 1 hour ago

      const project = {
        id: 'project-123',
        isActive: true,
        startDate: pastDate,
        orderWindow: 30 // 30 minutes window (already expired)
      };

      mockPrisma.project.findUnique.mockResolvedValue(project);

      await checkOrderWindow(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: expect.objectContaining({
          code: 'ORDER_WINDOW_CLOSED',
          message: 'Order window has ended'
        })
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow order when window is open', async () => {
      const now = new Date();
      const startDate = new Date(now.getTime() - 10 * 60 * 1000); // 10 minutes ago

      const project = {
        id: 'project-123',
        isActive: true,
        startDate: startDate,
        orderWindow: 30 // 30 minutes window (still 20 minutes left)
      };

      mockPrisma.project.findUnique.mockResolvedValue(project);

      await checkOrderWindow(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.project).toEqual(project);
      expect(req.orderWindow).toBeDefined();
      expect(req.orderWindow.isOpen).toBe(true);
      expect(req.orderWindow.minutesRemaining).toBeGreaterThan(0);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should add project and orderWindow info to request', async () => {
      const now = new Date();
      const startDate = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes ago

      const project = {
        id: 'project-123',
        name: 'Test Project',
        isActive: true,
        startDate: startDate,
        orderWindow: 30
      };

      mockPrisma.project.findUnique.mockResolvedValue(project);

      await checkOrderWindow(req, res, next);

      expect(req.project).toEqual(project);
      expect(req.orderWindow).toHaveProperty('isOpen', true);
      expect(req.orderWindow).toHaveProperty('start');
      expect(req.orderWindow).toHaveProperty('end');
      expect(req.orderWindow).toHaveProperty('timeRemainingMs');
      expect(req.orderWindow).toHaveProperty('minutesRemaining');
      expect(next).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
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
      expect(next).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('checkDuplicateOrder', () => {
    it('should block duplicate orders', async () => {
      const existingOrder = {
        id: 'order-123',
        userId: 'user-123',
        projectId: 'project-123',
        status: 'CONFIRMED',
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
            id: existingOrder.id,
            status: existingOrder.status,
            createdAt: existingOrder.createdAt
          }
        }
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow order when no duplicate exists', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(null);

      await checkDuplicateOrder(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow order when previous order was cancelled', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(null);

      await checkDuplicateOrder(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(mockPrisma.order.findFirst).toHaveBeenCalledWith({
        where: expect.objectContaining({
          status: { not: 'CANCELLED' }
        })
      });
    });

    it('should check orders for today only', async () => {
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
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
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
      expect(next).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('sendOrderReminders', () => {
    it('should send reminders to users without orders', async () => {
      const project = {
        id: 'project-123',
        name: 'Test Project'
      };

      const allUsers = [
        { id: 'user-1', email: 'user1@test.com', isActive: true, role: 'REGULAR' },
        { id: 'user-2', email: 'user2@test.com', isActive: true, role: 'VIP' },
        { id: 'user-3', email: 'user3@test.com', isActive: true, role: 'REGULAR' }
      ];

      const ordersToday = [
        { userId: 'user-1' }
      ];

      mockPrisma.project.findUnique.mockResolvedValue(project);
      mockPrisma.user.findMany.mockResolvedValue(allUsers);
      mockPrisma.order.findMany.mockResolvedValue(ordersToday);

      const result = await sendOrderReminders('project-123');

      expect(result.success).toBe(true);
      expect(result.totalUsers).toBe(3);
      expect(result.usersWithOrders).toBe(1);
      expect(result.usersWithoutOrders).toBe(2);
      expect(result.remindersSent).toBe(2);
    });

    it('should throw error when project not found', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);

      await expect(sendOrderReminders('invalid-project')).rejects.toThrow('Project not found');
    });

    it('should handle case when all users have orders', async () => {
      const project = {
        id: 'project-123',
        name: 'Test Project'
      };

      const allUsers = [
        { id: 'user-1', email: 'user1@test.com', isActive: true, role: 'REGULAR' },
        { id: 'user-2', email: 'user2@test.com', isActive: true, role: 'VIP' }
      ];

      const ordersToday = [
        { userId: 'user-1' },
        { userId: 'user-2' }
      ];

      mockPrisma.project.findUnique.mockResolvedValue(project);
      mockPrisma.user.findMany.mockResolvedValue(allUsers);
      mockPrisma.order.findMany.mockResolvedValue(ordersToday);

      const result = await sendOrderReminders('project-123');

      expect(result.success).toBe(true);
      expect(result.usersWithoutOrders).toBe(0);
      expect(result.remindersSent).toBe(0);
    });

    it('should only send reminders to active users', async () => {
      const project = {
        id: 'project-123',
        name: 'Test Project'
      };

      mockPrisma.project.findUnique.mockResolvedValue(project);
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.order.findMany.mockResolvedValue([]);

      await sendOrderReminders('project-123');

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          role: {
            in: ['REGULAR', 'VIP']
          }
        }
      });
    });

    it('should handle database errors', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockPrisma.project.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(sendOrderReminders('project-123')).rejects.toThrow();

      consoleErrorSpy.mockRestore();
    });

    it('should create reminder records with proper structure', async () => {
      const project = { id: 'project-123', name: 'Test Project' };
      const allUsers = [
        { id: 'user-1', email: 'user1@test.com', isActive: true, role: 'REGULAR' }
      ];

      mockPrisma.project.findUnique.mockResolvedValue(project);
      mockPrisma.user.findMany.mockResolvedValue(allUsers);
      mockPrisma.order.findMany.mockResolvedValue([]);

      const result = await sendOrderReminders('project-123');

      expect(result.success).toBe(true);
      const reminder = result;
      expect(reminder).toHaveProperty('totalUsers');
      expect(reminder).toHaveProperty('usersWithOrders');
      expect(reminder).toHaveProperty('usersWithoutOrders');
      expect(reminder).toHaveProperty('remindersSent');
    });
  });
});

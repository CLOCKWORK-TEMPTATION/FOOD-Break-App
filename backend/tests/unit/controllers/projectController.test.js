/**
 * Project Controller Unit Tests
 * اختبارات وحدة متحكم المشاريع
 *
 * Coverage targets:
 * - Project CRUD operations (Create, Read, Update, Delete, Archive)
 * - QR code generation and verification
 * - Order window management and validation
 * - Member management (add, remove, update roles)
 * - Project statistics and settings
 * - Error handling and edge cases
 * - Pagination and filtering
 */

const projectController = require('../../../src/controllers/projectController');
const projectService = require('../../../src/services/projectService');

jest.mock('../../../src/services/projectService');
jest.mock('../../../src/utils/logger');

describe('Project Controller', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      user: { id: 'test-user-id', role: 'ADMIN' },
      body: {},
      params: {},
      query: {},
      file: null
    };
    mockRes = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('createProject', () => {
    it('should create project successfully', async () => {
      const mockProject = {
        id: 'project-1',
        name: 'مشروع اختبار',
        qrCode: 'QR123',
        location: 'الرياض',
        startDate: new Date(),
        isActive: true
      };

      mockReq.body = {
        name: 'مشروع اختبار',
        location: 'الرياض',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        orderWindow: 60
      };

      projectService.createProject.mockResolvedValue(mockProject);

      await projectController.createProject(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockProject
      });
    });

    it('should validate required fields', async () => {
      mockReq.body = {
        // Missing name and location
      };

      await projectController.createProject(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getProjects', () => {
    it('should return all projects for admin', async () => {
      const mockProjects = [
        {
          id: 'project-1',
          name: 'مشروع 1',
          isActive: true
        },
        {
          id: 'project-2',
          name: 'مشروع 2',
          isActive: false
        }
      ];

      projectService.getProjects.mockResolvedValue(mockProjects);

      await projectController.getProjects(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockProjects
      });
    });

    it('should filter active projects', async () => {
      mockReq.query.active = 'true';

      projectService.getActiveProjects.mockResolvedValue([]);

      await projectController.getProjects(mockReq, mockRes, mockNext);

      expect(projectService.getActiveProjects).toHaveBeenCalled();
    });
  });

  describe('getProjectById', () => {
    it('should return project by id', async () => {
      const mockProject = {
        id: 'project-1',
        name: 'مشروع اختبار',
        qrCode: 'QR123',
        members: []
      };

      mockReq.params.id = 'project-1';

      projectService.getProjectById.mockResolvedValue(mockProject);

      await projectController.getProjectById(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 for non-existent project', async () => {
      mockReq.params.id = 'non-existent';

      projectService.getProjectById.mockResolvedValue(null);

      await projectController.getProjectById(mockReq, mockRes, mockNext);

      const error = mockNext.mock.calls[0][0];
      expect(error.statusCode).toBe(404);
    });
  });

  describe('updateProject', () => {
    it('should update project successfully', async () => {
      const mockProject = {
        id: 'project-1',
        name: 'مشروع محدث',
        location: 'جدة'
      };

      mockReq.params.id = 'project-1';
      mockReq.body = {
        name: 'مشروع محدث',
        location: 'جدة'
      };

      projectService.updateProject.mockResolvedValue(mockProject);

      await projectController.updateProject(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('deleteProject', () => {
    it('should delete project', async () => {
      mockReq.params.id = 'project-1';

      projectService.deleteProject.mockResolvedValue(true);

      await projectController.deleteProject(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'تم حذف المشروع'
      });
    });

    it('should return 404 if project not found', async () => {
      mockReq.params.id = 'non-existent';

      projectService.deleteProject.mockResolvedValue(false);

      await projectController.deleteProject(mockReq, mockRes, mockNext);

      const error = mockNext.mock.calls[0][0];
      expect(error.statusCode).toBe(404);
    });
  });

  describe('addMember', () => {
    it('should add member to project', async () => {
      const mockMembership = {
        id: 'member-1',
        projectId: 'project-1',
        userId: 'user-1',
        role: 'MEMBER'
      };

      mockReq.params.id = 'project-1';
      mockReq.body = {
        userId: 'user-1',
        role: 'MEMBER'
      };

      projectService.addMember.mockResolvedValue(mockMembership);

      await projectController.addMember(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });

  describe('removeMember', () => {
    it('should remove member from project', async () => {
      mockReq.params.id = 'project-1';
      mockReq.params.userId = 'user-1';

      projectService.removeMember.mockResolvedValue(true);

      await projectController.removeMember(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getProjectMembers', () => {
    it('should return project members', async () => {
      const mockMembers = [
        {
          id: 'member-1',
          user: { id: 'user-1', firstName: 'محمد' },
          role: 'ADMIN'
        }
      ];

      mockReq.params.id = 'project-1';

      projectService.getProjectMembers.mockResolvedValue(mockMembers);

      await projectController.getProjectMembers(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('updateMemberRole', () => {
    it('should update member role', async () => {
      const mockMember = {
        id: 'member-1',
        role: 'VIP'
      };

      mockReq.params.id = 'project-1';
      mockReq.params.userId = 'user-1';
      mockReq.body = { role: 'VIP' };

      projectService.updateMemberRole.mockResolvedValue(mockMember);

      await projectController.updateMemberRole(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('generateQRCode', () => {
    it('should generate QR code', async () => {
      const mockQR = {
        qrCode: 'QR123',
        qrToken: 'jwt-token',
        imageUrl: 'https://api.qrserver.com/...'
      };

      mockReq.params.id = 'project-1';

      projectService.generateQRCode.mockResolvedValue(mockQR);

      await projectController.generateQRCode(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('validateQRCode', () => {
    it('should validate QR code successfully', async () => {
      const mockValidation = {
        valid: true,
        project: {
          id: 'project-1',
          name: 'مشروع اختبار'
        }
      };

      mockReq.body = { qrCode: 'QR123' };

      projectService.validateQRCode.mockResolvedValue(mockValidation);

      await projectController.validateQRCode(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return error for invalid QR', async () => {
      mockReq.body = { qrCode: 'INVALID' };

      projectService.validateQRCode.mockResolvedValue({
        valid: false,
        error: 'QR code غير صالح'
      });

      await projectController.validateQRCode(mockReq, mockRes, mockNext);

      const error = mockNext.mock.calls[0][0];
      expect(error.statusCode).toBe(400);
    });
  });

  describe('getProjectOrders', () => {
    it('should return project orders', async () => {
      const mockOrders = [
        {
          id: 'order-1',
          projectId: 'project-1',
          status: 'DELIVERED'
        }
      ];

      mockReq.params.id = 'project-1';

      projectService.getProjectOrders.mockResolvedValue(mockOrders);

      await projectController.getProjectOrders(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('updateProjectSettings', () => {
    it('should update project settings', async () => {
      const mockProject = {
        id: 'project-1',
        orderWindow: 90,
        reminderEnabled: true
      };

      mockReq.params.id = 'project-1';
      mockReq.body = {
        orderWindow: 90,
        reminderEnabled: true
      };

      projectService.updateProjectSettings.mockResolvedValue(mockProject);

      await projectController.updateProjectSettings(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getProjectStats', () => {
    it('should return project statistics', async () => {
      const mockStats = {
        totalOrders: 150,
        totalAmount: 15000,
        activeMembers: 25,
        averageOrderValue: 100
      };

      mockReq.params.id = 'project-1';

      projectService.getProjectStats.mockResolvedValue(mockStats);

      await projectController.getProjectStats(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats
      });
    });
  });

  describe('archiveProject', () => {
    it('should archive project', async () => {
      const mockProject = {
        id: 'project-1',
        isActive: false,
        archivedAt: new Date()
      };

      mockReq.params.id = 'project-1';

      projectService.archiveProject.mockResolvedValue(mockProject);

      await projectController.archiveProject(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  // Additional comprehensive tests
  describe('createProject - Edge Cases', () => {
    it('should handle project with invalid dates', async () => {
      mockReq.body = {
        name: 'Test Project',
        startDate: 'invalid-date',
        endDate: '2025-12-31'
      };

      projectService.createProject.mockRejectedValue(
        new Error('Invalid date format')
      );

      await projectController.createProject(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle project with end date before start date', async () => {
      mockReq.body = {
        name: 'Test Project',
        startDate: '2025-12-31',
        endDate: '2025-01-01'
      };

      projectService.createProject.mockRejectedValue(
        new Error('End date must be after start date')
      );

      await projectController.createProject(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should accept project without end date', async () => {
      const mockProject = {
        id: 'project-1',
        name: 'مشروع بدون تاريخ انتهاء',
        startDate: new Date(),
        endDate: null
      };

      mockReq.body = {
        name: 'مشروع بدون تاريخ انتهاء',
        startDate: '2025-01-01'
      };

      projectService.createProject.mockResolvedValue(mockProject);

      await projectController.createProject(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });

  describe('getProjects - Pagination and Filtering', () => {
    it('should handle pagination parameters', async () => {
      mockReq.query = { page: '2', limit: '20' };

      const mockProjects = Array.from({ length: 20 }, (_, i) => ({
        id: `project-${i}`,
        name: `مشروع ${i}`
      }));

      projectService.getProjects.mockResolvedValue(mockProjects);

      await projectController.getProjects(mockReq, mockRes, mockNext);

      expect(projectService.getProjects).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          limit: 20
        })
      );
    });

    it('should filter by location', async () => {
      mockReq.query = { location: 'Riyadh' };

      projectService.getProjectsByLocation.mockResolvedValue([]);

      await projectController.getProjects(mockReq, mockRes, mockNext);

      expect(projectService.getProjectsByLocation).toHaveBeenCalledWith('Riyadh');
    });

    it('should return empty array when no projects match', async () => {
      projectService.getProjects.mockResolvedValue([]);

      await projectController.getProjects(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: []
        })
      );
    });
  });

  describe('QR Code Operations', () => {
    it('should regenerate QR code for existing project', async () => {
      const mockQR = {
        qrCode: 'NEW_QR123',
        qrToken: 'new-jwt-token',
        regeneratedAt: new Date()
      };

      mockReq.params.id = 'project-1';

      projectService.regenerateQRCode.mockResolvedValue(mockQR);

      await projectController.regenerateQRCode(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(projectService.regenerateQRCode).toHaveBeenCalledWith('project-1');
    });

    it('should validate QR code with project access check', async () => {
      const mockValidation = {
        valid: true,
        project: { id: 'project-1', name: 'مشروع اختبار' },
        accessLevel: 'MEMBER',
        orderWindowOpen: true
      };

      mockReq.body = { qrToken: 'valid-jwt-token' };

      projectService.validateQRCode.mockResolvedValue(mockValidation);

      await projectController.validateQRCode(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          valid: true,
          accessLevel: 'MEMBER'
        })
      );
    });

    it('should reject expired QR code', async () => {
      mockReq.body = { qrToken: 'expired-token' };

      projectService.validateQRCode.mockResolvedValue({
        valid: false,
        error: 'QR Code expired'
      });

      await projectController.validateQRCode(mockReq, mockRes, mockNext);

      const error = mockNext.mock.calls[0][0];
      expect(error.statusCode).toBe(400);
    });
  });

  describe('Member Management - Edge Cases', () => {
    it('should prevent adding duplicate member', async () => {
      mockReq.params.id = 'project-1';
      mockReq.body = { userId: 'user-1', role: 'MEMBER' };

      projectService.addMember.mockRejectedValue(
        new Error('User is already a member')
      );

      await projectController.addMember(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle removing non-existent member', async () => {
      mockReq.params.id = 'project-1';
      mockReq.params.userId = 'non-existent-user';

      projectService.removeMember.mockResolvedValue(false);

      await projectController.removeMember(mockReq, mockRes, mockNext);

      const error = mockNext.mock.calls[0][0];
      expect(error.statusCode).toBe(404);
    });

    it('should update member role to VIP', async () => {
      const mockMember = {
        id: 'member-1',
        role: 'VIP',
        permissions: ['order_priority', 'special_items']
      };

      mockReq.params.id = 'project-1';
      mockReq.params.userId = 'user-1';
      mockReq.body = { role: 'VIP' };

      projectService.updateMemberRole.mockResolvedValue(mockMember);

      await projectController.updateMemberRole(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            role: 'VIP'
          })
        })
      );
    });

    it('should prevent removing last admin', async () => {
      mockReq.params.id = 'project-1';
      mockReq.params.userId = 'last-admin';

      projectService.removeMember.mockRejectedValue(
        new Error('Cannot remove last admin')
      );

      await projectController.removeMember(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('Order Window Management', () => {
    it('should check if order window is open', async () => {
      const mockWindowStatus = {
        isOpen: true,
        closesAt: new Date(Date.now() + 30 * 60 * 1000),
        remainingMinutes: 30
      };

      mockReq.params.id = 'project-1';

      projectService.checkOrderWindow.mockResolvedValue(mockWindowStatus);

      await projectController.checkOrderWindow(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isOpen: true
          })
        })
      );
    });

    it('should return closed status when window expired', async () => {
      const mockWindowStatus = {
        isOpen: false,
        closedAt: new Date(Date.now() - 10 * 60 * 1000),
        nextWindow: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };

      mockReq.params.id = 'project-1';

      projectService.checkOrderWindow.mockResolvedValue(mockWindowStatus);

      await projectController.checkOrderWindow(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isOpen: false
          })
        })
      );
    });
  });

  describe('Project Settings', () => {
    it('should update order window setting', async () => {
      const mockProject = {
        id: 'project-1',
        orderWindow: 90,
        reminderEnabled: true,
        autoReminders: true
      };

      mockReq.params.id = 'project-1';
      mockReq.body = { orderWindow: 90 };

      projectService.updateProjectSettings.mockResolvedValue(mockProject);

      await projectController.updateProjectSettings(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should enable/disable reminders', async () => {
      const mockProject = {
        id: 'project-1',
        reminderEnabled: false
      };

      mockReq.params.id = 'project-1';
      mockReq.body = { reminderEnabled: false };

      projectService.updateProjectSettings.mockResolvedValue(mockProject);

      await projectController.updateProjectSettings(mockReq, mockRes, mockNext);

      expect(projectService.updateProjectSettings).toHaveBeenCalledWith(
        'project-1',
        { reminderEnabled: false }
      );
    });
  });

  describe('Statistics and Reports', () => {
    it('should return comprehensive project statistics', async () => {
      const mockStats = {
        totalOrders: 150,
        totalAmount: 15000,
        activeMembers: 25,
        averageOrderValue: 100,
        topRestaurants: [
          { name: 'مطعم 1', orders: 50 },
          { name: 'مطعم 2', orders: 30 }
        ],
        popularItems: [
          { name: 'طبق 1', orders: 40 },
          { name: 'طبق 2', orders: 35 }
        ]
      };

      mockReq.params.id = 'project-1';

      projectService.getProjectStats.mockResolvedValue(mockStats);

      await projectController.getProjectStats(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            totalOrders: 150,
            topRestaurants: expect.any(Array)
          })
        })
      );
    });

    it('should return 404 for stats of non-existent project', async () => {
      mockReq.params.id = 'non-existent';

      projectService.getProjectStats.mockRejectedValue(
        new Error('Project not found')
      );

      await projectController.getProjectStats(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      projectService.createProject.mockRejectedValue(
        new Error('Database connection failed')
      );

      await projectController.createProject(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle validation errors gracefully', async () => {
      mockReq.body = { name: '' }; // Invalid empty name

      await projectController.createProject(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle unauthorized access attempts', async () => {
      mockReq.user = { id: 'user-1', role: 'MEMBER' };
      mockReq.params.id = 'project-1';
      mockReq.body = { userId: 'user-2', role: 'ADMIN' };

      projectService.updateMemberRole.mockRejectedValue(
        new Error('Unauthorized: Insufficient permissions')
      );

      await projectController.updateMemberRole(mockReq, mockRes, mockNext);

      const error = mockNext.mock.calls[0][0];
      expect(error.statusCode).toBe(403);
    });
  });
});

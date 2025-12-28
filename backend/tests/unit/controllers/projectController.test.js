/**
 * Project Controller Unit Tests
 * اختبارات وحدة متحكم المشاريع
 */

const projectController = require('../../../src/controllers/projectController');
const projectService = require('../../../src/services/projectService');

jest.mock('../../../src/services/projectService');

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
});

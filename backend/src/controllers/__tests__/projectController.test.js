/**
 * Tests for Project Controller
 */

jest.mock('@prisma/client');
jest.mock('../../services/qrCodeService');
jest.mock('express-validator');

const projectController = require('../projectController');
const { PrismaClient } = require('@prisma/client');
const qrCodeService = require('../../services/qrCodeService');
const { validationResult } = require('express-validator');

describe('Project Controller', () => {
  let req, res, next;
  let mockPrisma;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPrisma = {
      project: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        count: jest.fn()
      }
    };

    PrismaClient.mockImplementation(() => mockPrisma);

    req = {
      user: { id: 'user123', role: 'ADMIN' },
      params: {},
      query: {},
      body: {},
      t: (key) => key
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    next = jest.fn();

    validationResult.mockReturnValue({
      isEmpty: () => true,
      array: () => []
    });
  });

  describe('createProject', () => {
    it('should create project successfully', async () => {
      req.body = {
        name: 'Test Project',
        location: 'Test Location',
        latitude: 30.0,
        longitude: 31.0,
        startDate: '2025-01-15T10:00:00Z',
        orderWindow: 60
      };

      mockPrisma.project.create.mockResolvedValue({
        id: 'project123',
        name: 'Test Project',
        location: 'Test Location',
        startDate: new Date('2025-01-15'),
        orderWindow: 60,
        qrCode: '',
        qrToken: ''
      });

      qrCodeService.generateProjectQR = jest.fn().mockResolvedValue({
        qrCode: 'qr_code_data',
        token: 'qr_token',
        expiresAt: new Date()
      });

      mockPrisma.project.update.mockResolvedValue({
        id: 'project123',
        name: 'Test Project',
        qrCode: 'qr_code_data',
        qrToken: 'qr_token',
        location: 'Test Location',
        startDate: new Date('2025-01-15'),
        orderWindow: 60
      });

      await projectController.createProject(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            project: expect.any(Object)
          })
        })
      );
    });

    it('should handle validation errors', async () => {
      validationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => [{ msg: 'Invalid input' }]
      });

      await projectController.createProject(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getAllProjects', () => {
    it('should get all projects with pagination', async () => {
      req.query = { page: '1', limit: '10' };

      mockPrisma.project.findMany.mockResolvedValue([
        { id: 'project1', name: 'Project 1' },
        { id: 'project2', name: 'Project 2' }
      ]);

      mockPrisma.project.count.mockResolvedValue(2);

      await projectController.getAllProjects(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            projects: expect.any(Array),
            pagination: expect.any(Object)
          })
        })
      );
    });

    it('should filter by isActive', async () => {
      req.query = { isActive: 'true' };

      mockPrisma.project.findMany.mockResolvedValue([]);
      mockPrisma.project.count.mockResolvedValue(0);

      await projectController.getAllProjects(req, res, next);

      expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true }
        })
      );
    });
  });

  describe('getProject', () => {
    it('should get project by ID', async () => {
      req.params = { projectId: 'project123' };

      mockPrisma.project.findUnique.mockResolvedValue({
        id: 'project123',
        name: 'Test Project'
      });

      await projectController.getProject(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            project: expect.any(Object)
          })
        })
      );
    });

    it('should return 404 for non-existent project', async () => {
      req.params = { projectId: 'invalid_project' };

      mockPrisma.project.findUnique.mockResolvedValue(null);

      await projectController.getProject(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updateProject', () => {
    it('should update project successfully', async () => {
      req.params = { projectId: 'project123' };
      req.body = {
        name: 'Updated Project',
        location: 'New Location'
      };

      mockPrisma.project.findUnique.mockResolvedValue({
        id: 'project123',
        name: 'Test Project'
      });

      mockPrisma.project.update.mockResolvedValue({
        id: 'project123',
        name: 'Updated Project',
        location: 'New Location'
      });

      await projectController.updateProject(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            project: expect.any(Object)
          })
        })
      );
    });

    it('should return 404 for non-existent project', async () => {
      req.params = { projectId: 'invalid_project' };
      req.body = { name: 'Updated' };

      mockPrisma.project.findUnique.mockResolvedValue(null);

      await projectController.updateProject(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('regenerateQRCode', () => {
    it('should regenerate QR code successfully', async () => {
      req.params = { projectId: 'project123' };

      mockPrisma.project.findUnique.mockResolvedValue({
        id: 'project123',
        name: 'Test Project'
      });

      qrCodeService.generateProjectQR = jest.fn().mockResolvedValue({
        qrCode: 'new_qr_code',
        token: 'new_token',
        expiresAt: new Date()
      });

      mockPrisma.project.update.mockResolvedValue({
        id: 'project123',
        qrCode: 'new_qr_code',
        qrToken: 'new_token'
      });

      await projectController.regenerateQRCode(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            qrCode: 'new_qr_code'
          })
        })
      );
    });

    it('should return 404 for non-existent project', async () => {
      req.params = { projectId: 'invalid_project' };

      mockPrisma.project.findUnique.mockResolvedValue(null);

      await projectController.regenerateQRCode(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteProject', () => {
    it('should deactivate project successfully', async () => {
      req.params = { projectId: 'project123' };

      mockPrisma.project.findUnique.mockResolvedValue({
        id: 'project123',
        name: 'Test Project'
      });

      mockPrisma.project.update.mockResolvedValue({
        id: 'project123',
        isActive: false
      });

      await projectController.deleteProject(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );
    });

    it('should return 404 for non-existent project', async () => {
      req.params = { projectId: 'invalid_project' };

      mockPrisma.project.findUnique.mockResolvedValue(null);

      await projectController.deleteProject(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('accessProjectByQR', () => {
    it('should access project with valid QR', async () => {
      req.body = { qrToken: 'valid_token' };

      qrCodeService.validateQRCode = jest.fn().mockResolvedValue({
        valid: true,
        projectId: 'project123'
      });

      const startDate = new Date();
      startDate.setMinutes(startDate.getMinutes() - 10);

      mockPrisma.project.findUnique.mockResolvedValue({
        id: 'project123',
        name: 'Test Project',
        location: 'Test Location',
        latitude: 30.0,
        longitude: 31.0,
        startDate: startDate,
        orderWindow: 60,
        isActive: true
      });

      mockPrisma.project.update.mockResolvedValue({});

      await projectController.accessProjectByQR(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            project: expect.any(Object),
            accessGranted: true
          })
        })
      );
    });

    it('should reject missing QR token', async () => {
      req.body = {};

      await projectController.accessProjectByQR(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject invalid QR code', async () => {
      req.body = { qrToken: 'invalid_token' };

      qrCodeService.validateQRCode = jest.fn().mockResolvedValue({
        valid: false
      });

      await projectController.accessProjectByQR(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should reject inactive project', async () => {
      req.body = { qrToken: 'valid_token' };

      qrCodeService.validateQRCode = jest.fn().mockResolvedValue({
        valid: true,
        projectId: 'project123'
      });

      mockPrisma.project.findUnique.mockResolvedValue({
        id: 'project123',
        name: 'Test Project',
        isActive: false
      });

      await projectController.accessProjectByQR(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('checkOrderWindow', () => {
    it('should check order window when open', async () => {
      req.params = { projectId: 'project123' };

      const now = new Date();
      const startDate = new Date(now.getTime() - 10 * 60 * 1000); // 10 minutes ago

      mockPrisma.project.findUnique.mockResolvedValue({
        id: 'project123',
        name: 'Test Project',
        startDate: startDate,
        orderWindow: 60
      });

      await projectController.checkOrderWindow(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            projectId: 'project123',
            isOrderWindowOpen: true
          })
        })
      );
    });

    it('should check order window when closed', async () => {
      req.params = { projectId: 'project123' };

      const now = new Date();
      const startDate = new Date(now.getTime() - 120 * 60 * 1000); // 2 hours ago

      mockPrisma.project.findUnique.mockResolvedValue({
        id: 'project123',
        name: 'Test Project',
        startDate: startDate,
        orderWindow: 60
      });

      await projectController.checkOrderWindow(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            isOrderWindowOpen: false,
            timeRemainingMs: 0
          })
        })
      );
    });

    it('should return 404 for non-existent project', async () => {
      req.params = { projectId: 'invalid_project' };

      mockPrisma.project.findUnique.mockResolvedValue(null);

      await projectController.checkOrderWindow(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});

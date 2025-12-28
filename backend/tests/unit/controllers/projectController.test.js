/**
 * Project Controller Tests
 * اختبارات وحدة المشاريع
 */

const projectController = require('../../../src/controllers/projectController');

// Mock dependencies
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => global.mockPrisma)
}));

describe('Project Controller', () => {
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

  describe('getAllProjects', () => {
    it('should return all projects', async () => {
      const mockProjects = [
        { id: '1', name: 'Project 1', status: 'ACTIVE' },
        { id: '2', name: 'Project 2', status: 'COMPLETED' }
      ];
      global.mockPrisma.project.findMany.mockResolvedValue(mockProjects);

      await projectController.getAllProjects(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockProjects
        })
      );
    });
  });

  describe('getProjectById', () => {
    it('should return project by id', async () => {
      const mockProject = { id: '1', name: 'Project 1' };
      global.mockPrisma.project.findUnique.mockResolvedValue(mockProject);

      req.params.id = '1';

      await projectController.getProjectById(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockProject
        })
      );
    });
  });

  describe('createProject', () => {
    it('should create project successfully', async () => {
      const projectData = {
        name: 'New Project',
        description: 'Test project',
        restaurantId: 'rest-123'
      };
      const mockProject = { id: '1', ...projectData };
      global.mockPrisma.project.create.mockResolvedValue(mockProject);

      req.body = projectData;

      await projectController.createProject(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockProject
        })
      );
    });
  });

  describe('updateProject', () => {
    it('should update project successfully', async () => {
      const updateData = { name: 'Updated Project' };
      const mockProject = { id: '1', ...updateData };
      global.mockPrisma.project.update.mockResolvedValue(mockProject);

      req.params.id = '1';
      req.body = updateData;

      await projectController.updateProject(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockProject
        })
      );
    });
  });

  describe('deleteProject', () => {
    it('should delete project successfully', async () => {
      global.mockPrisma.project.delete.mockResolvedValue({ id: '1' });

      req.params.id = '1';

      await projectController.deleteProject(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );
    });
  });

  describe('getProjectOrders', () => {
    it('should return orders for a project', async () => {
      const mockOrders = [{ id: 'order-1' }, { id: 'order-2' }];
      global.mockPrisma.order.findMany.mockResolvedValue(mockOrders);

      req.params.id = '1';

      await projectController.getProjectOrders(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockOrders
        })
      );
    });
  });
});

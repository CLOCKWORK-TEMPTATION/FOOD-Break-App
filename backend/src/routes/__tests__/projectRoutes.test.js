/**
 * Tests for Project Routes
 */

jest.mock('../../controllers/projectController');
jest.mock('../../middleware/auth');

const express = require('express');
const request = require('supertest');
const projectController = require('../../controllers/projectController');
const { authenticate, authorize } = require('../../middleware/auth');

describe('Project Routes', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();

    app = express();
    app.use(express.json());

    // Mock authentication middleware
    authenticate.mockImplementation((req, res, next) => {
      req.user = { id: 'user123', role: 'ADMIN' };
      next();
    });

    authorize.mockImplementation(() => (req, res, next) => next());

    // Mock all controller functions
    Object.keys(projectController).forEach((key) => {
      if (typeof projectController[key] === 'function') {
        projectController[key].mockImplementation((req, res) => {
          res.status(200).json({ success: true, data: {} });
        });
      }
    });

    // Load routes
    const projectRoutes = require('../../routes/projects');
    app.use('/api/projects', projectRoutes);
  });

  describe('POST /api/projects', () => {
    it('should create a new project', async () => {
      const projectData = {
        name: 'Test Project',
        location: 'Cairo',
        startDate: '2025-02-01'
      };

      const response = await request(app)
        .post('/api/projects')
        .send(projectData);

      expect(response.status).toBe(200);
      expect(projectController.createProject).toHaveBeenCalled();
    });
  });

  describe('GET /api/projects', () => {
    it('should get all projects', async () => {
      const response = await request(app).get('/api/projects');

      expect(response.status).toBe(200);
      expect(projectController.getAllProjects).toHaveBeenCalled();
    });

    it('should filter by isActive', async () => {
      const response = await request(app).get(
        '/api/projects?isActive=true'
      );

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/projects/:projectId', () => {
    it('should get project by ID', async () => {
      const response = await request(app).get('/api/projects/project123');

      expect(response.status).toBe(200);
      expect(projectController.getProject).toHaveBeenCalled();
    });
  });

  describe('PATCH /api/projects/:projectId', () => {
    it('should update project', async () => {
      const updateData = { name: 'Updated Project' };

      const response = await request(app)
        .patch('/api/projects/project123')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(projectController.updateProject).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/projects/:projectId', () => {
    it('should delete project', async () => {
      const response = await request(app).delete('/api/projects/project123');

      expect(response.status).toBe(200);
      expect(projectController.deleteProject).toHaveBeenCalled();
    });
  });

  describe('POST /api/projects/:projectId/regenerate-qr', () => {
    it('should regenerate QR code', async () => {
      const response = await request(app).post(
        '/api/projects/project123/regenerate-qr'
      );

      expect(response.status).toBe(200);
      expect(projectController.regenerateQRCode).toHaveBeenCalled();
    });
  });

  describe('POST /api/projects/access-by-qr', () => {
    it('should access project by QR code', async () => {
      const response = await request(app)
        .post('/api/projects/access-by-qr')
        .send({ qrToken: 'valid_token' });

      expect(response.status).toBe(200);
      expect(projectController.accessProjectByQR).toHaveBeenCalled();
    });
  });

  describe('GET /api/projects/:projectId/order-window', () => {
    it('should check order window status', async () => {
      const response = await request(app).get(
        '/api/projects/project123/order-window'
      );

      expect(response.status).toBe(200);
      expect(projectController.checkOrderWindow).toHaveBeenCalled();
    });
  });
});

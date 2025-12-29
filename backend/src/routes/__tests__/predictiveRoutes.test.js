/**
 * Tests for Predictive Routes
 */

jest.mock('../../controllers/predictiveController');
jest.mock('../../middleware/auth');

const express = require('express');
const request = require('supertest');
const predictiveController = require('../../controllers/predictiveController');
const { authenticate } = require('../../middleware/auth');

describe('Predictive Routes', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();

    app = express();
    app.use(express.json());

    // Mock authentication middleware
    authenticate.mockImplementation((req, res, next) => {
      req.user = { id: 'user123', role: 'USER' };
      next();
    });

    // Mock all controller functions
    Object.keys(predictiveController).forEach((key) => {
      if (typeof predictiveController[key] === 'function') {
        predictiveController[key].mockImplementation((req, res) => {
          res.status(200).json({ success: true, data: {} });
        });
      }
    });

    // Load routes
    const predictiveRoutes = require('../../routes/predictive');
    app.use('/api/predictive', predictiveRoutes);
  });

  describe('GET /api/predictive/behavior', () => {
    it('should analyze user behavior', async () => {
      const response = await request(app).get('/api/predictive/behavior');

      expect(response.status).toBe(200);
      expect(predictiveController.analyzeMyBehavior).toHaveBeenCalled();
    });
  });

  describe('GET /api/predictive/patterns', () => {
    it('should get user patterns', async () => {
      const response = await request(app).get('/api/predictive/patterns');

      expect(response.status).toBe(200);
      expect(predictiveController.getMyPatterns).toHaveBeenCalled();
    });
  });

  describe('POST /api/predictive/patterns/discover', () => {
    it('should discover new patterns', async () => {
      const response = await request(app).post(
        '/api/predictive/patterns/discover'
      );

      expect(response.status).toBe(200);
      expect(predictiveController.discoverPatterns).toHaveBeenCalled();
    });
  });

  describe('GET /api/predictive/suggestions', () => {
    it('should get order suggestions', async () => {
      const response = await request(app).get('/api/predictive/suggestions');

      expect(response.status).toBe(200);
      expect(predictiveController.getMySuggestions).toHaveBeenCalled();
    });
  });

  describe('POST /api/predictive/suggestions/generate', () => {
    it('should generate new suggestion', async () => {
      const response = await request(app).post(
        '/api/predictive/suggestions/generate'
      );

      expect(response.status).toBe(200);
      expect(predictiveController.generateSuggestion).toHaveBeenCalled();
    });
  });

  describe('POST /api/predictive/suggestions/:suggestionId/accept', () => {
    it('should accept suggestion', async () => {
      const response = await request(app)
        .post('/api/predictive/suggestions/suggestion123/accept')
        .send({ modifications: {} });

      expect(response.status).toBe(200);
      expect(predictiveController.acceptSuggestion).toHaveBeenCalled();
    });
  });

  describe('POST /api/predictive/suggestions/:suggestionId/reject', () => {
    it('should reject suggestion', async () => {
      const response = await request(app)
        .post('/api/predictive/suggestions/suggestion123/reject')
        .send({ reason: 'not_interested' });

      expect(response.status).toBe(200);
      expect(predictiveController.rejectSuggestion).toHaveBeenCalled();
    });
  });

  describe('GET /api/predictive/delivery/schedule', () => {
    it('should get delivery schedule', async () => {
      const response = await request(app).get(
        '/api/predictive/delivery/schedule'
      );

      expect(response.status).toBe(200);
      expect(predictiveController.getDeliverySchedule).toHaveBeenCalled();
    });
  });

  describe('GET /api/predictive/delivery/peak-times', () => {
    it('should get peak delivery times', async () => {
      const response = await request(app).get(
        '/api/predictive/delivery/peak-times'
      );

      expect(response.status).toBe(200);
      expect(predictiveController.getPeakTimes).toHaveBeenCalled();
    });
  });
});

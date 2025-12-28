const request = require('supertest');
const express = require('express');
const authRouter = require('../../routes/auth');
const authService = require('../../services/authService');

// Mock authService
jest.mock('../../services/authService');

// Mock middlewares
jest.mock('../../middleware/validation', () => ({
  validateRegistration: (req, res, next) => next(),
  validateLogin: (req, res, next) => next(),
  validateProfileUpdate: (req, res, next) => next(),
  validatePasswordChange: (req, res, next) => next()
}));

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

// Error handling middleware to catch "next(error)" calls in controller
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    success: false,
    message: err.message
  });
});

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User'
    };

    it('should register a new user', async () => {
      authService.register.mockResolvedValue({
        user: { id: 1, ...userData },
        token: 'mock-token'
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.data).toHaveProperty('token', 'mock-token');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.success).toBe(true);
    });

    it('should handle registration errors', async () => {
      const error = new Error('Registration failed');
      error.status = 400; // Simulate service setting a status or controller handling it
      authService.register.mockRejectedValue(error);

      // Note: In the controller, errors are passed to next(error).
      // Express default error handler sends 500 if no status is set.
      // So if I want 400, I should expect the error to have status property or middleware to handle it.
      // In this test setup, I added a middleware to capture next(error) and send back status.

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);
    });
  });

  describe('POST /api/auth/login', () => {
    const loginData = {
      email: 'test@example.com',
      password: 'password123'
    };

    it('should login successfully', async () => {
      authService.login.mockResolvedValue({
        user: { id: 1, email: loginData.email },
        token: 'mock-token'
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.data).toHaveProperty('token', 'mock-token');
      expect(response.body.success).toBe(true);
    });

    it('should handle login errors', async () => {
       const error = new Error('Login failed');
       error.status = 401; // Simulate specific error
      authService.login.mockRejectedValue(error);

      await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);
    });
  });
});

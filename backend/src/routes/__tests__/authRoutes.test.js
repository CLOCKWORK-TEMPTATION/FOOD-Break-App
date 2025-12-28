const request = require('supertest');

// Mock services
jest.mock('../../services/authService', () => ({
  register: jest.fn(),
  login: jest.fn(),
}));

// Mock Payment Controller to avoid init issues
jest.mock('../../controllers/paymentControllerNew', () => ({
  createPaymentIntent: jest.fn((req, res) => res.status(200).send('mock')),
  confirmPayment: jest.fn(),
  getUserPayments: jest.fn(),
  createInvoice: jest.fn(),
  getUserInvoices: jest.fn(),
  processRefund: jest.fn(),
  handleStripeWebhook: jest.fn(),
  getPaymentStatistics: jest.fn(),
}));

const app = require('../../server');
const authService = require('../../services/authService');

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        phoneNumber: '1234567890'
      };

      const mockResult = {
        user: { id: '1', ...userData, role: 'REGULAR' },
        token: 'mock-token',
        refreshToken: 'mock-refresh-token'
      };

      authService.register.mockResolvedValue(mockResult);

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockResult);
      expect(authService.register).toHaveBeenCalledWith(expect.objectContaining({
        email: userData.email
      }));
    });

    it('should validate input', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({}); // Empty body

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login a user', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const mockResult = {
        user: { id: '1', email: loginData.email },
        token: 'mock-token',
        refreshToken: 'mock-refresh-token'
      };

      authService.login.mockResolvedValue(mockResult);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockResult);
      expect(authService.login).toHaveBeenCalledWith(loginData.email, loginData.password);
    });

    it('should validate input', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'invalid-email' }); // Missing password

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});

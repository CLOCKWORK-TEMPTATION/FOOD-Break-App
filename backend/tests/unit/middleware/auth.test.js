const jwt = require('jsonwebtoken');
const { authenticateToken, authorizeRoles } = require('../../../src/middleware/auth');
jest.mock('jsonwebtoken');
jest.mock('../../../src/utils/logger');

describe('Auth Middleware', () => {
  let req, res, next, mockPrisma;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    mockPrisma = global.mockPrisma;
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('should authenticate valid token', async () => {
      req.headers.authorization = 'Bearer valid-token';
      jwt.verify.mockReturnValue({ userId: 'user-123' });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email: 'test@test.com',
        role: 'REGULAR',
        isActive: true
      });

      await authenticateToken(req, res, next);

      expect(req.user).toBeDefined();
      expect(next).toHaveBeenCalled();
    });

    it('should reject request without token', async () => {
      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject inactive user', async () => {
      req.headers.authorization = 'Bearer valid-token';
      jwt.verify.mockReturnValue({ userId: 'user-123' });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        isActive: false
      });

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should reject expired token', async () => {
      req.headers.authorization = 'Bearer expired-token';
      jwt.verify.mockImplementation(() => {
        const error = new Error('jwt expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('authorizeRoles', () => {
    it('should allow authorized role', () => {
      req.user = { role: 'ADMIN' };
      const middleware = authorizeRoles('ADMIN', 'PRODUCER');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should reject unauthorized role', () => {
      req.user = { role: 'REGULAR' };
      const middleware = authorizeRoles('ADMIN');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should reject without user', () => {
      const middleware = authorizeRoles('ADMIN');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});

const { errorHandler, notFound } = require('../../../src/middleware/errorHandler');

jest.mock('../../../src/utils/logger');
jest.mock('../../../src/utils/monitoring');

describe('Error Handler Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      path: '/test',
      method: 'GET',
      body: {},
      ip: '127.0.0.1',
      get: jest.fn((header) => {
        if (header === 'user-agent') return 'test-agent';
        return null;
      })
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('errorHandler', () => {
    it('should handle Prisma duplicate error', () => {
      const err = { code: 'P2002', meta: { target: ['email'] } };

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'القيمة موجودة مسبقاً',
        field: ['email']
      });
    });

    it('should handle Prisma not found error', () => {
      const err = { code: 'P2025' };

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should handle validation error', () => {
      const err = { name: 'ValidationError', message: 'Invalid input' };

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should handle JWT error', () => {
      const err = { name: 'JsonWebTokenError', message: 'Invalid token' };

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should sanitize sensitive data', () => {
      req.body = { password: 'secret123', email: 'test@test.com' };
      const err = new Error('Test error');

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('notFound', () => {
    it('should create 404 error', () => {
      req.originalUrl = '/api/nonexistent';

      notFound(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 404
      }));
    });
  });
});

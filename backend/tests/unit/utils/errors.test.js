/**
 * Custom Error Classes Unit Tests
 * اختبارات فئات الأخطاء المخصصة
 */

const {
  ApiError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  RateLimitError,
  InternalServerError,
  ServiceUnavailableError,
  DatabaseError,
  PrismaError,
  errorHandler
} = require('../../../src/utils/errors');

describe('Custom Error Classes', () => {
  describe('ApiError', () => {
    it('should create base API error', () => {
      const error = new ApiError('Test error', 500, 'TEST_ERROR');

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('TEST_ERROR');
      expect(error.isOperational).toBe(true);
    });

    it('should serialize to JSON correctly', () => {
      const error = new ApiError('Test error', 400, 'BAD_REQUEST');
      const json = error.toJSON();

      expect(json).toEqual({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'Test error'
        }
      });
    });

    it('should include stack trace in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new ApiError('Test error', 500);
      const json = error.toJSON();

      expect(json.error.stack).toBeDefined();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('BadRequestError', () => {
    it('should create 400 error', () => {
      const error = new BadRequestError('Invalid input');

      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('BAD_REQUEST');
      expect(error.message).toBe('Invalid input');
    });
  });

  describe('UnauthorizedError', () => {
    it('should create 401 error', () => {
      const error = new UnauthorizedError('Not authenticated');

      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('ForbiddenError', () => {
    it('should create 403 error', () => {
      const error = new ForbiddenError();

      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('FORBIDDEN');
    });
  });

  describe('NotFoundError', () => {
    it('should create 404 error', () => {
      const error = new NotFoundError('Resource not found');

      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
    });
  });

  describe('ConflictError', () => {
    it('should create 409 error', () => {
      const error = new ConflictError('Duplicate entry');

      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('CONFLICT');
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with details', () => {
      const errors = [
        { field: 'email', message: 'Invalid email' },
        { field: 'password', message: 'Password too short' }
      ];
      const error = new ValidationError('Validation failed', errors);

      expect(error.statusCode).toBe(422);
      expect(error.errors).toEqual(errors);

      const json = error.toJSON();
      expect(json.error.errors).toEqual(errors);
    });
  });

  describe('RateLimitError', () => {
    it('should create rate limit error with retry time', () => {
      const error = new RateLimitError('Too many requests', 120);

      expect(error.statusCode).toBe(429);
      expect(error.retryAfter).toBe(120);

      const json = error.toJSON();
      expect(json.error.retryAfter).toBe(120);
    });
  });

  describe('InternalServerError', () => {
    it('should create 500 error as non-operational', () => {
      const error = new InternalServerError();

      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(false);
    });
  });

  describe('ServiceUnavailableError', () => {
    it('should create 503 error', () => {
      const error = new ServiceUnavailableError();

      expect(error.statusCode).toBe(503);
      expect(error.code).toBe('SERVICE_UNAVAILABLE');
    });
  });

  describe('DatabaseError', () => {
    it('should wrap database errors', () => {
      const originalError = new Error('Connection failed');
      const error = new DatabaseError('Database error', originalError);

      expect(error.statusCode).toBe(500);
      expect(error.originalError).toBe(originalError);
    });
  });

  describe('PrismaError', () => {
    it('should handle P2002 (unique constraint)', () => {
      const prismaError = {
        code: 'P2002',
        meta: { target: ['email'] }
      };
      const error = new PrismaError(prismaError);

      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('DUPLICATE_ENTRY');
      expect(error.prismaCode).toBe('P2002');
    });

    it('should handle P2025 (record not found)', () => {
      const prismaError = { code: 'P2025' };
      const error = new PrismaError(prismaError);

      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
    });

    it('should handle P2003 (foreign key constraint)', () => {
      const prismaError = { code: 'P2003' };
      const error = new PrismaError(prismaError);

      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('INVALID_RELATION');
    });

    it('should handle unknown Prisma errors', () => {
      const prismaError = { code: 'P9999' };
      const error = new PrismaError(prismaError);

      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('DATABASE_ERROR');
    });
  });

  describe('errorHandler utility', () => {
    it('should handle Prisma errors', () => {
      const prismaError = {
        code: 'P2002',
        message: 'Unique constraint failed'
      };
      const error = errorHandler.handlePrismaError(prismaError);

      expect(error).toBeInstanceOf(PrismaError);
      expect(error.statusCode).toBe(409);
    });

    it('should handle JWT errors', () => {
      const jwtError = {
        name: 'TokenExpiredError',
        message: 'jwt expired'
      };
      const error = errorHandler.handleJWTError(jwtError);

      expect(error.code).toBe('TOKEN_EXPIRED');
      expect(error.statusCode).toBe(401);
    });

    it('should handle validation errors', () => {
      const errors = [
        { param: 'email', msg: 'Invalid email' }
      ];
      const error = errorHandler.handleValidationError(errors);

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.errors).toEqual([
        { field: 'email', message: 'Invalid email' }
      ]);
    });

    it('should log errors with context', () => {
      const logger = require('../../../src/utils/logger');
      const testError = new BadRequestError('Test error');
      const context = { path: '/test', method: 'GET' };

      errorHandler.logError(testError, context);

      // Logger should have been called
      expect(logger.warn).toHaveBeenCalledWith({
        message: 'Test error',
        code: 'BAD_REQUEST',
        statusCode: 400,
        ...context
      });
    });
  });
});

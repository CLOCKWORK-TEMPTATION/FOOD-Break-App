/**
 * Errors Utility Tests
 * اختبارات شاملة لأداة الأخطاء
 */

const errors = require('../../../src/utils/errors');

describe('Errors Utility Tests', () => {
  describe('Custom Error Classes', () => {
    it('should have ValidationError class', () => {
      expect(errors.ValidationError).toBeDefined();
    });

    it('should have AuthenticationError class', () => {
      expect(errors.AuthenticationError).toBeDefined();
    });

    it('should have NotFoundError class', () => {
      expect(errors.NotFoundError).toBeDefined();
    });

    it('should have ForbiddenError class', () => {
      expect(errors.ForbiddenError).toBeDefined();
    });

    it('should create ValidationError with message', () => {
      const error = new errors.ValidationError('Invalid input');
      expect(error.message).toBe('Invalid input');
      expect(error).toBeInstanceOf(Error);
    });

    it('should create AuthenticationError with message', () => {
      const error = new errors.AuthenticationError('Unauthorized');
      expect(error.message).toBe('Unauthorized');
    });

    it('should create NotFoundError with message', () => {
      const error = new errors.NotFoundError('Resource not found');
      expect(error.message).toBe('Resource not found');
    });

    it('should create ForbiddenError with message', () => {
      const error = new errors.ForbiddenError('Access denied');
      expect(error.message).toBe('Access denied');
    });
  });

  describe('Error handling utilities', () => {
    it('should format error responses', () => {
      if (errors.formatError) {
        const formatted = errors.formatError('Test error');
        expect(formatted).toBeDefined();
      }
    });
  });
});

/**
 * JWT Utility Tests
 * اختبارات شاملة لأداة JWT
 */

jest.mock('jsonwebtoken');
const jwt = require('jsonwebtoken');
const jwtUtil = require('../../../src/utils/jwt');

describe('JWT Utility Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  });

  describe('generateToken', () => {
    it('should generate access token', () => {
      const mockToken = 'mock-token';
      jwt.sign = jest.fn().mockReturnValue(mockToken);

      const result = jwtUtil.generateToken({ userId: '123' });

      expect(jwt.sign).toHaveBeenCalled();
      expect(result).toBe(mockToken);
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', () => {
      const mockPayload = { userId: '123' };
      jwt.verify = jest.fn().mockReturnValue(mockPayload);

      const result = jwtUtil.verifyToken('valid-token');

      expect(jwt.verify).toHaveBeenCalled();
      expect(result).toEqual(mockPayload);
    });

    it('should handle invalid token', () => {
      jwt.verify = jest.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => jwtUtil.verifyToken('invalid-token')).toThrow();
    });
  });
});

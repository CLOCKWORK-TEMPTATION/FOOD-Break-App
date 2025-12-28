describe('JWT Utils', () => {
  const OLD_ENV = process.env;
  let jwtUtils;
  let jwt; // We need the same instance of jwt that the util uses

  beforeEach(() => {
    jest.resetModules(); // Clears the cache
    process.env = { ...OLD_ENV }; // Make a copy

    // We require the module inside beforeEach to ensure a fresh copy is loaded
    // This is important if the module reads env vars at the top level
    jwtUtils = require('../../src/utils/jwt');
    // We also need the local jwt instance to compare errors against correct constructor
    jwt = require('jsonwebtoken');
  });

  afterAll(() => {
    process.env = OLD_ENV; // Restore old environment
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      process.env.JWT_SECRET = 'test-secret';
      const payload = { id: 1, role: 'user' };
      const token = jwtUtils.generateToken(payload);

      expect(typeof token).toBe('string');
      const decoded = jwt.verify(token, 'test-secret');
      expect(decoded.id).toBe(payload.id);
      expect(decoded.role).toBe(payload.role);
    });

    it('should use default expiration (7d) if not provided and no env var set', () => {
      process.env.JWT_SECRET = 'test-secret';
      delete process.env.JWT_EXPIRES_IN;

      const payload = { id: 1 };
      const token = jwtUtils.generateToken(payload);
      const decoded = jwt.verify(token, 'test-secret');
      expect(decoded.id).toBe(1);
    });

    it('should use custom expiration when provided as argument', () => {
        process.env.JWT_SECRET = 'test-secret';
        const payload = { id: 1 };
        // Pass explicit expiration '1h'
        const token = jwtUtils.generateToken(payload, '1h');
        const decoded = jwt.verify(token, 'test-secret');
        expect(decoded).toHaveProperty('exp');
    });

    it('should use JWT_EXPIRES_IN from env if set and no argument provided', () => {
       process.env.JWT_SECRET = 'test-secret';
       process.env.JWT_EXPIRES_IN = '1h';

       const payload = { id: 1 };
       const token = jwtUtils.generateToken(payload);
       const decoded = jwt.verify(token, 'test-secret');
       expect(decoded).toHaveProperty('exp');
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token and return payload', () => {
      process.env.JWT_SECRET = 'test-secret';
      const payload = { id: 123 };
      const token = jwt.sign(payload, 'test-secret');

      const decoded = jwtUtils.verifyToken(token);
      expect(decoded.id).toBe(123);
    });

    it('should throw error for invalid token', () => {
      process.env.JWT_SECRET = 'test-secret';
      const token = 'invalid-token';

      expect(() => {
        jwtUtils.verifyToken(token);
      }).toThrow(jwt.JsonWebTokenError);
    });

    it('should throw error for token signed with different secret', () => {
      process.env.JWT_SECRET = 'test-secret';
      const token = jwt.sign({ id: 1 }, 'other-secret');

      expect(() => {
        jwtUtils.verifyToken(token);
      }).toThrow(jwt.JsonWebTokenError);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      process.env.JWT_REFRESH_SECRET = 'refresh-secret';
      const payload = { id: 1 };
      const token = jwtUtils.generateRefreshToken(payload);

      expect(typeof token).toBe('string');
      const decoded = jwt.verify(token, 'refresh-secret');
      expect(decoded.id).toBe(1);
    });

    it('should fall back to JWT_SECRET if JWT_REFRESH_SECRET is not set', () => {
        delete process.env.JWT_REFRESH_SECRET;
        process.env.JWT_SECRET = 'fallback-secret';

        const payload = { id: 1 };
        const token = jwtUtils.generateRefreshToken(payload);

        const decoded = jwt.verify(token, 'fallback-secret');
        expect(decoded.id).toBe(1);
    });
  });
});

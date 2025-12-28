const jwt = require('../../utils/jwt');
const password = require('../../utils/password');

describe('JWT Utils', () => {
  const testPayload = { userId: 'test-123', role: 'ADMIN' };

  it('should generate valid token', () => {
    const token = jwt.generateToken(testPayload);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
  });

  it('should verify valid token', () => {
    const token = jwt.generateToken(testPayload);
    const decoded = jwt.verifyToken(token);
    expect(decoded.userId).toBe(testPayload.userId);
  });

  it('should throw error for invalid token', () => {
    expect(() => jwt.verifyToken('invalid')).toThrow();
  });
});

describe('Password Utils', () => {
  it('should hash password', async () => {
    const hashed = await password.hashPassword('Test123!');
    expect(hashed).toBeDefined();
    expect(hashed).not.toBe('Test123!');
  });

  it('should return true for correct password', async () => {
    const hashed = await password.hashPassword('Test123!');
    const result = await password.comparePassword('Test123!', hashed);
    expect(result).toBe(true);
  });

  it('should return false for wrong password', async () => {
    const hashed = await password.hashPassword('Test123!');
    const result = await password.comparePassword('Wrong!', hashed);
    expect(result).toBe(false);
  });
});

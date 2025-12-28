/**
 * Password Utility Tests
 * اختبارات شاملة لأداة كلمات المرور
 */

jest.mock('bcrypt');
const bcrypt = require('bcrypt');
const passwordUtil = require('../../../src/utils/password');

describe('Password Utility Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('should hash password successfully', async () => {
      const mockHash = 'hashed-password';
      bcrypt.hash = jest.fn().mockResolvedValue(mockHash);

      const result = await passwordUtil.hashPassword('plain-password');

      expect(bcrypt.hash).toHaveBeenCalledWith('plain-password', expect.any(Number));
      expect(result).toBe(mockHash);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching passwords', async () => {
      bcrypt.compare = jest.fn().mockResolvedValue(true);

      const result = await passwordUtil.comparePassword('plain', 'hashed');

      expect(bcrypt.compare).toHaveBeenCalledWith('plain', 'hashed');
      expect(result).toBe(true);
    });

    it('should return false for non-matching passwords', async () => {
      bcrypt.compare = jest.fn().mockResolvedValue(false);

      const result = await passwordUtil.comparePassword('plain', 'hashed');

      expect(result).toBe(false);
    });
  });
});

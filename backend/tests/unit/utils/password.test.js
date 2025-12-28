/**
 * Password Utils Unit Tests
 * اختبارات أدوات كلمات المرور
 */

const { hashPassword, comparePassword } = require('../../../src/utils/password');

describe('Password Utils', () => {
  it('should hash password and validate correct match', async () => {
    const plainPassword = 'StrongPassword123!';

    const hashedPassword = await hashPassword(plainPassword);

    expect(hashedPassword).not.toBe(plainPassword);
    const isMatch = await comparePassword(plainPassword, hashedPassword);
    expect(isMatch).toBe(true);
  });

  it('should return false for mismatched password', async () => {
    const plainPassword = 'StrongPassword123!';
    const hashedPassword = await hashPassword(plainPassword);

    const isMatch = await comparePassword('WrongPassword!', hashedPassword);
    expect(isMatch).toBe(false);
  });
});

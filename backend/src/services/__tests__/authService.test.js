const authService = require('../../authService');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

describe('AuthService', () => {
  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { contains: 'authtest' } } });
    await prisma.$disconnect();
  });

  describe('register', () => {
    it('should register new user', async () => {
      const userData = {
        email: 'authtest1@test.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User'
      };

      const result = await authService.register(userData);
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe(userData.email);
    });

    it('should throw error for duplicate email', async () => {
      const userData = {
        email: 'authtest2@test.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User'
      };

      await authService.register(userData);
      await expect(authService.register(userData)).rejects.toThrow();
    });

    it('should hash password', async () => {
      const userData = {
        email: 'authtest3@test.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User'
      };

      await authService.register(userData);
      const user = await prisma.user.findUnique({ where: { email: userData.email } });
      expect(user.passwordHash).not.toBe(userData.password);
      expect(await bcrypt.compare(userData.password, user.passwordHash)).toBe(true);
    });
  });

  describe('login', () => {
    beforeAll(async () => {
      await authService.register({
        email: 'authtest4@test.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User'
      });
    });

    it('should login with correct credentials', async () => {
      const result = await authService.login('authtest4@test.com', 'Password123!');
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
    });

    it('should throw error for wrong password', async () => {
      await expect(authService.login('authtest4@test.com', 'WrongPassword')).rejects.toThrow();
    });

    it('should throw error for non-existent user', async () => {
      await expect(authService.login('nonexistent@test.com', 'Password123!')).rejects.toThrow();
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', async () => {
      const { token } = await authService.register({
        email: 'authtest5@test.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User'
      });

      const decoded = await authService.verifyToken(token);
      expect(decoded).toHaveProperty('userId');
    });

    it('should throw error for invalid token', async () => {
      await expect(authService.verifyToken('invalid-token')).rejects.toThrow();
    });
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      const { user } = await authService.register({
        email: 'authtest6@test.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User'
      });

      const found = await authService.getUserById(user.id);
      expect(found.id).toBe(user.id);
    });

    it('should throw error for invalid id', async () => {
      await expect(authService.getUserById('invalid-id')).rejects.toThrow();
    });
  });
});

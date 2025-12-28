// Mock database
jest.mock('@prisma/client', () => {
  const mPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $disconnect: jest.fn(),
  };
  return { PrismaClient: jest.fn(() => mPrisma) };
});

jest.mock('../../utils/password', () => ({
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
}));

jest.mock('../../utils/jwt', () => ({
  generateToken: jest.fn(),
  generateRefreshToken: jest.fn(),
}));

const authService = require('../authService');
const { PrismaClient } = require('@prisma/client');
const { hashPassword, comparePassword } = require('../../utils/password');
const { generateToken, generateRefreshToken } = require('../../utils/jwt');

describe('AuthService', () => {
  let prisma;

  beforeEach(() => {
    prisma = new PrismaClient();
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        phoneNumber: '1234567890'
      };

      const mockUser = {
        id: '1',
        ...userData,
        passwordHash: 'hashedPassword',
        role: 'REGULAR',
        isActive: true,
        createdAt: new Date()
      };

      prisma.user.findUnique.mockResolvedValue(null);
      hashPassword.mockResolvedValue('hashedPassword');
      prisma.user.create.mockResolvedValue(mockUser);
      generateToken.mockReturnValue('mock-token');
      generateRefreshToken.mockReturnValue('mock-refresh-token');

      const result = await authService.register(userData);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: userData.email } });
      expect(hashPassword).toHaveBeenCalledWith(userData.password);
      expect(prisma.user.create).toHaveBeenCalled();
      expect(result).toEqual({
        user: mockUser,
        token: 'mock-token',
        refreshToken: 'mock-refresh-token'
      });
    });

    it('should throw error if email already exists', async () => {
      const userData = { email: 'existing@example.com', password: 'password' };
      prisma.user.findUnique.mockResolvedValue({ id: '1' });

      await expect(authService.register(userData)).rejects.toThrow('البريد الإلكتروني مستخدم مسبقاً');
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const loginData = { email: 'test@example.com', password: 'password123' };
      const mockUser = {
        id: '1',
        email: loginData.email,
        passwordHash: 'hashedPassword',
        role: 'REGULAR',
        isActive: true
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      comparePassword.mockResolvedValue(true);
      generateToken.mockReturnValue('mock-token');
      generateRefreshToken.mockReturnValue('mock-refresh-token');

      const result = await authService.login(loginData.email, loginData.password);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: loginData.email } });
      expect(comparePassword).toHaveBeenCalledWith(loginData.password, mockUser.passwordHash);
      expect(result.token).toBe('mock-token');
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('should throw error for invalid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(authService.login('wrong@email.com', 'pass')).rejects.toThrow('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    });

    it('should throw error for inactive user', async () => {
      const mockUser = { isActive: false };
      prisma.user.findUnique.mockResolvedValue(mockUser);
      await expect(authService.login('inactive@email.com', 'pass')).rejects.toThrow('الحساب غير مفعل');
    });
  });
});

const { mockDeep } = require('jest-mock-extended');

// 1. Create the mock instance first, using a name starting with "mock"
const mockPrisma = mockDeep();

// 2. Mock the module to return that specific instance
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma)
}));

// Mock other utils
jest.mock('../../utils/password');
jest.mock('../../utils/jwt');
jest.mock('../../utils/logger');

// Import dependent modules AFTER mocking
const { hashPassword, comparePassword } = require('../../utils/password');
const { generateToken, generateRefreshToken } = require('../../utils/jwt');

// Import the service AFTER mocking
const authService = require('../authService');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock return values
    hashPassword.mockResolvedValue('hashedPassword');
    comparePassword.mockResolvedValue(true);
    generateToken.mockReturnValue('mockToken');
    generateRefreshToken.mockReturnValue('mockRefreshToken');
  });

  describe('register', () => {
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      phoneNumber: '1234567890'
    };

    it('should register a new user successfully', async () => {
      // Mock existing user check (returns null)
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Mock user creation
      const createdUser = {
        id: 'user-id',
        ...userData,
        passwordHash: 'hashedPassword',
        role: 'REGULAR',
        isActive: true,
        createdAt: new Date()
      };

      mockPrisma.user.create.mockResolvedValue(createdUser);

      const result = await authService.register(userData);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { email: userData.email } });
      expect(hashPassword).toHaveBeenCalledWith(userData.password);
      expect(mockPrisma.user.create).toHaveBeenCalled();
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token', 'mockToken');
    });

    it('should throw error if email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-id' });

      await expect(authService.register(userData)).rejects.toThrow('البريد الإلكتروني مستخدم مسبقاً');
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginData = {
      email: 'test@example.com',
      password: 'password123'
    };

    const mockUser = {
      id: 'user-id',
      email: loginData.email,
      passwordHash: 'hashedPassword',
      role: 'REGULAR',
      isActive: true,
      firstName: 'Test',
      lastName: 'User'
    };

    it('should login successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      comparePassword.mockResolvedValue(true);

      const result = await authService.login(loginData.email, loginData.password);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { email: loginData.email } });
      expect(comparePassword).toHaveBeenCalledWith(loginData.password, mockUser.passwordHash);
      expect(result).toHaveProperty('token', 'mockToken');
    });

    it('should throw error if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.login(loginData.email, loginData.password)).rejects.toThrow('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    });
  });
});

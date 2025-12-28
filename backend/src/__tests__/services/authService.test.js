/**
 * اختبارات وحدة authService
 * Unit Tests for Authentication Service
 *
 * يغطي هذا الملف:
 * - تسجيل مستخدم جديد (Register)
 * - تسجيل الدخول (Login)
 * - الحصول على بيانات المستخدم الحالي (Get Current User)
 * - تحديث الملف الشخصي (Update Profile)
 * - تغيير كلمة المرور (Change Password)
 */

const authService = require('../../services/authService');
const { PrismaClient } = require('@prisma/client');
const { hashPassword, comparePassword } = require('../../utils/password');
const { generateToken, generateRefreshToken } = require('../../utils/jwt');

// Mock all dependencies
jest.mock('@prisma/client');
jest.mock('../../utils/password');
jest.mock('../../utils/jwt');
jest.mock('../../utils/logger');

describe('AuthService - خدمة المصادقة', () => {
  let mockPrisma;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Setup mock Prisma client
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn()
      }
    };

    // Mock PrismaClient constructor
    PrismaClient.mockImplementation(() => mockPrisma);
  });

  describe('register - تسجيل مستخدم جديد', () => {
    it('يجب تسجيل مستخدم جديد بنجاح', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'أحمد',
        lastName: 'محمد',
        phoneNumber: '+966501234567',
        role: 'REGULAR'
      };

      const hashedPassword = 'hashed_password_123';
      const mockUser = {
        id: 'user-123',
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        isActive: true,
        createdAt: new Date()
      };

      const mockToken = 'mock_jwt_token';
      const mockRefreshToken = 'mock_refresh_token';

      // Setup mocks
      mockPrisma.user.findUnique.mockResolvedValue(null); // User doesn't exist
      hashPassword.mockResolvedValue(hashedPassword);
      mockPrisma.user.create.mockResolvedValue(mockUser);
      generateToken.mockReturnValue(mockToken);
      generateRefreshToken.mockReturnValue(mockRefreshToken);

      // Act
      const result = await authService.register(userData);

      // Assert
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: userData.email }
      });
      expect(hashPassword).toHaveBeenCalledWith(userData.password);
      expect(mockPrisma.user.create).toHaveBeenCalled();
      expect(result).toEqual({
        user: mockUser,
        token: mockToken,
        refreshToken: mockRefreshToken
      });
    });

    it('يجب رفض التسجيل إذا كان البريد الإلكتروني مستخدماً مسبقاً', async () => {
      // Arrange
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'أحمد',
        lastName: 'محمد'
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'existing-user-id',
        email: userData.email
      });

      // Act & Assert
      await expect(authService.register(userData)).rejects.toThrow(
        'البريد الإلكتروني مستخدم مسبقاً'
      );
      expect(hashPassword).not.toHaveBeenCalled();
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('يجب استخدام REGULAR كدور افتراضي', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'أحمد',
        lastName: 'محمد'
        // No role specified
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      hashPassword.mockResolvedValue('hashed');
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-123',
        email: userData.email,
        role: 'REGULAR',
        firstName: userData.firstName,
        lastName: userData.lastName,
        isActive: true,
        createdAt: new Date()
      });
      generateToken.mockReturnValue('token');
      generateRefreshToken.mockReturnValue('refresh');

      // Act
      await authService.register(userData);

      // Assert
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            role: 'REGULAR'
          })
        })
      );
    });
  });

  describe('login - تسجيل الدخول', () => {
    it('يجب السماح بتسجيل الدخول بنجاح مع بيانات صحيحة', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'password123';
      const mockUser = {
        id: 'user-123',
        email,
        passwordHash: 'hashed_password',
        firstName: 'أحمد',
        lastName: 'محمد',
        role: 'REGULAR',
        isActive: true
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      comparePassword.mockResolvedValue(true);
      generateToken.mockReturnValue('jwt_token');
      generateRefreshToken.mockReturnValue('refresh_token');

      // Act
      const result = await authService.login(email, password);

      // Assert
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email }
      });
      expect(comparePassword).toHaveBeenCalledWith(password, mockUser.passwordHash);
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('refreshToken');
    });

    it('يجب رفض تسجيل الدخول مع بريد إلكتروني غير موجود', async () => {
      // Arrange
      const email = 'nonexistent@example.com';
      const password = 'password123';

      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.login(email, password)).rejects.toThrow(
        'البريد الإلكتروني أو كلمة المرور غير صحيحة'
      );
      expect(comparePassword).not.toHaveBeenCalled();
    });

    it('يجب رفض تسجيل الدخول مع كلمة مرور خاطئة', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'wrong_password';
      const mockUser = {
        id: 'user-123',
        email,
        passwordHash: 'hashed_password',
        isActive: true
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      comparePassword.mockResolvedValue(false);

      // Act & Assert
      await expect(authService.login(email, password)).rejects.toThrow(
        'البريد الإلكتروني أو كلمة المرور غير صحيحة'
      );
      expect(generateToken).not.toHaveBeenCalled();
    });

    it('يجب رفض تسجيل الدخول للحسابات غير المفعلة', async () => {
      // Arrange
      const email = 'inactive@example.com';
      const password = 'password123';
      const mockUser = {
        id: 'user-123',
        email,
        passwordHash: 'hashed_password',
        isActive: false // Account is inactive
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(authService.login(email, password)).rejects.toThrow(
        'الحساب غير مفعل'
      );
      expect(comparePassword).not.toHaveBeenCalled();
    });
  });

  describe('getCurrentUser - الحصول على بيانات المستخدم الحالي', () => {
    it('يجب إرجاع بيانات المستخدم بنجاح', async () => {
      // Arrange
      const userId = 'user-123';
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        firstName: 'أحمد',
        lastName: 'محمد',
        phoneNumber: '+966501234567',
        role: 'REGULAR',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      // Act
      const result = await authService.getCurrentUser(userId);

      // Assert
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: expect.any(Object)
      });
      expect(result).toEqual(mockUser);
    });

    it('يجب رفض الطلب للمستخدم غير الموجود', async () => {
      // Arrange
      const userId = 'nonexistent-user';
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.getCurrentUser(userId)).rejects.toThrow(
        'المستخدم غير موجود'
      );
    });
  });

  describe('updateProfile - تحديث الملف الشخصي', () => {
    it('يجب تحديث الملف الشخصي بنجاح', async () => {
      // Arrange
      const userId = 'user-123';
      const updateData = {
        firstName: 'أحمد المحدث',
        lastName: 'محمد المحدث',
        phoneNumber: '+966509876543'
      };

      const mockUpdatedUser = {
        id: userId,
        email: 'test@example.com',
        ...updateData,
        role: 'REGULAR',
        updatedAt: new Date()
      };

      mockPrisma.user.update.mockResolvedValue(mockUpdatedUser);

      // Act
      const result = await authService.updateProfile(userId, updateData);

      // Assert
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: expect.objectContaining({
          firstName: updateData.firstName,
          lastName: updateData.lastName,
          phoneNumber: updateData.phoneNumber
        }),
        select: expect.any(Object)
      });
      expect(result).toEqual(mockUpdatedUser);
    });

    it('يجب تحديث الحقول المحددة فقط', async () => {
      // Arrange
      const userId = 'user-123';
      const updateData = {
        firstName: 'أحمد الجديد'
        // Only firstName is being updated
      };

      mockPrisma.user.update.mockResolvedValue({
        id: userId,
        email: 'test@example.com',
        firstName: updateData.firstName,
        lastName: 'محمد', // Not changed
        role: 'REGULAR'
      });

      // Act
      await authService.updateProfile(userId, updateData);

      // Assert
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: expect.objectContaining({
          firstName: updateData.firstName
        }),
        select: expect.any(Object)
      });
    });
  });

  describe('changePassword - تغيير كلمة المرور', () => {
    it('يجب تغيير كلمة المرور بنجاح', async () => {
      // Arrange
      const userId = 'user-123';
      const currentPassword = 'old_password';
      const newPassword = 'new_password';
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        passwordHash: 'old_hashed_password'
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      comparePassword.mockResolvedValue(true);
      hashPassword.mockResolvedValue('new_hashed_password');
      mockPrisma.user.update.mockResolvedValue({});

      // Act
      await authService.changePassword(userId, currentPassword, newPassword);

      // Assert
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId }
      });
      expect(comparePassword).toHaveBeenCalledWith(currentPassword, mockUser.passwordHash);
      expect(hashPassword).toHaveBeenCalledWith(newPassword);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { passwordHash: 'new_hashed_password' }
      });
    });

    it('يجب رفض تغيير كلمة المرور مع كلمة مرور حالية خاطئة', async () => {
      // Arrange
      const userId = 'user-123';
      const currentPassword = 'wrong_password';
      const newPassword = 'new_password';
      const mockUser = {
        id: userId,
        passwordHash: 'hashed_password'
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      comparePassword.mockResolvedValue(false);

      // Act & Assert
      await expect(
        authService.changePassword(userId, currentPassword, newPassword)
      ).rejects.toThrow('كلمة المرور الحالية غير صحيحة');

      expect(hashPassword).not.toHaveBeenCalled();
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('يجب رفض تغيير كلمة المرور للمستخدم غير الموجود', async () => {
      // Arrange
      const userId = 'nonexistent-user';
      const currentPassword = 'password';
      const newPassword = 'new_password';

      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        authService.changePassword(userId, currentPassword, newPassword)
      ).rejects.toThrow('المستخدم غير موجود');

      expect(comparePassword).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases - الحالات الحدودية', () => {
    it('يجب التعامل مع أخطاء قاعدة البيانات أثناء التسجيل', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'أحمد',
        lastName: 'محمد'
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      hashPassword.mockResolvedValue('hashed');
      mockPrisma.user.create.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(authService.register(userData)).rejects.toThrow('Database error');
    });

    it('يجب التعامل مع أخطاء التشفير', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'أحمد',
        lastName: 'محمد'
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      hashPassword.mockRejectedValue(new Error('Hashing failed'));

      // Act & Assert
      await expect(authService.register(userData)).rejects.toThrow('Hashing failed');
    });

    it('يجب التعامل مع البيانات الفارغة', async () => {
      // Arrange
      const userData = {
        email: '',
        password: '',
        firstName: '',
        lastName: ''
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      // The function should handle empty data appropriately
      await expect(authService.register(userData)).resolves.toBeDefined();
    });
  });
});

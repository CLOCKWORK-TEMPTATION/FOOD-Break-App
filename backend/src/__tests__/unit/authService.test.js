/**
 * اختبارات Unit Tests لخدمة المصادقة
 * Unit Tests for Authentication Service
 */

const { PrismaClient } = require('@prisma/client');
const authService = require('../../services/authService');
const { hashPassword, comparePassword } = require('../../utils/password');
const { generateToken, generateRefreshToken } = require('../../utils/jwt');

// Mock dependencies
jest.mock('@prisma/client');
jest.mock('../../utils/password');
jest.mock('../../utils/jwt');
jest.mock('../../utils/logger');

describe('AuthService - Unit Tests', () => {
  let mockPrisma;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock Prisma instance
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    // Mock PrismaClient constructor
    PrismaClient.mockImplementation(() => mockPrisma);
  });

  // ==========================================
  // اختبارات تسجيل المستخدم (Register)
  // ==========================================
  describe('register()', () => {
    const validUserData = {
      email: 'test@example.com',
      password: 'SecurePass123!',
      firstName: 'أحمد',
      lastName: 'محمد',
      phoneNumber: '+966501234567',
      role: 'REGULAR'
    };

    it('يجب أن ينشئ مستخدم جديد بنجاح', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: '1',
        email: validUserData.email,
        firstName: validUserData.firstName,
        lastName: validUserData.lastName,
        role: validUserData.role,
        isActive: true,
        createdAt: new Date()
      });
      hashPassword.mockResolvedValue('hashedPassword123');
      generateToken.mockReturnValue('access_token');
      generateRefreshToken.mockReturnValue('refresh_token');

      // Act
      const result = await authService.register(validUserData);

      // Assert
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: validUserData.email }
      });
      expect(hashPassword).toHaveBeenCalledWith(validUserData.password);
      expect(mockPrisma.user.create).toHaveBeenCalled();
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(validUserData.email);
    });

    it('يجب أن يرفض تسجيل مستخدم بريد إلكتروني مكرر', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue({
        id: '1',
        email: validUserData.email
      });

      // Act & Assert
      await expect(authService.register(validUserData))
        .rejects
        .toThrow('البريد الإلكتروني مستخدم مسبقاً');

      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('يجب أن يستخدم دور REGULAR افتراضياً', async () => {
      // Arrange
      const userDataWithoutRole = { ...validUserData };
      delete userDataWithoutRole.role;

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: '1',
        email: validUserData.email,
        role: 'REGULAR',
        isActive: true,
        createdAt: new Date()
      });
      hashPassword.mockResolvedValue('hashedPassword123');
      generateToken.mockReturnValue('access_token');
      generateRefreshToken.mockReturnValue('refresh_token');

      // Act
      await authService.register(userDataWithoutRole);

      // Assert
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            role: 'REGULAR'
          })
        })
      );
    });

    it('يجب أن يشفر كلمة المرور قبل الحفظ', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: '1',
        email: validUserData.email,
        isActive: true,
        createdAt: new Date()
      });
      hashPassword.mockResolvedValue('hashedPassword123');
      generateToken.mockReturnValue('access_token');
      generateRefreshToken.mockReturnValue('refresh_token');

      // Act
      await authService.register(validUserData);

      // Assert
      expect(hashPassword).toHaveBeenCalledWith(validUserData.password);
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            passwordHash: 'hashedPassword123'
          })
        })
      );
    });

    it('يجب أن ينشئ توكنات للمستخدم الجديد', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: '123',
        email: validUserData.email,
        role: 'REGULAR',
        isActive: true,
        createdAt: new Date()
      });
      hashPassword.mockResolvedValue('hashedPassword123');
      generateToken.mockReturnValue('access_token');
      generateRefreshToken.mockReturnValue('refresh_token');

      // Act
      const result = await authService.register(validUserData);

      // Assert
      expect(generateToken).toHaveBeenCalledWith({
        userId: '123',
        role: 'REGULAR'
      });
      expect(generateRefreshToken).toHaveBeenCalledWith({ userId: '123' });
      expect(result.token).toBe('access_token');
      expect(result.refreshToken).toBe('refresh_token');
    });
  });

  // ==========================================
  // اختبارات تسجيل الدخول (Login)
  // ==========================================
  describe('login()', () => {
    const testEmail = 'test@example.com';
    const testPassword = 'SecurePass123!';

    it('يجب أن ينجح تسجيل الدخول ببيانات صحيحة', async () => {
      // Arrange
      const mockUser = {
        id: '1',
        email: testEmail,
        passwordHash: 'hashedPassword123',
        firstName: 'أحمد',
        lastName: 'محمد',
        role: 'REGULAR',
        isActive: true
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      comparePassword.mockResolvedValue(true);
      generateToken.mockReturnValue('access_token');
      generateRefreshToken.mockReturnValue('refresh_token');

      // Act
      const result = await authService.login(testEmail, testPassword);

      // Assert
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: testEmail }
      });
      expect(comparePassword).toHaveBeenCalledWith(testPassword, mockUser.passwordHash);
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('يجب أن يرفض تسجيل الدخول لمستخدم غير موجود', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.login(testEmail, testPassword))
        .rejects
        .toThrow('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    });

    it('يجب أن يرفض تسجيل الدخول لحساب غير مفعل', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue({
        id: '1',
        email: testEmail,
        isActive: false,
        passwordHash: 'hashedPassword123'
      });

      // Act & Assert
      await expect(authService.login(testEmail, testPassword))
        .rejects
        .toThrow('الحساب غير مفعل');
    });

    it('يجب أن يرفض تسجيل الدخول بكلمة مرور خاطئة', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue({
        id: '1',
        email: testEmail,
        passwordHash: 'hashedPassword123',
        isActive: true
      });
      comparePassword.mockResolvedValue(false);

      // Act & Assert
      await expect(authService.login(testEmail, testPassword))
        .rejects
        .toThrow('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    });

    it('يجب أن يزيل كلمة المرور من النتيجة', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue({
        id: '1',
        email: testEmail,
        passwordHash: 'hashedPassword123',
        isActive: true,
        role: 'REGULAR'
      });
      comparePassword.mockResolvedValue(true);
      generateToken.mockReturnValue('access_token');
      generateRefreshToken.mockReturnValue('refresh_token');

      // Act
      const result = await authService.login(testEmail, testPassword);

      // Assert
      expect(result.user).not.toHaveProperty('passwordHash');
    });
  });

  // ==========================================
  // اختبارات الحصول على المستخدم الحالي
  // ==========================================
  describe('getCurrentUser()', () => {
    it('يجب أن يرجع بيانات المستخدم بنجاح', async () => {
      // Arrange
      const userId = '123';
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        firstName: 'أحمد',
        lastName: 'محمد',
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

    it('يجب أن يرمي خطأ لمستخدم غير موجود', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.getCurrentUser('999'))
        .rejects
        .toThrow('المستخدم غير موجود');
    });
  });

  // ==========================================
  // اختبارات تحديث الملف الشخصي
  // ==========================================
  describe('updateProfile()', () => {
    it('يجب أن يحدث بيانات المستخدم بنجاح', async () => {
      // Arrange
      const userId = '123';
      const updateData = {
        firstName: 'أحمد',
        lastName: 'علي',
        phoneNumber: '+966501234567'
      };

      mockPrisma.user.update.mockResolvedValue({
        id: userId,
        ...updateData,
        email: 'test@example.com',
        role: 'REGULAR',
        updatedAt: new Date()
      });

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
      expect(result.firstName).toBe(updateData.firstName);
    });

    it('يجب أن يتجاهل الحقول غير المحددة', async () => {
      // Arrange
      const userId = '123';
      const updateData = { firstName: 'أحمد' };

      mockPrisma.user.update.mockResolvedValue({
        id: userId,
        firstName: 'أحمد',
        email: 'test@example.com',
        role: 'REGULAR'
      });

      // Act
      await authService.updateProfile(userId, updateData);

      // Assert
      const updateCall = mockPrisma.user.update.mock.calls[0][0];
      expect(updateCall.data.firstName).toBe('أحمد');
      expect(updateCall.data.lastName).toBeUndefined();
      expect(updateCall.data.phoneNumber).toBeUndefined();
    });
  });

  // ==========================================
  // اختبارات تغيير كلمة المرور
  // ==========================================
  describe('changePassword()', () => {
    it('يجب أن يغير كلمة المرور بنجاح', async () => {
      // Arrange
      const userId = '123';
      const currentPassword = 'OldPass123!';
      const newPassword = 'NewPass456!';

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        email: 'test@example.com',
        passwordHash: 'oldHashedPassword'
      });
      comparePassword.mockResolvedValue(true);
      hashPassword.mockResolvedValue('newHashedPassword');
      mockPrisma.user.update.mockResolvedValue({});

      // Act
      await authService.changePassword(userId, currentPassword, newPassword);

      // Assert
      expect(comparePassword).toHaveBeenCalledWith(currentPassword, 'oldHashedPassword');
      expect(hashPassword).toHaveBeenCalledWith(newPassword);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { passwordHash: 'newHashedPassword' }
      });
    });

    it('يجب أن يرفض تغيير كلمة المرور لمستخدم غير موجود', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.changePassword('999', 'old', 'new'))
        .rejects
        .toThrow('المستخدم غير موجود');
    });

    it('يجب أن يرفض تغيير كلمة المرور بكلمة مرور حالية خاطئة', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue({
        id: '123',
        passwordHash: 'hashedPassword'
      });
      comparePassword.mockResolvedValue(false);

      // Act & Assert
      await expect(authService.changePassword('123', 'wrongPassword', 'newPassword'))
        .rejects
        .toThrow('كلمة المرور الحالية غير صحيحة');

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });
  });
});

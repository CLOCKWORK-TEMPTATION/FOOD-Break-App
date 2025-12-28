/**
 * اختبارات خدمة المصادقة (AuthService)
 * Unit Tests لخدمة إدارة المستخدمين والمصادقة
 */

const authService = require('../authService');
const { PrismaClient } = require('@prisma/client');

// Mock Prisma Client
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

// Mock dependencies
jest.mock('../../utils/password', () => ({
  hashPassword: jest.fn(() => Promise.resolve('hashed_password_123')),
  comparePassword: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('../../utils/jwt', () => ({
  generateToken: jest.fn(() => 'mock_jwt_token'),
  generateRefreshToken: jest.fn(() => 'mock_refresh_token'),
}));

jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

const prisma = new PrismaClient();
const { hashPassword, comparePassword } = require('../../utils/password');

describe('AuthService - اختبارات خدمة المصادقة', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('register - تسجيل مستخدم جديد', () => {
    const mockUserData = {
      email: 'test@example.com',
      password: 'SecurePass123',
      firstName: 'محمد',
      lastName: 'أحمد',
      phoneNumber: '+201234567890',
      role: 'REGULAR',
    };

    it('يجب أن يسجل مستخدم جديد بنجاح', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'user_123',
        email: mockUserData.email,
        firstName: mockUserData.firstName,
        lastName: mockUserData.lastName,
        role: mockUserData.role,
        isActive: true,
        createdAt: new Date(),
      });

      const result = await authService.register(mockUserData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token', 'mock_jwt_token');
      expect(result).toHaveProperty('refreshToken', 'mock_refresh_token');
      expect(prisma.user.create).toHaveBeenCalled();
      expect(hashPassword).toHaveBeenCalledWith(mockUserData.password);
    });

    it('يجب أن يرفض تسجيل بريد إلكتروني موجود مسبقاً', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'existing_user',
        email: mockUserData.email,
      });

      await expect(authService.register(mockUserData)).rejects.toThrow(
        'البريد الإلكتروني مستخدم مسبقاً'
      );

      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('يجب أن يستخدم الدور الافتراضي REGULAR إذا لم يُحدد', async () => {
      const dataWithoutRole = { ...mockUserData };
      delete dataWithoutRole.role;

      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'user_123',
        email: dataWithoutRole.email,
        role: 'REGULAR',
      });

      await authService.register(dataWithoutRole);

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'REGULAR',
        })
      );
    });

    it('يجب أن يعالج أخطاء قاعدة البيانات', async () => {
      prisma.user.findUnique.mockRejectedValue(
        new Error('Database connection error')
      );

      await expect(authService.register(mockUserData)).rejects.toThrow();
    });
  });

  describe('login - تسجيل الدخول', () => {
    const mockEmail = 'test@example.com';
    const mockPassword = 'SecurePass123';

    const mockUser = {
      id: 'user_123',
      email: mockEmail,
      firstName: 'محمد',
      lastName: 'أحمد',
      passwordHash: 'hashed_password_123',
      role: 'REGULAR',
      isActive: true,
    };

    it('يجب أن يسجل الدخول بنجاح ببيانات صحيحة', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      comparePassword.mockResolvedValue(true);

      const result = await authService.login(mockEmail, mockPassword);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token', 'mock_jwt_token');
      expect(result).toHaveProperty('refreshToken', 'mock_refresh_token');
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('يجب أن يرفض تسجيل الدخول بمستخدم غير موجود', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.login(mockEmail, mockPassword)).rejects.toThrow(
        'البريد الإلكتروني أو كلمة المرور غير صحيحة'
      );
    });

    it('يجب أن يرفض تسجيل الدخول بحساب غير مفعل', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      prisma.user.findUnique.mockResolvedValue(inactiveUser);

      await expect(authService.login(mockEmail, mockPassword)).rejects.toThrow(
        'الحساب غير مفعل'
      );
    });

    it('يجب أن يرفض تسجيل الدخول بكلمة مرور خاطئة', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      comparePassword.mockResolvedValue(false);

      await expect(authService.login(mockEmail, mockPassword)).rejects.toThrow(
        'البريد الإلكتروني أو كلمة المرور غير صحيحة'
      );
    });

    it('يجب أن يتحقق من كلمة المرور المشفرة', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      comparePassword.mockResolvedValue(true);

      await authService.login(mockEmail, mockPassword);

      expect(comparePassword).toHaveBeenCalledWith(
        mockPassword,
        mockUser.passwordHash
      );
    });
  });

  describe('getCurrentUser - الحصول على بيانات المستخدم', () => {
    const mockUserId = 'user_123';

    it('يجب أن يرجع بيانات المستخدم بدون كلمة المرور', async () => {
      const mockUser = {
        id: mockUserId,
        email: 'test@example.com',
        firstName: 'محمد',
        lastName: 'أحمد',
        phoneNumber: '+201234567890',
        role: 'REGULAR',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await authService.getCurrentUser(mockUserId);

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
        select: expect.objectContaining({
          id: true,
          email: true,
          firstName: true,
          // لا يحتوي على passwordHash
        }),
      });
    });

    it('يجب أن يرمي خطأ إذا لم يكن المستخدم موجوداً', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.getCurrentUser(mockUserId)).rejects.toThrow(
        'المستخدم غير موجود'
      );
    });
  });

  describe('updateProfile - تحديث الملف الشخصي', () => {
    const mockUserId = 'user_123';
    const updateData = {
      firstName: 'أحمد جديد',
      lastName: 'محمد جديد',
      phoneNumber: '+201987654321',
    };

    it('يجب أن يحدث البيانات المحددة فقط', async () => {
      const updatedUser = {
        id: mockUserId,
        email: 'test@example.com',
        ...updateData,
        role: 'REGULAR',
        updatedAt: new Date(),
      };

      prisma.user.update.mockResolvedValue(updatedUser);

      const result = await authService.updateProfile(mockUserId, updateData);

      expect(result).toEqual(updatedUser);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: {
          firstName: updateData.firstName,
          lastName: updateData.lastName,
          phoneNumber: updateData.phoneNumber,
        },
        select: expect.any(Object),
      });
    });

    it('يجب أن يحدث الاسم الأول فقط', async () => {
      const partialData = { firstName: 'اسم جديد' };
      prisma.user.update.mockResolvedValue({
        id: mockUserId,
        firstName: 'اسم جديد',
      });

      await authService.updateProfile(mockUserId, partialData);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: expect.objectContaining({
          firstName: 'اسم جديد',
        }),
        select: expect.any(Object),
      });
    });

    it('يجب أن يعالج أخطاء التحديث', async () => {
      prisma.user.update.mockRejectedValue(
        new Error('Update failed')
      );

      await expect(
        authService.updateProfile(mockUserId, updateData)
      ).rejects.toThrow();
    });
  });

  describe('changePassword - تغيير كلمة المرور', () => {
    const mockUserId = 'user_123';
    const currentPassword = 'OldPass123';
    const newPassword = 'NewPass456';

    const mockUser = {
      id: mockUserId,
      email: 'test@example.com',
      passwordHash: 'old_hashed_password',
    };

    it('يجب أن يغير كلمة المرور بنجاح', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      comparePassword.mockResolvedValue(true);

      await authService.changePassword(mockUserId, currentPassword, newPassword);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: { passwordHash: 'hashed_password_123' },
      });
    });

    it('يجب أن يرفض كلمة المرور الحالية الخاطئة', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      comparePassword.mockResolvedValue(false);

      await expect(
        authService.changePassword(mockUserId, 'wrongPassword', newPassword)
      ).rejects.toThrow('كلمة المرور الحالية غير صحيحة');

      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('يجب أن يرفض إذا لم يكن المستخدم موجوداً', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        authService.changePassword(mockUserId, currentPassword, newPassword)
      ).rejects.toThrow('المستخدم غير موجود');
    });

    it('يجب أن يشفر كلمة المرور الجديدة', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      comparePassword.mockResolvedValue(true);

      await authService.changePassword(mockUserId, currentPassword, newPassword);

      expect(hashPassword).toHaveBeenCalledWith(newPassword);
    });
  });

  describe('معالجة الأخطاء العامة', () => {
    it('يجب أن يسجل الأخطاء في الـ logger', async () => {
      const logger = require('../../utils/logger');
      prisma.user.findUnique.mockRejectedValue(
        new Error('Database error')
      );

      try {
        await authService.login('test@example.com', 'password');
      } catch (error) {
        // Error expected
      }

      expect(logger.error).toHaveBeenCalled();
    });
  });
});

/**
 * اختبارات middleware المصادقة والتفويض
 * Unit Tests لـ Auth Middleware
 */

const authMiddleware = require('../auth');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

// Mock dependencies
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    user: {
      findUnique: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

const prisma = new PrismaClient();

describe('Auth Middleware - اختبارات المصادقة', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      headers: {},
    };

    mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(() => mockRes),
    };

    mockNext = jest.fn();
  });

  describe('authenticateToken - التحقق من صحة JWT', () => {
    const mockValidToken = 'valid_jwt_token';
    const mockDecodedToken = { userId: 'user_123', role: 'REGULAR' };

    const mockUser = {
      id: 'user_123',
      email: 'test@example.com',
      firstName: 'محمد',
      lastName: 'أحمد',
      role: 'REGULAR',
      isActive: true,
    };

    it('يجب أن يصادق على التوكن الصحيح ويضيف المستخدم للطلب', async () => {
      mockReq.headers.authorization = `Bearer ${mockValidToken}`;

      jwt.verify = jest.fn().mockReturnValue(mockDecodedToken);
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await authMiddleware.authenticateToken(mockReq, mockRes, mockNext);

      expect(mockReq.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('يجب أن يقبل Authorization header بأحرف كبيرة', async () => {
      mockReq.headers.Authorization = `Bearer ${mockValidToken}`;

      jwt.verify = jest.fn().mockReturnValue(mockDecodedToken);
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await authMiddleware.authenticateToken(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('يجب أن يرفض الطلب بدون توكن', async () => {
      await authMiddleware.authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'رجاءً قم بتسجيل الدخول أولاً',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('يجب أن يرفض التوكن المشوّه', async () => {
      mockReq.headers.authorization = 'InvalidToken';

      await authMiddleware.authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('يجب أن يرفض التوكن غير الصحيح (JsonWebTokenError)', async () => {
      mockReq.headers.authorization = `Bearer ${mockValidToken}`;

      jwt.verify = jest.fn(() => {
        const error = new Error('Invalid token');
        error.name = 'JsonWebTokenError';
        throw error;
      });

      await authMiddleware.authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'التوكن غير صحيح',
      });
    });

    it('يجب أن يرفض التوكن المنتهي (TokenExpiredError)', async () => {
      mockReq.headers.authorization = `Bearer ${mockValidToken}`;

      jwt.verify = jest.fn(() => {
        const error = new Error('Token expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      await authMiddleware.authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'انتهت صلاحية التوكن',
      });
    });

    it('يجب أن يرفض المستخدم غير الموجود', async () => {
      mockReq.headers.authorization = `Bearer ${mockValidToken}`;

      jwt.verify = jest.fn().mockReturnValue(mockDecodedToken);
      prisma.user.findUnique.mockResolvedValue(null);

      await authMiddleware.authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'المستخدم غير موجود',
      });
    });

    it('يجب أن يرفض المستخدم غير المفعل', async () => {
      mockReq.headers.authorization = `Bearer ${mockValidToken}`;

      jwt.verify = jest.fn().mockReturnValue(mockDecodedToken);
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      await authMiddleware.authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'حساب المستخدم معطل',
      });
    });

    it('يجب أن يسجل تحذيراً عند فشل التحقق', async () => {
      const logger = require('../../utils/logger');

      mockReq.headers.authorization = `Bearer ${mockValidToken}`;

      jwt.verify = jest.fn(() => {
        const error = new Error('Invalid token');
        error.name = 'JsonWebTokenError';
        throw error;
      });

      await authMiddleware.authenticateToken(mockReq, mockRes, mockNext);

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('فشل التحقق من التوكن')
      );
    });
  });

  describe('authorizeRoles - التحقق من الصلاحيات', () => {
    beforeEach(() => {
      mockReq.user = { ...mockUser };
    });

    it('يجب أن يسمح بالمرور للمستخدم ذي الصلاحية', () => {
      const middleware = authMiddleware.authorizeRoles('ADMIN', 'MANAGER');

      mockReq.user.role = 'ADMIN';

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('يجب أن يقبل الأدوار كنصوص', () => {
      const middleware = authMiddleware.authorizeRoles(123, 456);

      mockReq.user.role = '123';

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('يجب أن يرفض المستخدم بدون صلاحية', () => {
      const middleware = authMiddleware.authorizeRoles('ADMIN', 'MANAGER');

      mockReq.user.role = 'REGULAR';

      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'غير مصرح لك بالوصول إلى هذا المورد',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('يجب أن يرفض المستخدم غير المصادق عليه', () => {
      const middleware = authMiddleware.authorizeRoles('ADMIN');

      delete mockReq.user;

      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'رجاءً قم بتسجيل الدخول أولاً',
      });
    });

    it('يجب أن يعمل مع دور واحد', () => {
      const middleware = authMiddleware.authorizeRoles('ADMIN');

      mockReq.user.role = 'ADMIN';

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('يجب أن يعمل مع عدة أدوار', () => {
      const middleware = authMiddleware.authorizeRoles('ADMIN', 'PRODUCER', 'VIP');

      mockReq.user.role = 'PRODUCER';

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('Middlewares جاهزة للأدوار المحددة', () => {
    beforeEach(() => {
      mockReq.user = { ...mockUser };
    });

    it('requireAdmin يجب أن يرفض غير الأدمن', () => {
      mockReq.user.role = 'REGULAR';

      authMiddleware.requireAdmin(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    it('requireAdmin يجب أن يقبل الأدمن', () => {
      mockReq.user.role = 'ADMIN';

      authMiddleware.requireAdmin(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('requireProducer يجب أن يقبل المنتج والأدمن', () => {
      mockReq.user.role = 'PRODUCER';

      authMiddleware.requireProducer(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('requireProducer يجب أن يرفض المستخدم العادي', () => {
      mockReq.user.role = 'REGULAR';

      authMiddleware.requireProducer(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    it('requireAdminOrProducer يجب أن يقبل الأدمن', () => {
      mockReq.user.role = 'ADMIN';

      authMiddleware.requireAdminOrProducer(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('requireAdminOrProducer يجب أن يقبل المنتج', () => {
      mockReq.user.role = 'PRODUCER';

      authMiddleware.requireAdminOrProducer(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('vipOnly يجب أن يقبل VIP', () => {
      mockReq.user.role = 'VIP';

      authMiddleware.vipOnly(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('vipOnly يجب أن يرفض المستخدم العادي', () => {
      mockReq.user.role = 'REGULAR';

      authMiddleware.vipOnly(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });
  });

  describe('Aliases للتوافق', () => {
    it('يجب أن يكون auth هو نفسه authenticateToken', () => {
      expect(authMiddleware.auth).toBe(authMiddleware.authenticateToken);
    });

    it('يجب أن يكون producer هو نفسه requireProducer', () => {
      expect(authMiddleware.producer).toBe(authMiddleware.requireProducer);
    });

    it('يجب أن يكون admin هو نفسه requireAdmin', () => {
      expect(authMiddleware.admin).toBe(authMiddleware.requireAdmin);
    });
  });
});

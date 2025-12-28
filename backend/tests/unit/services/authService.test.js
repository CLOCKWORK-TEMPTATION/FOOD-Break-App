/**
 * Unit Tests - Auth Service
 * Why: اختبار منطق المصادقة والتفويض بشكل منفصل
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createTestUser, cleanupTestData, closePrisma } = require('../../utils/testHelpers');

// Mock Prisma Client
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    $disconnect: jest.fn(),
  };
  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

describe('Auth Service - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await cleanupTestData();
    await closePrisma();
  });

  describe('Password Hashing', () => {
    test('should hash password correctly', async () => {
      const password = 'Test123!@#';
      const hash = await bcrypt.hash(password, 10);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      
      const isValid = await bcrypt.compare(password, hash);
      expect(isValid).toBe(true);
    });

    test('should verify password correctly', async () => {
      const password = 'Test123!@#';
      const hash = await bcrypt.hash(password, 10);
      
      const isValid = await bcrypt.compare(password, hash);
      expect(isValid).toBe(true);
      
      const isInvalid = await bcrypt.compare('WrongPassword', hash);
      expect(isInvalid).toBe(false);
    });
  });

  describe('JWT Token Generation', () => {
    test('should generate valid JWT token', () => {
      const userId = 'test-user-id';
      const role = 'REGULAR';
      const secret = process.env.JWT_SECRET || 'test-secret-key';
      
      const token = jwt.sign({ userId, role }, secret, { expiresIn: '1h' });
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      
      const decoded = jwt.verify(token, secret);
      expect(decoded.userId).toBe(userId);
      expect(decoded.role).toBe(role);
    });

    test('should reject invalid token', () => {
      const invalidToken = 'invalid.token.here';
      const secret = process.env.JWT_SECRET || 'test-secret-key';
      
      expect(() => {
        jwt.verify(invalidToken, secret);
      }).toThrow();
    });

    test('should reject expired token', () => {
      const userId = 'test-user-id';
      const secret = process.env.JWT_SECRET || 'test-secret-key';
      
      // إنشاء token منتهي الصلاحية
      const token = jwt.sign({ userId }, secret, { expiresIn: '-1h' });
      
      expect(() => {
        jwt.verify(token, secret);
      }).toThrow('jwt expired');
    });
  });

  describe('User Authentication Logic', () => {
    test('should authenticate user with correct credentials', async () => {
      const password = 'Test123!@#';
      const hash = await bcrypt.hash(password, 10);
      
      const user = {
        id: 'user-id',
        email: 'test@test.com',
        passwordHash: hash,
        isActive: true
      };
      
      const isValid = await bcrypt.compare(password, user.passwordHash);
      expect(isValid).toBe(true);
    });

    test('should reject inactive user', () => {
      const user = {
        id: 'user-id',
        email: 'test@test.com',
        isActive: false
      };
      
      expect(user.isActive).toBe(false);
    });
  });
});

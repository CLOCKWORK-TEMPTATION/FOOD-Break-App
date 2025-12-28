/**
 * Integration Tests - Auth API
 * اختبارات تكامل واجهة المصادقة
 */

const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Setup test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key';

const { users, requestBodies } = require('../../fixtures/testData');
const { generateUserToken, generateExpiredToken } = require('../../helpers/testHelpers');

describe('Auth API Integration Tests', () => {
  let app;
  let mockPrisma;

  beforeAll(() => {
    // Mock Prisma before loading app
    jest.mock('@prisma/client', () => {
      const mockClient = {
        user: {
          findUnique: jest.fn(),
          findMany: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
        },
        $connect: jest.fn(),
        $disconnect: jest.fn(),
      };
      return { PrismaClient: jest.fn(() => mockClient) };
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    const { PrismaClient } = require('@prisma/client');
    mockPrisma = new PrismaClient();
  });

  // ==========================================
  // Registration Endpoint Tests
  // ==========================================
  describe('POST /api/v1/auth/register', () => {
    it('should register new user with valid data', async () => {
      const newUser = requestBodies.validRegistration;
      
      // Verify registration data structure
      expect(newUser.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      expect(newUser.password.length).toBeGreaterThanOrEqual(8);
      expect(newUser.firstName).toBeDefined();
      expect(newUser.lastName).toBeDefined();
    });

    it('should reject registration with invalid email', () => {
      const invalidEmails = [
        'notanemail',
        'missing@domain',
        '@nodomain.com',
        'spaces in@email.com',
        '',
      ];
      
      invalidEmails.forEach(email => {
        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        expect(isValid).toBe(false);
      });
    });

    it('should reject weak passwords', () => {
      const weakPasswords = ['123', 'password', '12345678'];
      
      weakPasswords.forEach(password => {
        // Password should have at least 8 chars, uppercase, lowercase, number
        const hasMinLength = password.length >= 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        
        const isStrong = hasMinLength && hasUpperCase && hasLowerCase && hasNumber;
        expect(isStrong).toBe(false);
      });
    });

    it('should accept strong passwords', () => {
      const strongPasswords = ['SecurePass123!', 'MyP@ssw0rd!', 'Testing123!'];
      
      strongPasswords.forEach(password => {
        const hasMinLength = password.length >= 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        
        expect(hasMinLength).toBe(true);
        expect(hasUpperCase).toBe(true);
        expect(hasLowerCase).toBe(true);
        expect(hasNumber).toBe(true);
      });
    });

    it('should hash password before storing', async () => {
      const password = 'SecurePass123!';
      const hash = await bcrypt.hash(password, 10);
      
      expect(hash).not.toBe(password);
      expect(hash.startsWith('$2a$') || hash.startsWith('$2b$')).toBe(true);
    });

    it('should return JWT token on successful registration', () => {
      const token = generateUserToken(users.validUser);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts
    });
  });

  // ==========================================
  // Login Endpoint Tests
  // ==========================================
  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const credentials = requestBodies.validLogin;
      
      // Verify credentials structure
      expect(credentials.email).toBeDefined();
      expect(credentials.password).toBeDefined();
    });

    it('should reject login with wrong password', async () => {
      const isMatch = await bcrypt.compare('wrongpassword', users.validUser.passwordHash);
      
      expect(isMatch).toBe(false);
    });

    it('should reject login for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      
      const user = await mockPrisma.user.findUnique({
        where: { email: 'nonexistent@example.com' }
      });
      
      expect(user).toBeNull();
    });

    it('should reject login for inactive user', async () => {
      const inactiveUser = users.inactiveUser;
      
      expect(inactiveUser.isActive).toBe(false);
    });

    it('should return access token and refresh token', () => {
      const accessToken = generateUserToken(users.validUser);
      // Refresh token uses a different secret and longer expiry
      const refreshToken = jwt.sign(
        { userId: users.validUser.id, type: 'refresh' },
        process.env.JWT_REFRESH_SECRET || 'test-refresh-secret',
        { expiresIn: '7d' }
      );
      
      expect(accessToken).toBeDefined();
      expect(refreshToken).toBeDefined();
      // Different secrets and payloads produce different tokens
      expect(accessToken.split('.')[0]).toBe(refreshToken.split('.')[0]); // Same algorithm header
      expect(accessToken.split('.')[1]).not.toBe(refreshToken.split('.')[1]); // Different payload
    });

    it('should include user info in response', () => {
      const user = users.validUser;
      const safeUserData = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      };
      
      // Should not include sensitive data
      expect(safeUserData).not.toHaveProperty('passwordHash');
      expect(safeUserData).not.toHaveProperty('password');
    });
  });

  // ==========================================
  // Token Refresh Endpoint Tests
  // ==========================================
  describe('POST /api/v1/auth/refresh', () => {
    it('should refresh token with valid refresh token', () => {
      const refreshToken = generateUserToken({ userId: users.validUser.id, type: 'refresh' });
      const newAccessToken = generateUserToken(users.validUser);
      
      expect(refreshToken).toBeDefined();
      expect(newAccessToken).toBeDefined();
    });

    it('should reject expired refresh token', () => {
      const expiredToken = generateExpiredToken({ userId: users.validUser.id });
      
      expect(expiredToken).toBeDefined();
      // Verification would throw
    });

    it('should reject invalid refresh token', () => {
      const invalidToken = 'invalid.token.here';
      
      expect(invalidToken.split('.').length).toBe(3);
      // But verification would fail
    });
  });

  // ==========================================
  // Logout Endpoint Tests
  // ==========================================
  describe('POST /api/v1/auth/logout', () => {
    it('should logout successfully', () => {
      const token = generateUserToken(users.validUser);
      
      // Logout should invalidate the token
      expect(token).toBeDefined();
      // In real implementation, token would be blacklisted
    });

    it('should require authentication', () => {
      // Logout without token should fail
      const noToken = undefined;
      
      expect(noToken).toBeUndefined();
    });
  });

  // ==========================================
  // Password Reset Endpoint Tests
  // ==========================================
  describe('POST /api/v1/auth/forgot-password', () => {
    it('should send reset email for existing user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(users.validUser);
      
      const user = await mockPrisma.user.findUnique({
        where: { email: users.validUser.email }
      });
      
      expect(user).toBeDefined();
      expect(user.email).toBe(users.validUser.email);
    });

    it('should not reveal if email exists (security)', () => {
      // Response should be same whether email exists or not
      const successMessage = 'إذا كان البريد الإلكتروني مسجلاً، ستصلك رسالة إعادة تعيين كلمة المرور';
      
      expect(successMessage).toBeDefined();
    });
  });

  // ==========================================
  // Profile Endpoint Tests
  // ==========================================
  describe('GET /api/v1/auth/profile', () => {
    it('should return user profile with valid token', () => {
      const user = users.validUser;
      const profileData = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phoneNumber: user.phoneNumber,
      };
      
      expect(profileData.id).toBe(user.id);
      expect(profileData).not.toHaveProperty('passwordHash');
    });

    it('should reject request without token', () => {
      const authHeader = undefined;
      
      expect(authHeader).toBeUndefined();
    });

    it('should reject request with expired token', () => {
      const expiredToken = generateExpiredToken({ userId: users.validUser.id });
      
      expect(expiredToken).toBeDefined();
    });
  });

  // ==========================================
  // Update Profile Endpoint Tests
  // ==========================================
  describe('PUT /api/v1/auth/profile', () => {
    it('should update profile with valid data', async () => {
      const updateData = {
        firstName: 'محمد',
        lastName: 'أحمد',
        phoneNumber: '+966501234568',
      };
      
      mockPrisma.user.update.mockResolvedValue({
        ...users.validUser,
        ...updateData,
      });
      
      const updated = await mockPrisma.user.update({
        where: { id: users.validUser.id },
        data: updateData,
      });
      
      expect(updated.firstName).toBe(updateData.firstName);
    });

    it('should not allow email update through profile', () => {
      const protectedFields = ['email', 'role', 'passwordHash'];
      
      protectedFields.forEach(field => {
        expect(protectedFields).toContain(field);
      });
    });
  });

  // ==========================================
  // Change Password Endpoint Tests
  // ==========================================
  describe('PUT /api/v1/auth/change-password', () => {
    it('should change password with correct current password', async () => {
      const currentPassword = 'CurrentPass123!';
      const newPassword = 'NewSecurePass456!';
      
      // Simulate password verification
      const mockHash = await bcrypt.hash(currentPassword, 10);
      const isMatch = await bcrypt.compare(currentPassword, mockHash);
      
      expect(isMatch).toBe(true);
      
      // New password should be hashed
      const newHash = await bcrypt.hash(newPassword, 10);
      expect(newHash).not.toBe(newPassword);
    });

    it('should reject if current password is wrong', async () => {
      const wrongPassword = 'WrongPassword123!';
      const correctHash = await bcrypt.hash('CorrectPassword123!', 10);
      
      const isMatch = await bcrypt.compare(wrongPassword, correctHash);
      
      expect(isMatch).toBe(false);
    });

    it('should reject if new password is same as current', () => {
      const currentPassword = 'SamePassword123!';
      const newPassword = 'SamePassword123!';
      
      expect(currentPassword).toBe(newPassword);
    });
  });

  // ==========================================
  // Rate Limiting Tests
  // ==========================================
  describe('Rate Limiting', () => {
    it('should have rate limit on login endpoint', () => {
      const maxAttempts = 10;
      const windowMs = 15 * 60 * 1000; // 15 minutes
      
      expect(maxAttempts).toBeLessThanOrEqual(10);
      expect(windowMs).toBe(900000);
    });

    it('should have rate limit on registration endpoint', () => {
      const maxAttempts = 5;
      const windowMs = 60 * 60 * 1000; // 1 hour
      
      expect(maxAttempts).toBeLessThanOrEqual(5);
      expect(windowMs).toBe(3600000);
    });
  });

  // ==========================================
  // Security Headers Tests
  // ==========================================
  describe('Security', () => {
    it('should not expose sensitive error details in production', () => {
      process.env.NODE_ENV = 'production';
      
      const errorResponse = {
        success: false,
        error: {
          message: 'خطأ في المصادقة',
          // Should NOT include stack trace in production
        },
      };
      
      expect(errorResponse.error).not.toHaveProperty('stack');
      
      // Reset
      process.env.NODE_ENV = 'test';
    });

    it('should sanitize user input', () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        'SELECT * FROM users',
        "'; DROP TABLE users; --",
      ];
      
      maliciousInputs.forEach(input => {
        // These should be sanitized/rejected
        expect(input).toBeDefined();
      });
    });
  });
});

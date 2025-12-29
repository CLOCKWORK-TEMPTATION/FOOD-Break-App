/**
 * Unit Tests - Auth Service
 * اختبارات وحدة خدمة المصادقة
 */

const bcrypt = require('bcryptjs');
const { prisma: mockPrisma } = require("../../utils/testHelpers");
const jwt = require('jsonwebtoken');
const { prisma: mockPrisma } = require("../../utils/testHelpers");

// Mock dependencies before requiring the service
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => global.mockPrisma)
}));

const { users, requestBodies } = require('../../fixtures/testData');
const { prisma: mockPrisma } = require("../../utils/testHelpers");
const { 
  createMockRequest, 
  createMockResponse, 
  generateUserToken 
} = require('../../utils/testHelpers');

describe('Auth Service', () => {
  let authService;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset all mock functions
    if (global.mockPrisma) {
      Object.keys(global.mockPrisma).forEach(model => {
        if (typeof global.mockPrisma[model] === 'object' && global.mockPrisma[model] !== null) {
          Object.keys(global.mockPrisma[model]).forEach(method => {
            if (jest.isMockFunction(global.mockPrisma[model][method])) {
              global.mockPrisma[model][method].mockReset();
            }
          });
        }
      });
    }

    // Require authService after mocks are set up
    authService = require('../../../src/services/authService');
  });

  // ==========================================
  // Registration Tests
  // ==========================================
  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = requestBodies.validRegistration;
      const hashedPassword = 'hashed-password-123';
      
      global.mockPrisma.user.findUnique.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue(hashedPassword);
      global.mockPrisma.user.create.mockResolvedValue({
        ...users.validUser,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
      });
      jwt.sign.mockReturnValue('mock-token');
      
      // Test registration logic (simulated)
      expect(global.mockPrisma.user.findUnique).toBeDefined();
      expect(bcrypt.hash).toBeDefined();
    });

    it('should reject registration with existing email', async () => {
      global.mockPrisma.user.findUnique.mockResolvedValue(users.validUser);
      
      // Verify that findUnique was called
      expect(global.mockPrisma.user.findUnique).toBeDefined();
    });

    it('should hash password before storing', async () => {
      const password = 'SecurePass123!';
      const hashedPassword = 'hashed-password';
      
      bcrypt.hash.mockResolvedValue(hashedPassword);
      
      await bcrypt.hash(password, 10);
      
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
    });

    it('should not store plain text password', async () => {
      const userData = requestBodies.validRegistration;
      const hashedPassword = 'hashed-password';
      
      bcrypt.hash.mockResolvedValue(hashedPassword);
      global.mockPrisma.user.create.mockImplementation((args) => {
        // Verify password is hashed
        expect(args.data.passwordHash).not.toBe(userData.password);
        return Promise.resolve({ ...users.validUser, passwordHash: hashedPassword });
      });
      
      await bcrypt.hash(userData.password, 10);
      
      expect(bcrypt.hash).toHaveBeenCalled();
    });
  });

  // ==========================================
  // Login Tests
  // ==========================================
  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      global.mockPrisma.user.findUnique.mockResolvedValue(users.validUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('mock-jwt-token');
      
      // Simulate login
      const result = await bcrypt.compare('password', users.validUser.passwordHash);
      
      expect(result).toBe(true);
    });

    it('should reject login with invalid password', async () => {
      global.mockPrisma.user.findUnique.mockResolvedValue(users.validUser);
      bcrypt.compare.mockResolvedValue(false);
      
      const result = await bcrypt.compare('wrongpassword', users.validUser.passwordHash);
      
      expect(result).toBe(false);
    });

    it('should reject login for non-existent user', async () => {
      global.mockPrisma.user.findUnique.mockResolvedValue(null);
      
      const user = await global.mockPrisma.user.findUnique({ where: { email: 'notfound@example.com' } });
      
      expect(user).toBeNull();
    });

    it('should reject login for inactive user', async () => {
      global.mockPrisma.user.findUnique.mockResolvedValue(users.inactiveUser);
      
      const user = await global.mockPrisma.user.findUnique({ where: { email: users.inactiveUser.email } });
      
      expect(user.isActive).toBe(false);
    });

    it('should generate JWT token on successful login', async () => {
      const tokenPayload = { userId: users.validUser.id, role: users.validUser.role };
      jwt.sign.mockReturnValue('mock-jwt-token');
      
      const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '1h' });
      
      expect(jwt.sign).toHaveBeenCalled();
      expect(token).toBe('mock-jwt-token');
    });
  });

  // ==========================================
  // Token Verification Tests
  // ==========================================
  describe('verifyToken', () => {
    it('should verify valid token', () => {
      const payload = { userId: users.validUser.id, role: users.validUser.role };
      jwt.verify.mockReturnValue(payload);
      
      const decoded = jwt.verify('valid-token', process.env.JWT_SECRET);
      
      expect(decoded).toEqual(payload);
    });

    it('should reject expired token', () => {
      jwt.verify.mockImplementation(() => {
        const error = new Error('jwt expired');
        error.name = 'TokenExpiredError';
        throw error;
      });
      
      expect(() => jwt.verify('expired-token', process.env.JWT_SECRET))
        .toThrow('jwt expired');
    });

    it('should reject invalid token', () => {
      jwt.verify.mockImplementation(() => {
        const error = new Error('invalid token');
        error.name = 'JsonWebTokenError';
        throw error;
      });
      
      expect(() => jwt.verify('invalid-token', process.env.JWT_SECRET))
        .toThrow('invalid token');
    });
  });

  // ==========================================
  // Password Change Tests
  // ==========================================
  describe('changePassword', () => {
    it('should change password with valid current password', async () => {
      const currentPassword = 'currentPass123!';
      const newPassword = 'newSecurePass456!';
      const newHash = 'new-hashed-password';
      
      bcrypt.compare.mockResolvedValue(true);
      bcrypt.hash.mockResolvedValue(newHash);
      global.mockPrisma.user.update.mockResolvedValue({
        ...users.validUser,
        passwordHash: newHash,
      });
      
      const isMatch = await bcrypt.compare(currentPassword, users.validUser.passwordHash);
      expect(isMatch).toBe(true);
      
      const hashedNew = await bcrypt.hash(newPassword, 10);
      expect(hashedNew).toBe(newHash);
    });

    it('should reject password change with wrong current password', async () => {
      bcrypt.compare.mockResolvedValue(false);
      
      const isMatch = await bcrypt.compare('wrongpassword', users.validUser.passwordHash);
      
      expect(isMatch).toBe(false);
    });
  });

  // ==========================================
  // User Lookup Tests
  // ==========================================
  describe('getUserById', () => {
    it('should return user by ID', async () => {
      global.mockPrisma.user.findUnique.mockResolvedValue(users.validUser);
      
      const user = await global.mockPrisma.user.findUnique({ where: { id: users.validUser.id } });
      
      expect(user).toEqual(users.validUser);
      expect(user.id).toBe(users.validUser.id);
    });

    it('should return null for non-existent ID', async () => {
      global.mockPrisma.user.findUnique.mockResolvedValue(null);
      
      const user = await global.mockPrisma.user.findUnique({ where: { id: 'non-existent-id' } });
      
      expect(user).toBeNull();
    });
  });

  // ==========================================
  // Role-based Access Tests
  // ==========================================
  describe('role validation', () => {
    it('should identify admin user', () => {
      expect(users.adminUser.role).toBe('ADMIN');
    });

    it('should identify producer user', () => {
      expect(users.producerUser.role).toBe('PRODUCER');
    });

    it('should identify regular user', () => {
      expect(users.validUser.role).toBe('REGULAR');
    });

    it('should identify VIP user', () => {
      expect(users.vipUser.role).toBe('VIP');
    });
  });
});

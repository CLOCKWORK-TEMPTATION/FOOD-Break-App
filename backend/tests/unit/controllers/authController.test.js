const authController = require('../../../src/controllers/authController');
const authService = require('../../../src/services/authService');
const { validationResult } = require('express-validator');

jest.mock('../../../src/services/authService');
jest.mock('express-validator');

describe('Auth Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      user: { id: 'user-123' },
      t: jest.fn((key) => {
        const translations = {
          'auth.registerSuccess': 'تم التسجيل بنجاح',
          'auth.loginSuccess': 'تم تسجيل الدخول بنجاح',
          'validation.required': 'حقل مطلوب'
        };
        return translations[key] || key;
      })
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register user successfully', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true });
      authService.register.mockResolvedValue({ user: { id: '1' }, token: 'token' });

      await authController.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'تم التسجيل بنجاح',
        data: { user: { id: '1' }, token: 'token' }
      });
    });

    it('should return validation errors', async () => {
      validationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => [{ msg: 'Invalid email' }]
      });

      await authController.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'حقل مطلوب',
        errors: [{ msg: 'Invalid email' }]
      });
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true });
      req.body = { email: 'test@test.com', password: 'pass123' };
      authService.login.mockResolvedValue({ user: { id: '1' }, token: 'token' });

      await authController.login(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'تم تسجيل الدخول بنجاح',
        data: { user: { id: '1' }, token: 'token' }
      });
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user', async () => {
      authService.getCurrentUser.mockResolvedValue({ id: 'user-123', email: 'test@test.com' });

      await authController.getCurrentUser(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { id: 'user-123', email: 'test@test.com' }
      });
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true });
      req.body = { currentPassword: 'old', newPassword: 'new' };
      authService.changePassword.mockResolvedValue();

      await authController.changePassword(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'تم تغيير كلمة المرور بنجاح'
      });
    });
  });
});

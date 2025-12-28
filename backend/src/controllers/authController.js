const authService = require('../services/authService');
const { validationResult } = require('express-validator');

/**
 * Controller - تسجيل مستخدم جديد
 * POST /api/v1/auth/register
 */
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: req.__('validation.required'),
        errors: errors.array()
      });
    }

    const result = await authService.register(req.body);

    res.status(201).json({
      success: true,
      message: req.__('auth.registerSuccess'),
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller - تسجيل الدخول
 * POST /api/v1/auth/login
 */
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: req.__('validation.required'),
        errors: errors.array()
      });
    }

    const { email, password } = req.body;
    const result = await authService.login(email, password);

    res.json({
      success: true,
      message: req.__('auth.loginSuccess'),
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller - الحصول على المستخدم الحالي
 * GET /api/v1/auth/me
 */
const getCurrentUser = async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(req.user.id);

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller - تحديث الملف الشخصي
 * PUT /api/v1/auth/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const user = await authService.updateProfile(req.user.id, req.body);

    res.json({
      success: true,
      message: 'تم تحديث الملف الشخصي بنجاح',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller - تغيير كلمة المرور
 * POST /api/v1/auth/change-password
 */
const changePassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user.id, currentPassword, newPassword);

    res.json({
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller - تسجيل الخروج
 * POST /api/v1/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    // في حالة استخدام JWT، التوكن يتم حذفه من جهة العميل
    // يمكن إضافة blacklist للتوكنات إذا لزم الأمر
    
    res.json({
      success: true,
      message: 'تم تسجيل الخروج بنجاح'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  updateProfile,
  changePassword,
  logout
};

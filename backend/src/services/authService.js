const { PrismaClient } = require('@prisma/client');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken, generateRefreshToken } = require('../utils/jwt');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * خدمة المصادقة - تسجيل مستخدم جديد
 * @param {Object} userData - بيانات المستخدم
 * @returns {Promise<Object>} - المستخدم والتوكن
 */
const register = async (userData) => {
  try {
    const { email, password, firstName, lastName, phoneNumber, role = 'REGULAR' } = userData;

    // التحقق من وجود المستخدم مسبقاً
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new Error('البريد الإلكتروني مستخدم مسبقاً');
    }

    // تشفير كلمة المرور
    const passwordHash = await hashPassword(password);

    // إنشاء المستخدم
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        phoneNumber,
        role
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    // إنشاء التوكن
    const token = generateToken({ userId: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user.id });

    logger.info(`تم تسجيل مستخدم جديد: ${user.email}`);

    return {
      user,
      token,
      refreshToken
    };
  } catch (error) {
    logger.error(`خطأ في تسجيل مستخدم: ${error.message}`);
    throw error;
  }
};

/**
 * خدمة المصادقة - تسجيل الدخول
 * @param {string} email - البريد الإلكتروني
 * @param {string} password - كلمة المرور
 * @returns {Promise<Object>} - المستخدم والتوكن
 */
const login = async (email, password) => {
  try {
    // البحث عن المستخدم
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }

    // التحقق من الحساب المفعل
    if (!user.isActive) {
      throw new Error('الحساب غير مفعل');
    }

    // التحقق من كلمة المرور
    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }

    // إنشاء التوكن
    const token = generateToken({ userId: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user.id });

    // إزالة كلمة المرور من النتيجة
    const { passwordHash, ...userWithoutPassword } = user;

    logger.info(`تسجيل دخول ناجح: ${user.email}`);

    return {
      user: userWithoutPassword,
      token,
      refreshToken
    };
  } catch (error) {
    logger.error(`خطأ في تسجيل الدخول: ${error.message}`);
    throw error;
  }
};

/**
 * خدمة المصادقة - الحصول على بيانات المستخدم الحالي
 * @param {string} userId - معرف المستخدم
 * @returns {Promise<Object>} - بيانات المستخدم
 */
const getCurrentUser = async (userId) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      throw new Error('المستخدم غير موجود');
    }

    return user;
  } catch (error) {
    logger.error(`خطأ في الحصول على بيانات المستخدم: ${error.message}`);
    throw error;
  }
};

/**
 * خدمة المصادقة - تحديث بيانات المستخدم
 * @param {string} userId - معرف المستخدم
 * @param {Object} updateData - البيانات المحدثة
 * @returns {Promise<Object>} - المستخدم المحدث
 */
const updateProfile = async (userId, updateData) => {
  try {
    const { firstName, lastName, phoneNumber } = updateData;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phoneNumber && { phoneNumber })
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        role: true,
        updatedAt: true
      }
    });

    logger.info(`تم تحديث ملف المستخدم: ${user.email}`);

    return user;
  } catch (error) {
    logger.error(`خطأ في تحديث الملف الشخصي: ${error.message}`);
    throw error;
  }
};

/**
 * خدمة المصادقة - تغيير كلمة المرور
 * @param {string} userId - معرف المستخدم
 * @param {string} currentPassword - كلمة المرور الحالية
 * @param {string} newPassword - كلمة المرور الجديدة
 * @returns {Promise<void>}
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('المستخدم غير موجود');
    }

    // التحقق من كلمة المرور الحالية
    const isPasswordValid = await comparePassword(currentPassword, user.passwordHash);

    if (!isPasswordValid) {
      throw new Error('كلمة المرور الحالية غير صحيحة');
    }

    // تشفير كلمة المرور الجديدة
    const newPasswordHash = await hashPassword(newPassword);

    // تحديث كلمة المرور
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash }
    });

    logger.info(`تم تغيير كلمة المرور للمستخدم: ${user.email}`);
  } catch (error) {
    logger.error(`خطأ في تغيير كلمة المرور: ${error.message}`);
    throw error;
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  updateProfile,
  changePassword
};

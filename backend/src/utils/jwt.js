const jwt = require('jsonwebtoken');

/**
 * إنشاء JWT Token
 * @param {Object} payload - البيانات المراد تشفيرها
 * @param {string} expiresIn - مدة صلاحية التوكن
 * @returns {string} - JWT Token
 */
const generateToken = (payload, expiresIn = process.env.JWT_EXPIRES_IN || '7d') => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn
  });
};

/**
 * فك تشفير JWT Token
 * @param {string} token - التوكن
 * @returns {Object} - البيانات المفككة
 */
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * إنشاء Refresh Token
 * @param {Object} payload - البيانات
 * @returns {string} - Refresh Token
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  });
};

module.exports = {
  generateToken,
  verifyToken,
  generateRefreshToken
};

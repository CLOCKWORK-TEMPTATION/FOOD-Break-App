const bcrypt = require('bcryptjs');

/**
 * تشفير كلمة المرور
 * @param {string} password - كلمة المرور
 * @returns {Promise<string>} - كلمة المرور المشفرة
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * التحقق من كلمة المرور
 * @param {string} password - كلمة المرور المدخلة
 * @param {string} hashedPassword - كلمة المرور المشفرة
 * @returns {Promise<boolean>} - نتيجة المطابقة
 */
const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

module.exports = {
  hashPassword,
  comparePassword
};

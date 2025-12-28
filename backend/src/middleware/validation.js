const { validationResult } = require('express-validator');

/**
 * Middleware للتحقق من صحة البيانات باستخدام express-validator
 * @param {Object} req - طلب Express
 * @param {Object} res - استجابة Express
 * @param {Function} next - الوظيفة التالية
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const extractedErrors = errors.array().map(err => ({
      field: err.param,
      message: err.msg
    }));

    return res.status(400).json({
      success: false,
      errors: extractedErrors
    });
  }
  
  next();
};

module.exports = { validate };

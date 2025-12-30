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

const validateOrder = (req, res, next) => next();
const validateOrderStatus = (req, res, next) => next();
const validatePaymentRequest = (req, res, next) => next();
const validateRefundRequest = (req, res, next) => next();

/**
 * التحقق من صحة بيانات جدول التصوير
 * Validate shooting schedule data
 */
const validateScheduleData = (req, res, next) => {
  const { scheduleName, scheduleDate, callTime, breakSchedules } = req.body;

  // التحقق من البيانات المطلوبة
  if (!scheduleName || !scheduleDate || !callTime) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'البيانات المطلوبة مفقودة: اسم الجدول، تاريخ التصوير، ووقت الحضور',
        messageEn: 'Required fields missing: scheduleName, scheduleDate, callTime'
      }
    });
  }

  // التحقق من صيغة التاريخ
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(scheduleDate)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_DATE_FORMAT',
        message: 'صيغة التاريخ غير صحيحة. استخدم YYYY-MM-DD',
        messageEn: 'Invalid date format. Use YYYY-MM-DD'
      }
    });
  }

  // التحقق من صيغة الوقت
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(callTime)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_TIME_FORMAT',
        message: 'صيغة الوقت غير صحيحة. استخدم HH:MM',
        messageEn: 'Invalid time format. Use HH:MM'
      }
    });
  }

  // التحقق من جداول البريك إذا كانت موجودة
  if (breakSchedules && Array.isArray(breakSchedules)) {
    for (let i = 0; i < breakSchedules.length; i++) {
      const breakItem = breakSchedules[i];
      
      if (!breakItem.breakType || !breakItem.breakName || !breakItem.scheduledStart || !breakItem.scheduledEnd) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_BREAK_DATA',
            message: `بيانات البريك رقم ${i + 1} غير مكتملة`,
            messageEn: `Break ${i + 1} data is incomplete`
          }
        });
      }

      // التحقق من أوقات البريك
      if (!timeRegex.test(breakItem.scheduledStart) || !timeRegex.test(breakItem.scheduledEnd)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_BREAK_TIME',
            message: `أوقات البريك رقم ${i + 1} غير صحيحة`,
            messageEn: `Break ${i + 1} times are invalid`
          }
        });
      }

      // التحقق من أن وقت النهاية بعد وقت البداية
      const startTime = breakItem.scheduledStart.split(':').map(Number);
      const endTime = breakItem.scheduledEnd.split(':').map(Number);
      const startMinutes = startTime[0] * 60 + startTime[1];
      const endMinutes = endTime[0] * 60 + endTime[1];

      if (endMinutes <= startMinutes) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_BREAK_DURATION',
            message: `وقت انتهاء البريك رقم ${i + 1} يجب أن يكون بعد وقت البداية`,
            messageEn: `Break ${i + 1} end time must be after start time`
          }
        });
      }

      // التحقق من نوع البريك
      const validBreakTypes = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'TEA_BREAK', 'MEAL_BREAK'];
      if (!validBreakTypes.includes(breakItem.breakType)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_BREAK_TYPE',
            message: `نوع البريك رقم ${i + 1} غير صحيح`,
            messageEn: `Break ${i + 1} type is invalid`
          }
        });
      }
    }
  }

  next();
};

/**
 * التحقق من صحة بيانات البريك
 * Validate break data
 */
const validateBreakData = (req, res, next) => {
  const { breakType, breakName, scheduledStart, scheduledEnd } = req.body;

  if (!breakType || !breakName || !scheduledStart || !scheduledEnd) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'بيانات البريك غير مكتملة',
        messageEn: 'Break data is incomplete'
      }
    });
  }

  // التحقق من صيغة الوقت
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(scheduledStart) || !timeRegex.test(scheduledEnd)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_TIME_FORMAT',
        message: 'صيغة الوقت غير صحيحة. استخدم HH:MM',
        messageEn: 'Invalid time format. Use HH:MM'
      }
    });
  }

  // التحقق من نوع البريك
  const validBreakTypes = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'TEA_BREAK', 'MEAL_BREAK'];
  if (!validBreakTypes.includes(breakType)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_BREAK_TYPE',
        message: 'نوع البريك غير صحيح',
        messageEn: 'Invalid break type'
      }
    });
  }

  next();
};

module.exports = {
  validate,
  validateRequest: validate,
  validateOrder,
  validateOrderStatus,
  validatePaymentRequest,
  validateRefundRequest,
  validateScheduleData,
  validateBreakData
};

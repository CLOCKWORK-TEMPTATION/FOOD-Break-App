/**
 * Validation Utility Functions
 * دوال التحقق من البيانات
 */

/**
 * Validate required fields
 * التحقق من الحقول المطلوبة
 */
function validateRequired(data, requiredFields) {
  const missing = [];
  const errors = {};

  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      missing.push(field);
      errors[field] = `الحقل ${field} مطلوب`;
    }
  }

  return {
    isValid: missing.length === 0,
    missing,
    errors
  };
}

/**
 * Validate email format
 * التحقق من صيغة البريد الإلكتروني
 */
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(email);

  return {
    isValid,
    error: isValid ? null : 'صيغة البريد الإلكتروني غير صحيحة'
  };
}

/**
 * Validate phone number (Saudi format)
 * التحقق من رقم الهاتف (بالصيغة السعودية)
 */
function validatePhone(phone) {
  const phoneRegex = /^(?:\+966|00966|0)?5[0-9]{8}$/;
  const isValid = phoneRegex.test(phone);

  return {
    isValid,
    error: isValid ? null : 'رقم الهاتف يجب أن يكون بصيغة سعودية صحيحة (05xxxxxxxx)'
  };
}

/**
 * Validate password strength
 * التحقق من قوة كلمة المرور
 */
function validatePassword(password) {
  const errors = [];

  if (password.length < 8) {
    errors.push('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('كلمة المرور يجب أن تحتوي على رقم واحد على الأقل');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate Saudi National ID
 * التحقق من رقم الهوية السعودية
 */
function validateNationalId(id) {
  // Saudi ID is 10 digits
  const idRegex = /^[1-2][0-9]{9}$/;
  const isValid = idRegex.test(id);

  return {
    isValid,
    error: isValid ? null : 'رقم الهوية يجب أن يكون 10 أرقام ويبدأ بـ 1 أو 2'
  };
}

/**
 * Validate coordinates
 * التحقق من الإحداثيات الجغرافية
 */
function validateCoordinates(lat, lng) {
  const errors = [];

  if (typeof lat !== 'number' || lat < -90 || lat > 90) {
    errors.push('خط العرض (latitude) يجب أن يكون بين -90 و 90');
  }

  if (typeof lng !== 'number' || lng < -180 || lng > 180) {
    errors.push('خط الطول (longitude) يجب أن يكون بين -180 و 180');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate amount (positive number)
 * التحقق من المبلغ (رقم موجب)
 */
function validateAmount(amount) {
  const num = parseFloat(amount);

  return {
    isValid: !isNaN(num) && num > 0,
    error: isNaN(num) ? 'المبلغ يجب أن يكون رقماً' : (num <= 0 ? 'المبلغ يجب أن يكون رقماً موجباً' : null)
  };
}

/**
 * Validate date range
 * التحقق من نطاق التاريخ
 */
function validateDateRange(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  return {
    isValid: start <= end,
    error: start > end ? 'تاريخ البداية يجب أن يكون قبل تاريخ النهاية' : null
  };
}

/**
 * Validate URL
 * التحقق من صيغة الرابط
 */
function validateUrl(url) {
  try {
    new URL(url);
    return { isValid: true, error: null };
  } catch {
    return { isValid: false, error: 'صيغة الرابط غير صحيحة' };
  }
}

/**
 * Sanitize string input
 * تعقيم النصوص المدخلة
 */
function sanitizeString(input, maxLength = 1000) {
  if (typeof input !== 'string') {
    return { isValid: false, error: 'القيمة المدخلة يجب أن تكون نصاً', sanitized: '' };
  }

  const sanitized = input
    .trim()
    .replace(/[<>]/g, '') // Remove potential XSS
    .substring(0, maxLength);

  return {
    isValid: true,
    error: null,
    sanitized
  };
}

/**
 * Validate file upload
 * التحقق من الملف المرفوع
 */
function validateFile(file, allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'], maxSizeMB = 5) {
  const errors = [];

  if (!file) {
    return {
      isValid: false,
      errors: ['الملف مطلوب']
    };
  }

  if (!allowedTypes.includes(file.mimetype)) {
    errors.push(`نوع الملف غير مدعوم. الأنواع المدعومة: ${allowedTypes.join(', ')}`);
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    errors.push(`حجم الملف يجب أن يكون أقل من ${maxSizeMB} ميجابايت`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate Saudi postal code
 * التحقق من الرمز البريدي السعودي
 */
function validatePostalCode(code) {
  const postalCodeRegex = /^[0-9]{5}$/;
  const isValid = postalCodeRegex.test(code);

  return {
    isValid,
    error: isValid ? null : 'الرمز البريدي يجب أن يكون 5 أرقام'
  };
}

/**
 * Validate rating (1-5 stars)
 * التحقق من التقييم (1-5 نجوم)
 */
function validateRating(rating) {
  const num = parseFloat(rating);
  const isValid = !isNaN(num) && num >= 1 && num <= 5;

  return {
    isValid,
    error: isValid ? null : 'التقييم يجب أن يكون بين 1 و 5'
  };
}

/**
 * Validate order status
 * التحقق من حالة الطلب
 */
function validateOrderStatus(status) {
  const validStatuses = [
    'pending',
    'confirmed',
    'preparing',
    'ready',
    'picked_up',
    'delivered',
    'cancelled',
    'rejected'
  ];

  const isValid = validStatuses.includes(status);

  return {
    isValid,
    error: isValid ? null : `حالة الطلب يجب أن تكون إحدى: ${validStatuses.join(', ')}`
  };
}

/**
 * Validate payment method
 * التحقق من طريقة الدفع
 */
function validatePaymentMethod(method) {
  const validMethods = [
    'cash',
    'card',
    'apple_pay',
    'stc_pay',
    'mada'
  ];

  const isValid = validMethods.includes(method);

  return {
    isValid,
    error: isValid ? null : `طريقة الدفع يجب أن تكون إحدى: ${validMethods.join(', ')}`
  };
}

/**
 * Validate meal type
 * التحقق من نوع الوجبة
 */
function validateMealType(type) {
  const validTypes = [
    'breakfast',
    'lunch',
    'dinner',
    'snack'
  ];

  const isValid = validTypes.includes(type);

  return {
    isValid,
    error: isValid ? null : `نوع الوجبة يجب أن يكون إحدى: ${validTypes.join(', ')}`
  };
}

module.exports = {
  validateRequired,
  validateEmail,
  validatePhone,
  validatePassword,
  validateNationalId,
  validateCoordinates,
  validateAmount,
  validateDateRange,
  validateUrl,
  sanitizeString,
  validateFile,
  validatePostalCode,
  validateRating,
  validateOrderStatus,
  validatePaymentMethod,
  validateMealType
};

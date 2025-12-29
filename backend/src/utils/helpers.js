/**
 * Utility Helper Functions
 * دوال مساعدة متنوعة
 */

const crypto = require('crypto');

/**
 * Generate a unique transaction ID
 * توليد معاملة فريدة
 */
function generateTransactionId() {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(4).toString('hex');
  return `TXN-${timestamp}-${random}`.toUpperCase();
}

/**
 * Generate a unique order ID
 * توليد رقم طلب فريد
 */
function generateOrderId() {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(3).toString('hex');
  return `ORD-${timestamp}-${random}`.toUpperCase();
}

/**
 * Generate a unique reference code
 * توليد رمز مرجعي فريد
 */
function generateReferenceCode(prefix = 'REF') {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Format currency amount
 * تنسيق المبلغ المالي
 */
function formatCurrency(amount, currency = 'SAR') {
  return `${amount.toFixed(2)} ${currency}`;
}

/**
 * Calculate distance between two coordinates (in km)
 * حساب المسافة بين إحداثيتين
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Validate email format
 * التحقق من صيغة البريد الإلكتروني
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (Saudi format)
 * التحقق من رقم الهاتف (بالصيغة السعودية)
 */
function isValidPhone(phone) {
  const phoneRegex = /^(?:\+966|00966|0)?5[0-9]{8}$/;
  return phoneRegex.test(phone);
}

/**
 * Sanitize user input to prevent XSS
 * تعقيم مدخلات المستخدم لمنع XSS
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Parse pagination parameters
 * تحليل معاملات التصفح
 */
function parsePagination(page = 1, limit = 10) {
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
  const offset = (pageNum - 1) * limitNum;

  return {
    page: pageNum,
    limit: limitNum,
    offset
  };
}

/**
 * Format paginated response
 * تنسيق استجابة التصفح
 */
function formatPaginatedResponse(data, total, page, limit) {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
}

/**
 * Extract initials from name
 * استخراج الأحرف الأولى من الاسم
 */
function getInitials(name) {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2);
}

/**
 * Slugify a string (Arabic and English)
 * تحويل النص إلى صيغة URL
 */
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u0600-\u06FF\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

/**
 * Delay execution (for async operations)
 * تأخير التنفيذ
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 * إعادة محاولة دالة مع تراجع أسي
 */
async function retry(fn, maxRetries = 3, delayMs = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await delay(delayMs * Math.pow(2, i));
    }
  }
}

module.exports = {
  generateTransactionId,
  generateOrderId,
  generateReferenceCode,
  formatCurrency,
  calculateDistance,
  isValidEmail,
  isValidPhone,
  sanitizeInput,
  parsePagination,
  formatPaginatedResponse,
  getInitials,
  slugify,
  delay,
  retry
};

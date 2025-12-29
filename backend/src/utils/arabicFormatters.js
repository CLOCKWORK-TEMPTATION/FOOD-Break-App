/**
 * Arabic Formatters Utility
 * دوال تنسيق خاصة باللغة العربية
 */

/**
 * Convert numbers to Arabic numerals
 * تحويل الأرقام إلى الأرقام العربية
 */
function toArabicNumerals(num) {
  const arabicNums = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return num.toString().replace(/\d/g, x => arabicNums[x]);
}

/**
 * Format date in Arabic (Hijri or Gregorian)
 * تنسيق التاريخ بالعربية
 */
function formatDateArabic(date, format = 'gregorian') {
  const d = new Date(date);
  const months = {
    gregorian: [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ],
    hijri: [
      'محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني', 'جمادى الأولى', 'جمادى الآخرة',
      'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
    ]
  };

  if (format === 'hijri') {
    // Simplified Hijri conversion (use intl-date-hijri in production)
    return `${d.getDate()} ${months.hijri[d.getMonth()]} ${toArabicNumerals(d.getFullYear())}`;
  }

  return `${d.getDate()} ${months.gregorian[d.getMonth()]} ${toArabicNumerals(d.getFullYear())}`;
}

/**
 * Format currency in Arabic
 * تنسيق العملة بالعربية
 */
function formatCurrencyArabic(amount, currency = 'ر.س') {
  return `${toArabicNumerals(amount.toFixed(2))} ${currency}`;
}

/**
 * Format number with Arabic thousands separator
 * تنسيق الرقم بفاصل الآلات العربية
 */
function formatNumberArabic(num) {
  return num.toLocaleString('ar-SA').replace(/,/g, '٬');
}

/**
 * Get Arabic ordinal suffix (الأول، الثاني، إلخ)
 */
function getArabicOrdinal(num) {
  const ordinals = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس'];
  return ordinals[num - 1] || toArabicNumerals(num);
}

/**
 * Format percentage in Arabic
 * تنسيق النسبة المئوية بالعربية
 */
function formatPercentageArabic(value) {
  return `${toArabicNumerals(value)}%`;
}

/**
 * Format duration in Arabic (hours, minutes)
 * تنسيق المدة بالعربية
 */
function formatDurationArabic(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours > 0 && mins > 0) {
    return `${toArabicNumerals(hours)} ساعة و${toArabicNumerals(mins)} دقيقة`;
  } else if (hours > 0) {
    return `${toArabicNumerals(hours)} ساعة`;
  } else {
    return `${toArabicNumerals(mins)} دقيقة`;
  }
}

/**
 * Format distance in Arabic
 * تنسيق المسافة بالعربية
 */
function formatDistanceArabic(km) {
  if (km < 1) {
    return `${toArabicNumerals(Math.round(km * 1000))} متر`;
  } else {
    return `${toArabicNumerals(km.toFixed(1))} كم`;
  }
}

/**
 * Convert English digits to Arabic
 * تحويل الأرقام الإنجليزية إلى عربية (في النصوص)
 */
function convertToArabicDigits(text) {
  return text.replace(/\d+/g, match => toArabicNumerals(parseInt(match)));
}

module.exports = {
  toArabicNumerals,
  formatDateArabic,
  formatCurrencyArabic,
  formatNumberArabic,
  getArabicOrdinal,
  formatPercentageArabic,
  formatDurationArabic,
  formatDistanceArabic,
  convertToArabicDigits
};

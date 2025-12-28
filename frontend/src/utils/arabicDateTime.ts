/**
 * أدوات التاريخ والوقت العربية
 * Arabic Date and Time Utilities with Hijri calendar support
 */

// أسماء الأشهر الميلادية بالعربية
const gregorianMonths = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

// أسماء الأشهر الهجرية
const hijriMonths = [
  'محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني', 'جمادى الأولى', 'جمادى الثانية',
  'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
];

// أسماء أيام الأسبوع بالعربية
const weekDays = [
  'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'
];

// أسماء أيام الأسبوع المختصرة
const weekDaysShort = [
  'أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'
];

/**
 * تحويل الأرقام الإنجليزية إلى عربية
 */
export function toArabicNumbers(str: string | number): string {
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return str.toString().replace(/[0-9]/g, (digit) => arabicNumbers[parseInt(digit)]);
}

/**
 * تحويل الأرقام العربية إلى إنجليزية
 */
export function toEnglishNumbers(str: string): string {
  const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  
  let result = str;
  arabicNumbers.forEach((arabicNum, index) => {
    result = result.replace(new RegExp(arabicNum, 'g'), englishNumbers[index]);
  });
  
  return result;
}

/**
 * تنسيق التاريخ بالعربية
 */
export function formatArabicDate(date: Date | string, options: {
  includeTime?: boolean;
  includeDay?: boolean;
  useArabicNumbers?: boolean;
  format?: 'short' | 'medium' | 'long';
} = {}): string {
  const {
    includeTime = false,
    includeDay = false,
    useArabicNumbers = true,
    format = 'medium'
  } = options;

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'تاريخ غير صحيح';
  }

  let result = '';

  // إضافة اليوم
  if (includeDay) {
    result += weekDays[dateObj.getDay()] + '، ';
  }

  // تنسيق التاريخ حسب النوع
  switch (format) {
    case 'short':
      result += `${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`;
      break;
    
    case 'long':
      result += `${dateObj.getDate()} ${gregorianMonths[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
      break;
    
    default: // medium
      result += `${dateObj.getDate()} ${gregorianMonths[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
      break;
  }

  // إضافة الوقت
  if (includeTime) {
    const hours = dateObj.getHours();
    const minutes = dateObj.getMinutes();
    const ampm = hours >= 12 ? 'م' : 'ص';
    const displayHours = hours % 12 || 12;
    
    result += ` - ${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  }

  // تحويل الأرقام للعربية
  if (useArabicNumbers) {
    result = toArabicNumbers(result);
  }

  return result;
}

/**
 * تنسيق الوقت بالعربية
 */
export function formatArabicTime(date: Date | string, options: {
  useArabicNumbers?: boolean;
  format?: '12' | '24';
} = {}): string {
  const { useArabicNumbers = true, format = '12' } = options;
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'وقت غير صحيح';
  }

  let result = '';
  
  if (format === '24') {
    const hours = dateObj.getHours().toString().padStart(2, '0');
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');
    result = `${hours}:${minutes}`;
  } else {
    const hours = dateObj.getHours();
    const minutes = dateObj.getMinutes();
    const ampm = hours >= 12 ? 'م' : 'ص';
    const displayHours = hours % 12 || 12;
    
    result = `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  }

  if (useArabicNumbers) {
    result = toArabicNumbers(result);
  }

  return result;
}

/**
 * حساب الفرق الزمني بالعربية
 */
export function getArabicTimeAgo(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'الآن';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    if (diffInMinutes === 1) return 'منذ دقيقة';
    if (diffInMinutes === 2) return 'منذ دقيقتين';
    if (diffInMinutes <= 10) return `منذ ${toArabicNumbers(diffInMinutes)} دقائق`;
    return `منذ ${toArabicNumbers(diffInMinutes)} دقيقة`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    if (diffInHours === 1) return 'منذ ساعة';
    if (diffInHours === 2) return 'منذ ساعتين';
    if (diffInHours <= 10) return `منذ ${toArabicNumbers(diffInHours)} ساعات`;
    return `منذ ${toArabicNumbers(diffInHours)} ساعة`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    if (diffInDays === 1) return 'أمس';
    if (diffInDays === 2) return 'منذ يومين';
    if (diffInDays <= 10) return `منذ ${toArabicNumbers(diffInDays)} أيام`;
    return `منذ ${toArabicNumbers(diffInDays)} يوماً`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    if (diffInMonths === 1) return 'منذ شهر';
    if (diffInMonths === 2) return 'منذ شهرين';
    if (diffInMonths <= 10) return `منذ ${toArabicNumbers(diffInMonths)} أشهر`;
    return `منذ ${toArabicNumbers(diffInMonths)} شهراً`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  if (diffInYears === 1) return 'منذ سنة';
  if (diffInYears === 2) return 'منذ سنتين';
  if (diffInYears <= 10) return `منذ ${toArabicNumbers(diffInYears)} سنوات`;
  return `منذ ${toArabicNumbers(diffInYears)} سنة`;
}

/**
 * تحويل التاريخ الميلادي إلى هجري (تقريبي)
 */
export function gregorianToHijri(date: Date): { year: number; month: number; day: number } {
  // هذا تحويل تقريبي - للدقة الكاملة يُنصح باستخدام مكتبة متخصصة
  const gregorianYear = date.getFullYear();
  const gregorianMonth = date.getMonth() + 1;
  const gregorianDay = date.getDate();

  // معادلة تقريبية للتحويل
  const hijriYear = Math.floor((gregorianYear - 622) * 1.030684);
  const hijriMonth = Math.floor(((gregorianMonth - 1) * 1.030684) % 12) + 1;
  const hijriDay = Math.floor(gregorianDay * 1.030684);

  return {
    year: hijriYear,
    month: hijriMonth,
    day: hijriDay
  };
}

/**
 * تنسيق التاريخ الهجري
 */
export function formatHijriDate(date: Date | string, options: {
  useArabicNumbers?: boolean;
  includeDay?: boolean;
} = {}): string {
  const { useArabicNumbers = true, includeDay = false } = options;
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const hijriDate = gregorianToHijri(dateObj);

  let result = '';

  if (includeDay) {
    result += weekDays[dateObj.getDay()] + '، ';
  }

  result += `${hijriDate.day} ${hijriMonths[hijriDate.month - 1]} ${hijriDate.year} هـ`;

  if (useArabicNumbers) {
    result = toArabicNumbers(result);
  }

  return result;
}

/**
 * تنسيق التاريخ مع كلا التقويمين
 */
export function formatDualDate(date: Date | string, options: {
  useArabicNumbers?: boolean;
  includeTime?: boolean;
} = {}): string {
  const { useArabicNumbers = true, includeTime = false } = options;
  
  const gregorian = formatArabicDate(date, { 
    includeTime, 
    useArabicNumbers: false 
  });
  const hijri = formatHijriDate(date, { 
    useArabicNumbers: false 
  });

  let result = `${gregorian} - ${hijri}`;

  if (useArabicNumbers) {
    result = toArabicNumbers(result);
  }

  return result;
}

/**
 * التحقق من صحة التاريخ
 */
export function isValidDate(date: any): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * إنشاء تاريخ من نص عربي
 */
export function parseArabicDate(dateString: string): Date | null {
  try {
    // تحويل الأرقام العربية إلى إنجليزية
    const englishDateString = toEnglishNumbers(dateString);
    const date = new Date(englishDateString);
    
    return isValidDate(date) ? date : null;
  } catch (error) {
    return null;
  }
}

/**
 * الحصول على بداية اليوم
 */
export function getStartOfDay(date: Date = new Date()): Date {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  return startOfDay;
}

/**
 * الحصول على نهاية اليوم
 */
export function getEndOfDay(date: Date = new Date()): Date {
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay;
}

/**
 * الحصول على بداية الأسبوع (الأحد)
 */
export function getStartOfWeek(date: Date = new Date()): Date {
  const startOfWeek = new Date(date);
  const day = startOfWeek.getDay();
  startOfWeek.setDate(startOfWeek.getDate() - day);
  startOfWeek.setHours(0, 0, 0, 0);
  return startOfWeek;
}

/**
 * الحصول على نهاية الأسبوع (السبت)
 */
export function getEndOfWeek(date: Date = new Date()): Date {
  const endOfWeek = new Date(date);
  const day = endOfWeek.getDay();
  endOfWeek.setDate(endOfWeek.getDate() + (6 - day));
  endOfWeek.setHours(23, 59, 59, 999);
  return endOfWeek;
}

/**
 * الحصول على بداية الشهر
 */
export function getStartOfMonth(date: Date = new Date()): Date {
  const startOfMonth = new Date(date);
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  return startOfMonth;
}

/**
 * الحصول على نهاية الشهر
 */
export function getEndOfMonth(date: Date = new Date()): Date {
  const endOfMonth = new Date(date);
  endOfMonth.setMonth(endOfMonth.getMonth() + 1, 0);
  endOfMonth.setHours(23, 59, 59, 999);
  return endOfMonth;
}

/**
 * تنسيق المدة الزمنية بالعربية
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    if (minutes === 1) return 'دقيقة واحدة';
    if (minutes === 2) return 'دقيقتان';
    if (minutes <= 10) return `${toArabicNumbers(minutes)} دقائق`;
    return `${toArabicNumbers(minutes)} دقيقة`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  let result = '';
  
  if (hours === 1) {
    result += 'ساعة واحدة';
  } else if (hours === 2) {
    result += 'ساعتان';
  } else if (hours <= 10) {
    result += `${toArabicNumbers(hours)} ساعات`;
  } else {
    result += `${toArabicNumbers(hours)} ساعة`;
  }

  if (remainingMinutes > 0) {
    if (remainingMinutes === 1) {
      result += ' ودقيقة واحدة';
    } else if (remainingMinutes === 2) {
      result += ' ودقيقتان';
    } else if (remainingMinutes <= 10) {
      result += ` و${toArabicNumbers(remainingMinutes)} دقائق`;
    } else {
      result += ` و${toArabicNumbers(remainingMinutes)} دقيقة`;
    }
  }

  return result;
}

/**
 * تنسيق أوقات العمل
 */
export function formatWorkingHours(openTime: string, closeTime: string): string {
  const openDate = new Date(`2000-01-01T${openTime}`);
  const closeDate = new Date(`2000-01-01T${closeTime}`);
  
  const openFormatted = formatArabicTime(openDate);
  const closeFormatted = formatArabicTime(closeDate);
  
  return `من ${openFormatted} إلى ${closeFormatted}`;
}
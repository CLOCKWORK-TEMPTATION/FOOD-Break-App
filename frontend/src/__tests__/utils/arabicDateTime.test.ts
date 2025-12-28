/**
 * اختبارات أدوات التاريخ والوقت العربية
 * Arabic Date and Time Utilities Tests
 */

import {
  toArabicNumbers,
  toEnglishNumbers,
  formatArabicDate,
  formatArabicTime,
  getArabicTimeAgo,
  formatHijriDate,
  formatDualDate,
  isValidDate,
  parseArabicDate,
  getStartOfDay,
  getEndOfDay,
  getStartOfWeek,
  getEndOfWeek,
  getStartOfMonth,
  getEndOfMonth,
  formatDuration,
  formatWorkingHours
} from '../../utils/arabicDateTime';

describe('Arabic Date and Time Utilities', () => {
  
  describe('Number Conversion', () => {
    describe('toArabicNumbers', () => {
      test('converts English numbers to Arabic', () => {
        expect(toArabicNumbers('123')).toBe('١٢٣');
        expect(toArabicNumbers('0')).toBe('٠');
        expect(toArabicNumbers('9876543210')).toBe('٩٨٧٦٥٤٣٢١٠');
      });

      test('handles mixed content', () => {
        expect(toArabicNumbers('Order 123')).toBe('Order ١٢٣');
        expect(toArabicNumbers('Price: 50 EGP')).toBe('Price: ٥٠ EGP');
      });

      test('handles numeric input', () => {
        expect(toArabicNumbers(123)).toBe('١٢٣');
        expect(toArabicNumbers(0)).toBe('٠');
      });

      test('handles empty string', () => {
        expect(toArabicNumbers('')).toBe('');
      });
    });

    describe('toEnglishNumbers', () => {
      test('converts Arabic numbers to English', () => {
        expect(toEnglishNumbers('١٢٣')).toBe('123');
        expect(toEnglishNumbers('٠')).toBe('0');
        expect(toEnglishNumbers('٩٨٧٦٥٤٣٢١٠')).toBe('9876543210');
      });

      test('handles mixed content', () => {
        expect(toEnglishNumbers('Order ١٢٣')).toBe('Order 123');
        expect(toEnglishNumbers('Price: ٥٠ EGP')).toBe('Price: 50 EGP');
      });

      test('handles empty string', () => {
        expect(toEnglishNumbers('')).toBe('');
      });

      test('handles string with no Arabic numbers', () => {
        expect(toEnglishNumbers('Hello World')).toBe('Hello World');
      });
    });
  });

  describe('Date Formatting', () => {
    const testDate = new Date('2024-03-15T14:30:00');

    describe('formatArabicDate', () => {
      test('formats date with default options', () => {
        const result = formatArabicDate(testDate);
        expect(result).toContain('١٥');
        expect(result).toContain('مارس');
        expect(result).toContain('٢٠٢٤');
      });

      test('formats date without Arabic numbers', () => {
        const result = formatArabicDate(testDate, { useArabicNumbers: false });
        expect(result).toContain('15');
        expect(result).toContain('مارس');
        expect(result).toContain('2024');
      });

      test('includes time when requested', () => {
        const result = formatArabicDate(testDate, { includeTime: true });
        expect(result).toContain('٢:٣٠ م');
      });

      test('includes day when requested', () => {
        const result = formatArabicDate(testDate, { includeDay: true });
        expect(result).toContain('الجمعة');
      });

      test('formats short date', () => {
        const result = formatArabicDate(testDate, { format: 'short' });
        expect(result).toContain('١٥/٣/٢٠٢٤');
      });

      test('formats long date', () => {
        const result = formatArabicDate(testDate, { format: 'long' });
        expect(result).toContain('١٥ مارس ٢٠٢٤');
      });

      test('handles string date input', () => {
        const result = formatArabicDate('2024-03-15');
        expect(result).toContain('١٥');
        expect(result).toContain('مارس');
      });

      test('handles invalid date', () => {
        const result = formatArabicDate('invalid-date');
        expect(result).toBe('تاريخ غير صحيح');
      });
    });

    describe('formatArabicTime', () => {
      test('formats time in 12-hour format by default', () => {
        const result = formatArabicTime(testDate);
        expect(result).toBe('٢:٣٠ م');
      });

      test('formats time in 24-hour format', () => {
        const result = formatArabicTime(testDate, { format: '24' });
        expect(result).toBe('١٤:٣٠');
      });

      test('formats time without Arabic numbers', () => {
        const result = formatArabicTime(testDate, { useArabicNumbers: false });
        expect(result).toBe('2:30 م');
      });

      test('handles morning time', () => {
        const morningDate = new Date('2024-03-15T09:15:00');
        const result = formatArabicTime(morningDate);
        expect(result).toBe('٩:١٥ ص');
      });

      test('handles midnight', () => {
        const midnightDate = new Date('2024-03-15T00:00:00');
        const result = formatArabicTime(midnightDate);
        expect(result).toBe('١٢:٠٠ ص');
      });

      test('handles noon', () => {
        const noonDate = new Date('2024-03-15T12:00:00');
        const result = formatArabicTime(noonDate);
        expect(result).toBe('١٢:٠٠ م');
      });

      test('handles invalid date', () => {
        const result = formatArabicTime('invalid-date');
        expect(result).toBe('وقت غير صحيح');
      });
    });
  });

  describe('Time Ago Formatting', () => {
    describe('getArabicTimeAgo', () => {
      const now = new Date();

      test('returns "الآن" for very recent dates', () => {
        const recent = new Date(now.getTime() - 30 * 1000); // 30 seconds ago
        expect(getArabicTimeAgo(recent)).toBe('الآن');
      });

      test('formats minutes correctly', () => {
        const oneMinute = new Date(now.getTime() - 60 * 1000);
        expect(getArabicTimeAgo(oneMinute)).toBe('منذ دقيقة');

        const twoMinutes = new Date(now.getTime() - 2 * 60 * 1000);
        expect(getArabicTimeAgo(twoMinutes)).toBe('منذ دقيقتين');

        const fiveMinutes = new Date(now.getTime() - 5 * 60 * 1000);
        expect(getArabicTimeAgo(fiveMinutes)).toBe('منذ ٥ دقائق');

        const fifteenMinutes = new Date(now.getTime() - 15 * 60 * 1000);
        expect(getArabicTimeAgo(fifteenMinutes)).toBe('منذ ١٥ دقيقة');
      });

      test('formats hours correctly', () => {
        const oneHour = new Date(now.getTime() - 60 * 60 * 1000);
        expect(getArabicTimeAgo(oneHour)).toBe('منذ ساعة');

        const twoHours = new Date(now.getTime() - 2 * 60 * 60 * 1000);
        expect(getArabicTimeAgo(twoHours)).toBe('منذ ساعتين');

        const fiveHours = new Date(now.getTime() - 5 * 60 * 60 * 1000);
        expect(getArabicTimeAgo(fiveHours)).toBe('منذ ٥ ساعات');

        const fifteenHours = new Date(now.getTime() - 15 * 60 * 60 * 1000);
        expect(getArabicTimeAgo(fifteenHours)).toBe('منذ ١٥ ساعة');
      });

      test('formats days correctly', () => {
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        expect(getArabicTimeAgo(yesterday)).toBe('أمس');

        const twoDays = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
        expect(getArabicTimeAgo(twoDays)).toBe('منذ يومين');

        const fiveDays = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
        expect(getArabicTimeAgo(fiveDays)).toBe('منذ ٥ أيام');

        const fifteenDays = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
        expect(getArabicTimeAgo(fifteenDays)).toBe('منذ ١٥ يوماً');
      });

      test('formats months correctly', () => {
        const oneMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        expect(getArabicTimeAgo(oneMonth)).toBe('منذ شهر');

        const twoMonths = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        expect(getArabicTimeAgo(twoMonths)).toBe('منذ شهرين');

        const fiveMonths = new Date(now.getTime() - 150 * 24 * 60 * 60 * 1000);
        expect(getArabicTimeAgo(fiveMonths)).toBe('منذ ٥ أشهر');

        const elevenMonths = new Date(now.getTime() - 330 * 24 * 60 * 60 * 1000);
        expect(getArabicTimeAgo(elevenMonths)).toBe('منذ ١١ شهراً');
      });

      test('formats years correctly', () => {
        const oneYear = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        expect(getArabicTimeAgo(oneYear)).toBe('منذ سنة');

        const twoYears = new Date(now.getTime() - 2 * 365 * 24 * 60 * 60 * 1000);
        expect(getArabicTimeAgo(twoYears)).toBe('منذ سنتين');

        const fiveYears = new Date(now.getTime() - 5 * 365 * 24 * 60 * 60 * 1000);
        expect(getArabicTimeAgo(fiveYears)).toBe('منذ ٥ سنوات');

        const fifteenYears = new Date(now.getTime() - 15 * 365 * 24 * 60 * 60 * 1000);
        expect(getArabicTimeAgo(fifteenYears)).toBe('منذ ١٥ سنة');
      });
    });
  });

  describe('Hijri Date Formatting', () => {
    describe('formatHijriDate', () => {
      const testDate = new Date('2024-03-15');

      test('formats Hijri date with Arabic numbers', () => {
        const result = formatHijriDate(testDate);
        expect(result).toContain('هـ');
        expect(result).toMatch(/\d+/); // Should contain Arabic numbers
      });

      test('formats Hijri date without Arabic numbers', () => {
        const result = formatHijriDate(testDate, { useArabicNumbers: false });
        expect(result).toContain('هـ');
        expect(result).toMatch(/[0-9]/); // Should contain English numbers
      });

      test('includes day when requested', () => {
        const result = formatHijriDate(testDate, { includeDay: true });
        expect(result).toContain('الجمعة');
      });
    });

    describe('formatDualDate', () => {
      const testDate = new Date('2024-03-15T14:30:00');

      test('formats both Gregorian and Hijri dates', () => {
        const result = formatDualDate(testDate);
        expect(result).toContain('مارس');
        expect(result).toContain('هـ');
        expect(result).toContain(' - ');
      });

      test('includes time when requested', () => {
        const result = formatDualDate(testDate, { includeTime: true });
        expect(result).toContain('٢:٣٠ م');
      });
    });
  });

  describe('Date Validation and Parsing', () => {
    describe('isValidDate', () => {
      test('validates correct dates', () => {
        expect(isValidDate(new Date())).toBe(true);
        expect(isValidDate(new Date('2024-03-15'))).toBe(true);
      });

      test('invalidates incorrect dates', () => {
        expect(isValidDate(new Date('invalid'))).toBe(false);
        expect(isValidDate('not a date' as any)).toBe(false);
        expect(isValidDate(null as any)).toBe(false);
        expect(isValidDate(undefined as any)).toBe(false);
      });
    });

    describe('parseArabicDate', () => {
      test('parses Arabic date strings', () => {
        const result = parseArabicDate('٢٠٢٤-٠٣-١٥');
        expect(result).toBeInstanceOf(Date);
        expect(result?.getFullYear()).toBe(2024);
      });

      test('parses English date strings', () => {
        const result = parseArabicDate('2024-03-15');
        expect(result).toBeInstanceOf(Date);
        expect(result?.getFullYear()).toBe(2024);
      });

      test('returns null for invalid dates', () => {
        expect(parseArabicDate('invalid-date')).toBe(null);
        expect(parseArabicDate('')).toBe(null);
      });
    });
  });

  describe('Date Range Utilities', () => {
    const testDate = new Date('2024-03-15T14:30:25.123');

    describe('getStartOfDay', () => {
      test('returns start of day', () => {
        const result = getStartOfDay(testDate);
        expect(result.getHours()).toBe(0);
        expect(result.getMinutes()).toBe(0);
        expect(result.getSeconds()).toBe(0);
        expect(result.getMilliseconds()).toBe(0);
      });

      test('uses current date when no date provided', () => {
        const result = getStartOfDay();
        expect(result).toBeInstanceOf(Date);
      });
    });

    describe('getEndOfDay', () => {
      test('returns end of day', () => {
        const result = getEndOfDay(testDate);
        expect(result.getHours()).toBe(23);
        expect(result.getMinutes()).toBe(59);
        expect(result.getSeconds()).toBe(59);
        expect(result.getMilliseconds()).toBe(999);
      });
    });

    describe('getStartOfWeek', () => {
      test('returns start of week (Sunday)', () => {
        const result = getStartOfWeek(testDate);
        expect(result.getDay()).toBe(0); // Sunday
        expect(result.getHours()).toBe(0);
      });
    });

    describe('getEndOfWeek', () => {
      test('returns end of week (Saturday)', () => {
        const result = getEndOfWeek(testDate);
        expect(result.getDay()).toBe(6); // Saturday
        expect(result.getHours()).toBe(23);
      });
    });

    describe('getStartOfMonth', () => {
      test('returns start of month', () => {
        const result = getStartOfMonth(testDate);
        expect(result.getDate()).toBe(1);
        expect(result.getHours()).toBe(0);
      });
    });

    describe('getEndOfMonth', () => {
      test('returns end of month', () => {
        const result = getEndOfMonth(testDate);
        expect(result.getDate()).toBe(31); // March has 31 days
        expect(result.getHours()).toBe(23);
      });
    });
  });

  describe('Duration and Working Hours', () => {
    describe('formatDuration', () => {
      test('formats minutes only', () => {
        expect(formatDuration(1)).toBe('دقيقة واحدة');
        expect(formatDuration(2)).toBe('دقيقتان');
        expect(formatDuration(5)).toBe('٥ دقائق');
        expect(formatDuration(15)).toBe('١٥ دقيقة');
        expect(formatDuration(45)).toBe('٤٥ دقيقة');
      });

      test('formats hours only', () => {
        expect(formatDuration(60)).toBe('ساعة واحدة');
        expect(formatDuration(120)).toBe('ساعتان');
        expect(formatDuration(300)).toBe('٥ ساعات');
        expect(formatDuration(900)).toBe('١٥ ساعة');
      });

      test('formats hours and minutes', () => {
        expect(formatDuration(61)).toBe('ساعة واحدة ودقيقة واحدة');
        expect(formatDuration(122)).toBe('ساعتان ودقيقتان');
        expect(formatDuration(305)).toBe('٥ ساعات و٥ دقائق');
        expect(formatDuration(915)).toBe('١٥ ساعة و١٥ دقيقة');
      });
    });

    describe('formatWorkingHours', () => {
      test('formats working hours correctly', () => {
        const result = formatWorkingHours('09:00', '17:00');
        expect(result).toBe('من ٩:٠٠ ص إلى ٥:٠٠ م');
      });

      test('handles 24-hour format', () => {
        const result = formatWorkingHours('14:30', '22:15');
        expect(result).toBe('من ٢:٣٠ م إلى ١٠:١٥ م');
      });

      test('handles midnight hours', () => {
        const result = formatWorkingHours('00:00', '23:59');
        expect(result).toBe('من ١٢:٠٠ ص إلى ١١:٥٩ م');
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('handles null and undefined inputs gracefully', () => {
      expect(() => toArabicNumbers('')).not.toThrow();
      expect(() => toEnglishNumbers('')).not.toThrow();
      expect(() => formatArabicDate('invalid')).not.toThrow();
      expect(() => formatArabicTime('invalid')).not.toThrow();
    });

    test('handles extreme dates', () => {
      const veryOldDate = new Date('1900-01-01');
      const veryNewDate = new Date('2100-12-31');
      
      expect(() => formatArabicDate(veryOldDate)).not.toThrow();
      expect(() => formatArabicDate(veryNewDate)).not.toThrow();
    });

    test('handles leap year dates', () => {
      const leapYearDate = new Date('2024-02-29');
      expect(() => formatArabicDate(leapYearDate)).not.toThrow();
      expect(formatArabicDate(leapYearDate)).toContain('٢٩');
    });
  });
});
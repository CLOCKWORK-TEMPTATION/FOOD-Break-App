/**
 * Validator Utilities Unit Tests
 * اختبارات وحدة أدوات التحقق من صحة البيانات
 */

const {
  validateEmail,
  validatePhone,
  validatePassword,
  validateRequired,
  validateLength,
  validateRange,
  validateDate,
  validateEnum,
  sanitizeInput,
  validateObject,
  validateArray
} = require('../../../src/utils/validator');

describe('Validator Utilities', () => {

  describe('validateEmail', () => {
    it('should accept valid email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@example.co.uk')).toBe(true);
      expect(validateEmail('user+tag@example.com')).toBe(true);
      expect(validateEmail('user123@test-domain.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('invalid@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('user @example.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(validateEmail(null)).toBe(false);
      expect(validateEmail(undefined)).toBe(false);
      expect(validateEmail(123)).toBe(false);
      expect(validateEmail({})).toBe(false);
    });
  });

  describe('validatePhone', () => {
    it('should accept valid phone numbers', () => {
      expect(validatePhone('+966501234567')).toBe(true);
      expect(validatePhone('+201234567890')).toBe(true);
      expect(validatePhone('0501234567')).toBe(true);
      expect(validatePhone('966501234567')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(validatePhone('123')).toBe(false);
      expect(validatePhone('abc')).toBe(false);
      expect(validatePhone('')).toBe(false);
      expect(validatePhone('+1234567890123456')).toBe(false); // Too long
    });

    it('should support different formats', () => {
      expect(validatePhone('+1-555-123-4567')).toBe(true);
      expect(validatePhone('055 123 4567')).toBe(true);
    });
  });

  describe('validatePassword', () => {
    it('should accept strong passwords', () => {
      expect(validatePassword('SecurePass123')).toBe(true);
      expect(validatePassword('MyP@ssw0rd')).toBe(true);
      expect(validatePassword('Strong1!')).toBe(true);
    });

    it('should reject weak passwords', () => {
      expect(validatePassword('weak')).toBe(false);
      expect(validatePassword('password')).toBe(false);
      expect(validatePassword('12345678')).toBe(false);
      expect(validatePassword('abcdefgh')).toBe(false);
    });

    it('should enforce minimum length', () => {
      expect(validatePassword('Pass1')).toBe(false); // Too short
      expect(validatePassword('Password1')).toBe(true); // Long enough
    });

    it('should require complexity', () => {
      expect(validatePassword('password')).toBe(false); // No numbers
      expect(validatePassword('12345678')).toBe(false); // No letters
      expect(validatePassword('PASSWORD1')).toBe(false); // No lowercase
      expect(validatePassword('password1')).toBe(false); // No uppercase
    });
  });

  describe('validateRequired', () => {
    it('should accept non-empty values', () => {
      expect(validateRequired('text')).toBe(true);
      expect(validateRequired(0)).toBe(true);
      expect(validateRequired(false)).toBe(true);
      expect(validateRequired([])).toBe(true);
    });

    it('should reject empty values', () => {
      expect(validateRequired('')).toBe(false);
      expect(validateRequired(null)).toBe(false);
      expect(validateRequired(undefined)).toBe(false);
    });

    it('should handle whitespace-only strings', () => {
      expect(validateRequired('   ')).toBe(false);
      expect(validateRequired('\t\n')).toBe(false);
    });
  });

  describe('validateLength', () => {
    it('should validate string length', () => {
      expect(validateLength('test', { min: 2, max: 10 })).toBe(true);
      expect(validateLength('a', { min: 2, max: 10 })).toBe(false);
      expect(validateLength('verylongstring', { min: 2, max: 10 })).toBe(false);
    });

    it('should validate array length', () => {
      expect(validateLength([1, 2, 3], { min: 1, max: 5 })).toBe(true);
      expect(validateLength([], { min: 1, max: 5 })).toBe(false);
      expect(validateLength([1, 2, 3, 4, 5, 6], { min: 1, max: 5 })).toBe(false);
    });

    it('should support only minimum', () => {
      expect(validateLength('test', { min: 2 })).toBe(true);
      expect(validateLength('t', { min: 2 })).toBe(false);
    });

    it('should support only maximum', () => {
      expect(validateLength('test', { max: 10 })).toBe(true);
      expect(validateLength('verylongstring', { max: 10 })).toBe(false);
    });
  });

  describe('validateRange', () => {
    it('should validate numbers in range', () => {
      expect(validateRange(5, { min: 1, max: 10 })).toBe(true);
      expect(validateRange(0, { min: 1, max: 10 })).toBe(false);
      expect(validateRange(11, { min: 1, max: 10 })).toBe(false);
    });

    it('should handle inclusive boundaries', () => {
      expect(validateRange(1, { min: 1, max: 10 })).toBe(true);
      expect(validateRange(10, { min: 1, max: 10 })).toBe(true);
    });

    it('should handle negative numbers', () => {
      expect(validateRange(-5, { min: -10, max: 0 })).toBe(true);
      expect(validateRange(5, { min: -10, max: 0 })).toBe(false);
    });
  });

  describe('validateDate', () => {
    it('should accept valid dates', () => {
      expect(validateDate('2025-01-01')).toBe(true);
      expect(validateDate('2025-12-31')).toBe(true);
      expect(validateDate(new Date())).toBe(true);
    });

    it('should reject invalid dates', () => {
      expect(validateDate('invalid')).toBe(false);
      expect(validateDate('2025-13-01')).toBe(false);
      expect(validateDate('2025-02-30')).toBe(false);
    });

    it('should support custom formats', () => {
      expect(validateDate('01/01/2025', 'DD/MM/YYYY')).toBe(true);
      expect(validateDate('2025-01-01', 'YYYY-MM-DD')).toBe(true);
    });
  });

  describe('validateEnum', () => {
    it('should accept valid enum values', () => {
      const roles = ['ADMIN', 'USER', 'GUEST'];
      expect(validateEnum('ADMIN', roles)).toBe(true);
      expect(validateEnum('USER', roles)).toBe(true);
    });

    it('should reject invalid enum values', () => {
      const roles = ['ADMIN', 'USER', 'GUEST'];
      expect(validateEnum('SUPERADMIN', roles)).toBe(false);
      expect(validateEnum('admin', roles)).toBe(false); // Case sensitive
    });

    it('should handle empty enum arrays', () => {
      expect(validateEnum('test', [])).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    it('should remove HTML tags', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe('alert("xss")');
      expect(sanitizeInput('<b>bold</b>')).toBe('bold');
      expect(sanitizeInput('normal text')).toBe('normal text');
    });

    it('should trim whitespace', () => {
      expect(sanitizeInput('  text  ')).toBe('text');
      expect(sanitizeInput('\ttext\n')).toBe('text');
    });

    it('should remove special characters', () => {
      expect(sanitizeInput("test'test")).toBe('testtest');
      expect(sanitizeInput('test"test')).toBe('testtest');
    });
  });

  describe('validateObject', () => {
    it('should validate object with schema', () => {
      const schema = {
        name: { required: true, type: 'string' },
        age: { required: true, type: 'number', min: 0 },
        email: { required: false, type: 'email' }
      };

      const validObject = {
        name: 'John',
        age: 30,
        email: 'john@example.com'
      };

      const result = validateObject(validObject, schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for invalid object', () => {
      const schema = {
        name: { required: true, type: 'string' },
        age: { required: true, type: 'number', min: 0 }
      };

      const invalidObject = {
        name: 123, // Wrong type
        age: -5 // Below minimum
      };

      const result = validateObject(invalidObject, schema);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle missing required fields', () => {
      const schema = {
        name: { required: true },
        email: { required: true }
      };

      const incompleteObject = {
        name: 'John'
        // email is missing
      };

      const result = validateObject(incompleteObject, schema);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateArray', () => {
    it('should validate array with validators', () => {
      const validators = [
        { type: 'string', required: true }
      ];

      const validArray = ['item1', 'item2', 'item3'];
      const result = validateArray(validArray, validators);

      expect(result.valid).toBe(true);
    });

    it('should validate array items', () => {
      const validators = [
        { type: 'number', min: 0, max: 10 }
      ];

      const validArray = [1, 5, 10];
      const invalidArray = [1, 15, -5];

      expect(validateArray(validArray, validators).valid).toBe(true);
      expect(validateArray(invalidArray, validators).valid).toBe(false);
    });

    it('should validate array length', () => {
      const validators = [
        { type: 'string' }
      ];

      const options = { minLength: 1, maxLength: 3 };

      expect(validateArray(['a'], validators, options).valid).toBe(true);
      expect(validateArray([], validators, options).valid).toBe(false);
      expect(validateArray(['a', 'b', 'c', 'd'], validators, options).valid).toBe(false);
    });
  });

  describe('Arabic Text Validation', () => {
    it('should accept Arabic text', () => {
      expect(validateRequired('مرحباً')).toBe(true);
      expect(validateLength('مرحباً', { min: 2 })).toBe(true);
    });

    it('should handle mixed Arabic and English', () => {
      expect(validateLength('Hello مرحباً', { min: 5, max: 20 })).toBe(true);
    });

    it('should handle Arabic numbers', () => {
      expect(validateRange('٥', { min: 1, max: 10 })).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null and undefined', () => {
      expect(validateRequired(null)).toBe(false);
      expect(validateRequired(undefined)).toBe(false);
    });

    it('should handle boolean values', () => {
      expect(validateRequired(true)).toBe(true);
      expect(validateRequired(false)).toBe(true);
    });

    it('should handle zero values', () => {
      expect(validateRequired(0)).toBe(true);
      expect(validateRange(0, { min: 0, max: 10 })).toBe(true);
    });

    it('should handle empty collections', () => {
      expect(validateLength([], { min: 0 })).toBe(true);
      expect(validateLength({}, { min: 0 })).toBe(true);
    });
  });
});

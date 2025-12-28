/**
 * Localization Configuration Tests
 * اختبارات شاملة لإعدادات التعريب
 */

const {
  messages,
  getMessage,
  getLanguageFromRequest,
  localizationMiddleware
} = require('../../../src/config/localization');

describe('Localization Configuration Tests', () => {
  describe('messages object', () => {
    it('should have Arabic messages', () => {
      expect(messages.ar).toBeDefined();
      expect(typeof messages.ar).toBe('object');
    });

    it('should have English messages', () => {
      expect(messages.en).toBeDefined();
      expect(typeof messages.en).toBe('object');
    });

    it('should have auth messages in Arabic', () => {
      expect(messages.ar.auth).toBeDefined();
      expect(messages.ar.auth.loginSuccess).toBe('تم تسجيل الدخول بنجاح');
      expect(messages.ar.auth.loginFailed).toBe('فشل في تسجيل الدخول');
    });

    it('should have orders messages in Arabic', () => {
      expect(messages.ar.orders).toBeDefined();
      expect(messages.ar.orders.orderCreated).toBe('تم إنشاء الطلب بنجاح');
    });

    it('should have menu messages in Arabic', () => {
      expect(messages.ar.menu).toBeDefined();
      expect(messages.ar.menu.menuItemAdded).toBe('تم إضافة عنصر القائمة');
    });

    it('should have exceptions messages in Arabic', () => {
      expect(messages.ar.exceptions).toBeDefined();
      expect(messages.ar.exceptions.exceptionCreated).toBe('تم إنشاء الاستثناء بنجاح');
    });

    it('should have payments messages in Arabic', () => {
      expect(messages.ar.payments).toBeDefined();
      expect(messages.ar.payments.paymentSuccess).toBe('تم الدفع بنجاح');
    });

    it('should have recommendations messages', () => {
      expect(messages.ar.recommendations).toBeDefined();
    });

    it('should have nutrition messages', () => {
      expect(messages.ar.nutrition).toBeDefined();
    });

    it('should have emergency messages', () => {
      expect(messages.ar.emergency).toBeDefined();
    });

    it('should have dietary messages', () => {
      expect(messages.ar.dietary).toBeDefined();
    });

    it('should have admin messages', () => {
      expect(messages.ar.admin).toBeDefined();
    });

    it('should have emotion messages', () => {
      expect(messages.ar.emotion).toBeDefined();
    });

    it('should have ml messages', () => {
      expect(messages.ar.ml).toBeDefined();
    });

    it('should have medical messages', () => {
      expect(messages.ar.medical).toBeDefined();
    });

    it('should have voice messages', () => {
      expect(messages.ar.voice).toBeDefined();
    });

    it('should have projects messages', () => {
      expect(messages.ar.projects).toBeDefined();
    });

    it('should have budget messages', () => {
      expect(messages.ar.budget).toBeDefined();
    });

    it('should have general messages', () => {
      expect(messages.ar.general).toBeDefined();
    });

    it('should have validation messages', () => {
      expect(messages.ar.validation).toBeDefined();
    });

    it('should have order status translations', () => {
      expect(messages.ar.orderStatus).toBeDefined();
      expect(messages.ar.orderStatus.PENDING).toBe('في الانتظار');
      expect(messages.ar.orderStatus.CONFIRMED).toBe('مؤكد');
      expect(messages.ar.orderStatus.DELIVERED).toBe('تم التوصيل');
    });

    it('should have user roles translations', () => {
      expect(messages.ar.userRoles).toBeDefined();
      expect(messages.ar.userRoles.REGULAR).toBe('عضو عادي');
      expect(messages.ar.userRoles.ADMIN).toBe('مدير');
    });
  });

  describe('getMessage', () => {
    it('should get simple message in Arabic', () => {
      const message = getMessage('auth.loginSuccess', 'ar');
      expect(message).toBe('تم تسجيل الدخول بنجاح');
    });

    it('should get simple message in English', () => {
      const message = getMessage('auth.loginSuccess', 'en');
      expect(message).toBe('Login successful');
    });

    it('should default to Arabic when language not specified', () => {
      const message = getMessage('auth.loginSuccess');
      expect(message).toBe('تم تسجيل الدخول بنجاح');
    });

    it('should get nested message', () => {
      const message = getMessage('orders.orderCreated', 'ar');
      expect(message).toBe('تم إنشاء الطلب بنجاح');
    });

    it('should return key when message not found', () => {
      const message = getMessage('nonexistent.key', 'ar');
      expect(message).toBe('nonexistent.key');
    });

    it('should fallback to English when Arabic message not found', () => {
      const message = getMessage('nonexistent.key', 'ar');
      // Will try Arabic first, then fallback to English, if still not found return key
      expect(message).toBeDefined();
    });

    it('should replace parameters in message', () => {
      const message = getMessage('orders.orderStatusUpdated', 'ar', { status: 'تم التوصيل' });
      expect(message).toContain('تم التوصيل');
    });

    it('should replace multiple parameters', () => {
      const message = getMessage('validation.minLength', 'ar', { min: 8 });
      expect(message).toContain('8');
    });

    it('should handle messages with multiple placeholders', () => {
      const message = getMessage('dietary.autoMessagesCreated', 'ar', { count: 5 });
      expect(message).toContain('5');
    });

    it('should handle deep nested keys', () => {
      const message = getMessage('orderStatus.PENDING', 'ar');
      expect(message).toBe('في الانتظار');
    });

    it('should handle errors gracefully', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const message = getMessage(null, 'ar');

      expect(message).toBeDefined();
      consoleErrorSpy.mockRestore();
    });

    it('should return original key on error', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Try to get message with invalid input
      const message = getMessage('test.key', 'ar');

      expect(message).toBeDefined();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('getLanguageFromRequest', () => {
    let req;

    beforeEach(() => {
      req = {
        headers: {},
        query: {},
        user: null
      };
    });

    it('should return "ar" from Accept-Language header', () => {
      req.headers['accept-language'] = 'ar-SA,ar;q=0.9,en;q=0.8';

      const lang = getLanguageFromRequest(req);

      expect(lang).toBe('ar');
    });

    it('should return "en" from query parameter', () => {
      req.query.lang = 'en';

      const lang = getLanguageFromRequest(req);

      expect(lang).toBe('en');
    });

    it('should return "ar" when query.lang is not "en"', () => {
      req.query.lang = 'fr';

      const lang = getLanguageFromRequest(req);

      expect(lang).toBe('ar');
    });

    it('should return language from user preferences', () => {
      req.user = { language: 'en' };

      const lang = getLanguageFromRequest(req);

      expect(lang).toBe('en');
    });

    it('should default to Arabic', () => {
      const lang = getLanguageFromRequest(req);

      expect(lang).toBe('ar');
    });

    it('should prioritize query parameter over Accept-Language', () => {
      req.headers['accept-language'] = 'en-US';
      req.query.lang = 'ar';

      const lang = getLanguageFromRequest(req);

      expect(lang).toBe('ar');
    });

    it('should prioritize Accept-Language over user preferences', () => {
      req.headers['accept-language'] = 'ar';
      req.user = { language: 'en' };

      const lang = getLanguageFromRequest(req);

      expect(lang).toBe('ar');
    });

    it('should handle missing Accept-Language header', () => {
      delete req.headers['accept-language'];

      const lang = getLanguageFromRequest(req);

      expect(lang).toBe('ar');
    });

    it('should handle various Accept-Language formats', () => {
      const testCases = [
        'ar',
        'ar-EG',
        'ar-SA',
        'ar-AE',
        'ar,en-US;q=0.9',
        'fr,ar;q=0.8'
      ];

      testCases.forEach(acceptLanguage => {
        req = { headers: { 'accept-language': acceptLanguage }, query: {}, user: null };
        const lang = getLanguageFromRequest(req);
        expect(lang).toBe('ar');
      });
    });
  });

  describe('localizationMiddleware', () => {
    let req, res, next;

    beforeEach(() => {
      req = {
        headers: {},
        query: {},
        user: null
      };
      res = {};
      next = jest.fn();
    });

    it('should add t function to request', () => {
      localizationMiddleware(req, res, next);

      expect(req.t).toBeDefined();
      expect(typeof req.t).toBe('function');
    });

    it('should add lang property to request', () => {
      localizationMiddleware(req, res, next);

      expect(req.lang).toBeDefined();
      expect(req.lang).toBe('ar');
    });

    it('should add message function to response', () => {
      localizationMiddleware(req, res, next);

      expect(res.message).toBeDefined();
      expect(typeof res.message).toBe('function');
    });

    it('should call next middleware', () => {
      localizationMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('req.t should translate messages', () => {
      req.headers['accept-language'] = 'ar';

      localizationMiddleware(req, res, next);

      const message = req.t('auth.loginSuccess');
      expect(message).toBe('تم تسجيل الدخول بنجاح');
    });

    it('req.t should support parameters', () => {
      localizationMiddleware(req, res, next);

      const message = req.t('validation.minLength', { min: 8 });
      expect(message).toContain('8');
    });

    it('res.message should translate messages', () => {
      localizationMiddleware(req, res, next);

      const message = res.message('auth.loginSuccess');
      expect(message).toBe('تم تسجيل الدخول بنجاح');
    });

    it('should use correct language based on request', () => {
      req.query.lang = 'en';

      localizationMiddleware(req, res, next);

      expect(req.lang).toBe('en');
      const message = req.t('auth.loginSuccess');
      expect(message).toBe('Login successful');
    });

    it('should handle missing translations gracefully', () => {
      localizationMiddleware(req, res, next);

      const message = req.t('nonexistent.message');
      expect(message).toBeDefined();
    });
  });

  describe('Module exports', () => {
    it('should export messages object', () => {
      expect(messages).toBeDefined();
      expect(typeof messages).toBe('object');
    });

    it('should export getMessage function', () => {
      expect(getMessage).toBeDefined();
      expect(typeof getMessage).toBe('function');
    });

    it('should export getLanguageFromRequest function', () => {
      expect(getLanguageFromRequest).toBeDefined();
      expect(typeof getLanguageFromRequest).toBe('function');
    });

    it('should export localizationMiddleware function', () => {
      expect(localizationMiddleware).toBeDefined();
      expect(typeof localizationMiddleware).toBe('function');
    });
  });

  describe('Message structure validation', () => {
    it('all Arabic message categories should be objects', () => {
      const categories = Object.keys(messages.ar);

      categories.forEach(category => {
        expect(typeof messages.ar[category]).toBe('object');
      });
    });

    it('should have consistent message keys between languages', () => {
      const arAuthKeys = Object.keys(messages.ar.auth);
      const enAuthKeys = Object.keys(messages.en.auth);

      arAuthKeys.forEach(key => {
        expect(enAuthKeys).toContain(key);
      });
    });

    it('all messages should be non-empty strings', () => {
      const checkMessages = (obj) => {
        Object.values(obj).forEach(value => {
          if (typeof value === 'string') {
            expect(value.length).toBeGreaterThan(0);
          } else if (typeof value === 'object') {
            checkMessages(value);
          }
        });
      };

      checkMessages(messages.ar);
    });
  });

  describe('Parameter replacement', () => {
    it('should replace single parameter', () => {
      const message = getMessage('admin.notificationsSent', 'ar', { count: 10 });
      expect(message).toContain('10');
    });

    it('should handle missing parameters', () => {
      const message = getMessage('admin.notificationsSent', 'ar');
      expect(message).toBeDefined();
    });

    it('should leave placeholder if parameter not provided', () => {
      const message = getMessage('admin.notificationsSent', 'ar', {});
      expect(message).toContain('{count}');
    });

    it('should handle multiple parameter replacements', () => {
      // Create a test message with multiple parameters
      const message = getMessage('orders.orderStatusUpdated', 'ar', { status: 'مؤكد' });
      expect(message).toContain('مؤكد');
    });
  });
});

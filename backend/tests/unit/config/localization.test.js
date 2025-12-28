/**
 * اختبارات وحدة Localization
 * Unit tests for Localization configuration module
 */

const {
  messages,
  getMessage,
  getLanguageFromRequest,
  localizationMiddleware
} = require('../../../src/config/localization');

describe('Localization Configuration', () => {
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

    it('should have recommendations messages in Arabic', () => {
      expect(messages.ar.recommendations).toBeDefined();
      expect(messages.ar.recommendations.recommendationsGenerated).toBe('تم إنشاء التوصيات');
    });

    it('should have nutrition messages in Arabic', () => {
      expect(messages.ar.nutrition).toBeDefined();
      expect(messages.ar.nutrition.nutritionLogAdded).toBe('تم إضافة سجل التغذية');
    });

    it('should have emergency messages in Arabic', () => {
      expect(messages.ar.emergency).toBeDefined();
      expect(messages.ar.emergency.emergencyOrderCreated).toBe('تم إنشاء طلب طوارئ');
    });

    it('should have dietary messages in Arabic', () => {
      expect(messages.ar.dietary).toBeDefined();
      expect(messages.ar.dietary.profileUpdated).toBe('تم تحديث ملف الحمية الغذائية بنجاح');
    });

    it('should have admin messages in Arabic', () => {
      expect(messages.ar.admin).toBeDefined();
      expect(messages.ar.admin.statsFetchFailed).toBe('فشل في جلب الإحصائيات');
    });

    it('should have emotion messages in Arabic', () => {
      expect(messages.ar.emotion).toBeDefined();
      expect(messages.ar.emotion.moodLogSuccess).toBe('تم تسجيل الحالة المزاجية بنجاح');
    });

    it('should have ML messages in Arabic', () => {
      expect(messages.ar.ml).toBeDefined();
      expect(messages.ar.ml.trainingDataCollected).toBe('تم جمع بيانات التدريب بنجاح');
    });

    it('should have medical messages in Arabic', () => {
      expect(messages.ar.medical).toBeDefined();
      expect(messages.ar.medical.profileUpdated).toBe('تم تحديث الملف الطبي بنجاح');
    });

    it('should have voice messages in Arabic', () => {
      expect(messages.ar.voice).toBeDefined();
      expect(messages.ar.voice.orderConfirmed).toBe('تم تأكيد الطلب بنجاح');
    });

    it('should have projects messages in Arabic', () => {
      expect(messages.ar.projects).toBeDefined();
      expect(messages.ar.projects.projectCreated).toBe('تم إنشاء المشروع بنجاح');
    });

    it('should have budget messages in Arabic', () => {
      expect(messages.ar.budget).toBeDefined();
      expect(messages.ar.budget.budgetCreated).toBe('تم إنشاء الميزانية بنجاح');
    });

    it('should have general messages in Arabic', () => {
      expect(messages.ar.general).toBeDefined();
      expect(messages.ar.general.success).toBe('تم بنجاح');
    });

    it('should have validation messages in Arabic', () => {
      expect(messages.ar.validation).toBeDefined();
      expect(messages.ar.validation.required).toBe('هذا الحقل مطلوب');
    });

    it('should have orderStatus messages in Arabic', () => {
      expect(messages.ar.orderStatus).toBeDefined();
      expect(messages.ar.orderStatus.PENDING).toBe('في الانتظار');
      expect(messages.ar.orderStatus.CONFIRMED).toBe('مؤكد');
    });

    it('should have exceptionTypes messages in Arabic', () => {
      expect(messages.ar.exceptionTypes).toBeDefined();
      expect(messages.ar.exceptionTypes.FULL).toBe('استثناء كامل');
    });

    it('should have userRoles messages in Arabic', () => {
      expect(messages.ar.userRoles).toBeDefined();
      expect(messages.ar.userRoles.ADMIN).toBe('مدير');
    });

    it('should have menuTypes messages in Arabic', () => {
      expect(messages.ar.menuTypes).toBeDefined();
      expect(messages.ar.menuTypes.CORE).toBe('القائمة الأساسية');
    });
  });

  describe('getMessage', () => {
    it('should get simple message in Arabic by default', () => {
      const message = getMessage('auth.loginSuccess');
      expect(message).toBe('تم تسجيل الدخول بنجاح');
    });

    it('should get nested message in Arabic', () => {
      const message = getMessage('orders.orderCreated');
      expect(message).toBe('تم إنشاء الطلب بنجاح');
    });

    it('should get message in English when specified', () => {
      const message = getMessage('auth.loginSuccess', 'en');
      expect(message).toBe('Login successful');
    });

    it('should fallback to English if Arabic message not found', () => {
      const message = getMessage('nonexistent.key');
      expect(message).toBe('nonexistent.key');
    });

    it('should replace parameters in message', () => {
      const message = getMessage('validation.minLength', 'ar', { min: 5 });
      expect(message).toBe('الحد الأدنى للطول هو 5 أحرف');
    });

    it('should replace multiple parameters', () => {
      const message = getMessage('orders.orderStatusUpdated', 'ar', { status: 'مؤكد' });
      expect(message).toBe('تم تحديث حالة الطلب إلى مؤكد');
    });

    it('should handle message with count parameter', () => {
      const message = getMessage('admin.notificationsSent', 'ar', { count: 5 });
      expect(message).toBe('تم إرسال 5 إشعار');
    });

    it('should handle dietary autoMessagesCreated with count', () => {
      const message = getMessage('dietary.autoMessagesCreated', 'ar', { count: 3 });
      expect(message).toBe('تم إنشاء 3 رسالة تلقائية');
    });

    it('should return key if message not found', () => {
      const message = getMessage('unknown.message.key');
      expect(message).toBe('unknown.message.key');
    });

    it('should handle deeply nested keys', () => {
      const message = getMessage('orderStatus.DELIVERED');
      expect(message).toBe('تم التوصيل');
    });

    it('should handle empty parameters object', () => {
      const message = getMessage('auth.loginSuccess', 'ar', {});
      expect(message).toBe('تم تسجيل الدخول بنجاح');
    });

    it('should handle null language and use default', () => {
      const message = getMessage('auth.loginSuccess', null);
      expect(message).toBeDefined();
    });

    it('should handle undefined language and use default', () => {
      const message = getMessage('auth.loginSuccess', undefined);
      expect(message).toBeDefined();
    });

    it('should handle invalid key gracefully', () => {
      const message = getMessage('');
      expect(message).toBe('');
    });

    it('should handle null key gracefully', () => {
      const message = getMessage(null);
      expect(message).toBeNull();
    });
  });

  describe('getLanguageFromRequest', () => {
    it('should return ar from Accept-Language header', () => {
      const req = {
        headers: { 'accept-language': 'ar-SA,ar;q=0.9' },
        query: {},
        user: null
      };

      const lang = getLanguageFromRequest(req);
      expect(lang).toBe('ar');
    });

    it('should return ar from query parameter', () => {
      const req = {
        headers: {},
        query: { lang: 'ar' },
        user: null
      };

      const lang = getLanguageFromRequest(req);
      expect(lang).toBe('ar');
    });

    it('should return en from query parameter', () => {
      const req = {
        headers: {},
        query: { lang: 'en' },
        user: null
      };

      const lang = getLanguageFromRequest(req);
      expect(lang).toBe('en');
    });

    it('should return language from user preferences', () => {
      const req = {
        headers: {},
        query: {},
        user: { language: 'en' }
      };

      const lang = getLanguageFromRequest(req);
      expect(lang).toBe('en');
    });

    it('should prioritize Accept-Language header over query', () => {
      const req = {
        headers: { 'accept-language': 'ar' },
        query: { lang: 'en' },
        user: null
      };

      const lang = getLanguageFromRequest(req);
      expect(lang).toBe('ar');
    });

    it('should prioritize query over user preferences', () => {
      const req = {
        headers: {},
        query: { lang: 'en' },
        user: { language: 'ar' }
      };

      const lang = getLanguageFromRequest(req);
      expect(lang).toBe('en');
    });

    it('should default to ar if no language specified', () => {
      const req = {
        headers: {},
        query: {},
        user: null
      };

      const lang = getLanguageFromRequest(req);
      expect(lang).toBe('ar');
    });

    it('should handle missing headers object', () => {
      const req = {
        query: {},
        user: null
      };

      const lang = getLanguageFromRequest(req);
      expect(lang).toBe('ar');
    });

    it('should handle missing query object', () => {
      const req = {
        headers: {},
        user: null
      };

      const lang = getLanguageFromRequest(req);
      expect(lang).toBe('ar');
    });

    it('should handle Accept-Language without ar', () => {
      const req = {
        headers: { 'accept-language': 'en-US,en;q=0.9' },
        query: {},
        user: null
      };

      const lang = getLanguageFromRequest(req);
      expect(lang).toBe('ar');
    });

    it('should handle invalid lang query parameter', () => {
      const req = {
        headers: {},
        query: { lang: 'fr' },
        user: null
      };

      const lang = getLanguageFromRequest(req);
      expect(lang).toBe('ar');
    });

    it('should handle undefined user', () => {
      const req = {
        headers: {},
        query: {}
      };

      const lang = getLanguageFromRequest(req);
      expect(lang).toBe('ar');
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

    it('should make req.t work correctly', () => {
      localizationMiddleware(req, res, next);

      const message = req.t('auth.loginSuccess');
      expect(message).toBe('تم تسجيل الدخول بنجاح');
    });

    it('should make res.message work correctly', () => {
      localizationMiddleware(req, res, next);

      const message = res.message('auth.loginFailed');
      expect(message).toBe('فشل في تسجيل الدخول');
    });

    it('should use correct language from request', () => {
      req.query.lang = 'en';
      localizationMiddleware(req, res, next);

      expect(req.lang).toBe('en');
      const message = req.t('auth.loginSuccess');
      expect(message).toBe('Login successful');
    });

    it('should pass parameters through req.t', () => {
      localizationMiddleware(req, res, next);

      const message = req.t('validation.minLength', { min: 8 });
      expect(message).toBe('الحد الأدنى للطول هو 8 أحرف');
    });

    it('should pass parameters through res.message', () => {
      localizationMiddleware(req, res, next);

      const message = res.message('validation.maxLength', { max: 100 });
      expect(message).toBe('الحد الأقصى للطول هو 100 حرف');
    });

    it('should handle Arabic Accept-Language header', () => {
      req.headers['accept-language'] = 'ar-SA';
      localizationMiddleware(req, res, next);

      expect(req.lang).toBe('ar');
    });

    it('should handle missing Accept-Language header', () => {
      localizationMiddleware(req, res, next);

      expect(req.lang).toBe('ar');
      expect(next).toHaveBeenCalled();
    });

    it('should work with user language preference', () => {
      req.user = { language: 'en' };
      localizationMiddleware(req, res, next);

      expect(req.lang).toBe('en');
    });

    it('should only call next once', () => {
      localizationMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should not modify request headers', () => {
      const originalHeaders = { ...req.headers };
      localizationMiddleware(req, res, next);

      expect(req.headers).toEqual(originalHeaders);
    });

    it('should handle concurrent requests independently', () => {
      const req1 = { headers: {}, query: { lang: 'ar' }, user: null };
      const req2 = { headers: {}, query: { lang: 'en' }, user: null };
      const res1 = {};
      const res2 = {};
      const next1 = jest.fn();
      const next2 = jest.fn();

      localizationMiddleware(req1, res1, next1);
      localizationMiddleware(req2, res2, next2);

      expect(req1.lang).toBe('ar');
      expect(req2.lang).toBe('en');
      expect(next1).toHaveBeenCalled();
      expect(next2).toHaveBeenCalled();
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle getMessage with circular reference in params', () => {
      const circularObj = {};
      circularObj.self = circularObj;

      // Should not throw error
      expect(() => {
        getMessage('auth.loginSuccess', 'ar', circularObj);
      }).not.toThrow();
    });

    it('should handle very long message keys', () => {
      const longKey = 'a.'.repeat(100) + 'key';
      const result = getMessage(longKey);
      expect(result).toBe(longKey);
    });

    it('should handle special characters in parameters', () => {
      const message = getMessage('validation.minLength', 'ar', {
        min: '<script>alert("xss")</script>'
      });
      expect(message).toContain('<script>');
    });

    it('should handle numeric parameters', () => {
      const message = getMessage('validation.minValue', 'ar', { min: 0 });
      expect(message).toBe('الحد الأدنى للقيمة هو 0');
    });

    it('should handle boolean parameters', () => {
      const params = { value: true };
      const message = getMessage('general.success', 'ar', params);
      expect(message).toBeDefined();
    });

    it('should handle null parameters', () => {
      const message = getMessage('auth.loginSuccess', 'ar', null);
      expect(message).toBe('تم تسجيل الدخول بنجاح');
    });

    it('should handle undefined in parameter values', () => {
      const message = getMessage('validation.minLength', 'ar', { min: undefined });
      expect(message).toContain('undefined');
    });

    it('should handle middleware with null request', () => {
      const req = null;
      const res = {};
      const next = jest.fn();

      expect(() => {
        localizationMiddleware(req, res, next);
      }).toThrow();
    });

    it('should handle all message categories exist', () => {
      const categories = [
        'auth', 'orders', 'menu', 'exceptions', 'payments',
        'recommendations', 'nutrition', 'emergency', 'dietary',
        'admin', 'emotion', 'ml', 'medical', 'voice', 'projects',
        'budget', 'general', 'validation', 'orderStatus',
        'exceptionTypes', 'userRoles', 'menuTypes'
      ];

      categories.forEach(category => {
        expect(messages.ar[category]).toBeDefined();
      });
    });
  });
});

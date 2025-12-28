/**
 * Security Middleware Tests
 * اختبارات شاملة لوسطاء الأمان
 */

const {
  rateLimiters,
  helmetConfig,
  sanitizeInput,
  csrfProtection,
  preventSQLInjection,
  xssProtection,
  secureHeaders,
  auditLog
} = require('../../../src/middleware/security');

describe('Security Middleware Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      method: 'POST',
      path: '/api/test',
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'Jest Test Agent',
        'x-csrf-token': 'valid-token'
      },
      body: {},
      query: {},
      params: {},
      user: { id: 'user-123' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn()
    };
    next = jest.fn();
  });

  describe('sanitizeInput', () => {
    it('should sanitize HTML tags from body', () => {
      req.body = {
        name: '<script>alert("xss")</script>John',
        description: '<b>Test</b> Description'
      };

      sanitizeInput(req, res, next);

      expect(req.body.name).not.toContain('<script>');
      expect(req.body.name).not.toContain('</script>');
      expect(req.body.description).not.toContain('<b>');
      expect(next).toHaveBeenCalled();
    });

    it('should sanitize HTML tags from query params', () => {
      req.query = {
        search: '<img src=x onerror=alert(1)>',
        filter: 'safe<>value'
      };

      sanitizeInput(req, res, next);

      expect(req.query.search).not.toContain('<img');
      expect(req.query.filter).not.toContain('<>');
      expect(next).toHaveBeenCalled();
    });

    it('should sanitize HTML tags from URL params', () => {
      req.params = {
        id: 'test<script>',
        name: 'value>test'
      };

      sanitizeInput(req, res, next);

      expect(req.params.id).not.toContain('<');
      expect(req.params.name).not.toContain('>');
      expect(next).toHaveBeenCalled();
    });

    it('should handle nested objects', () => {
      req.body = {
        user: {
          profile: {
            bio: '<div>Malicious</div>Content'
          }
        }
      };

      sanitizeInput(req, res, next);

      expect(req.body.user.profile.bio).not.toContain('<div>');
      expect(next).toHaveBeenCalled();
    });

    it('should handle arrays', () => {
      req.body = {
        items: ['<script>test1</script>', 'safe', '<img src=x>']
      };

      sanitizeInput(req, res, next);

      req.body.items.forEach(item => {
        expect(item).not.toContain('<');
        expect(item).not.toContain('>');
      });
      expect(next).toHaveBeenCalled();
    });
  });

  describe('csrfProtection', () => {
    it('should allow GET requests without CSRF token', () => {
      req.method = 'GET';
      delete req.headers['x-csrf-token'];

      csrfProtection(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should block POST requests without CSRF token', () => {
      req.method = 'POST';
      delete req.headers['x-csrf-token'];

      csrfProtection(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: { message: 'CSRF token missing' }
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should block PUT requests without CSRF token', () => {
      req.method = 'PUT';
      delete req.headers['x-csrf-token'];

      csrfProtection(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should block DELETE requests without CSRF token', () => {
      req.method = 'DELETE';
      delete req.headers['x-csrf-token'];

      csrfProtection(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should block PATCH requests without CSRF token', () => {
      req.method = 'PATCH';
      delete req.headers['x-csrf-token'];

      csrfProtection(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow POST requests with valid CSRF token', () => {
      req.method = 'POST';
      req.headers['x-csrf-token'] = 'valid-token';

      csrfProtection(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('preventSQLInjection', () => {
    it('should block SQL injection in body', () => {
      req.body = {
        username: "admin' OR '1'='1",
        query: 'SELECT * FROM users'
      };

      preventSQLInjection(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: { message: 'Invalid input detected' }
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should block SQL injection in query params', () => {
      req.query = {
        search: 'test; DROP TABLE users;'
      };

      preventSQLInjection(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    it('should block SQL injection in URL params', () => {
      req.params = {
        id: "1 UNION SELECT * FROM passwords"
      };

      preventSQLInjection(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    it('should detect various SQL keywords', () => {
      const sqlKeywords = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER', 'EXEC', 'UNION'];

      sqlKeywords.forEach(keyword => {
        req.body = { test: `test ${keyword} test` };
        preventSQLInjection(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
        res.status.mockClear();
        res.json.mockClear();
        next.mockClear();
      });
    });

    it('should allow safe inputs', () => {
      req.body = {
        name: 'John Doe',
        email: 'john@example.com',
        description: 'This is a safe description'
      };

      preventSQLInjection(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should handle nested objects with SQL injection', () => {
      req.body = {
        user: {
          profile: {
            bio: 'SELECT * FROM users'
          }
        }
      };

      preventSQLInjection(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('xssProtection', () => {
    it('should set XSS protection headers', () => {
      xssProtection(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
      expect(res.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
      expect(res.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
      expect(next).toHaveBeenCalled();
    });

    it('should call next middleware', () => {
      xssProtection(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe('secureHeaders', () => {
    it('should set all security headers', () => {
      secureHeaders(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains'
      );
      expect(res.setHeader).toHaveBeenCalledWith('X-Permitted-Cross-Domain-Policies', 'none');
      expect(res.setHeader).toHaveBeenCalledWith('Referrer-Policy', 'no-referrer');
      expect(res.setHeader).toHaveBeenCalledWith(
        'Permissions-Policy',
        'geolocation=(), microphone=(), camera=()'
      );
      expect(next).toHaveBeenCalled();
    });
  });

  describe('auditLog', () => {
    let consoleSpy;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should log POST requests', () => {
      req.method = 'POST';

      auditLog(req, res, next);

      expect(consoleSpy).toHaveBeenCalled();
      const loggedData = JSON.parse(consoleSpy.mock.calls[0][1]);
      expect(loggedData.method).toBe('POST');
      expect(loggedData.path).toBe('/api/test');
      expect(loggedData.ip).toBe('127.0.0.1');
      expect(next).toHaveBeenCalled();
    });

    it('should log PUT requests', () => {
      req.method = 'PUT';

      auditLog(req, res, next);

      expect(consoleSpy).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should log DELETE requests', () => {
      req.method = 'DELETE';

      auditLog(req, res, next);

      expect(consoleSpy).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should log PATCH requests', () => {
      req.method = 'PATCH';

      auditLog(req, res, next);

      expect(consoleSpy).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should not log GET requests', () => {
      req.method = 'GET';

      auditLog(req, res, next);

      expect(consoleSpy).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should include user ID when authenticated', () => {
      req.method = 'POST';
      req.user = { id: 'user-456' };

      auditLog(req, res, next);

      const loggedData = JSON.parse(consoleSpy.mock.calls[0][1]);
      expect(loggedData.userId).toBe('user-456');
      expect(next).toHaveBeenCalled();
    });

    it('should handle requests without user', () => {
      req.method = 'POST';
      delete req.user;

      auditLog(req, res, next);

      const loggedData = JSON.parse(consoleSpy.mock.calls[0][1]);
      expect(loggedData.userId).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('rateLimiters', () => {
    it('should export all rate limiters', () => {
      expect(rateLimiters).toBeDefined();
      expect(rateLimiters.general).toBeDefined();
      expect(rateLimiters.auth).toBeDefined();
      expect(rateLimiters.api).toBeDefined();
      expect(rateLimiters.strict).toBeDefined();
    });
  });

  describe('helmetConfig', () => {
    it('should export helmet configuration', () => {
      expect(helmetConfig).toBeDefined();
    });
  });
});

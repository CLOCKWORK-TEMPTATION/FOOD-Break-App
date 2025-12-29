/**
 * Unit Tests - Security Middleware
 * اختبارات وحدة middleware الأمان
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

describe('Security Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      method: 'GET',
      path: '/api/test',
      ip: '127.0.0.1',
      headers: {},
      body: {},
      query: {},
      params: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();

    // Mock console.log to suppress audit log output during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ==========================================
  // Rate Limiters Tests
  // ==========================================
  describe('rateLimiters', () => {
    it('should have general rate limiter', () => {
      expect(rateLimiters.general).toBeDefined();
      expect(typeof rateLimiters.general).toBe('function');
    });

    it('should have auth rate limiter', () => {
      expect(rateLimiters.auth).toBeDefined();
      expect(typeof rateLimiters.auth).toBe('function');
    });

    it('should have API rate limiter', () => {
      expect(rateLimiters.api).toBeDefined();
      expect(typeof rateLimiters.api).toBe('function');
    });

    it('should have strict rate limiter', () => {
      expect(rateLimiters.strict).toBeDefined();
      expect(typeof rateLimiters.strict).toBe('function');
    });

    it('should have different configurations', () => {
      expect(rateLimiters.general).not.toBe(rateLimiters.auth);
      expect(rateLimiters.api).not.toBe(rateLimiters.strict);
    });
  });

  // ==========================================
  // Helmet Configuration Tests
  // ==========================================
  describe('helmetConfig', () => {
    it('should be defined', () => {
      expect(helmetConfig).toBeDefined();
      expect(typeof helmetConfig).toBe('function');
    });
  });

  // ==========================================
  // Sanitize Input Tests
  // ==========================================
  describe('sanitizeInput', () => {
    it('should sanitize body with XSS characters', () => {
      req.body = {
        name: 'Test<script>alert("xss")</script>',
        email: 'test@test.com'
      };

      sanitizeInput(req, res, next);

      expect(req.body.name).not.toContain('<script>');
      expect(req.body.name).not.toContain('</script>');
      expect(next).toHaveBeenCalled();
    });

    it('should sanitize query parameters', () => {
      req.query = {
        search: '<img src=x onerror=alert(1)>'
      };

      sanitizeInput(req, res, next);

      expect(req.query.search).not.toContain('<img');
      expect(next).toHaveBeenCalled();
    });

    it('should sanitize params', () => {
      req.params = {
        id: 'test<div>malicious</div>'
      };

      sanitizeInput(req, res, next);

      expect(req.params.id).not.toContain('<div>');
      expect(next).toHaveBeenCalled();
    });

    it('should handle nested objects', () => {
      req.body = {
        user: {
          profile: {
            bio: 'Hello<script>bad</script>World'
          }
        }
      };

      sanitizeInput(req, res, next);

      expect(req.body.user.profile.bio).not.toContain('<script>');
      expect(next).toHaveBeenCalled();
    });

    it('should preserve safe strings', () => {
      req.body = {
        name: 'John Doe',
        age: 30
      };

      sanitizeInput(req, res, next);

      expect(req.body.name).toBe('John Doe');
      expect(req.body.age).toBe(30);
      expect(next).toHaveBeenCalled();
    });

    it('should handle arrays', () => {
      req.body = {
        items: ['item<script>1</script>', 'item2']
      };

      sanitizeInput(req, res, next);

      expect(req.body.items[0]).not.toContain('<script>');
      expect(next).toHaveBeenCalled();
    });

    it('should handle null values', () => {
      req.body = {
        value: null
      };

      expect(() => sanitizeInput(req, res, next)).not.toThrow();
      expect(next).toHaveBeenCalled();
    });
  });

  // ==========================================
  // CSRF Protection Tests
  // ==========================================
  describe('csrfProtection', () => {
    it('should allow GET requests without token', () => {
      req.method = 'GET';

      csrfProtection(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should require token for POST requests', () => {
      req.method = 'POST';

      csrfProtection(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: { message: 'CSRF token missing' }
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should require token for PUT requests', () => {
      req.method = 'PUT';

      csrfProtection(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should require token for DELETE requests', () => {
      req.method = 'DELETE';

      csrfProtection(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should require token for PATCH requests', () => {
      req.method = 'PATCH';

      csrfProtection(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should allow POST with valid token', () => {
      req.method = 'POST';
      req.headers['x-csrf-token'] = 'valid-token';

      csrfProtection(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  // ==========================================
  // Prevent SQL Injection Tests
  // ==========================================
  describe('preventSQLInjection', () => {
    it('should allow safe queries', () => {
      req.body = {
        username: 'johndoe',
        email: 'john@example.com'
      };

      preventSQLInjection(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should block SELECT injection in body', () => {
      req.body = {
        username: "admin' OR '1'='1'; SELECT * FROM users--"
      };

      preventSQLInjection(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: { message: 'Invalid input detected' }
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should block INSERT injection', () => {
      req.query = {
        search: "'; INSERT INTO users VALUES ('hacker', 'pass')--"
      };

      preventSQLInjection(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should block UPDATE injection', () => {
      req.params = {
        id: "1; UPDATE users SET role='admin'"
      };

      preventSQLInjection(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should block DELETE injection', () => {
      req.body = {
        query: "'; DELETE FROM users WHERE '1'='1"
      };

      preventSQLInjection(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should block DROP injection', () => {
      req.query = {
        table: "users; DROP TABLE users--"
      };

      preventSQLInjection(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should handle nested objects', () => {
      req.body = {
        user: {
          name: "admin'; DROP TABLE users--"
        }
      };

      preventSQLInjection(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should allow safe SQL keywords in context', () => {
      req.body = {
        description: 'This is a selection of items'
      };

      preventSQLInjection(req, res, next);

      // Should pass because it's just text, not SQL injection
      // The pattern looks for SQL keywords which might trigger, but context matters
      // In real scenarios, this would be refined
      expect(next).toHaveBeenCalled();
    });
  });

  // ==========================================
  // XSS Protection Tests
  // ==========================================
  describe('xssProtection', () => {
    it('should set XSS protection header', () => {
      xssProtection(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
      expect(next).toHaveBeenCalled();
    });

    it('should set content type options header', () => {
      xssProtection(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
    });

    it('should set frame options header', () => {
      xssProtection(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
    });

    it('should set all headers and call next', () => {
      xssProtection(req, res, next);

      expect(res.setHeader).toHaveBeenCalledTimes(3);
      expect(next).toHaveBeenCalled();
    });
  });

  // ==========================================
  // Secure Headers Tests
  // ==========================================
  describe('secureHeaders', () => {
    it('should set HSTS header', () => {
      secureHeaders(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains'
      );
    });

    it('should set X-Permitted-Cross-Domain-Policies header', () => {
      secureHeaders(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith(
        'X-Permitted-Cross-Domain-Policies',
        'none'
      );
    });

    it('should set Referrer-Policy header', () => {
      secureHeaders(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith('Referrer-Policy', 'no-referrer');
    });

    it('should set Permissions-Policy header', () => {
      secureHeaders(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith(
        'Permissions-Policy',
        'geolocation=(), microphone=(), camera=()'
      );
    });

    it('should set all headers and call next', () => {
      secureHeaders(req, res, next);

      expect(res.setHeader).toHaveBeenCalledTimes(4);
      expect(next).toHaveBeenCalled();
    });
  });

  // ==========================================
  // Audit Log Tests
  // ==========================================
  describe('auditLog', () => {
    it('should log POST requests', () => {
      req.method = 'POST';
      req.path = '/api/users';
      req.user = { id: 'user-123' };
      req.headers['user-agent'] = 'Mozilla/5.0';

      auditLog(req, res, next);

      expect(console.log).toHaveBeenCalledWith(
        '[AUDIT]',
        expect.stringContaining('"method":"POST"')
      );
      expect(next).toHaveBeenCalled();
    });

    it('should log PUT requests', () => {
      req.method = 'PUT';

      auditLog(req, res, next);

      expect(console.log).toHaveBeenCalled();
    });

    it('should log DELETE requests', () => {
      req.method = 'DELETE';

      auditLog(req, res, next);

      expect(console.log).toHaveBeenCalled();
    });

    it('should log PATCH requests', () => {
      req.method = 'PATCH';

      auditLog(req, res, next);

      expect(console.log).toHaveBeenCalled();
    });

    it('should not log GET requests', () => {
      req.method = 'GET';

      auditLog(req, res, next);

      expect(console.log).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should include timestamp in log', () => {
      req.method = 'POST';

      auditLog(req, res, next);

      expect(console.log).toHaveBeenCalledWith(
        '[AUDIT]',
        expect.stringContaining('timestamp')
      );
    });

    it('should include user ID if available', () => {
      req.method = 'POST';
      req.user = { id: 'user-456' };

      auditLog(req, res, next);

      expect(console.log).toHaveBeenCalledWith(
        '[AUDIT]',
        expect.stringContaining('user-456')
      );
    });

    it('should handle requests without user', () => {
      req.method = 'POST';
      req.user = undefined;

      expect(() => auditLog(req, res, next)).not.toThrow();
      expect(next).toHaveBeenCalled();
    });

    it('should include IP address', () => {
      req.method = 'POST';
      req.ip = '192.168.1.100';

      auditLog(req, res, next);

      expect(console.log).toHaveBeenCalledWith(
        '[AUDIT]',
        expect.stringContaining('192.168.1.100')
      );
    });

    it('should include user agent', () => {
      req.method = 'POST';
      req.headers['user-agent'] = 'Custom-Agent/1.0';

      auditLog(req, res, next);

      expect(console.log).toHaveBeenCalledWith(
        '[AUDIT]',
        expect.stringContaining('Custom-Agent/1.0')
      );
    });
  });
});

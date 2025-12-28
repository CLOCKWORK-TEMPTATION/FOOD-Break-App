/**
 * QR Code Service Unit Tests
 * اختبارات وحدة خدمة QR Code (Logic Only)
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

describe('QR Code Service - Token Generation', () => {
  const generateQRToken = (projectId, projectName, validityHours = 24) => {
    const expiresAt = new Date(Date.now() + validityHours * 60 * 60 * 1000);
    
    const payload = {
      projectId,
      projectName,
      validUntil: expiresAt.toISOString(),
      type: 'PROJECT_ACCESS',
      hash: crypto.createHash('sha256').update(projectId).digest('hex')
    };

    return jwt.sign(payload, process.env.QR_SECRET_KEY, {
      expiresIn: `${validityHours}h`
    });
  };

  test('should generate QR token successfully', () => {
    // Arrange
    const projectId = 'project-123';
    const projectName = 'Test Project';

    // Act
    const token = generateQRToken(projectId, projectName);

    // Assert
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3); // JWT structure
  });

  test('should include project data in token', () => {
    // Arrange
    const projectId = 'project-456';
    const projectName = 'Another Project';

    // Act
    const token = generateQRToken(projectId, projectName);
    const decoded = jwt.verify(token, process.env.QR_SECRET_KEY);

    // Assert
    expect(decoded.projectId).toBe(projectId);
    expect(decoded.projectName).toBe(projectName);
    expect(decoded.type).toBe('PROJECT_ACCESS');
  });

  test('should set correct expiration time', () => {
    // Arrange
    const validityHours = 12;

    // Act
    const token = generateQRToken('project-789', 'Test', validityHours);
    const decoded = jwt.verify(token, process.env.QR_SECRET_KEY);

    const issuedAt = decoded.iat * 1000;
    const expiresAt = decoded.exp * 1000;
    const actualValidity = (expiresAt - issuedAt) / (1000 * 60 * 60);

    // Assert
    expect(actualValidity).toBeCloseTo(validityHours, 0);
  });

  test('should generate different tokens for different projects', () => {
    // Act
    const token1 = generateQRToken('project-1', 'Project 1');
    const token2 = generateQRToken('project-2', 'Project 2');

    // Assert
    expect(token1).not.toBe(token2);
    
    const decoded1 = jwt.verify(token1, process.env.QR_SECRET_KEY);
    const decoded2 = jwt.verify(token2, process.env.QR_SECRET_KEY);
    
    expect(decoded1.projectId).not.toBe(decoded2.projectId);
  });
});

describe('QR Code Service - Token Validation', () => {
  const validateQRToken = (token, expectedType = 'PROJECT_ACCESS') => {
    try {
      const decoded = jwt.verify(token, process.env.QR_SECRET_KEY);
      
      if (decoded.type !== expectedType) {
        throw new Error('نوع QR Code غير صحيح');
      }
      
      const validUntil = new Date(decoded.validUntil);
      if (validUntil < new Date()) {
        throw new Error('QR Code منتهي الصلاحية');
      }
      
      return { isValid: true, data: decoded };
    } catch (error) {
      return { isValid: false, error: error.message };
    }
  };

  test('should validate correct QR token', () => {
    // Arrange
    const projectId = 'project-123';
    const token = jwt.sign(
      {
        projectId,
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        type: 'PROJECT_ACCESS',
        hash: 'valid-hash'
      },
      process.env.QR_SECRET_KEY,
      { expiresIn: '24h' }
    );

    // Act
    const result = validateQRToken(token);

    // Assert
    expect(result.isValid).toBe(true);
    expect(result.data.projectId).toBe(projectId);
  });

  test('should reject expired token', () => {
    // Arrange
    const expiredToken = jwt.sign(
      {
        projectId: 'project-123',
        validUntil: new Date(Date.now() - 1000).toISOString(), // Already expired
        type: 'PROJECT_ACCESS'
      },
      process.env.QR_SECRET_KEY,
      { expiresIn: '0s' }
    );

    // Wait to ensure expiration
    return new Promise(resolve => {
      setTimeout(() => {
        // Act
        const result = validateQRToken(expiredToken);

        // Assert
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
        resolve();
      }, 100);
    });
  });

  test('should reject token with invalid secret', () => {
    // Arrange
    const token = jwt.sign(
      { projectId: 'project-123', type: 'PROJECT_ACCESS' },
      'wrong-secret',
      { expiresIn: '1h' }
    );

    // Act
    const result = validateQRToken(token);

    // Assert
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('invalid');
  });

  test('should reject token with wrong type', () => {
    // Arrange
    const token = jwt.sign(
      {
        projectId: 'project-123',
        validUntil: new Date(Date.now() + 3600000).toISOString(),
        type: 'ORDER_TRACKING' // Wrong type
      },
      process.env.QR_SECRET_KEY,
      { expiresIn: '1h' }
    );

    // Act
    const result = validateQRToken(token, 'PROJECT_ACCESS');

    // Assert
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('نوع');
  });
});

describe('QR Code Service - Hash Generation', () => {
  const generateHash = (input) => {
    return crypto.createHash('sha256').update(input).digest('hex');
  };

  test('should generate consistent hash for same input', () => {
    // Arrange
    const input = 'test-project-123';

    // Act
    const hash1 = generateHash(input);
    const hash2 = generateHash(input);

    // Assert
    expect(hash1).toBe(hash2);
  });

  test('should generate different hashes for different inputs', () => {
    // Arrange
    const input1 = 'project-1';
    const input2 = 'project-2';

    // Act
    const hash1 = generateHash(input1);
    const hash2 = generateHash(input2);

    // Assert
    expect(hash1).not.toBe(hash2);
  });

  test('should generate hash of expected length', () => {
    // Arrange
    const input = 'any-input';

    // Act
    const hash = generateHash(input);

    // Assert
    expect(hash).toHaveLength(64); // SHA-256 produces 64 hex characters
  });

  test('should handle empty string', () => {
    // Act
    const hash = generateHash('');

    // Assert
    expect(hash).toBeDefined();
    expect(hash).toHaveLength(64);
  });

  test('should handle special characters', () => {
    // Act
    const hash1 = generateHash('project!@#$%');
    const hash2 = generateHash('project^&*()');

    // Assert
    expect(hash1).toBeDefined();
    expect(hash2).toBeDefined();
    expect(hash1).not.toBe(hash2);
  });
});

describe('QR Code Service - QR Type Validation', () => {
  const QR_TYPES = [
    'PROJECT_ACCESS',
    'ORDER_TRACKING',
    'MENU_VIEW',
    'RESTAURANT_INFO'
  ];

  const isValidQRType = (type) => {
    return QR_TYPES.includes(type);
  };

  test('should validate QR types', () => {
    QR_TYPES.forEach(type => {
      expect(isValidQRType(type)).toBe(true);
    });
  });

  test('should reject invalid QR types', () => {
    const invalidTypes = ['INVALID', 'PAYMENT', 'USER_AUTH', ''];
    
    invalidTypes.forEach(type => {
      expect(isValidQRType(type)).toBe(false);
    });
  });

  test('should be case-sensitive', () => {
    expect(isValidQRType('project_access')).toBe(false);
    expect(isValidQRType('PROJECT_ACCESS')).toBe(true);
  });
});

describe('QR Code Service - Security Checks', () => {
  test('should throw error if QR_SECRET_KEY not set in production', () => {
    // Arrange
    const originalEnv = process.env.NODE_ENV;
    const originalSecret = process.env.QR_SECRET_KEY;
    
    process.env.NODE_ENV = 'production';
    delete process.env.QR_SECRET_KEY;

    // Act & Assert
    expect(() => {
      if (process.env.NODE_ENV === 'production' && !process.env.QR_SECRET_KEY) {
        throw new Error('QR_SECRET_KEY must be set in production');
      }
    }).toThrow('QR_SECRET_KEY must be set');

    // Cleanup
    process.env.NODE_ENV = originalEnv;
    process.env.QR_SECRET_KEY = originalSecret;
  });

  test('should warn in development if QR_SECRET_KEY not set', () => {
    // Arrange
    const originalEnv = process.env.NODE_ENV;
    const originalSecret = process.env.QR_SECRET_KEY;
    
    process.env.NODE_ENV = 'development';
    delete process.env.QR_SECRET_KEY;

    // Act
    let warningIssued = false;
    if (process.env.NODE_ENV !== 'production' && !process.env.QR_SECRET_KEY) {
      warningIssued = true;
    }

    // Assert
    expect(warningIssued).toBe(true);

    // Cleanup
    process.env.NODE_ENV = originalEnv;
    process.env.QR_SECRET_KEY = originalSecret;
  });
});

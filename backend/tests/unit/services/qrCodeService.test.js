/**
 * Unit Tests - QR Code Service
 * Why: اختبار منطق توليد والتحقق من QR Codes
 */

const QRCodeService = require('../../../src/services/qrCodeService');
const jwt = require('jsonwebtoken');

describe('QR Code Service - Unit Tests', () => {
  const originalEnv = process.env.QR_SECRET_KEY;

  beforeEach(() => {
    process.env.QR_SECRET_KEY = 'test-qr-secret-key';
  });

  afterEach(() => {
    process.env.QR_SECRET_KEY = originalEnv;
  });

  describe('generateProjectQR', () => {
    test('should generate valid QR code for project', async () => {
      const projectData = {
        id: 'project-123',
        name: 'Test Project'
      };

      const result = await QRCodeService.generateProjectQR(projectData);

      expect(result).toHaveProperty('qrCode');
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('expiresAt');
      expect(result.qrCode).toContain('data:image/png;base64');
    });

    test('should include correct project data in token', async () => {
      const projectData = {
        id: 'project-123',
        name: 'Test Project'
      };

      const result = await QRCodeService.generateProjectQR(projectData);
      const decoded = jwt.verify(result.token, process.env.QR_SECRET_KEY);

      expect(decoded.projectId).toBe(projectData.id);
      expect(decoded.type).toBe('PROJECT_ACCESS');
    });
  });

  describe('validateQRCode', () => {
    test('should validate correct QR token', async () => {
      const projectData = {
        id: 'project-123',
        name: 'Test Project'
      };

      const { token } = await QRCodeService.generateProjectQR(projectData);
      const validation = await QRCodeService.validateQRCode(token);

      expect(validation.valid).toBe(true);
      expect(validation.projectId).toBe(projectData.id);
    });

    test('should reject invalid token', async () => {
      const invalidToken = 'invalid-token';

      await expect(
        QRCodeService.validateQRCode(invalidToken)
      ).rejects.toThrow();
    });

    test('should reject expired token', async () => {
      const expiredToken = jwt.sign(
        {
          projectId: 'project-123',
          type: 'PROJECT_ACCESS',
          validUntil: new Date(Date.now() - 1000) // منتهي الصلاحية
        },
        process.env.QR_SECRET_KEY
      );

      await expect(
        QRCodeService.validateQRCode(expiredToken)
      ).rejects.toThrow('QR Code منتهي الصلاحية');
    });
  });

  describe('extractTokenFromInput', () => {
    test('should extract token from JSON string', () => {
      const qrInput = JSON.stringify({ token: 'test-token-123' });
      const token = QRCodeService.extractTokenFromInput(qrInput);

      expect(token).toBe('test-token-123');
    });

    test('should extract token from plain string', () => {
      const qrInput = 'test-token-123';
      const token = QRCodeService.extractTokenFromInput(qrInput);

      expect(token).toBe('test-token-123');
    });

    test('should return null for invalid input', () => {
      const token = QRCodeService.extractTokenFromInput(null);
      expect(token).toBeNull();
    });
  });

  describe('generateHash', () => {
    test('should generate consistent hash for same input', () => {
      const data = 'test-data';
      const hash1 = QRCodeService.generateHash(data);
      const hash2 = QRCodeService.generateHash(data);

      expect(hash1).toBe(hash2);
      expect(hash1).toBeDefined();
      expect(typeof hash1).toBe('string');
    });

    test('should generate different hash for different input', () => {
      const hash1 = QRCodeService.generateHash('data1');
      const hash2 = QRCodeService.generateHash('data2');

      expect(hash1).not.toBe(hash2);
    });
  });
});

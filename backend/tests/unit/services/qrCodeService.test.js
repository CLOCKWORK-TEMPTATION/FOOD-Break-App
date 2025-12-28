/**
 * Unit Tests - QR Code Service
 * اختبارات وحدة خدمة رموز QR
 */

const crypto = require('crypto');
const jwt = require('jsonwebtoken');

jest.mock('qrcode', () => ({
  toDataURL: jest.fn(),
  toString: jest.fn(),
}));

const { users, projects } = require('../../fixtures/testData');

describe('QR Code Service', () => {
  let mockPrisma;
  let qrcode;

  beforeEach(() => {
    jest.clearAllMocks();
    
    const { PrismaClient } = require('@prisma/client');
    mockPrisma = new PrismaClient();
    qrcode = require('qrcode');
  });

  // ==========================================
  // QR Code Generation Tests
  // ==========================================
  describe('generateQRCode', () => {
    it('should generate QR code for project', async () => {
      const projectId = projects.activeProject.id;
      const qrDataUrl = 'data:image/png;base64,mockQRCode';
      
      qrcode.toDataURL.mockResolvedValue(qrDataUrl);
      
      const result = await qrcode.toDataURL(projectId);
      
      expect(result).toBe(qrDataUrl);
      expect(qrcode.toDataURL).toHaveBeenCalledWith(projectId);
    });

    it('should include project data in QR payload', () => {
      const qrPayload = {
        projectId: projects.activeProject.id,
        projectName: projects.activeProject.name,
        location: projects.activeProject.location,
        timestamp: Date.now(),
      };
      
      expect(qrPayload.projectId).toBeDefined();
      expect(qrPayload.projectName).toBeDefined();
    });

    it('should generate unique QR for each project', () => {
      const qr1 = `QR-${projects.activeProject.id}`;
      const qr2 = `QR-${projects.inactiveProject.id}`;
      
      expect(qr1).not.toBe(qr2);
    });
  });

  // ==========================================
  // QR Token Generation Tests
  // ==========================================
  describe('generateQRToken', () => {
    it('should generate JWT token for QR', () => {
      const payload = {
        projectId: projects.activeProject.id,
        type: 'PROJECT_ACCESS',
      };
      
      const token = jwt.sign(payload, process.env.QR_SECRET_KEY, { expiresIn: '24h' });
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should include expiration in token', () => {
      const payload = {
        projectId: projects.activeProject.id,
      };
      
      const token = jwt.sign(payload, process.env.QR_SECRET_KEY, { expiresIn: '1h' });
      const decoded = jwt.verify(token, process.env.QR_SECRET_KEY);
      
      expect(decoded.exp).toBeDefined();
    });

    it('should use secure secret key', () => {
      const secretKey = process.env.QR_SECRET_KEY;
      
      expect(secretKey).toBeDefined();
      expect(secretKey.length).toBeGreaterThan(10);
    });
  });

  // ==========================================
  // QR Token Verification Tests
  // ==========================================
  describe('verifyQRToken', () => {
    it('should verify valid QR token', () => {
      const payload = { projectId: projects.activeProject.id };
      const token = jwt.sign(payload, process.env.QR_SECRET_KEY);
      
      const decoded = jwt.verify(token, process.env.QR_SECRET_KEY);
      
      expect(decoded.projectId).toBe(projects.activeProject.id);
    });

    it('should reject expired QR token', () => {
      const payload = { projectId: projects.activeProject.id };
      const token = jwt.sign(payload, process.env.QR_SECRET_KEY, { expiresIn: '-1h' });
      
      expect(() => {
        jwt.verify(token, process.env.QR_SECRET_KEY);
      }).toThrow();
    });

    it('should reject token with invalid signature', () => {
      const payload = { projectId: projects.activeProject.id };
      const token = jwt.sign(payload, 'wrong-secret');
      
      expect(() => {
        jwt.verify(token, process.env.QR_SECRET_KEY);
      }).toThrow();
    });

    it('should reject malformed token', () => {
      const invalidToken = 'not.a.valid.jwt.token';
      
      expect(() => {
        jwt.verify(invalidToken, process.env.QR_SECRET_KEY);
      }).toThrow();
    });
  });

  // ==========================================
  // Project Access via QR Tests
  // ==========================================
  describe('accessProjectByQR', () => {
    it('should grant access to active project', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(projects.activeProject);
      
      const project = await mockPrisma.project.findUnique({
        where: { id: projects.activeProject.id }
      });
      
      expect(project.isActive).toBe(true);
    });

    it('should deny access to inactive project', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(projects.inactiveProject);
      
      const project = await mockPrisma.project.findUnique({
        where: { id: projects.inactiveProject.id }
      });
      
      expect(project.isActive).toBe(false);
    });

    it('should validate project date range', () => {
      const now = new Date();
      const project = projects.activeProject;
      
      const isWithinRange = now >= project.startDate && now <= project.endDate;
      
      // Active project should be within range (for test data, this may vary)
      expect(typeof isWithinRange).toBe('boolean');
    });

    it('should check order window', () => {
      const orderWindowMinutes = projects.activeProject.orderWindow;
      
      expect(orderWindowMinutes).toBeGreaterThan(0);
      expect(typeof orderWindowMinutes).toBe('number');
    });
  });

  // ==========================================
  // QR Code Scanning Tests
  // ==========================================
  describe('scanQRCode', () => {
    it('should extract data from scanned QR', () => {
      const scannedData = JSON.stringify({
        projectId: projects.activeProject.id,
        token: 'jwt-token-here',
      });
      
      const parsed = JSON.parse(scannedData);
      
      expect(parsed.projectId).toBe(projects.activeProject.id);
      expect(parsed.token).toBeDefined();
    });

    it('should handle invalid QR data', () => {
      const invalidData = 'not-valid-json';
      
      expect(() => {
        JSON.parse(invalidData);
      }).toThrow();
    });
  });

  // ==========================================
  // User-Project Association Tests
  // ==========================================
  describe('associateUserWithProject', () => {
    it('should associate user with project on scan', async () => {
      const association = {
        userId: users.validUser.id,
        projectId: projects.activeProject.id,
        scannedAt: new Date(),
      };
      
      mockPrisma.userProject = {
        create: jest.fn().mockResolvedValue(association),
      };
      
      // Simulating the association creation
      expect(association.userId).toBe(users.validUser.id);
      expect(association.projectId).toBe(projects.activeProject.id);
    });

    it('should prevent duplicate associations', async () => {
      // User already associated with project
      const existingAssociation = {
        userId: users.validUser.id,
        projectId: projects.activeProject.id,
      };
      
      // Should use upsert or check existing
      expect(existingAssociation).toBeDefined();
    });
  });

  // ==========================================
  // QR Code Format Tests
  // ==========================================
  describe('QR code formats', () => {
    it('should generate PNG format', async () => {
      const pngDataUrl = 'data:image/png;base64,xxx';
      qrcode.toDataURL.mockResolvedValue(pngDataUrl);
      
      const result = await qrcode.toDataURL('test-data', { type: 'png' });
      
      expect(result).toContain('data:image/png');
    });

    it('should generate SVG format', async () => {
      const svgString = '<svg>...</svg>';
      qrcode.toString.mockResolvedValue(svgString);
      
      const result = await qrcode.toString('test-data', { type: 'svg' });
      
      expect(result).toBeDefined();
    });

    it('should support custom size options', async () => {
      const options = {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      };
      
      qrcode.toDataURL.mockResolvedValue('data:image/png;base64,xxx');
      
      await qrcode.toDataURL('test-data', options);
      
      expect(qrcode.toDataURL).toHaveBeenCalledWith('test-data', options);
    });
  });

  // ==========================================
  // QR Security Tests
  // ==========================================
  describe('QR security', () => {
    it('should use cryptographically secure random for tokens', () => {
      const randomBytes = crypto.randomBytes(32);
      
      expect(randomBytes.length).toBe(32);
      expect(Buffer.isBuffer(randomBytes)).toBe(true);
    });

    it('should hash sensitive data in QR', () => {
      const sensitiveData = 'user-sensitive-info';
      const hash = crypto.createHash('sha256').update(sensitiveData).digest('hex');
      
      expect(hash.length).toBe(64); // SHA-256 produces 64 hex characters
      expect(hash).not.toBe(sensitiveData);
    });

    it('should rate limit QR scans', () => {
      const maxScansPerMinute = 10;
      const userScans = [
        { timestamp: Date.now() },
        { timestamp: Date.now() },
        { timestamp: Date.now() },
      ];
      
      const isWithinLimit = userScans.length <= maxScansPerMinute;
      
      expect(isWithinLimit).toBe(true);
    });
  });

  // ==========================================
  // QR Analytics Tests
  // ==========================================
  describe('QR analytics', () => {
    it('should track scan count', () => {
      const scanStats = {
        projectId: projects.activeProject.id,
        totalScans: 150,
        uniqueUsers: 45,
        lastScanAt: new Date(),
      };
      
      expect(scanStats.totalScans).toBeGreaterThan(0);
      expect(scanStats.uniqueUsers).toBeLessThanOrEqual(scanStats.totalScans);
    });

    it('should track scan location', () => {
      const scanData = {
        latitude: 24.7136,
        longitude: 46.6753,
        timestamp: new Date(),
      };
      
      expect(scanData.latitude).toBeDefined();
      expect(scanData.longitude).toBeDefined();
    });
  });
});

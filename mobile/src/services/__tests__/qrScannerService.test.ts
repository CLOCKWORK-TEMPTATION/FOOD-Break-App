/**
 * اختبارات شاملة لخدمة مسح QR
 * Comprehensive tests for QR Scanner Service
 */

import { Camera } from 'expo-camera';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { Alert } from 'react-native';
import qrScannerService, { QRScanResult, QRValidationResult } from '../qrScannerService';
import apiService from '../apiService';

// Mock dependencies
jest.mock('expo-camera');
jest.mock('expo-barcode-scanner');
jest.mock('react-native');
jest.mock('../apiService');

describe('QRScannerService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (qrScannerService as any).hasPermission = null;
  });

  // ==========================================
  // Permission Tests
  // ==========================================
  describe('Camera Permission', () => {
    describe('requestCameraPermission', () => {
      it('should request camera permission successfully', async () => {
        (Camera.requestCameraPermissionsAsync as jest.Mock).mockResolvedValueOnce({
          status: 'granted',
        });

        const result = await qrScannerService.requestCameraPermission();

        expect(result).toBe(true);
        expect((qrScannerService as any).hasPermission).toBe(true);
        expect(Alert.alert).not.toHaveBeenCalled();
      });

      it('should handle permission denial', async () => {
        (Camera.requestCameraPermissionsAsync as jest.Mock).mockResolvedValueOnce({
          status: 'denied',
        });

        const result = await qrScannerService.requestCameraPermission();

        expect(result).toBe(false);
        expect((qrScannerService as any).hasPermission).toBe(false);
        expect(Alert.alert).toHaveBeenCalledWith(
          'إذن الكاميرا مطلوب',
          expect.any(String),
          expect.any(Array)
        );
      });

      it('should handle permission request errors', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        (Camera.requestCameraPermissionsAsync as jest.Mock).mockRejectedValueOnce(
          new Error('Permission error')
        );

        const result = await qrScannerService.requestCameraPermission();

        expect(result).toBe(false);
        expect(consoleErrorSpy).toHaveBeenCalled();
        consoleErrorSpy.mockRestore();
      });
    });

    describe('checkCameraPermission', () => {
      it('should check and return granted permission', async () => {
        (Camera.getCameraPermissionsAsync as jest.Mock).mockResolvedValueOnce({
          status: 'granted',
        });

        const result = await qrScannerService.checkCameraPermission();

        expect(result).toBe(true);
        expect((qrScannerService as any).hasPermission).toBe(true);
      });

      it('should check and return denied permission', async () => {
        (Camera.getCameraPermissionsAsync as jest.Mock).mockResolvedValueOnce({
          status: 'denied',
        });

        const result = await qrScannerService.checkCameraPermission();

        expect(result).toBe(false);
        expect((qrScannerService as any).hasPermission).toBe(false);
      });

      it('should handle check permission errors', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        (Camera.getCameraPermissionsAsync as jest.Mock).mockRejectedValueOnce(
          new Error('Check error')
        );

        const result = await qrScannerService.checkCameraPermission();

        expect(result).toBe(false);
        expect(consoleErrorSpy).toHaveBeenCalled();
        consoleErrorSpy.mockRestore();
      });
    });

    describe('getPermissionStatus', () => {
      it('should return current permission status', () => {
        (qrScannerService as any).hasPermission = true;

        const result = qrScannerService.getPermissionStatus();

        expect(result).toBe(true);
      });

      it('should return null when permission not checked', () => {
        (qrScannerService as any).hasPermission = null;

        const result = qrScannerService.getPermissionStatus();

        expect(result).toBeNull();
      });
    });
  });

  // ==========================================
  // QR Code Handling Tests
  // ==========================================
  describe('handleQRScan', () => {
    it('should handle valid JSON QR code with token', async () => {
      const qrData = {
        token: 'valid-qr-token-123',
        metadata: { projectId: 'proj-1' },
      };
      const scanResult: QRScanResult = {
        type: 'QR',
        data: JSON.stringify(qrData),
      };

      const mockValidation = {
        success: true,
        data: {
          valid: true,
          projectId: 'proj-1',
          projectName: 'Test Project',
          type: 'PROJECT_ACCESS',
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
        },
      };

      (apiService.post as jest.Mock).mockResolvedValueOnce(mockValidation);

      const result = await qrScannerService.handleQRScan(scanResult);

      expect(apiService.post).toHaveBeenCalledWith('/qr/validate', {
        token: 'valid-qr-token-123',
      });
      expect(result.valid).toBe(true);
      expect(result.projectId).toBe('proj-1');
      expect(result.projectName).toBe('Test Project');
    });

    it('should handle plain text QR code', async () => {
      const scanResult: QRScanResult = {
        type: 'QR',
        data: 'plain-text-token',
      };

      const mockValidation = {
        success: true,
        data: { valid: true, type: 'ORDER_TRACKING' },
      };

      (apiService.post as jest.Mock).mockResolvedValueOnce(mockValidation);

      const result = await qrScannerService.handleQRScan(scanResult);

      expect(apiService.post).toHaveBeenCalledWith('/qr/validate', {
        token: 'plain-text-token',
      });
      expect(result.valid).toBe(true);
    });

    it('should handle invalid QR code without token', async () => {
      const scanResult: QRScanResult = {
        type: 'QR',
        data: JSON.stringify({ noToken: true }),
      };

      const result = await qrScannerService.handleQRScan(scanResult);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('لا يحتوي على معلومات صالحة');
      expect(apiService.post).not.toHaveBeenCalled();
    });

    it('should handle QR validation failure from API', async () => {
      const scanResult: QRScanResult = {
        type: 'QR',
        data: JSON.stringify({ token: 'invalid-token' }),
      };

      const mockValidation = {
        success: false,
        error: { message: 'QR Code expired' },
      };

      (apiService.post as jest.Mock).mockResolvedValueOnce(mockValidation);

      const result = await qrScannerService.handleQRScan(scanResult);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('QR Code expired');
    });

    it('should handle API errors during validation', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const scanResult: QRScanResult = {
        type: 'QR',
        data: JSON.stringify({ token: 'test-token' }),
      };

      (apiService.post as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await qrScannerService.handleQRScan(scanResult);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('خطأ في التحقق من QR Code');
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should handle QR code with bounds information', async () => {
      const scanResult: QRScanResult = {
        type: 'QR',
        data: JSON.stringify({ token: 'token-123' }),
        bounds: {
          origin: { x: 100, y: 150 },
          size: { width: 200, height: 200 },
        },
      };

      const mockValidation = {
        success: true,
        data: { valid: true },
      };

      (apiService.post as jest.Mock).mockResolvedValueOnce(mockValidation);

      const result = await qrScannerService.handleQRScan(scanResult);

      expect(result.valid).toBe(true);
    });
  });

  // ==========================================
  // Project Access Tests
  // ==========================================
  describe('accessProjectByQR', () => {
    it('should access project successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          projectAccess: {
            projectId: 'proj-1',
            name: 'Test Project',
            permissions: ['read', 'order'],
          },
        },
      };

      (apiService.post as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await qrScannerService.accessProjectByQR('qr-token-123');

      expect(apiService.post).toHaveBeenCalledWith('/qr/access', {
        qrToken: 'qr-token-123',
      });
      expect(result.success).toBe(true);
      expect(result.projectData).toEqual(mockResponse.data.projectAccess);
      expect(result.message).toContain('تم الوصول للمشروع بنجاح');
    });

    it('should handle project access failure', async () => {
      const mockResponse = {
        success: false,
        error: { message: 'Access denied' },
      };

      (apiService.post as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await qrScannerService.accessProjectByQR('invalid-token');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Access denied');
    });

    it('should handle API errors', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (apiService.post as jest.Mock).mockRejectedValueOnce(new Error('Connection failed'));

      const result = await qrScannerService.accessProjectByQR('token-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('خطأ في الاتصال بالخادم');
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  // ==========================================
  // Order Tracking Tests
  // ==========================================
  describe('trackOrderByQR', () => {
    it('should track order successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          order: {
            id: 'order-123',
            status: 'in_transit',
          },
          trackingInfo: {
            currentLocation: 'En route',
            estimatedArrival: '15 minutes',
          },
        },
      };

      (apiService.post as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await qrScannerService.trackOrderByQR('order-qr-data');

      expect(apiService.post).toHaveBeenCalledWith('/orders/track/qr', {
        qrData: 'order-qr-data',
      });
      expect(result.success).toBe(true);
      expect(result.orderData).toEqual(mockResponse.data.order);
      expect(result.trackingInfo).toEqual(mockResponse.data.trackingInfo);
    });

    it('should handle order not found', async () => {
      const mockResponse = {
        success: false,
        error: { message: 'Order not found' },
      };

      (apiService.post as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await qrScannerService.trackOrderByQR('invalid-order-data');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Order not found');
    });

    it('should handle tracking errors', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (apiService.post as jest.Mock).mockRejectedValueOnce(new Error('Tracking failed'));

      const result = await qrScannerService.trackOrderByQR('order-data');

      expect(result.success).toBe(false);
      expect(result.error).toContain('خطأ في الاتصال بالخادم');
      consoleErrorSpy.mockRestore();
    });
  });

  // ==========================================
  // QR Type Detection Tests
  // ==========================================
  describe('determineQRType', () => {
    it('should detect PROJECT_ACCESS type', () => {
      const qrData = {
        metadata: {
          projectId: 'proj-1',
        },
      };

      const result = qrScannerService.determineQRType(qrData);

      expect(result).toBe('PROJECT_ACCESS');
    });

    it('should detect ORDER_TRACKING type', () => {
      const qrData = {
        metadata: {
          projectId: 'proj-1',
          orderId: 'order-123',
        },
      };

      const result = qrScannerService.determineQRType(qrData);

      expect(result).toBe('ORDER_TRACKING');
    });

    it('should return UNKNOWN for unrecognized type', () => {
      const qrData = {
        metadata: {},
      };

      const result = qrScannerService.determineQRType(qrData);

      expect(result).toBe('UNKNOWN');
    });

    it('should return UNKNOWN for missing metadata', () => {
      const qrData = {};

      const result = qrScannerService.determineQRType(qrData);

      expect(result).toBe('UNKNOWN');
    });
  });

  // ==========================================
  // Message Formatting Tests
  // ==========================================
  describe('formatResultMessage', () => {
    it('should format PROJECT_ACCESS message', () => {
      const result: QRValidationResult = {
        valid: true,
        projectName: 'Test Project',
        type: 'PROJECT_ACCESS',
      };

      const message = qrScannerService.formatResultMessage(result);

      expect(message).toContain('Test Project');
      expect(message).toContain('تم العثور على مشروع');
    });

    it('should format ORDER_TRACKING message', () => {
      const result: QRValidationResult = {
        valid: true,
        orderId: 'order-123',
        type: 'ORDER_TRACKING',
      };

      const message = qrScannerService.formatResultMessage(result);

      expect(message).toContain('order-123');
      expect(message).toContain('تم العثور على طلب رقم');
    });

    it('should format error message for invalid QR', () => {
      const result: QRValidationResult = {
        valid: false,
        error: 'QR Code expired',
      };

      const message = qrScannerService.formatResultMessage(result);

      expect(message).toBe('QR Code expired');
    });

    it('should format default message for unknown type', () => {
      const result: QRValidationResult = {
        valid: true,
      };

      const message = qrScannerService.formatResultMessage(result);

      expect(message).toContain('تم مسح QR Code بنجاح');
    });

    it('should use default error message when error not provided', () => {
      const result: QRValidationResult = {
        valid: false,
      };

      const message = qrScannerService.formatResultMessage(result);

      expect(message).toContain('QR Code غير صحيح');
    });
  });

  // ==========================================
  // Expiry Tests
  // ==========================================
  describe('isQRExpired', () => {
    it('should return false for future expiry date', () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString(); // Tomorrow

      const result = qrScannerService.isQRExpired(futureDate);

      expect(result).toBe(false);
    });

    it('should return true for past expiry date', () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString(); // Yesterday

      const result = qrScannerService.isQRExpired(pastDate);

      expect(result).toBe(true);
    });

    it('should return false when expiry date not provided', () => {
      const result = qrScannerService.isQRExpired();

      expect(result).toBe(false);
    });

    it('should return false for undefined expiry', () => {
      const result = qrScannerService.isQRExpired(undefined);

      expect(result).toBe(false);
    });
  });

  describe('getTimeUntilExpiry', () => {
    it('should return time until expiry in hours and minutes', () => {
      const futureDate = new Date(Date.now() + 7200000).toISOString(); // 2 hours from now

      const result = qrScannerService.getTimeUntilExpiry(futureDate);

      expect(result).toContain('ساعة');
      expect(result).toContain('دقيقة');
    });

    it('should return time until expiry in minutes only', () => {
      const futureDate = new Date(Date.now() + 1800000).toISOString(); // 30 minutes from now

      const result = qrScannerService.getTimeUntilExpiry(futureDate);

      expect(result).toContain('دقيقة');
      expect(result).not.toContain('ساعة');
    });

    it('should return expired message for past date', () => {
      const pastDate = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago

      const result = qrScannerService.getTimeUntilExpiry(pastDate);

      expect(result).toBe('منتهي الصلاحية');
    });

    it('should return empty string when expiry not provided', () => {
      const result = qrScannerService.getTimeUntilExpiry();

      expect(result).toBe('');
    });

    it('should handle very short time until expiry', () => {
      const futureDate = new Date(Date.now() + 60000).toISOString(); // 1 minute from now

      const result = qrScannerService.getTimeUntilExpiry(futureDate);

      expect(result).toContain('دقيقة');
    });
  });

  // ==========================================
  // Scanner Settings Tests
  // ==========================================
  describe('getDefaultScannerSettings', () => {
    it('should return default scanner settings', () => {
      const settings = qrScannerService.getDefaultScannerSettings();

      expect(settings.barCodeTypes).toContain(BarCodeScanner.Constants.BarCodeType.qr);
      expect(settings.onBarCodeScanned).toBeUndefined();
      expect(settings.style).toEqual({
        flex: 1,
        width: '100%',
        height: '100%',
      });
    });

    it('should return consistent settings on multiple calls', () => {
      const settings1 = qrScannerService.getDefaultScannerSettings();
      const settings2 = qrScannerService.getDefaultScannerSettings();

      expect(settings1).toEqual(settings2);
    });
  });

  // ==========================================
  // Device Support Tests
  // ==========================================
  describe('isQRScanningSupported', () => {
    it('should return true when barcode scanner is available', async () => {
      (BarCodeScanner.isAvailableAsync as jest.Mock).mockResolvedValueOnce(true);

      const result = await qrScannerService.isQRScanningSupported();

      expect(result).toBe(true);
      expect(BarCodeScanner.isAvailableAsync).toHaveBeenCalled();
    });

    it('should return false when barcode scanner is not available', async () => {
      (BarCodeScanner.isAvailableAsync as jest.Mock).mockResolvedValueOnce(false);

      const result = await qrScannerService.isQRScanningSupported();

      expect(result).toBe(false);
    });

    it('should handle errors in availability check', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (BarCodeScanner.isAvailableAsync as jest.Mock).mockRejectedValueOnce(
        new Error('Check failed')
      );

      const result = await qrScannerService.isQRScanningSupported();

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  // ==========================================
  // Edge Cases Tests
  // ==========================================
  describe('Edge Cases', () => {
    it('should handle very long QR token strings', async () => {
      const longToken = 'a'.repeat(10000);
      const scanResult: QRScanResult = {
        type: 'QR',
        data: JSON.stringify({ token: longToken }),
      };

      const mockValidation = {
        success: true,
        data: { valid: true },
      };

      (apiService.post as jest.Mock).mockResolvedValueOnce(mockValidation);

      const result = await qrScannerService.handleQRScan(scanResult);

      expect(result.valid).toBe(true);
      expect(apiService.post).toHaveBeenCalledWith('/qr/validate', {
        token: longToken,
      });
    });

    it('should handle malformed JSON in QR data', async () => {
      const scanResult: QRScanResult = {
        type: 'QR',
        data: '{invalid-json',
      };

      const mockValidation = {
        success: true,
        data: { valid: true },
      };

      (apiService.post as jest.Mock).mockResolvedValueOnce(mockValidation);

      const result = await qrScannerService.handleQRScan(scanResult);

      // Should treat as plain text
      expect(apiService.post).toHaveBeenCalledWith('/qr/validate', {
        token: '{invalid-json',
      });
    });

    it('should handle concurrent QR scans', async () => {
      const scanResult1: QRScanResult = {
        type: 'QR',
        data: JSON.stringify({ token: 'token-1' }),
      };
      const scanResult2: QRScanResult = {
        type: 'QR',
        data: JSON.stringify({ token: 'token-2' }),
      };

      (apiService.post as jest.Mock).mockResolvedValue({
        success: true,
        data: { valid: true },
      });

      const [result1, result2] = await Promise.all([
        qrScannerService.handleQRScan(scanResult1),
        qrScannerService.handleQRScan(scanResult2),
      ]);

      expect(result1.valid).toBe(true);
      expect(result2.valid).toBe(true);
    });

    it('should handle QR data with special characters', async () => {
      const specialToken = 'token-with-特殊-chars-مرحبا';
      const scanResult: QRScanResult = {
        type: 'QR',
        data: JSON.stringify({ token: specialToken }),
      };

      const mockValidation = {
        success: true,
        data: { valid: true },
      };

      (apiService.post as jest.Mock).mockResolvedValueOnce(mockValidation);

      const result = await qrScannerService.handleQRScan(scanResult);

      expect(result.valid).toBe(true);
    });

    it('should handle empty QR data string', async () => {
      const scanResult: QRScanResult = {
        type: 'QR',
        data: '',
      };

      const result = await qrScannerService.handleQRScan(scanResult);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('لا يحتوي على معلومات صالحة');
    });

    it('should handle null/undefined values in QR metadata', () => {
      const qrData = {
        metadata: {
          projectId: null,
          orderId: undefined,
        },
      };

      const result = qrScannerService.determineQRType(qrData);

      expect(result).toBe('UNKNOWN');
    });
  });
});

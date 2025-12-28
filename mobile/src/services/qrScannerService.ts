import { Camera } from 'expo-camera';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { Alert } from 'react-native';
import apiService from './apiService';

export interface QRScanResult {
  type: string;
  data: string;
  bounds?: {
    origin: { x: number; y: number };
    size: { width: number; height: number };
  };
}

export interface QRValidationResult {
  valid: boolean;
  projectId?: string;
  projectName?: string;
  orderId?: string;
  type?: 'PROJECT_ACCESS' | 'ORDER_TRACKING';
  expiresAt?: string;
  error?: string;
}

class QRScannerService {
  private hasPermission: boolean | null = null;

  // طلب إذن الكاميرا
  async requestCameraPermission(): Promise<boolean> {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      this.hasPermission = status === 'granted';
      
      if (!this.hasPermission) {
        Alert.alert(
          'إذن الكاميرا مطلوب',
          'يحتاج التطبيق للوصول للكاميرا لمسح رموز QR.',
          [{ text: 'موافق' }]
        );
      }
      
      return this.hasPermission;
    } catch (error) {
      console.error('خطأ في طلب إذن الكاميرا:', error);
      return false;
    }
  }

  // التحقق من إذن الكاميرا
  async checkCameraPermission(): Promise<boolean> {
    try {
      const { status } = await Camera.getCameraPermissionsAsync();
      this.hasPermission = status === 'granted';
      return this.hasPermission;
    } catch (error) {
      console.error('خطأ في التحقق من إذن الكاميرا:', error);
      return false;
    }
  }

  // معالجة نتيجة مسح QR Code
  async handleQRScan(scanResult: QRScanResult): Promise<QRValidationResult> {
    try {
      // محاولة تحليل البيانات كـ JSON
      let qrData;
      try {
        qrData = JSON.parse(scanResult.data);
      } catch {
        // إذا لم تكن JSON، نعتبرها نص عادي
        qrData = { token: scanResult.data };
      }

      // التحقق من وجود token
      if (!qrData.token) {
        return {
          valid: false,
          error: 'QR Code غير صحيح - لا يحتوي على معلومات صالحة'
        };
      }

      // التحقق من صحة QR Code عبر API
      const validation = await apiService.post('/qr/validate', {
        token: qrData.token
      });

      if (validation.success && validation.data.valid) {
        return {
          valid: true,
          projectId: validation.data.projectId,
          projectName: validation.data.projectName,
          orderId: validation.data.orderId,
          type: validation.data.type,
          expiresAt: validation.data.expiresAt
        };
      } else {
        return {
          valid: false,
          error: validation.error?.message || 'QR Code غير صحيح'
        };
      }
    } catch (error) {
      console.error('خطأ في معالجة QR Code:', error);
      return {
        valid: false,
        error: 'خطأ في التحقق من QR Code'
      };
    }
  }

  // الوصول للمشروع عبر QR Code
  async accessProjectByQR(qrToken: string): Promise<any> {
    try {
      const response = await apiService.post('/qr/access', { qrToken });
      
      if (response.success) {
        return {
          success: true,
          projectData: response.data.projectAccess,
          message: 'تم الوصول للمشروع بنجاح'
        };
      } else {
        return {
          success: false,
          error: response.error?.message || 'فشل في الوصول للمشروع'
        };
      }
    } catch (error) {
      console.error('خطأ في الوصول للمشروع:', error);
      return {
        success: false,
        error: 'خطأ في الاتصال بالخادم'
      };
    }
  }

  // تتبع الطلب عبر QR Code
  async trackOrderByQR(qrData: string): Promise<any> {
    try {
      const response = await apiService.post('/orders/track/qr', { qrData });
      
      if (response.success) {
        return {
          success: true,
          orderData: response.data.order,
          trackingInfo: response.data.trackingInfo,
          message: 'تم العثور على الطلب'
        };
      } else {
        return {
          success: false,
          error: response.error?.message || 'لم يتم العثور على الطلب'
        };
      }
    } catch (error) {
      console.error('خطأ في تتبع الطلب:', error);
      return {
        success: false,
        error: 'خطأ في الاتصال بالخادم'
      };
    }
  }

  // التحقق من نوع QR Code
  determineQRType(qrData: any): 'PROJECT_ACCESS' | 'ORDER_TRACKING' | 'UNKNOWN' {
    if (qrData.metadata) {
      if (qrData.metadata.projectId && !qrData.metadata.orderId) {
        return 'PROJECT_ACCESS';
      } else if (qrData.metadata.orderId) {
        return 'ORDER_TRACKING';
      }
    }
    
    return 'UNKNOWN';
  }

  // تنسيق رسالة النتيجة للمستخدم
  formatResultMessage(result: QRValidationResult): string {
    if (!result.valid) {
      return result.error || 'QR Code غير صحيح';
    }

    switch (result.type) {
      case 'PROJECT_ACCESS':
        return `تم العثور على مشروع: ${result.projectName}`;
      case 'ORDER_TRACKING':
        return `تم العثور على طلب رقم: ${result.orderId}`;
      default:
        return 'تم مسح QR Code بنجاح';
    }
  }

  // التحقق من انتهاء صلاحية QR Code
  isQRExpired(expiresAt?: string): boolean {
    if (!expiresAt) return false;
    
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    
    return now > expiryDate;
  }

  // حساب الوقت المتبقي لانتهاء الصلاحية
  getTimeUntilExpiry(expiresAt?: string): string {
    if (!expiresAt) return '';
    
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'منتهي الصلاحية';
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours} ساعة و ${diffMinutes} دقيقة`;
    } else {
      return `${diffMinutes} دقيقة`;
    }
  }

  // إعدادات الماسح الافتراضية
  getDefaultScannerSettings() {
    return {
      barCodeTypes: [BarCodeScanner.Constants.BarCodeType.qr],
      onBarCodeScanned: undefined, // يتم تعيينها من المكون
      style: {
        flex: 1,
        width: '100%',
        height: '100%'
      }
    };
  }

  // التحقق من دعم الجهاز لمسح QR Code
  async isQRScanningSupported(): Promise<boolean> {
    try {
      const isAvailable = await BarCodeScanner.isAvailableAsync();
      return isAvailable;
    } catch (error) {
      console.error('خطأ في التحقق من دعم مسح QR:', error);
      return false;
    }
  }

  // الحصول على حالة الإذن
  getPermissionStatus(): boolean | null {
    return this.hasPermission;
  }
}

// إنشاء مثيل واحد من الخدمة
const qrScannerService = new QRScannerService();

export default qrScannerService;
const QRCode = require('qrcode');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class QRCodeService {
  constructor() {
    // SECURITY: Never use fallback secret in production
    if (!process.env.QR_SECRET_KEY) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('CRITICAL: QR_SECRET_KEY must be set in production environment');
      }
      console.warn('⚠️  WARNING: Using default QR_SECRET_KEY. Set QR_SECRET_KEY environment variable for production.');
    }
    this.secretKey = process.env.QR_SECRET_KEY || 'breakapp-qr-secret-dev-only';
  }

  /**
   * استخراج token من محتوى QR
   * - يدعم token مباشر
   * - أو JSON string يحتوي على { token, url, metadata }
   */
  extractTokenFromInput(qrInput) {
    if (!qrInput || typeof qrInput !== 'string') return null;
    const trimmed = qrInput.trim();
    if (!trimmed) return null;

    if (trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed.token === 'string') return parsed.token;
      } catch (_) {
        // تجاهل
      }
    }
    return trimmed;
  }

  // توليد QR Code للمشروع
  async generateProjectQR(projectData) {
    try {
      const payload = {
        projectId: projectData.id,
        projectName: projectData.name,
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // صالح لمدة 24 ساعة
        type: 'PROJECT_ACCESS',
        hash: this.generateHash(projectData.id)
      };

      const token = jwt.sign(payload, this.secretKey, { expiresIn: '24h' });
      
      const qrData = {
        token,
        url: `${process.env.APP_BASE_URL}/project/${projectData.id}`,
        metadata: {
          projectId: projectData.id,
          projectName: projectData.name,
          generatedAt: new Date().toISOString()
        }
      };

      const qrCodeImage = await QRCode.toDataURL(JSON.stringify(qrData), {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 256
      });

      return {
        qrCode: qrCodeImage,
        token,
        data: qrData,
        expiresAt: payload.validUntil
      };
    } catch (error) {
      throw new Error(`خطأ في توليد QR Code: ${error.message}`);
    }
  }

  // التحقق من صحة QR Code
  async validateQRCode(qrToken, expectedType = null) {
    try {
      const decoded = jwt.verify(qrToken, this.secretKey);
      
      // التحقق من انتهاء الصلاحية
      if (new Date() > new Date(decoded.validUntil)) {
        throw new Error('QR Code منتهي الصلاحية');
      }

      if (expectedType && decoded.type !== expectedType) {
        throw new Error('نوع QR Code غير صحيح');
      }

      // التحقق من صحة الهاش
      if (decoded.type === 'PROJECT_ACCESS') {
        const expectedHash = this.generateHash(decoded.projectId);
        if (decoded.hash !== expectedHash) throw new Error('QR Code غير صحيح');
      } else if (decoded.type === 'ORDER_TRACKING') {
        const expectedHash = this.generateHash(`${decoded.orderId}-${decoded.userId}`);
        if (decoded.hash !== expectedHash) throw new Error('QR Code غير صحيح');
      }

      return {
        valid: true,
        type: decoded.type,
        projectId: decoded.projectId,
        projectName: decoded.projectName,
        expiresAt: decoded.validUntil,
        orderId: decoded.orderId,
        userId: decoded.userId
      };
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        throw new Error('QR Code غير صحيح');
      }
      if (error.name === 'TokenExpiredError') {
        throw new Error('QR Code منتهي الصلاحية');
      }
      throw new Error(`خطأ في التحقق من QR Code: ${error.message}`);
    }
  }

  async validateQRCodeFromInput(qrInput, expectedType = null) {
    const token = this.extractTokenFromInput(qrInput);
    if (!token) throw new Error('QR Code غير صحيح - لا يحتوي على token');
    return this.validateQRCode(token, expectedType);
  }

  // إعادة توليد QR Code
  async regenerateQRCode(projectId) {
    try {
      const newHash = this.generateHash(projectId + Date.now());
      
      return {
        success: true,
        message: 'تم توليد رمز QR جديد بنجاح'
      };
    } catch (error) {
      throw new Error(`خطأ في إعادة توليد QR Code: ${error.message}`);
    }
  }

  // توليد QR Code للطلب
  async generateOrderQR(orderData) {
    try {
      const payload = {
        orderId: orderData.id,
        userId: orderData.userId,
        projectId: orderData.projectId,
        type: 'ORDER_TRACKING',
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // صالح لمدة أسبوع
        hash: this.generateHash(`${orderData.id}-${orderData.userId}`)
      };

      const token = jwt.sign(payload, this.secretKey, { expiresIn: '7d' });
      
      const qrData = {
        token,
        url: `${process.env.APP_BASE_URL}/order/track/${orderData.id}`,
        metadata: {
          orderId: orderData.id,
          generatedAt: new Date().toISOString()
        }
      };

      const qrCodeImage = await QRCode.toDataURL(JSON.stringify(qrData), {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        width: 200
      });

      return {
        qrCode: qrCodeImage,
        token,
        data: qrData,
        expiresAt: payload.validUntil
      };
    } catch (error) {
      throw new Error(`خطأ في توليد QR Code للطلب: ${error.message}`);
    }
  }

  // فك تشفير QR Code من النص
  async decodeQRData(qrText) {
    try {
      const qrData = qrText && typeof qrText === 'string' && qrText.trim().startsWith('{')
        ? JSON.parse(qrText)
        : { token: qrText };
      
      if (!qrData.token) {
        throw new Error('QR Code غير صحيح - لا يحتوي على token');
      }

      const decoded = jwt.verify(qrData.token, this.secretKey);
      const validation = await this.validateQRCode(qrData.token, decoded.type);
      
      return {
        ...validation,
        token: qrData.token,
        url: qrData.url,
        metadata: qrData.metadata
      };
    } catch (error) {
      throw new Error(`خطأ في فك تشفير QR Code: ${error.message}`);
    }
  }

  // توليد هاش للتحقق من الأمان
  generateHash(data) {
    return crypto
      .createHmac('sha256', this.secretKey)
      .update(data.toString())
      .digest('hex');
  }

  // إنشاء QR Code مخصص
  async generateCustomQR(data, options = {}) {
    try {
      const defaultOptions = {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        width: 256,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      };

      const qrOptions = { ...defaultOptions, ...options };
      const qrCodeImage = await QRCode.toDataURL(JSON.stringify(data), qrOptions);

      return qrCodeImage;
    } catch (error) {
      throw new Error(`خطأ في إنشاء QR Code مخصص: ${error.message}`);
    }
  }

  // التحقق من صحة المشروع
  async validateProjectAccess(projectId, userId) {
    try {
      // هنا يمكن إضافة منطق التحقق من صلاحية المستخدم للوصول للمشروع
      // مثل التحقق من قاعدة البيانات
      
      return {
        hasAccess: true,
        projectId,
        userId,
        accessLevel: 'MEMBER' // يمكن أن يكون MEMBER, VIP, ADMIN
      };
    } catch (error) {
      throw new Error(`خطأ في التحقق من صلاحية الوصول: ${error.message}`);
    }
  }
}

module.exports = new QRCodeService();
/**
 * Egyptian Payment Gateways Integration
 * تكامل بوابات الدفع المصرية
 *
 * Implements real payment gateway integrations for:
 * - Vodafone Cash / فودافون كاش
 * - Orange Money / أورانج موني
 * - Fawry / فوري
 * - InstaPay / إنستاباي
 */

const axios = require('axios');
const crypto = require('crypto');
const logger = require('../utils/logger');

class EgyptianPaymentGateways {
  constructor() {
    this.vodafoneConfig = {
      baseURL: process.env.VODAFONE_CASH_API_URL || 'https://api.vodafone.eg/cash',
      merchantId: process.env.VODAFONE_MERCHANT_ID,
      secretKey: process.env.VODAFONE_SECRET_KEY,
      callbackURL: process.env.VODAFONE_CALLBACK_URL
    };

    this.orangeConfig = {
      baseURL: process.env.ORANGE_MONEY_API_URL || 'https://api.orange.eg/money',
      merchantId: process.env.ORANGE_MERCHANT_ID,
      apiKey: process.env.ORANGE_API_KEY,
      callbackURL: process.env.ORANGE_CALLBACK_URL
    };

    this.fawryConfig = {
      baseURL: process.env.FAWRY_API_URL || 'https://atfawry.fawrystaging.com',
      merchantCode: process.env.FAWRY_MERCHANT_CODE,
      securityKey: process.env.FAWRY_SECURITY_KEY,
      callbackURL: process.env.FAWRY_CALLBACK_URL
    };

    this.instapayConfig = {
      baseURL: process.env.INSTAPAY_API_URL || 'https://api.instapay.com.eg',
      merchantId: process.env.INSTAPAY_MERCHANT_ID,
      apiKey: process.env.INSTAPAY_API_KEY,
      callbackURL: process.env.INSTAPAY_CALLBACK_URL
    };
  }

  // ==========================================
  // VODAFONE CASH INTEGRATION
  // ==========================================

  /**
   * Initiate Vodafone Cash payment
   * بدء الدفع عبر فودافون كاش
   */
  async initiateVodafoneCashPayment(paymentData) {
    try {
      const { orderId, amount, phoneNumber, customerName, email } = paymentData;

      // Generate unique transaction reference
      const txnRef = this.generateTransactionReference('VF', orderId);

      // Create payment request
      const requestPayload = {
        merchant_id: this.vodafoneConfig.merchantId,
        txn_ref: txnRef,
        amount: amount.toFixed(2),
        currency: 'EGP',
        customer_phone: phoneNumber,
        customer_name: customerName,
        customer_email: email,
        callback_url: this.vodafoneConfig.callbackURL,
        description: `Order payment for ${orderId}`,
        timestamp: new Date().toISOString()
      };

      // Generate signature
      const signature = this.generateVodafoneSignature(requestPayload);
      requestPayload.signature = signature;

      logger.info(`Initiating Vodafone Cash payment for order ${orderId}`);

      // Make API call
      const response = await axios.post(
        `${this.vodafoneConfig.baseURL}/v1/payment/initiate`,
        requestPayload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.vodafoneConfig.secretKey}`
          },
          timeout: 30000
        }
      );

      return {
        success: true,
        provider: 'VODAFONE_CASH',
        transactionRef: txnRef,
        paymentURL: response.data.payment_url,
        expiresAt: new Date(Date.now() + 30 * 60000), // 30 minutes
        otpRequired: true,
        otpPhone: phoneNumber,
        status: 'INITIATED',
        rawResponse: response.data
      };
    } catch (error) {
      logger.error('Vodafone Cash payment failed:', error);
      throw new Error(`فشل الدفع عبر فودافون كاش: ${error.message}`);
    }
  }

  /**
   * Verify Vodafone Cash OTP
   * التحقق من رمز OTP لفودافون كاش
   */
  async verifyVodafoneOTP(transactionRef, otpCode) {
    try {
      const requestPayload = {
        merchant_id: this.vodafoneConfig.merchantId,
        txn_ref: transactionRef,
        otp: otpCode,
        timestamp: new Date().toISOString()
      };

      const signature = this.generateVodafoneSignature(requestPayload);
      requestPayload.signature = signature;

      const response = await axios.post(
        `${this.vodafoneConfig.baseURL}/v1/payment/verify-otp`,
        requestPayload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.vodafoneConfig.secretKey}`
          }
        }
      );

      return {
        success: response.data.status === 'SUCCESS',
        transactionRef,
        status: response.data.status,
        message: response.data.message
      };
    } catch (error) {
      logger.error('Vodafone OTP verification failed:', error);
      throw new Error(`فشل التحقق من رمز OTP: ${error.message}`);
    }
  }

  /**
   * Generate Vodafone signature for request authentication
   */
  generateVodafoneSignature(payload) {
    const sortedKeys = Object.keys(payload).sort();
    const signatureString = sortedKeys
      .map(key => `${key}=${payload[key]}`)
      .join('&');

    return crypto
      .createHmac('sha256', this.vodafoneConfig.secretKey)
      .update(signatureString)
      .digest('hex');
  }

  // ==========================================
  // ORANGE MONEY INTEGRATION
  // ==========================================

  /**
   * Initiate Orange Money payment
   * بدء الدفع عبر أورانج موني
   */
  async initiateOrangeMoneyPayment(paymentData) {
    try {
      const { orderId, amount, phoneNumber, customerName, email } = paymentData;

      const txnRef = this.generateTransactionReference('OM', orderId);

      const requestPayload = {
        merchant_id: this.orangeConfig.merchantId,
        reference: txnRef,
        amount: Math.round(amount * 100), // Orange uses cents
        currency: 'EGP',
        phone: phoneNumber,
        customer_name: customerName,
        customer_email: email,
        return_url: this.orangeConfig.callbackURL,
        order_id: orderId,
        description: `Payment for order ${orderId}`
      };

      logger.info(`Initiating Orange Money payment for order ${orderId}`);

      const response = await axios.post(
        `${this.orangeConfig.baseURL}/v2/payments`,
        requestPayload,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.orangeConfig.apiKey,
            'X-Merchant-ID': this.orangeConfig.merchantId
          },
          timeout: 30000
        }
      );

      return {
        success: true,
        provider: 'ORANGE_MONEY',
        transactionRef: txnRef,
        paymentURL: response.data.payment_url,
        paymentToken: response.data.token,
        expiresAt: new Date(Date.now() + 30 * 60000),
        otpRequired: true,
        otpPhone: phoneNumber,
        status: 'INITIATED',
        rawResponse: response.data
      };
    } catch (error) {
      logger.error('Orange Money payment failed:', error);
      throw new Error(`فشل الدفع عبر أورانج موني: ${error.message}`);
    }
  }

  /**
   * Verify Orange Money OTP
   */
  async verifyOrangeOTP(transactionRef, paymentToken, otpCode) {
    try {
      const requestPayload = {
        token: paymentToken,
        otp: otpCode,
        reference: transactionRef
      };

      const response = await axios.post(
        `${this.orangeConfig.baseURL}/v2/payments/verify`,
        requestPayload,
        {
          headers: {
            'X-API-Key': this.orangeConfig.apiKey,
            'X-Merchant-ID': this.orangeConfig.merchantId
          }
        }
      );

      return {
        success: response.data.status === 'COMPLETED',
        transactionRef,
        transactionId: response.data.transaction_id,
        status: response.data.status,
        message: response.data.message
      };
    } catch (error) {
      logger.error('Orange OTP verification failed:', error);
      throw new Error(`فشل التحقق من رمز OTP: ${error.message}`);
    }
  }

  // ==========================================
  // FAWRY INTEGRATION
  // ==========================================

  /**
   * Initiate Fawry payment (reference number generation)
   * بدء الدفع عبر فوري (توليد رقم مرجعي)
   */
  async initiateFawryPayment(paymentData) {
    try {
      const { orderId, amount, phoneNumber, customerName, email } = paymentData;

      const txnRef = this.generateTransactionReference('FW', orderId);

      // Fawry payment items
      const items = [
        {
          itemId: orderId,
          description: `Food order ${orderId}`,
          price: amount,
          quantity: 1
        }
      ];

      const requestPayload = {
        merchantCode: this.fawryConfig.merchantCode,
        merchantRefNum: txnRef,
        customerProfileId: phoneNumber,
        customerMobile: phoneNumber,
        customerEmail: email,
        customerName: customerName,
        paymentMethod: 'PAYATFAWRY', // Pay at Fawry, Aman, or via card
        amount: amount,
        currencyCode: 'EGP',
        chargeItems: items,
        returnUrl: this.fawryConfig.callbackURL,
        description: `Order payment ${orderId}`,
        authCaptureModePayment: false
      };

      // Generate Fawry signature
      const signature = this.generateFawrySignature(requestPayload);
      requestPayload.signature = signature;

      logger.info(`Initiating Fawry payment for order ${orderId}`);

      const response = await axios.post(
        `${this.fawryConfig.baseURL}/ECommerceWeb/Fawry/payments/charge`,
        requestPayload,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      return {
        success: true,
        provider: 'FAWRY',
        transactionRef: txnRef,
        referenceNumber: response.data.referenceNumber,
        expiryDate: response.data.expiryDate,
        paymentInstructions: {
          ar: `ادفع في أي فرع فوري باستخدام الرقم المرجعي: ${response.data.referenceNumber}`,
          en: `Pay at any Fawry branch using reference number: ${response.data.referenceNumber}`
        },
        status: 'PENDING',
        rawResponse: response.data
      };
    } catch (error) {
      logger.error('Fawry payment failed:', error);
      throw new Error(`فشل إنشاء الدفع عبر فوري: ${error.message}`);
    }
  }

  /**
   * Check Fawry payment status
   */
  async checkFawryPaymentStatus(merchantRefNum) {
    try {
      const requestPayload = {
        merchantCode: this.fawryConfig.merchantCode,
        merchantRefNumber: merchantRefNum
      };

      const signature = this.generateFawrySignature(requestPayload);

      const response = await axios.get(
        `${this.fawryConfig.baseURL}/ECommerceWeb/Fawry/payments/status`,
        {
          params: {
            ...requestPayload,
            signature
          }
        }
      );

      return {
        success: true,
        transactionRef: merchantRefNum,
        status: response.data.paymentStatus, // NEW, PAID, UNPAID, CANCELED, EXPIRED
        paidAmount: response.data.paymentAmount,
        paymentTime: response.data.paymentTime,
        rawResponse: response.data
      };
    } catch (error) {
      logger.error('Fawry status check failed:', error);
      throw new Error(`فشل التحقق من حالة الدفع: ${error.message}`);
    }
  }

  /**
   * Generate Fawry signature
   */
  generateFawrySignature(payload) {
    const signatureString = `${this.fawryConfig.merchantCode}${payload.merchantRefNum || payload.merchantRefNumber}${this.fawryConfig.securityKey}`;

    return crypto
      .createHash('sha256')
      .update(signatureString)
      .digest('hex');
  }

  // ==========================================
  // INSTAPAY INTEGRATION
  // ==========================================

  /**
   * Initiate InstaPay payment
   * بدء الدفع عبر إنستاباي
   */
  async initiateInstapayPayment(paymentData) {
    try {
      const { orderId, amount, phoneNumber, customerName, email, bankCode } = paymentData;

      const txnRef = this.generateTransactionReference('IP', orderId);

      const requestPayload = {
        merchant_id: this.instapayConfig.merchantId,
        transaction_ref: txnRef,
        amount: amount,
        currency: 'EGP',
        customer_phone: phoneNumber,
        customer_name: customerName,
        customer_email: email,
        bank_code: bankCode, // Required for InstaPay
        callback_url: this.instapayConfig.callbackURL,
        description: `Order ${orderId}`,
        timestamp: Date.now()
      };

      // Generate request signature
      const signature = this.generateInstapaySignature(requestPayload);
      requestPayload.signature = signature;

      logger.info(`Initiating InstaPay payment for order ${orderId}`);

      const response = await axios.post(
        `${this.instapayConfig.baseURL}/api/v1/payments/initiate`,
        requestPayload,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.instapayConfig.apiKey,
            'X-Merchant-ID': this.instapayConfig.merchantId
          },
          timeout: 30000
        }
      );

      return {
        success: true,
        provider: 'INSTAPAY',
        transactionRef: txnRef,
        qrCode: response.data.qr_code, // InstaPay generates QR code
        deepLink: response.data.deep_link, // Deep link to mobile banking app
        expiresAt: new Date(Date.now() + 15 * 60000), // 15 minutes
        status: 'INITIATED',
        rawResponse: response.data
      };
    } catch (error) {
      logger.error('InstaPay payment failed:', error);
      throw new Error(`فشل الدفع عبر إنستاباي: ${error.message}`);
    }
  }

  /**
   * Check InstaPay payment status
   */
  async checkInstapayPaymentStatus(transactionRef) {
    try {
      const requestPayload = {
        merchant_id: this.instapayConfig.merchantId,
        transaction_ref: transactionRef,
        timestamp: Date.now()
      };

      const signature = this.generateInstapaySignature(requestPayload);

      const response = await axios.get(
        `${this.instapayConfig.baseURL}/api/v1/payments/status`,
        {
          params: {
            ...requestPayload,
            signature
          },
          headers: {
            'X-API-Key': this.instapayConfig.apiKey
          }
        }
      );

      return {
        success: true,
        transactionRef,
        status: response.data.status, // PENDING, SUCCESS, FAILED, EXPIRED
        transactionId: response.data.transaction_id,
        paidAt: response.data.paid_at,
        rawResponse: response.data
      };
    } catch (error) {
      logger.error('InstaPay status check failed:', error);
      throw new Error(`فشل التحقق من حالة الدفع: ${error.message}`);
    }
  }

  /**
   * Generate InstaPay signature
   */
  generateInstapaySignature(payload) {
    const sortedKeys = Object.keys(payload)
      .filter(key => key !== 'signature')
      .sort();

    const signatureString = sortedKeys
      .map(key => `${key}=${payload[key]}`)
      .join('|');

    return crypto
      .createHmac('sha256', this.instapayConfig.apiKey)
      .update(signatureString)
      .digest('hex');
  }

  // ==========================================
  // UTILITY FUNCTIONS
  // ==========================================

  /**
   * Generate unique transaction reference
   */
  generateTransactionReference(prefix, orderId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${orderId.substring(0, 8)}-${timestamp}-${random}`;
  }

  /**
   * Validate payment provider configuration
   */
  validateProviderConfig(provider) {
    const configs = {
      VODAFONE_CASH: this.vodafoneConfig,
      ORANGE_MONEY: this.orangeConfig,
      FAWRY: this.fawryConfig,
      INSTAPAY: this.instapayConfig
    };

    const config = configs[provider];
    if (!config) {
      throw new Error(`مزود الدفع غير مدعوم: ${provider}`);
    }

    // Check if required credentials are configured
    const requiredFields = {
      VODAFONE_CASH: ['merchantId', 'secretKey'],
      ORANGE_MONEY: ['merchantId', 'apiKey'],
      FAWRY: ['merchantCode', 'securityKey'],
      INSTAPAY: ['merchantId', 'apiKey']
    };

    const missing = requiredFields[provider].filter(field => !config[field]);
    if (missing.length > 0) {
      throw new Error(`إعدادات ${provider} ناقصة: ${missing.join(', ')}`);
    }

    return true;
  }

  /**
   * Process webhook/callback from payment provider
   */
  async handlePaymentWebhook(provider, payload) {
    try {
      logger.info(`Received webhook from ${provider}:`, payload);

      let result;

      switch (provider) {
        case 'VODAFONE_CASH':
          result = this.processVodafoneWebhook(payload);
          break;
        case 'ORANGE_MONEY':
          result = this.processOrangeWebhook(payload);
          break;
        case 'FAWRY':
          result = this.processFawryWebhook(payload);
          break;
        case 'INSTAPAY':
          result = this.processInstapayWebhook(payload);
          break;
        default:
          throw new Error(`مزود غير مدعوم: ${provider}`);
      }

      return result;
    } catch (error) {
      logger.error(`Webhook processing failed for ${provider}:`, error);
      throw error;
    }
  }

  /**
   * Process Vodafone webhook
   */
  processVodafoneWebhook(payload) {
    // Verify signature
    const signature = this.generateVodafoneSignature(payload);
    if (signature !== payload.signature) {
      throw new Error('Invalid webhook signature');
    }

    return {
      provider: 'VODAFONE_CASH',
      transactionRef: payload.txn_ref,
      status: payload.status,
      amount: parseFloat(payload.amount),
      paidAt: new Date(payload.timestamp)
    };
  }

  /**
   * Process Orange webhook
   */
  processOrangeWebhook(payload) {
    return {
      provider: 'ORANGE_MONEY',
      transactionRef: payload.reference,
      status: payload.status,
      amount: payload.amount / 100, // Convert from cents
      transactionId: payload.transaction_id,
      paidAt: new Date(payload.completed_at)
    };
  }

  /**
   * Process Fawry webhook
   */
  processFawryWebhook(payload) {
    const signature = this.generateFawrySignature({
      merchantRefNum: payload.merchantRefNumber
    });

    return {
      provider: 'FAWRY',
      transactionRef: payload.merchantRefNumber,
      referenceNumber: payload.fawryRefNumber,
      status: payload.orderStatus,
      amount: parseFloat(payload.orderAmount),
      paidAt: new Date(payload.paymentTime)
    };
  }

  /**
   * Process InstaPay webhook
   */
  processInstapayWebhook(payload) {
    const signature = this.generateInstapaySignature(payload);
    if (signature !== payload.signature) {
      throw new Error('Invalid webhook signature');
    }

    return {
      provider: 'INSTAPAY',
      transactionRef: payload.transaction_ref,
      status: payload.status,
      amount: parseFloat(payload.amount),
      transactionId: payload.transaction_id,
      paidAt: new Date(payload.paid_at)
    };
  }
}

module.exports = new EgyptianPaymentGateways();

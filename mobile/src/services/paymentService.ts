/**
 * Payment Service
 * خدمة معالجة المدفوعات باستخدام Stripe و PayPal
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'apple_pay' | 'google_pay';
  last4?: string;
  brand?: string;
  email?: string;
  isDefault: boolean;
}

interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'succeeded' | 'failed';
}

interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  error?: string;
  requiresAction?: boolean;
  clientSecret?: string;
}

interface InvoiceData {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  createdAt: string;
  pdfUrl?: string;
}

class PaymentService {
  private stripePublicKey: string;
  private paypalClientId: string;

  constructor() {
    this.stripePublicKey = process.env.EXPO_PUBLIC_STRIPE_PUBLIC_KEY || '';
    this.paypalClientId = process.env.EXPO_PUBLIC_PAYPAL_CLIENT_ID || '';
  }

  /**
   * إنشاء نية دفع جديدة
   */
  async createPaymentIntent(amount: number, currency: string = 'EGP'): Promise<PaymentIntent> {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/create-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to cents
          currency,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'فشل إنشاء نية الدفع');
      }

      return data.data;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

  /**
   * تأكيد الدفع
   */
  async confirmPayment(paymentMethodId: string, paymentIntentId: string): Promise<PaymentResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({
          paymentMethodId,
          paymentIntentId,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'فشل تأكيد الدفع');
      }

      return {
        success: data.success,
        paymentIntentId: data.data?.paymentIntentId,
        requiresAction: data.data?.requiresAction,
        clientSecret: data.data?.clientSecret,
      };
    } catch (error) {
      console.error('Error confirming payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'فشل تأكيد الدفع',
      };
    }
  }

  /**
   * حفظ طريقة دفع
   */
  async savePaymentMethod(paymentMethodId: string): Promise<PaymentMethod> {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/save-method`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({ paymentMethodId }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'فشل حفظ طريقة الدفع');
      }

      return data.data;
    } catch (error) {
      console.error('Error saving payment method:', error);
      throw error;
    }
  }

  /**
   * الحصول على طرق الدفع المحفوظة
   */
  async getSavedPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/methods`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'فشل تحميل طرق الدفع');
      }

      return data.data;
    } catch (error) {
      console.error('Error getting payment methods:', error);
      throw error;
    }
  }

  /**
   * حذف طريقة دفع
   */
  async deletePaymentMethod(methodId: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/methods/${methodId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error deleting payment method:', error);
      return false;
    }
  }

  /**
   * إنشاء فاتورة
   */
  async createInvoice(orderId: string): Promise<InvoiceData> {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({ orderId }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'فشل إنشاء الفاتورة');
      }

      return data.data;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }

  /**
   * الحصول على فواتير المستخدم
   */
  async getUserInvoices(): Promise<InvoiceData[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/invoices`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'فشل تحميل الفواتير');
      }

      return data.data;
    } catch (error) {
      console.error('Error getting invoices:', error);
      throw error;
    }
  }

  /**
   * معالجة استرداد الأموال
   */
  async processRefund(paymentIntentId: string, amount?: number): Promise<PaymentResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({
          paymentIntentId,
          amount: amount ? Math.round(amount * 100) : undefined,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'فشل معالجة الاسترداد');
      }

      return {
        success: data.success,
        paymentIntentId: data.data?.refundId,
      };
    } catch (error) {
      console.error('Error processing refund:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'فشل معالجة الاسترداد',
      };
    }
  }

  /**
   * التحقق من صحة البطاقة
   */
  validateCardNumber(cardNumber: string): boolean {
    // Remove spaces and dashes
    const cleaned = cardNumber.replace(/[\s-]/g, '');
    
    // Check if it's all digits and has valid length
    if (!/^\d{13,19}$/.test(cleaned)) {
      return false;
    }

    // Luhn algorithm
    let sum = 0;
    let isEven = false;
    
    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i]);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  }

  /**
   * تحديد نوع البطاقة
   */
  getCardType(cardNumber: string): string {
    const cleaned = cardNumber.replace(/[\s-]/g, '');
    
    if (/^4/.test(cleaned)) return 'visa';
    if (/^5[1-5]/.test(cleaned)) return 'mastercard';
    if (/^3[47]/.test(cleaned)) return 'amex';
    if (/^6(?:011|5)/.test(cleaned)) return 'discover';
    
    return 'unknown';
  }

  /**
   * حساب العمولة والضرائب
   */
  calculateFees(subtotal: number, taxRate: number = 0.14, commissionRate: number = 0.025): {
    subtotal: number;
    tax: number;
    commission: number;
    total: number;
  } {
    const tax = subtotal * taxRate;
    const commission = subtotal * commissionRate;
    const total = subtotal + tax + commission;

    return {
      subtotal,
      tax: Math.round(tax * 100) / 100,
      commission: Math.round(commission * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }

  /**
   * الحصول على توكن المصادقة
   */
  private async getAuthToken(): Promise<string> {
    try {
      const token = await AsyncStorage.getItem('authToken');
      return token || '';
    } catch (error) {
      console.error('Error getting auth token:', error);
      return '';
    }
  }
}

// إنشاء مثيل واحد من الخدمة
const paymentService = new PaymentService();

export default paymentService;
export type { PaymentMethod, PaymentIntent, PaymentResult, InvoiceData };
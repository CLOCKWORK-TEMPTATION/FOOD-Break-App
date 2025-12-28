/**
 * Payment Service
 * خدمة المدفوعات والفواتير
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

// أنواع البيانات
export interface Payment {
  id: string;
  userId: string;
  orderId?: string;
  paymentIntentId: string;
  paymentMethodId?: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
  provider: 'STRIPE' | 'PAYPAL' | 'APPLE_PAY' | 'GOOGLE_PAY' | 'CASH' | 'BANK_TRANSFER';
  refundId?: string;
  refundAmount?: number;
  refundedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  order?: any;
  user?: any;
}

export interface Invoice {
  id: string;
  userId: string;
  orderId?: string;
  paymentId?: string;
  invoiceNumber: string;
  amount: number;
  tax: number;
  discount: number;
  totalAmount: number;
  currency: string;
  items?: any;
  notes?: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'REFUNDED';
  paidAt?: string;
  dueDate?: string;
  pdfUrl?: string;
  pdfGenerated: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentStatistics {
  totalPayments: number;
  completedPayments: number;
  totalAmount: number;
  completedAmount: number;
  refundedAmount: number;
  successRate: string;
}

/**
 * إنشاء نية دفع جديدة
 */
export const createPaymentIntent = async (amount: number, currency = 'egp', orderId?: string) => {
  const response = await axios.post(`${API_URL}/payments/create-intent`, {
    amount,
    currency,
    orderId
  });
  return response.data.data;
};

/**
 * تأكيد الدفع
 */
export const confirmPayment = async (paymentIntentId: string) => {
  const response = await axios.post(`${API_URL}/payments/confirm`, { paymentIntentId });
  return response.data.data;
};

/**
 * الحصول على مدفوعات المستخدم
 */
export const getUserPayments = async (filters?: any) => {
  const response = await axios.get(`${API_URL}/payments`, { params: filters });
  return {
    payments: response.data.data as Payment[],
    pagination: response.data.pagination
  };
};

/**
 * إنشاء فاتورة جديدة
 */
export const createInvoice = async (invoiceData: any): Promise<Invoice> => {
  const response = await axios.post(`${API_URL}/payments/invoices`, invoiceData);
  return response.data.data;
};

/**
 * الحصول على فواتير المستخدم
 */
export const getUserInvoices = async (filters?: any) => {
  const response = await axios.get(`${API_URL}/payments/invoices`, { params: filters });
  return {
    invoices: response.data.data as Invoice[],
    pagination: response.data.pagination
  };
};

/**
 * معالجة استرداد الأموال
 */
export const processRefund = async (paymentIntentId: string, amount?: number, reason?: string) => {
  const response = await axios.post(`${API_URL}/payments/refund`, {
    paymentIntentId,
    amount,
    reason
  });
  return response.data.data;
};

/**
 * الحصول على إحصائيات المدفوعات
 */
export const getPaymentStatistics = async (userId?: string, startDate?: string, endDate?: string): Promise<PaymentStatistics> => {
  const response = await axios.get(`${API_URL}/payments/statistics`, {
    params: { userId, startDate, endDate }
  });
  return response.data.data;
};

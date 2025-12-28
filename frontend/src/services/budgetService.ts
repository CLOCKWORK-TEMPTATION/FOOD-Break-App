/**
 * Budget Service
 * خدمة إدارة الميزانيات والتنبيهات المالية
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

// أنواع البيانات
export interface Budget {
  id: string;
  name: string;
  type: 'VIP' | 'PRODUCER' | 'DEPARTMENT' | 'PROJECT';
  targetUserId?: string;
  maxLimit: number;
  usedAmount: number;
  warningThreshold: number;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  alerts?: CostAlert[];
}

export interface CostAlert {
  id: string;
  budgetId: string;
  userId: string;
  alertType: 'WARNING' | 'CRITICAL' | 'EXCEEDED' | 'RESET';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  currentAmount: number;
  budgetLimit: number;
  percentage: number;
  isRead: boolean;
  isResolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface BudgetFilters {
  page?: number;
  limit?: number;
  type?: 'VIP' | 'PRODUCER' | 'DEPARTMENT' | 'PROJECT';
  isActive?: boolean;
  targetUserId?: string;
}

export interface BudgetAnalytics {
  totalBudgets: number;
  activeBudgets: number;
  totalAllocated: number;
  totalSpent: number;
  totalRemaining: number;
  utilizationRate: number;
  alertsCount: number;
  criticalAlertsCount: number;
}

/**
 * إنشاء ميزانية جديدة
 */
export const createBudget = async (budgetData: Partial<Budget>): Promise<Budget> => {
  const response = await axios.post(`${API_URL}/budgets`, budgetData);
  return response.data.data;
};

/**
 * الحصول على جميع الميزانيات
 */
export const getAllBudgets = async (filters?: BudgetFilters) => {
  const response = await axios.get(`${API_URL}/budgets`, { params: filters });
  return {
    budgets: response.data.data,
    stats: response.data.stats,
    pagination: response.data.pagination
  };
};

/**
 * الحصول على ميزانية محددة
 */
export const getBudgetById = async (budgetId: string): Promise<Budget> => {
  const response = await axios.get(`${API_URL}/budgets/${budgetId}`);
  return response.data.data;
};

/**
 * تحديث الميزانية
 */
export const updateBudget = async (budgetId: string, updateData: Partial<Budget>): Promise<Budget> => {
  const response = await axios.put(`${API_URL}/budgets/${budgetId}`, updateData);
  return response.data.data;
};

/**
 * فحص الميزانية وإضافة مبلغ
 */
export const checkBudget = async (budgetId: string, amount: number) => {
  const response = await axios.post(`${API_URL}/budgets/${budgetId}/check`, { amount });
  return response.data.data;
};

/**
 * الحصول على تنبيهات الميزانية
 */
export const getBudgetAlerts = async (budgetId: string, filters?: any) => {
  const response = await axios.get(`${API_URL}/budgets/${budgetId}/alerts`, { params: filters });
  return {
    alerts: response.data.data,
    pagination: response.data.pagination
  };
};

/**
 * حل التنبيه
 */
export const resolveAlert = async (alertId: string): Promise<CostAlert> => {
  const response = await axios.put(`${API_URL}/budgets/alerts/${alertId}/resolve`);
  return response.data.data;
};

/**
 * إعادة تعيين الميزانية
 */
export const resetBudget = async (budgetId: string) => {
  const response = await axios.put(`${API_URL}/budgets/${budgetId}/reset`);
  return response.data.data;
};

/**
 * إنشاء تقرير الميزانية
 */
export const generateBudgetReport = async (budgetId: string, startDate?: string, endDate?: string) => {
  const response = await axios.get(`${API_URL}/budgets/${budgetId}/report`, {
    params: { startDate, endDate }
  });
  return response.data.data;
};

/**
 * الحصول على إحصائيات شاملة
 */
export const getBudgetAnalytics = async (startDate?: string, endDate?: string): Promise<BudgetAnalytics> => {
  const response = await axios.get(`${API_URL}/budgets/analytics/summary`, {
    params: { startDate, endDate }
  });
  return response.data.data;
};

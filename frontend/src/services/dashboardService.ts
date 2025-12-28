/**
 * Dashboard Service - خدمات لوحة التحكم
 * Services for admin dashboard operations
 */

import apiClient from './apiClient';

// أنواع البيانات
export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  avgDeliveryTime: number;
  todayOrders: number;
  todayRevenue: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  restaurantId: string;
  restaurant?: {
    id: string;
    name: string;
    logo?: string;
  };
  user?: {
    id: string;
    name: string;
    phone: string;
  };
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    notes?: string;
  }>;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  totalAmount: number;
  deliveryFee: number;
  deliveryAddress: string;
  estimatedDeliveryTime: number;
  actualDeliveryTime?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Restaurant {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  coverImage?: string;
  cuisine: string[];
  rating: number;
  totalOrders: number;
  todayOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  isActive: boolean;
  openingHours: string;
  closingHours: string;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description?: string;
  price: number;
  discountPrice?: number;
  image?: string;
  category: string;
  isAvailable: boolean;
  preparationTime: number;
  calories?: number;
  allergens?: string[];
}

export interface PredictiveInsight {
  id: string;
  type: 'demand_forecast' | 'peak_time' | 'popular_item' | 'reorder_suggestion';
  title: string;
  description: string;
  confidence: number;
  data: Record<string, unknown>;
  createdAt: string;
}

// خدمات الإحصائيات
export const statsService = {
  // جلب إحصائيات لوحة التحكم
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await apiClient.get('/admin/stats');
    return response.data.data;
  },

  // جلب إحصائيات لفترة زمنية محددة
  async getStatsByDateRange(startDate: string, endDate: string): Promise<DashboardStats> {
    const response = await apiClient.get('/admin/stats', {
      params: { startDate, endDate },
    });
    return response.data.data;
  },

  // جلب تقارير الأداء
  async getPerformanceReport(period: 'day' | 'week' | 'month'): Promise<unknown> {
    const response = await apiClient.get('/admin/reports/performance', {
      params: { period },
    });
    return response.data.data;
  },
};

// خدمات الطلبات
export const ordersService = {
  // جلب جميع الطلبات
  async getOrders(params?: {
    status?: string;
    restaurantId?: string;
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ orders: Order[]; total: number; page: number; totalPages: number }> {
    const response = await apiClient.get('/admin/orders', { params });
    return response.data.data;
  },

  // جلب طلب محدد
  async getOrderById(orderId: string): Promise<Order> {
    const response = await apiClient.get(`/admin/orders/${orderId}`);
    return response.data.data;
  },

  // تحديث حالة الطلب
  async updateOrderStatus(orderId: string, status: Order['status'], notes?: string): Promise<Order> {
    const response = await apiClient.patch(`/admin/orders/${orderId}/status`, {
      status,
      notes,
    });
    return response.data.data;
  },

  // إلغاء طلب
  async cancelOrder(orderId: string, reason: string): Promise<Order> {
    const response = await apiClient.post(`/admin/orders/${orderId}/cancel`, { reason });
    return response.data.data;
  },

  // جلب الطلبات المعلقة (Real-time)
  async getPendingOrders(): Promise<Order[]> {
    const response = await apiClient.get('/admin/orders/pending');
    return response.data.data;
  },
};

// خدمات المطاعم
export const restaurantsService = {
  // جلب جميع المطاعم
  async getRestaurants(params?: {
    isActive?: boolean;
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ restaurants: Restaurant[]; total: number }> {
    const response = await apiClient.get('/admin/restaurants', { params });
    return response.data.data;
  },

  // جلب مطعم محدد
  async getRestaurantById(restaurantId: string): Promise<Restaurant> {
    const response = await apiClient.get(`/admin/restaurants/${restaurantId}`);
    return response.data.data;
  },

  // إنشاء مطعم جديد
  async createRestaurant(data: Partial<Restaurant>): Promise<Restaurant> {
    const response = await apiClient.post('/admin/restaurants', data);
    return response.data.data;
  },

  // تحديث مطعم
  async updateRestaurant(restaurantId: string, data: Partial<Restaurant>): Promise<Restaurant> {
    const response = await apiClient.put(`/admin/restaurants/${restaurantId}`, data);
    return response.data.data;
  },

  // تفعيل/تعطيل مطعم
  async toggleRestaurantStatus(restaurantId: string): Promise<Restaurant> {
    const response = await apiClient.patch(`/admin/restaurants/${restaurantId}/toggle-status`);
    return response.data.data;
  },

  // حذف مطعم
  async deleteRestaurant(restaurantId: string): Promise<void> {
    await apiClient.delete(`/admin/restaurants/${restaurantId}`);
  },

  // جلب إحصائيات مطعم
  async getRestaurantStats(restaurantId: string): Promise<unknown> {
    const response = await apiClient.get(`/admin/restaurants/${restaurantId}/stats`);
    return response.data.data;
  },
};

// خدمات القائمة
export const menuService = {
  // جلب قائمة مطعم
  async getMenuItems(restaurantId: string): Promise<MenuItem[]> {
    const response = await apiClient.get(`/admin/restaurants/${restaurantId}/menu`);
    return response.data.data;
  },

  // إضافة عنصر للقائمة
  async createMenuItem(restaurantId: string, data: Partial<MenuItem>): Promise<MenuItem> {
    const response = await apiClient.post(`/admin/restaurants/${restaurantId}/menu`, data);
    return response.data.data;
  },

  // تحديث عنصر في القائمة
  async updateMenuItem(menuItemId: string, data: Partial<MenuItem>): Promise<MenuItem> {
    const response = await apiClient.put(`/admin/menu/${menuItemId}`, data);
    return response.data.data;
  },

  // حذف عنصر من القائمة
  async deleteMenuItem(menuItemId: string): Promise<void> {
    await apiClient.delete(`/admin/menu/${menuItemId}`);
  },

  // تبديل توفر العنصر
  async toggleAvailability(menuItemId: string): Promise<MenuItem> {
    const response = await apiClient.patch(`/admin/menu/${menuItemId}/toggle-availability`);
    return response.data.data;
  },

  // تحديث أسعار متعددة
  async bulkUpdatePrices(updates: Array<{ id: string; price: number }>): Promise<void> {
    await apiClient.post('/admin/menu/bulk-update-prices', { updates });
  },
};

// خدمات التنبيهات
export const notificationsService = {
  // إرسال إشعار
  async sendNotification(data: {
    type: string;
    recipients: 'all' | 'active_orders' | 'restaurant' | 'specific';
    restaurantId?: string;
    userIds?: string[];
    title: string;
    message: string;
  }): Promise<{ sent: number }> {
    const response = await apiClient.post('/admin/notifications/send', data);
    return response.data.data;
  },

  // جلب سجل الإشعارات
  async getNotificationHistory(params?: {
    page?: number;
    limit?: number;
  }): Promise<unknown[]> {
    const response = await apiClient.get('/admin/notifications/history', { params });
    return response.data.data;
  },
};

// خدمات التنبؤات
export const predictiveService = {
  // جلب تحليلات سلوك المستخدمين
  async getUserBehaviorAnalytics(restaurantId?: string): Promise<unknown> {
    const response = await apiClient.get('/predictive/user-behavior', {
      params: { restaurantId },
    });
    return response.data.data;
  },

  // جلب أنماط الطلبات
  async getOrderPatterns(restaurantId?: string): Promise<unknown> {
    const response = await apiClient.get('/predictive/order-patterns', {
      params: { restaurantId },
    });
    return response.data.data;
  },

  // جلب توقعات الكميات
  async getQuantityForecasts(restaurantId: string, date: string): Promise<unknown> {
    const response = await apiClient.get('/predictive/quantity-forecasts', {
      params: { restaurantId, date },
    });
    return response.data.data;
  },

  // جلب تقرير الطلب
  async getDemandForecastReport(restaurantId: string): Promise<unknown> {
    const response = await apiClient.get(`/predictive/demand-report/${restaurantId}`);
    return response.data.data;
  },

  // جلب رؤى تنبؤية
  async getPredictiveInsights(): Promise<PredictiveInsight[]> {
    const response = await apiClient.get('/predictive/insights');
    return response.data.data;
  },

  // جلب أوقات الذروة المتوقعة
  async getPeakTimePredictions(date: string): Promise<unknown> {
    const response = await apiClient.get('/predictive/peak-times', {
      params: { date },
    });
    return response.data.data;
  },
};

export default {
  stats: statsService,
  orders: ordersService,
  restaurants: restaurantsService,
  menu: menuService,
  notifications: notificationsService,
  predictive: predictiveService,
};

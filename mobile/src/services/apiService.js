/**
 * API Service للتطبيق المحمول
 * جميع الطلبات للـ Backend API
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';

// إنشاء axios instance مع التكوين الأساسي
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor لإضافة التوكن تلقائياً لكل الطلبات
apiClient.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('خطأ في جلب التوكن:', error);
  }
  return config;
});

// Interceptor للتعامل مع أخطاء المصادقة
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      // حذف التوكن إذا انتهت صلاحيته
      await AsyncStorage.removeItem('userToken');
      // إعادة التوجيه لشاشة تسجيل الدخول
      // يتم معالجة هذا من قبل التطبيق الرئيسي
    }
    return Promise.reject(error);
  }
);

/**
 * Authentication APIs
 */
export const authService = {
  register: async (userData) => {
    try {
      const response = await apiClient.post('/auth/register', userData);
      if (response.data.data.token) {
        await AsyncStorage.setItem('userToken', response.data.data.token);
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'فشل التسجيل' };
    }
  },

  login: async (email, password) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      if (response.data.data.token) {
        await AsyncStorage.setItem('userToken', response.data.data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.data.user));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'فشل تسجيل الدخول' };
    }
  },

  logout: async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      return { success: true };
    } catch (error) {
      throw error;
    }
  }
};

/**
 * QR Code Validation APIs
 */
export const qrCodeService = {
  validateQR: async (qrCode) => {
    try {
      const response = await apiClient.post('/workflow/validate-qr', { qrCode });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'فشل التحقق من رمز QR' };
    }
  }
};

/**
 * Order APIs
 */
export const orderService = {
  submitOrder: async (orderData) => {
    try {
      const response = await apiClient.post('/workflow/orders', orderData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'فشل في تقديم الطلب' };
    }
  },

  confirmOrder: async (orderId, confirmed = true) => {
    try {
      const response = await apiClient.patch(`/workflow/orders/${orderId}/confirm`, { confirmed });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'فشل في تأكيد الطلب' };
    }
  },

  getUserOrders: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.projectId) params.append('projectId', filters.projectId);
      if (filters.status) params.append('status', filters.status);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);

      const response = await apiClient.get(`/workflow/orders?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'فشل في جلب الطلبات' };
    }
  },

  getOrderTracking: async (orderId) => {
    try {
      const response = await apiClient.get(`/workflow/orders/${orderId}/tracking`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'فشل في جلب بيانات التتبع' };
    }
  },

  updateDeliveryLocation: async (orderId, latitude, longitude) => {
    try {
      const response = await apiClient.patch(`/workflow/orders/${orderId}/location`, {
        latitude,
        longitude
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'فشل في تحديث الموقع' };
    }
  }
};

/**
 * Menu APIs
 */
export const menuService = {
  getMenus: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.restaurantId) params.append('restaurantId', filters.restaurantId);
      if (filters.menuType) params.append('menuType', filters.menuType);

      const response = await apiClient.get(`/menus?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'فشل في جلب القوائم' };
    }
  },

  getMenuById: async (menuId) => {
    try {
      const response = await apiClient.get(`/menus/${menuId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'فشل في جلب بيانات القائمة' };
    }
  }
};

/**
 * Restaurant APIs
 */
export const restaurantService = {
  getNearbyRestaurants: async (latitude, longitude, radius = 3) => {
    try {
      const params = new URLSearchParams({
        latitude,
        longitude,
        radius
      });

      const response = await apiClient.get(`/restaurants/nearby?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'فشل في جلب المطاعم القريبة' };
    }
  },

  getRestaurantById: async (restaurantId) => {
    try {
      const response = await apiClient.get(`/restaurants/${restaurantId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'فشل في جلب بيانات المطعم' };
    }
  },

  getRestaurantMenus: async (restaurantId) => {
    try {
      const response = await apiClient.get(`/restaurants/${restaurantId}/menus`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'فشل في جلب قائمة المطعم' };
    }
  }
};

/**
 * Notification APIs
 */
export const notificationService = {
  getNotifications: async (limit = 20) => {
    try {
      const response = await apiClient.get(`/notifications?limit=${limit}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'فشل في جلب الإشعارات' };
    }
  },

  markAsRead: async (notificationId) => {
    try {
      const response = await apiClient.patch(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'فشل في تحديث الإشعار' };
    }
  }
};

/**
 * Exception APIs
 */
export const exceptionService = {
  requestException: async (exceptionData) => {
    try {
      const response = await apiClient.post('/exceptions', exceptionData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'فشل في طلب الاستثناء' };
    }
  },

  getUserExceptions: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.projectId) params.append('projectId', filters.projectId);
      if (filters.status) params.append('status', filters.status);

      const response = await apiClient.get(`/exceptions?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'فشل في جلب الاستثناءات' };
    }
  }
};

/**
 * Recommendation APIs
 */
export const recommendationService = {
  getRecommendations: async (location = null) => {
    try {
      const params = location ? `?location=${encodeURIComponent(location)}` : '';
      const response = await apiClient.get(`/recommendations${params}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'فشل في جلب التوصيات' };
    }
  },

  saveRecommendation: async (recommendationData) => {
    try {
      const response = await apiClient.post('/recommendations', recommendationData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'فشل في حفظ التوصية' };
    }
  },

  getSavedRecommendations: async () => {
    try {
      const response = await apiClient.get('/recommendations/saved');
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'فشل في جلب التوصيات المحفوظة' };
    }
  },

  updateUserPreferences: async (preferences) => {
    try {
      const response = await apiClient.put('/recommendations/preferences', preferences);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'فشل في تحديث التفضيلات' };
    }
  },

  getUserPreferences: async () => {
    try {
      const response = await apiClient.get('/recommendations/preferences');
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'فشل في جلب التفضيلات' };
    }
  }
};

export default apiClient;

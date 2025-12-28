import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ملاحظة: في Expo استخدم EXPO_PUBLIC_API_URL
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: any;
  meta?: any;
};

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('userToken');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const authService = {
  register: async (userData: any): Promise<ApiResponse> => {
    const response = await apiClient.post('/auth/register', userData);
    const payload = response.data;
    const token = payload?.data?.token;
    if (token) {
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('authToken', token);
    }
    return payload;
  },

  login: async (email: string, password: string): Promise<ApiResponse> => {
    const response = await apiClient.post('/auth/login', { email, password });
    const payload = response.data;
    const token = payload?.data?.token;
    if (token) {
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('authToken', token);
    }
    return payload;
  },

  logout: async (): Promise<ApiResponse> => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('userData');
    return { success: true };
  }
};

const qrCodeService = {
  validateQR: async (qrCode: string): Promise<ApiResponse> => {
    const response = await apiClient.post('/workflow/validate-qr', { qrCode });
    return response.data;
  }
};

const restaurantService = {
  getNearbyRestaurants: async (latitude: number, longitude: number, radius: number = 3): Promise<ApiResponse> => {
    const response = await apiClient.get('/restaurants/nearby', { params: { latitude, longitude, radius } });
    return response.data;
  }
};

const menuService = {
  getMenus: async (filters: any = {}): Promise<ApiResponse> => {
    const response = await apiClient.get('/menus', { params: filters });
    return response.data;
  },

  getCoreMenu: async (): Promise<ApiResponse> => {
    const response = await apiClient.get('/menus/core');
    return response.data;
  },

  getGeographicMenu: async (latitude: number, longitude: number, radius: number = 3): Promise<ApiResponse> => {
    const response = await apiClient.get('/menus/geographic', { params: { latitude, longitude, radius } });
    return response.data;
  }
};

const orderService = {
  submitOrder: async (orderData: any): Promise<ApiResponse> => {
    const response = await apiClient.post('/workflow/orders', orderData);
    return response.data;
  },

  confirmOrder: async (orderId: string, confirmed: boolean = true): Promise<ApiResponse> => {
    const response = await apiClient.patch(`/workflow/orders/${orderId}/confirm`, { confirmed });
    return response.data;
  },

  getUserOrders: async (filters: any = {}): Promise<ApiResponse> => {
    const response = await apiClient.get('/workflow/orders', { params: filters });
    return response.data;
  },

  getOrderTracking: async (orderId: string): Promise<ApiResponse> => {
    const response = await apiClient.get(`/workflow/orders/${orderId}/tracking`);
    return response.data;
  },

  updateDeliveryLocation: async (orderId: string, latitude: number, longitude: number): Promise<ApiResponse> => {
    const response = await apiClient.patch(`/workflow/orders/${orderId}/location`, { latitude, longitude });
    return response.data;
  }
};

const notificationService = {
  getNotifications: async (options: any = {}): Promise<ApiResponse> => {
    const response = await apiClient.get('/notifications', { params: options });
    return response.data;
  },

  markAsRead: async (notificationId: string): Promise<ApiResponse> => {
    const response = await apiClient.patch(`/notifications/${notificationId}/read`);
    return response.data;
  }
};

const recommendationService = {
  getRecommendations: async (): Promise<ApiResponse> => {
    const response = await apiClient.get('/recommendations');
    return response.data;
  }
};

// Default export لتوافق الاستدعاءات القديمة (store + screens)
const apiService = {
  apiClient,
  authService,
  qrCodeService,
  restaurantService,
  menuService,
  orderService,
  notificationService,
  recommendationService,

  // اختصارات مستخدمة في بعض أجزاء التطبيق
  login: authService.login,
  register: authService.register,
  logout: authService.logout,

  accessProjectByQR: async (qrToken: string): Promise<ApiResponse> => {
    const response = await apiClient.post('/qr/access', { qrToken });
    return response.data;
  }
};

export {
  apiClient,
  authService,
  qrCodeService,
  restaurantService,
  menuService,
  orderService,
  notificationService,
  recommendationService
};

export default apiService;
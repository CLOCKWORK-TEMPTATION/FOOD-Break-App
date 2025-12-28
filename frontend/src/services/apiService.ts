/**
 * خدمة API العربية
 * Arabic API Service with localization support
 */

import { getSavedLanguage } from '../config/localization';

// أنواع البيانات
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  restaurant: {
    id: string;
    name: string;
    phone: string;
  };
  items: OrderItem[];
  status: string;
  totalAmount: number;
  deliveryAddress: string;
  deliveryTime: string;
  paymentMethod: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  price: number;
  category: string;
  categoryAr: string;
  image?: string;
  isAvailable: boolean;
  isHalal: boolean;
  isVegetarian: boolean;
  allergens: string[];
  nutritionInfo?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  restaurant: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Restaurant {
  id: string;
  name: string;
  nameAr: string;
  address: string;
  addressAr: string;
  phone: string;
  email: string;
  cuisineType: string;
  cuisineTypeAr: string;
  rating: number;
  deliveryTime: number;
  minimumOrder: number;
  deliveryFee: number;
  workingHours: {
    open: string;
    close: string;
  };
  isActive: boolean;
  isPartner: boolean;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

// فئة خدمة API
class ApiService {
  private baseURL: string;
  private token: string | null;

  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
    this.token = localStorage.getItem('token');
  }

  // إعداد الرؤوس
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept-Language': getSavedLanguage()
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  // معالجة الاستجابة
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('خطأ في معالجة الاستجابة:', error);
      throw error;
    }
  }

  // طلب عام
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const config: RequestInit = {
        headers: this.getHeaders(),
        ...options
      };

      const response = await fetch(url, config);
      return await this.handleResponse<T>(response);
    } catch (error) {
      console.error(`خطأ في طلب API ${endpoint}:`, error);
      throw error;
    }
  }

  // تحديث الرمز المميز
  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  // === خدمات المصادقة ===
  
  async login(credentials: LoginRequest): Promise<ApiResponse<{ token: string; user: any }>> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  }

  async register(userData: RegisterRequest): Promise<ApiResponse<{ token: string; user: any }>> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async logout(): Promise<ApiResponse> {
    const response = await this.request('/auth/logout', {
      method: 'POST'
    });
    this.setToken(null);
    return response;
  }

  async getCurrentUser(): Promise<ApiResponse<any>> {
    return this.request('/auth/me');
  }

  // === خدمات الطلبات ===

  async getOrders(params?: {
    status?: string;
    date?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ orders: Order[]; total: number }>> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/orders${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(endpoint);
  }

  async getOrder(orderId: string): Promise<ApiResponse<Order>> {
    return this.request(`/orders/${orderId}`);
  }

  async createOrder(orderData: {
    restaurantId: string;
    items: { itemId: string; quantity: number; notes?: string }[];
    deliveryAddress: string;
    deliveryTime: string;
    paymentMethod: string;
    notes?: string;
  }): Promise<ApiResponse<Order>> {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  }

  async updateOrderStatus(orderId: string, status: string): Promise<ApiResponse<Order>> {
    return this.request(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  async cancelOrder(orderId: string): Promise<ApiResponse<Order>> {
    return this.request(`/orders/${orderId}/cancel`, {
      method: 'PATCH'
    });
  }

  // === خدمات القوائم ===

  async getMenuItems(params?: {
    restaurantId?: string;
    category?: string;
    available?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ items: MenuItem[]; total: number }>> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/menu/items${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(endpoint);
  }

  async getMenuItem(itemId: string): Promise<ApiResponse<MenuItem>> {
    return this.request(`/menu/items/${itemId}`);
  }

  async createMenuItem(itemData: Partial<MenuItem>): Promise<ApiResponse<MenuItem>> {
    return this.request('/menu/items', {
      method: 'POST',
      body: JSON.stringify(itemData)
    });
  }

  async updateMenuItem(itemId: string, itemData: Partial<MenuItem>): Promise<ApiResponse<MenuItem>> {
    return this.request(`/menu/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(itemData)
    });
  }

  async deleteMenuItem(itemId: string): Promise<ApiResponse> {
    return this.request(`/menu/items/${itemId}`, {
      method: 'DELETE'
    });
  }

  async getCategories(): Promise<ApiResponse<{ categories: any[] }>> {
    return this.request('/menu/categories');
  }

  async createCategory(categoryData: {
    name: string;
    nameAr: string;
    description?: string;
    descriptionAr?: string;
    isActive: boolean;
  }): Promise<ApiResponse<any>> {
    return this.request('/menu/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData)
    });
  }

  // === خدمات المطاعم ===

  async getRestaurants(params?: {
    isActive?: boolean;
    isPartner?: boolean;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ restaurants: Restaurant[]; total: number }>> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/restaurants${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(endpoint);
  }

  async getRestaurant(restaurantId: string): Promise<ApiResponse<Restaurant>> {
    return this.request(`/restaurants/${restaurantId}`);
  }

  async createRestaurant(restaurantData: Partial<Restaurant>): Promise<ApiResponse<Restaurant>> {
    return this.request('/restaurants', {
      method: 'POST',
      body: JSON.stringify(restaurantData)
    });
  }

  async updateRestaurant(restaurantId: string, restaurantData: Partial<Restaurant>): Promise<ApiResponse<Restaurant>> {
    return this.request(`/restaurants/${restaurantId}`, {
      method: 'PUT',
      body: JSON.stringify(restaurantData)
    });
  }

  async deleteRestaurant(restaurantId: string): Promise<ApiResponse> {
    return this.request(`/restaurants/${restaurantId}`, {
      method: 'DELETE'
    });
  }

  // === خدمات الإحصائيات ===

  async getDashboardStats(): Promise<ApiResponse<{
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    totalRevenue: number;
    avgOrderValue: number;
    avgDeliveryTime: number;
    todayOrders: number;
    todayRevenue: number;
  }>> {
    return this.request('/admin/stats');
  }

  // === خدمات الدفع ===

  async createPaymentIntent(amount: number, orderId: string): Promise<ApiResponse<{
    clientSecret: string;
    paymentIntentId: string;
  }>> {
    return this.request('/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify({ amount, orderId })
    });
  }

  async confirmPayment(paymentIntentId: string): Promise<ApiResponse> {
    return this.request('/payments/confirm', {
      method: 'POST',
      body: JSON.stringify({ paymentIntentId })
    });
  }

  // === خدمات التوصيات ===

  async getRecommendations(params?: {
    userId?: string;
    type?: string;
    limit?: number;
  }): Promise<ApiResponse<{ recommendations: any[] }>> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/recommendations${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(endpoint);
  }

  // === خدمات التغذية ===

  async getNutritionData(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/nutrition${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(endpoint);
  }

  async logNutrition(nutritionData: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    date: string;
  }): Promise<ApiResponse> {
    return this.request('/nutrition/log', {
      method: 'POST',
      body: JSON.stringify(nutritionData)
    });
  }

  // === خدمات الإشعارات ===

  async getNotifications(params?: {
    unreadOnly?: boolean;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ notifications: any[]; total: number }>> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/notifications${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(endpoint);
  }

  async markNotificationAsRead(notificationId: string): Promise<ApiResponse> {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'PATCH'
    });
  }

  async markAllNotificationsAsRead(): Promise<ApiResponse> {
    return this.request('/notifications/read-all', {
      method: 'PATCH'
    });
  }
}

// إنشاء مثيل واحد من الخدمة
export const apiService = new ApiService();

// تصدير الخدمة كافتراضي
export default apiService;
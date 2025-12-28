import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.loadToken();
  }

  // تحميل التوكن من التخزين المحلي
  private async loadToken(): Promise<void> {
    try {
      const token = await AsyncStorage.getItem('authToken');
      this.token = token;
    } catch (error) {
      console.error('خطأ في تحميل التوكن:', error);
    }
  }

  // حفظ التوكن في التخزين المحلي
  private async saveToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem('authToken', token);
      this.token = token;
    } catch (error) {
      console.error('خطأ في حفظ التوكن:', error);
    }
  }

  // إزالة التوكن من التخزين المحلي
  private async removeToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem('authToken');
      this.token = null;
    } catch (error) {
      console.error('خطأ في إزالة التوكن:', error);
    }
  }

  // إعداد الطلب مع الهيدرز المطلوبة
  private getRequestConfig(options: RequestInit = {}): RequestInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return {
      ...options,
      headers,
    };
  }

  // دالة عامة لإرسال الطلبات
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      const config = this.getRequestConfig(options);
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'حدث خطأ في الطلب');
      }

      return data;
    } catch (error) {
      console.error(`خطأ في API ${endpoint}:`, error);
      throw error;
    }
  }

  // طلبات GET
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // طلبات POST
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // طلبات PUT
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // طلبات PATCH
  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // طلبات DELETE
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // === طلبات المصادقة ===

  // تسجيل الدخول
  async login(email: string, password: string) {
    const response = await this.post('/auth/login', { email, password });
    if (response.success && response.data.token) {
      await this.saveToken(response.data.token);
    }
    return response;
  }

  // تسجيل مستخدم جديد
  async register(userData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) {
    return this.post('/auth/register', userData);
  }

  // تسجيل الخروج
  async logout() {
    await this.removeToken();
    return { success: true };
  }

  // === طلبات المشاريع ===

  // الوصول للمشروع عبر QR Code
  async accessProjectByQR(qrToken: string) {
    return this.post('/qr/access', { qrToken });
  }

  // الحصول على تفاصيل المشروع
  async getProject(projectId: string) {
    return this.get(`/projects/${projectId}`);
  }

  // === طلبات المطاعم ===

  // الحصول على المطاعم القريبة
  async getNearbyRestaurants(latitude: number, longitude: number, radius: number = 3) {
    return this.get(`/restaurants/nearby?lat=${latitude}&lng=${longitude}&radius=${radius}`);
  }

  // الحصول على قائمة طعام المطعم
  async getRestaurantMenu(restaurantId: string) {
    return this.get(`/restaurants/${restaurantId}/menu`);
  }

  // === طلبات الطعام ===

  // إنشاء طلب جديد
  async createOrder(orderData: {
    projectId: string;
    restaurantId: string;
    items: Array<{
      menuItemId: string;
      quantity: number;
      price: number;
      notes?: string;
    }>;
    totalAmount: number;
    deliveryAddress: string;
    notes?: string;
  }) {
    return this.post('/orders', orderData);
  }

  // الحصول على طلبات المستخدم
  async getUserOrders(page: number = 1, limit: number = 10) {
    return this.get(`/orders?page=${page}&limit=${limit}`);
  }

  // الحصول على تفاصيل طلب محدد
  async getOrder(orderId: string) {
    return this.get(`/orders/${orderId}`);
  }

  // إلغاء الطلب
  async cancelOrder(orderId: string, reason: string) {
    return this.delete(`/orders/${orderId}`, { reason });
  }

  // تتبع الطلب بـ QR Code
  async trackOrderByQR(qrData: string) {
    return this.post('/orders/track/qr', { qrData });
  }

  // === طلبات الاستثناءات ===

  // إنشاء طلب استثناء
  async createException(exceptionData: {
    projectId: string;
    reason: string;
    requestedItems: Array<{
      restaurantId: string;
      itemName: string;
      quantity: number;
      estimatedPrice: number;
    }>;
    additionalCost: number;
    urgency?: 'LOW' | 'MEDIUM' | 'HIGH';
  }) {
    return this.post('/exceptions', exceptionData);
  }

  // الحصول على طلبات الاستثناء
  async getExceptions(projectId?: string) {
    const query = projectId ? `?projectId=${projectId}` : '';
    return this.get(`/exceptions${query}`);
  }

  // === طلبات الإشعارات ===

  // الحصول على إشعارات المستخدم
  async getNotifications(page: number = 1, unreadOnly: boolean = false) {
    return this.get(`/notifications?page=${page}&unreadOnly=${unreadOnly}`);
  }

  // تحديد الإشعار كمقروء
  async markNotificationAsRead(notificationId: string) {
    return this.patch(`/notifications/${notificationId}/read`);
  }

  // === طلبات الموقع والتتبع ===

  // تحديث موقع المستخدم
  async updateLocation(latitude: number, longitude: number) {
    return this.post('/location/update', { latitude, longitude });
  }

  // الحصول على تحديثات التوصيل
  async getDeliveryUpdates(orderId: string) {
    return this.get(`/orders/${orderId}/delivery-updates`);
  }
}

// إنشاء مثيل واحد من الخدمة
const apiService = new ApiService();

export default apiService;
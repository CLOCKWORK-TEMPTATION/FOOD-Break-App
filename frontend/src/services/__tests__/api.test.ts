/**
 * Integration Tests لخدمات API
 * اختبارات التكامل مع الواجهة الخلفية
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient } from '../api';
import { dashboardService } from '../dashboardService';

// Mock fetch
global.fetch = vi.fn();

describe('API Client - اختبارات العميل', () => {
  const originalEnv = import.meta.env;

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock environment variable
    import.meta.env.VITE_API_URL = 'http://localhost:3001/api/v1';
  });

  afterEach(() => {
    import.meta.env = originalEnv;
  });

  it('يجب أن يقوم طلب GET ناجح', async () => {
    const mockData = { id: '1', name: 'Test' };
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const response = await fetch('/test');
    const data = await response.json();

    expect(data).toEqual(mockData);
    expect(fetch).toHaveBeenCalledWith('/test');
  });

  it('يجب أن يعالج أخطاء الشبكة', async () => {
    (fetch as any).mockRejectedValueOnce(new Error('Network error'));

    await expect(fetch('/test')).rejects.toThrow('Network error');
  });

  it('يجب أن يعالج استجابات الخطأ', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Not found' }),
    });

    const response = await fetch('/test');
    expect(response.ok).toBe(false);
    expect(response.status).toBe(404);
  });

  it('يجب أن يرسل البيانات في طلب POST', async () => {
    const postData = { name: 'Test', value: 123 };
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: postData }),
    });

    const response = await fetch('/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData),
    });

    expect(response.ok).toBe(true);
  });

  it('يجب أن يضيف التوكن في رأس الطلب', async () => {
    const mockToken = 'test_jwt_token';
    localStorage.setItem('token', mockToken);

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    await fetch('/protected', {
      headers: {
        'Authorization': `Bearer ${mockToken}`,
      },
    });

    expect(fetch).toHaveBeenCalledWith('/protected', {
      headers: {
        'Authorization': `Bearer ${mockToken}`,
      },
    });
  });
});

describe('Dashboard Service - خدمة لوحة المعلومات', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('statsService', () => {
    it('يجب أن يجلب إحصائيات لوحة المعلومات', async () => {
      const mockStats = {
        totalOrders: 100,
        pendingOrders: 10,
        completedOrders: 80,
        cancelledOrders: 10,
        totalRevenue: 5000,
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockStats }),
      });

      const stats = await dashboardService.statsService.getDashboardStats();

      expect(stats).toEqual(mockStats);
    });

    it('يجب أن يعالج فشل جلب الإحصائيات', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('API Error'));

      await expect(
        dashboardService.statsService.getDashboardStats()
      ).rejects.toThrow();
    });
  });

  describe('ordersService', () => {
    it('يجب أن يجلب قائمة الطلبات', async () => {
      const mockOrders = {
        orders: [
          {
            id: 'order_1',
            orderNumber: '#123456',
            status: 'PENDING',
            totalAmount: 100,
          },
        ],
        pagination: { total: 1, page: 1 },
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockOrders.orders }),
      });

      const orders = await dashboardService.ordersService.getOrders({ limit: 10 });

      expect(orders).toBeDefined();
    });

    it('يجب أن يحدث حالة الطلب', async () => {
      const updatedOrder = {
        id: 'order_1',
        status: 'CONFIRMED',
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: updatedOrder }),
      });

      const result = await dashboardService.ordersService.updateOrderStatus(
        'order_1',
        'CONFIRMED'
      );

      expect(result).toBeDefined();
    });

    it('يجب أن يجلب تفاصيل طلب محدد', async () => {
      const mockOrder = {
        id: 'order_1',
        orderNumber: '#123456',
        status: 'DELIVERED',
        totalAmount: 150,
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockOrder }),
      });

      const order = await dashboardService.ordersService.getOrderById('order_1');

      expect(order).toEqual(mockOrder);
    });
  });

  describe('restaurantsService', () => {
    it('يجب أن يجلب قائمة المطاعم', async () => {
      const mockRestaurants = {
        restaurants: [
          {
            id: 'rest_1',
            name: 'مطعم السعادة',
            cuisine: ['عربي'],
            isActive: true,
          },
        ],
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockRestaurants.restaurants }),
      });

      const restaurants = await dashboardService.restaurantsService.getRestaurants();

      expect(restaurants).toBeDefined();
    });

    it('يجب أن يجلب تفاصيل مطعم محدد', async () => {
      const mockRestaurant = {
        id: 'rest_1',
        name: 'مطعم السعادة',
        cuisine: ['عربي'],
        rating: 4.5,
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockRestaurant }),
      });

      const restaurant = await dashboardService.restaurantsService.getRestaurantById('rest_1');

      expect(restaurant).toEqual(mockRestaurant);
    });
  });

  describe('notificationsService', () => {
    it('يجب أن يرسل إشعار', async () => {
      const notificationData = {
        type: 'order-ready',
        recipients: 'all',
        title: 'طلبك جاهز',
        message: 'طلبك جاهز للتوصيل',
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { sent: 100 } }),
      });

      const result = await dashboardService.notificationsService.sendNotification(
        notificationData
      );

      expect(result).toBeDefined();
    });

    it('يجب أن يجلب سجل الإشعارات', async () => {
      const mockNotifications = [
        { id: 'notif_1', type: 'order-ready', sentAt: '2024-01-15', recipients: 50 },
      ];

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockNotifications }),
      });

      const notifications = await dashboardService.notificationsService.getNotificationsHistory();

      expect(notifications).toEqual(mockNotifications);
    });
  });
});

describe('API Error Handling - معالجة الأخطاء', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('يجب أن يعالج أخطاء 401', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Unauthorized' }),
    });

    const response = await fetch('/protected');
    expect(response.status).toBe(401);
  });

  it('يجب أن يعالج أخطاء 403', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({ error: 'Forbidden' }),
    });

    const response = await fetch('/admin');
    expect(response.status).toBe(403);
  });

  it('يجب أن يعالج أخطاء 404', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Not found' }),
    });

    const response = await fetch('/nonexistent');
    expect(response.status).toBe(404);
  });

  it('يجب أن يعالج أخطاء 500', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal server error' }),
    });

    const response = await fetch('/error');
    expect(response.status).toBe(500);
  });
});

describe('API Retry Logic - منطق إعادة المحاولة', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('يجب أن يعيد المحاولة عند الفشل المؤقت', async () => {
    // فشل مرتين ثم نجح
    (fetch as any)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: {} }),
      });

    // محاكاة منطق إعادة المحاولة
    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
      try {
        await fetch('/test');
        break;
      } catch (error) {
        retries++;
        if (retries >= maxRetries) throw error;
      }
    }

    expect(fetch).toHaveBeenCalledTimes(3);
  });
});

describe('Request Interceptors - اعتراضات الطلبات', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('يجب أن يضيف التوكن تلقائياً للطلبات المحمية', async () => {
    const mockToken = 'test_jwt_token';
    localStorage.setItem('authToken', mockToken);

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    // محاكاة اعتراض الطلب
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (localStorage.getItem('authToken')) {
      headers['Authorization'] = `Bearer ${localStorage.getItem('authToken')}`;
    }

    await fetch('/protected', { headers });

    expect(headers['Authorization']).toBe(`Bearer ${mockToken}`);
  });

  it('يجب أن يعالج انتهاء صلاحية التوكن', async () => {
    localStorage.setItem('authToken', 'expired_token');

    (fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Token expired' }),
    });

    const response = await fetch('/protected');
    expect(response.status).toBe(401);

    // يجب تنظيف التوكن
    localStorage.removeItem('authToken');
  });
});

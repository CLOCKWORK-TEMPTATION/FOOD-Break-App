/**
 * Dashboard Service - Fixed Types
 */

import apiClient from './apiClient';

export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  avgOrderValue: number;
  avgDeliveryTime: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  user?: { name: string; phone: string };
  restaurant?: { name: string };
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  totalAmount: number;
  estimatedDeliveryTime: number;
  items: Array<{ name: string; quantity: number; price: number }>;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category?: string;
  isAvailable: boolean;
}

export const statsService = {
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await apiClient.get('/admin/stats');
    return response.data.data;
  }
};

export const ordersService = {
  async getOrders(params?: any): Promise<{ orders: Order[]; pagination: any }> {
    const response = await apiClient.get('/orders', { params });
    return response.data;
  },
  async updateOrderStatus(orderId: string, status: string): Promise<Order> {
    const response = await apiClient.put(`/orders/${orderId}/status`, { status });
    return response.data.data;
  }
};

export const restaurantsService = {
  async getRestaurants(params?: any): Promise<{ restaurants: any[] }> {
    const response = await apiClient.get('/restaurants', { params });
    return response.data;
  }
};

export const notificationsService = {
  async sendNotification(data: any): Promise<void> {
    await apiClient.post('/notifications', data);
  }
};

export const menuService = {
  async getMenuItems(restaurantId: string): Promise<MenuItem[]> {
    const response = await apiClient.get(`/restaurants/${restaurantId}/menu`);
    return response.data.data;
  }
};

// اختبار بسيط للتأكد من عمل TypeScript
import { DashboardStats, Order } from '../services/dashboardService';

const testStats: DashboardStats = {
  totalOrders: 100,
  pendingOrders: 5,
  completedOrders: 90,
  cancelledOrders: 5,
  totalRevenue: 5000,
  avgOrderValue: 50,
  avgDeliveryTime: 30,
  todayOrders: 25,
  todayRevenue: 1250,
};

const testOrder: Order = {
  id: 'test-order-1',
  orderNumber: '#TEST001',
  userId: 'user-1',
  restaurantId: 'rest-1',
  items: [],
  status: 'PENDING',
  totalAmount: 100,
  deliveryFee: 10,
  deliveryAddress: 'Test Address',
  estimatedDeliveryTime: 30,
  createdAt: '2023-01-01',
  updatedAt: '2023-01-01',
};

console.log('TypeScript types working correctly!', { testStats, testOrder });

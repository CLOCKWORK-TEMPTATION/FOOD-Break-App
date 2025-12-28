/**
 * لوحة التحكم العربية
 * Arabic Dashboard Page with RTL support
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from '../config/localization';
import ArabicLayout from '../components/layout/ArabicLayout';
import { 
  ShoppingBagIcon,
  BuildingStorefrontIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

interface DashboardStats {
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

interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  restaurant: string;
  status: string;
  totalAmount: number;
  createdAt: string;
}

const ArabicDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // جلب البيانات
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // جلب الإحصائيات
      const statsResponse = await fetch('/api/admin/stats', {
        headers: {
          'Accept-Language': 'ar'
        }
      });
      const statsData = await statsResponse.json();
      
      if (statsData.success) {
        setStats(statsData.data);
      }

      // جلب الطلبات الحديثة
      const ordersResponse = await fetch('/api/admin/orders?limit=5', {
        headers: {
          'Accept-Language': 'ar'
        }
      });
      const ordersData = await ordersResponse.json();
      
      if (ordersData.success) {
        setRecentOrders(ordersData.data.orders);
      }
    } catch (error) {
      console.error('خطأ في جلب بيانات لوحة التحكم:', error);
    } finally {
      setLoading(false);
    }
  };

  // بطاقات الإحصائيات
  const statCards = stats ? [
    {
      title: t('orders.totalOrders'),
      value: stats.totalOrders.toLocaleString('ar-EG'),
      icon: ShoppingBagIcon,
      color: 'blue',
      change: '+12%',
      changeType: 'increase'
    },
    {
      title: t('orders.todayOrders'),
      value: stats.todayOrders.toLocaleString('ar-EG'),
      icon: ClockIcon,
      color: 'green',
      change: '+8%',
      changeType: 'increase'
    },
    {
      title: t('budget.totalRevenue'),
      value: `${stats.totalRevenue.toLocaleString('ar-EG')} ج.م`,
      icon: CurrencyDollarIcon,
      color: 'yellow',
      change: '+15%',
      changeType: 'increase'
    },
    {
      title: t('orders.avgOrderValue'),
      value: `${stats.avgOrderValue.toFixed(2)} ج.م`,
      icon: ChartBarIcon,
      color: 'purple',
      change: '+5%',
      changeType: 'increase'
    }
  ] : [];

  // ألوان الحالات
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'text-yellow-600 bg-yellow-100';
      case 'CONFIRMED': return 'text-blue-600 bg-blue-100';
      case 'PREPARING': return 'text-orange-600 bg-orange-100';
      case 'OUT_FOR_DELIVERY': return 'text-purple-600 bg-purple-100';
      case 'DELIVERED': return 'text-green-600 bg-green-100';
      case 'CANCELLED': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // ترجمة الحالات
  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'PENDING': 'في الانتظار',
      'CONFIRMED': 'مؤكد',
      'PREPARING': 'قيد التحضير',
      'OUT_FOR_DELIVERY': 'في الطريق',
      'DELIVERED': 'تم التوصيل',
      'CANCELLED': 'ملغي'
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return (
      <ArabicLayout 
        sidebarCollapsed={sidebarCollapsed}
        onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="mr-3 text-gray-600">{t('common.loading')}</span>
        </div>
      </ArabicLayout>
    );
  }

  return (
    <ArabicLayout 
      sidebarCollapsed={sidebarCollapsed}
      onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
    >
      <div className="space-y-6">
        {/* العنوان الرئيسي */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('navigation.dashboard')}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            مرحباً بك في لوحة التحكم الرئيسية
          </p>
        </div>

        {/* بطاقات الإحصائيات */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div key={index} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className={`p-3 rounded-md bg-${card.color}-100`}>
                    <Icon className={`h-6 w-6 text-${card.color}-600`} />
                  </div>
                  <div className="mr-4 flex-1">
                    <p className="text-sm font-medium text-gray-600">
                      {card.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {card.value}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <span className={`
                    text-sm font-medium
                    ${card.changeType === 'increase' ? 'text-green-600' : 'text-red-600'}
                  `}>
                    {card.change}
                  </span>
                  <span className="text-sm text-gray-500 mr-2">
                    من الشهر الماضي
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* الطلبات الحديثة */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              الطلبات الحديثة
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    رقم الطلب
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    العميل
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المطعم
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الحالة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المبلغ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    التاريخ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{order.orderNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.customerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.restaurant}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`
                        inline-flex px-2 py-1 text-xs font-semibold rounded-full
                        ${getStatusColor(order.status)}
                      `}>
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.totalAmount.toLocaleString('ar-EG')} ج.م
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('ar-EG')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {recentOrders.length === 0 && (
            <div className="text-center py-12">
              <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                لا توجد طلبات
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                لم يتم تقديم أي طلبات بعد
              </p>
            </div>
          )}
        </div>

        {/* إحصائيات سريعة */}
        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* الطلبات حسب الحالة */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                الطلبات حسب الحالة
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">في الانتظار</span>
                  <span className="text-sm font-medium text-yellow-600">
                    {stats.pendingOrders}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">مكتملة</span>
                  <span className="text-sm font-medium text-green-600">
                    {stats.completedOrders}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">ملغية</span>
                  <span className="text-sm font-medium text-red-600">
                    {stats.cancelledOrders}
                  </span>
                </div>
              </div>
            </div>

            {/* إحصائيات اليوم */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                إحصائيات اليوم
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">الطلبات</span>
                  <span className="text-sm font-medium text-blue-600">
                    {stats.todayOrders}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">الإيرادات</span>
                  <span className="text-sm font-medium text-green-600">
                    {stats.todayRevenue.toLocaleString('ar-EG')} ج.م
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">متوسط وقت التوصيل</span>
                  <span className="text-sm font-medium text-purple-600">
                    {stats.avgDeliveryTime} دقيقة
                  </span>
                </div>
              </div>
            </div>

            {/* إجراءات سريعة */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                إجراءات سريعة
              </h3>
              <div className="space-y-3">
                <button className="w-full text-right px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                  عرض جميع الطلبات
                </button>
                <button className="w-full text-right px-4 py-2 text-sm text-green-600 hover:bg-green-50 rounded-md transition-colors">
                  إضافة مطعم جديد
                </button>
                <button className="w-full text-right px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-md transition-colors">
                  إنشاء تقرير
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ArabicLayout>
  );
};

export default ArabicDashboard;
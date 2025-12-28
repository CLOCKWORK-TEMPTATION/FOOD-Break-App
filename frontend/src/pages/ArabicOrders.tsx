/**
 * صفحة الطلبات العربية
 * Arabic Orders Page with RTL support
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from '../config/localization';
import ArabicLayout from '../components/layout/ArabicLayout';
import ArabicButton from '../components/forms/ArabicButton';
import ArabicNavigation from '../components/ArabicNavigation';
import { 
  ShoppingBagIcon,
  EyeIcon,
  XMarkIcon,
  CheckIcon,
  ClockIcon,
  TruckIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

interface Order {
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

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

const ArabicOrders: React.FC = () => {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('TODAY');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // جلب الطلبات
  useEffect(() => {
    fetchOrders();
  }, [statusFilter, dateFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (statusFilter !== 'ALL') {
        params.append('status', statusFilter);
      }
      
      if (dateFilter !== 'ALL') {
        params.append('date', dateFilter);
      }

      const response = await fetch(`/api/orders?${params.toString()}`, {
        headers: {
          'Accept-Language': 'ar',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setOrders(data.data.orders || []);
      } else {
        console.error('خطأ في جلب الطلبات:', data.message);
      }
    } catch (error) {
      console.error('خطأ في جلب الطلبات:', error);
    } finally {
      setLoading(false);
    }
  };

  // تحديث حالة الطلب
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': 'ar',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      
      if (data.success) {
        // تحديث الطلب في القائمة
        setOrders(orders.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus, updatedAt: new Date().toISOString() }
            : order
        ));
        
        // تحديث الطلب المحدد إذا كان مفتوحاً
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
      } else {
        alert(data.message || 'فشل في تحديث حالة الطلب');
      }
    } catch (error) {
      console.error('خطأ في تحديث حالة الطلب:', error);
      alert('حدث خطأ في تحديث حالة الطلب');
    }
  };

  // إلغاء الطلب
  const cancelOrder = async (orderId: string) => {
    if (!confirm('هل أنت متأكد من إلغاء هذا الطلب؟')) {
      return;
    }

    try {
      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'PATCH',
        headers: {
          'Accept-Language': 'ar',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchOrders(); // إعادة جلب الطلبات
        setShowOrderModal(false);
      } else {
        alert(data.message || 'فشل في إلغاء الطلب');
      }
    } catch (error) {
      console.error('خطأ في إلغاء الطلب:', error);
      alert('حدث خطأ في إلغاء الطلب');
    }
  };

  // تصفية الطلبات
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.restaurant.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

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

  // أيقونة الحالة
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return ClockIcon;
      case 'CONFIRMED': return CheckIcon;
      case 'PREPARING': return ClockIcon;
      case 'OUT_FOR_DELIVERY': return TruckIcon;
      case 'DELIVERED': return CheckIcon;
      case 'CANCELLED': return XMarkIcon;
      default: return ClockIcon;
    }
  };

  return (
    <ArabicLayout 
      sidebarCollapsed={sidebarCollapsed}
      onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
    >
      <div className="space-y-6">
        {/* التنقل العربي */}
        <ArabicNavigation currentPage="orders" />
        
        {/* العنوان والإجراءات */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {t('orders.title')}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              إدارة ومتابعة جميع الطلبات
            </p>
          </div>
          <ArabicButton
            variant="primary"
            onClick={() => {/* إضافة طلب جديد */}}
          >
            {t('orders.newOrder')}
          </ArabicButton>
        </div>

        {/* شريط البحث والتصفية */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* البحث */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="البحث في الطلبات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* تصفية الحالة */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">جميع الحالات</option>
              <option value="PENDING">في الانتظار</option>
              <option value="CONFIRMED">مؤكد</option>
              <option value="PREPARING">قيد التحضير</option>
              <option value="OUT_FOR_DELIVERY">في الطريق</option>
              <option value="DELIVERED">تم التوصيل</option>
              <option value="CANCELLED">ملغي</option>
            </select>

            {/* تصفية التاريخ */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">جميع التواريخ</option>
              <option value="TODAY">اليوم</option>
              <option value="YESTERDAY">أمس</option>
              <option value="THIS_WEEK">هذا الأسبوع</option>
              <option value="THIS_MONTH">هذا الشهر</option>
            </select>

            {/* زر التصفية المتقدمة */}
            <ArabicButton
              variant="secondary"
              onClick={() => {/* فتح التصفية المتقدمة */}}
            >
              تصفية متقدمة
            </ArabicButton>
          </div>
        </div>

        {/* قائمة الطلبات */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="mr-3 text-gray-600">{t('common.loading')}</span>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {t('orders.noOrders')}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                لا توجد طلبات تطابق معايير البحث
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('orders.orderNumber')}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      العميل
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      المطعم
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('orders.orderStatus')}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('orders.orderTotal')}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('orders.orderDate')}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => {
                    const StatusIcon = getStatusIcon(order.status);
                    return (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{order.orderNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {order.customerName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {order.customerEmail}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.restaurant.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`
                            inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${getStatusColor(order.status)}
                          `}>
                            <StatusIcon className="w-3 h-3 ml-1" />
                            {getStatusText(order.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.totalAmount.toLocaleString('ar-EG')} ج.م
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString('ar-EG')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2 space-x-reverse">
                            <button
                              onClick={() => {
                                setSelectedOrder(order);
                                setShowOrderModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            {order.status === 'PENDING' && (
                              <button
                                onClick={() => updateOrderStatus(order.id, 'CONFIRMED')}
                                className="text-green-600 hover:text-green-900"
                              >
                                <CheckIcon className="h-4 w-4" />
                              </button>
                            )}
                            {['PENDING', 'CONFIRMED'].includes(order.status) && (
                              <button
                                onClick={() => cancelOrder(order.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* نافذة تفاصيل الطلب */}
        {showOrderModal && selectedOrder && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                {/* رأس النافذة */}
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {t('orders.orderDetails')} - #{selectedOrder.orderNumber}
                  </h3>
                  <button
                    onClick={() => setShowOrderModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* معلومات الطلب */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">معلومات العميل</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>الاسم:</strong> {selectedOrder.customerName}</p>
                      <p><strong>البريد:</strong> {selectedOrder.customerEmail}</p>
                      <p><strong>العنوان:</strong> {selectedOrder.deliveryAddress}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">معلومات الطلب</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>المطعم:</strong> {selectedOrder.restaurant.name}</p>
                      <p><strong>التاريخ:</strong> {new Date(selectedOrder.createdAt).toLocaleDateString('ar-EG')}</p>
                      <p><strong>وقت التوصيل:</strong> {selectedOrder.deliveryTime}</p>
                      <p><strong>طريقة الدفع:</strong> {selectedOrder.paymentMethod}</p>
                    </div>
                  </div>
                </div>

                {/* عناصر الطلب */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">{t('orders.orderItems')}</h4>
                  <div className="border rounded-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">الصنف</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">الكمية</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">السعر</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">الإجمالي</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedOrder.items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-2 text-sm text-gray-900">{item.name}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{item.quantity}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{item.price.toLocaleString('ar-EG')} ج.م</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{(item.quantity * item.price).toLocaleString('ar-EG')} ج.م</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-2 text-left">
                    <span className="text-lg font-bold text-gray-900">
                      الإجمالي: {selectedOrder.totalAmount.toLocaleString('ar-EG')} ج.م
                    </span>
                  </div>
                </div>

                {/* الملاحظات */}
                {selectedOrder.notes && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">{t('orders.orderNotes')}</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                      {selectedOrder.notes}
                    </p>
                  </div>
                )}

                {/* أزرار الإجراءات */}
                <div className="flex justify-end space-x-3 space-x-reverse">
                  <ArabicButton
                    variant="secondary"
                    onClick={() => setShowOrderModal(false)}
                  >
                    {t('common.close')}
                  </ArabicButton>
                  
                  {selectedOrder.status === 'PENDING' && (
                    <ArabicButton
                      variant="primary"
                      onClick={() => {
                        updateOrderStatus(selectedOrder.id, 'CONFIRMED');
                        setShowOrderModal(false);
                      }}
                    >
                      {t('orders.confirmOrder')}
                    </ArabicButton>
                  )}
                  
                  {['PENDING', 'CONFIRMED'].includes(selectedOrder.status) && (
                    <ArabicButton
                      variant="danger"
                      onClick={() => cancelOrder(selectedOrder.id)}
                    >
                      {t('orders.cancelOrder')}
                    </ArabicButton>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ArabicLayout>
  );
};

export default ArabicOrders;
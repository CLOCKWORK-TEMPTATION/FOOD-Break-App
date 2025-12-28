/**
 * تفاصيل الطلب
 * Order Details Modal Component
 */

import { useState, useEffect } from 'react';
import { ordersService, Order } from '../services/dashboardService';
import styles from './OrderDetails.module.css';

interface OrderDetailsProps {
  orderId: string;
  onClose: () => void;
  onStatusUpdate: () => void;
}

export default function OrderDetails({ orderId, onClose, onStatusUpdate }: OrderDetailsProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadOrderDetails();
  }, [orderId]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      const data = await ordersService.getOrderById(orderId);
      setOrder(data);
    } catch (error) {
      console.error('فشل تحميل تفاصيل الطلب:', error);
      // بيانات تجريبية
      setOrder({
        id: orderId,
        orderNumber: '#10001',
        userId: 'user-1',
        restaurantId: 'rest-1',
        restaurant: {
          id: 'rest-1',
          name: 'مطعم البيت الشامي',
          logo: 'https://via.placeholder.com/60',
        },
        user: {
          id: 'user-1',
          name: 'أحمد محمد',
          phone: '0501234567',
        },
        items: [
          { id: '1', name: 'شاورما دجاج', quantity: 2, price: 25 },
          { id: '2', name: 'فتوش', quantity: 1, price: 15 },
          { id: '3', name: 'عصير برتقال', quantity: 2, price: 10 },
        ],
        status: 'PREPARING',
        totalAmount: 85,
        deliveryFee: 10,
        deliveryAddress: 'شارع الملك فهد، الرياض - حي العليا - مبنى 15، شقة 3',
        estimatedDeliveryTime: 30,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: Order['status']) => {
    if (!order) return;
    try {
      setUpdating(true);
      await ordersService.updateOrderStatus(order.id, newStatus);
      setOrder({ ...order, status: newStatus });
      onStatusUpdate();
    } catch (error) {
      console.error('فشل تحديث الحالة:', error);
      alert('فشل تحديث حالة الطلب');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    const reason = prompt('سبب الإلغاء:');
    if (!reason) return;

    try {
      setUpdating(true);
      await ordersService.cancelOrder(order.id, reason);
      setOrder({ ...order, status: 'CANCELLED' });
      onStatusUpdate();
    } catch (error) {
      console.error('فشل إلغاء الطلب:', error);
      alert('فشل إلغاء الطلب');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: Order['status']) => {
    const colors: Record<Order['status'], string> = {
      PENDING: '#FF9800',
      CONFIRMED: '#2196F3',
      PREPARING: '#673AB7',
      OUT_FOR_DELIVERY: '#9C27B0',
      DELIVERED: '#4CAF50',
      CANCELLED: '#F44336',
    };
    return colors[status] || '#333';
  };

  const getStatusLabel = (status: Order['status']) => {
    const labels: Record<Order['status'], string> = {
      PENDING: 'قيد الانتظار',
      CONFIRMED: 'مؤكد',
      PREPARING: 'قيد الإعداد',
      OUT_FOR_DELIVERY: 'في الطريق',
      DELIVERED: 'تم التوصيل',
      CANCELLED: 'ملغى',
    };
    return labels[status] || status;
  };

  const getNextStatus = (currentStatus: Order['status']): Order['status'] | null => {
    const flow: Record<Order['status'], Order['status'] | null> = {
      PENDING: 'CONFIRMED',
      CONFIRMED: 'PREPARING',
      PREPARING: 'OUT_FOR_DELIVERY',
      OUT_FOR_DELIVERY: 'DELIVERED',
      DELIVERED: null,
      CANCELLED: null,
    };
    return flow[currentStatus];
  };

  const getNextStatusLabel = (status: Order['status']) => {
    const labels: Record<Order['status'], string> = {
      PENDING: 'تأكيد الطلب',
      CONFIRMED: 'بدء التحضير',
      PREPARING: 'بدء التوصيل',
      OUT_FOR_DELIVERY: 'تم التسليم',
      DELIVERED: '',
      CANCELLED: '',
    };
    return labels[status] || '';
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className={styles.overlay}>
        <div className={styles.modal}>
          <div className={styles.loading}>جاري التحميل...</div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className={styles.overlay}>
        <div className={styles.modal}>
          <div className={styles.error}>فشل تحميل الطلب</div>
          <button onClick={onClose}>إغلاق</button>
        </div>
      </div>
    );
  }

  const nextStatus = getNextStatus(order.status);

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* Header */}
        <div
          className={styles.header}
          style={{ background: `linear-gradient(135deg, ${getStatusColor(order.status)}, ${getStatusColor(order.status)}dd)` }}
        >
          <div className={styles.headerContent}>
            <div>
              <h2>طلب {order.orderNumber}</h2>
              <p className={styles.orderDate}>{formatDateTime(order.createdAt)}</p>
            </div>
            <span className={styles.statusBadge}>{getStatusLabel(order.status)}</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {/* Customer Info */}
          <section className={styles.section}>
            <h3>👤 معلومات الزبون</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label>الاسم</label>
                <p>{order.user?.name || 'غير محدد'}</p>
              </div>
              <div className={styles.infoItem}>
                <label>رقم الهاتف</label>
                <p dir="ltr">{order.user?.phone || 'غير محدد'}</p>
              </div>
              <div className={`${styles.infoItem} ${styles.fullWidth}`}>
                <label>عنوان التوصيل</label>
                <p>{order.deliveryAddress}</p>
              </div>
            </div>
          </section>

          {/* Restaurant Info */}
          <section className={styles.section}>
            <h3>🏪 المطعم</h3>
            <div className={styles.restaurantInfo}>
              <img
                src={order.restaurant?.logo || 'https://via.placeholder.com/60'}
                alt={order.restaurant?.name}
                className={styles.restaurantLogo}
              />
              <div>
                <p className={styles.restaurantName}>{order.restaurant?.name}</p>
                <p className={styles.estimatedTime}>
                  ⏱ وقت التوصيل المتوقع: {order.estimatedDeliveryTime} دقيقة
                </p>
              </div>
            </div>
          </section>

          {/* Order Items */}
          <section className={styles.section}>
            <h3>🛒 العناصر المطلوبة</h3>
            <div className={styles.itemsList}>
              {order.items.map((item, index) => (
                <div key={index} className={styles.orderItem}>
                  <div className={styles.itemDetails}>
                    <span className={styles.itemQty}>x{item.quantity}</span>
                    <span className={styles.itemName}>{item.name}</span>
                  </div>
                  <span className={styles.itemPrice}>{item.price * item.quantity} ريال</span>
                </div>
              ))}
            </div>
          </section>

          {/* Order Summary */}
          <section className={styles.section}>
            <h3>💰 ملخص الطلب</h3>
            <div className={styles.summary}>
              <div className={styles.summaryRow}>
                <span>المجموع الفرعي</span>
                <span>{order.totalAmount - order.deliveryFee} ريال</span>
              </div>
              <div className={styles.summaryRow}>
                <span>رسوم التوصيل</span>
                <span>{order.deliveryFee} ريال</span>
              </div>
              <div className={`${styles.summaryRow} ${styles.total}`}>
                <span>الإجمالي</span>
                <span>{order.totalAmount} ريال</span>
              </div>
            </div>
          </section>

          {/* Order Timeline */}
          <section className={styles.section}>
            <h3>📍 مسار الطلب</h3>
            <div className={styles.timeline}>
              {['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'].map((status, index) => {
                const currentIndex = ['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'].indexOf(order.status);
                const isCompleted = index <= currentIndex;
                const isCurrent = index === currentIndex;

                return (
                  <div
                    key={status}
                    className={`${styles.timelineItem} ${isCompleted ? styles.completed : ''} ${isCurrent ? styles.current : ''}`}
                  >
                    <div className={styles.timelineDot}></div>
                    <span>{getStatusLabel(status as Order['status'])}</span>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Actions */}
        {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
          <div className={styles.actions}>
            <button
              className={styles.cancelBtn}
              onClick={handleCancelOrder}
              disabled={updating}
            >
              ❌ إلغاء الطلب
            </button>
            {nextStatus && (
              <button
                className={styles.nextBtn}
                onClick={() => handleStatusUpdate(nextStatus)}
                disabled={updating}
                style={{ backgroundColor: getStatusColor(nextStatus) }}
              >
                {updating ? 'جاري التحديث...' : `✓ ${getNextStatusLabel(order.status)}`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

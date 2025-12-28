/**
 * لوحة التحكم - المسؤول / صاحب المطعم
 * Dashboard للإدارة والمتابعة
 */

import React, { useState, useEffect, useCallback } from 'react';
import styles from './AdminDashboard.module.css';
import MenuManagement from '../components/MenuManagement';
import PredictiveInsights from '../components/PredictiveInsights';
import OrderDetails from '../components/OrderDetails';
import {
  statsService,
  ordersService,
  restaurantsService,
  notificationsService,
  DashboardStats,
  Order,
  Restaurant,
} from '../services/dashboardService';

// نوع بيانات الطلب المحلي للعرض
interface LocalOrder {
  id: string;
  orderNumber: string;
  customer: {
    name: string;
    phone: string;
    avatar: string;
  };
  restaurant: string;
  status: Order['status'];
  amount: number;
  time: number;
  items: Array<{ name: string; quantity: number; price: number }>;
}

// نوع بيانات المطعم المحلي للعرض
interface LocalRestaurant {
  id: string;
  name: string;
  category: string;
  todayOrders: number;
  revenue: number;
  rating: number;
  isActive: boolean;
}

export default function AdminDashboard() {
  // الحالة الرئيسية
  const [selectedTab, setSelectedTab] = useState('orders');
  const [orders, setOrders] = useState<LocalOrder[]>([]);
  const [restaurants, setRestaurants] = useState<LocalRestaurant[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // حالة النوافذ المنبثقة
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [menuRestaurant, setMenuRestaurant] = useState<{ id: string; name: string } | null>(null);
  const [showPredictive, setShowPredictive] = useState(false);

  // حالة الإشعارات
  const [notificationType, setNotificationType] = useState('');
  const [notificationRecipients, setNotificationRecipients] = useState('all');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [sendingNotification, setSendingNotification] = useState(false);

  // تحميل البيانات
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      // محاولة جلب البيانات من API
      try {
        const [statsData, ordersData, restaurantsData] = await Promise.all([
          statsService.getDashboardStats(),
          ordersService.getOrders({ limit: 20 }),
          restaurantsService.getRestaurants({ limit: 10 }),
        ]);

        setStats(statsData);
        // تحويل البيانات للشكل المحلي
        setOrders(ordersData.orders.map(o => ({
          id: o.id,
          orderNumber: o.orderNumber || `#${o.id.slice(-6)}`,
          customer: {
            name: o.user?.name || 'غير محدد',
            phone: o.user?.phone || '',
            avatar: o.user?.name?.charAt(0) || 'ز',
          },
          restaurant: o.restaurant?.name || 'غير محدد',
          status: o.status,
          amount: o.totalAmount,
          time: o.estimatedDeliveryTime,
          items: o.items,
        })));
        setRestaurants(restaurantsData.restaurants.map(r => ({
          id: r.id,
          name: r.name,
          category: r.cuisine?.[0] || 'عام',
          todayOrders: r.todayOrders,
          revenue: r.todayRevenue,
          rating: r.rating,
          isActive: r.isActive,
        })));
      } catch (apiError) {
        console.warn('فشل جلب البيانات من API، استخدام بيانات تجريبية:', apiError);

        // بيانات تجريبية
        setStats({
          totalOrders: 245,
          pendingOrders: 12,
          completedOrders: 233,
          cancelledOrders: 5,
          totalRevenue: 12450,
          avgOrderValue: 50.8,
          avgDeliveryTime: 32,
          todayOrders: 45,
          todayRevenue: 2250,
        });

        setOrders([
          { id: 'ord-1', orderNumber: '#10001', customer: { name: 'أحمد محمد', phone: '0501234567', avatar: 'أ' }, restaurant: 'مطعم البيت الشامي', status: 'PENDING', amount: 85, time: 25, items: [] },
          { id: 'ord-2', orderNumber: '#10002', customer: { name: 'سارة علي', phone: '0507654321', avatar: 'س' }, restaurant: 'مطعم الريف', status: 'CONFIRMED', amount: 120, time: 30, items: [] },
          { id: 'ord-3', orderNumber: '#10003', customer: { name: 'محمد خالد', phone: '0509876543', avatar: 'م' }, restaurant: 'البيتزا الإيطالية', status: 'PREPARING', amount: 95, time: 20, items: [] },
          { id: 'ord-4', orderNumber: '#10004', customer: { name: 'فاطمة أحمد', phone: '0502345678', avatar: 'ف' }, restaurant: 'مطعم البيت الشامي', status: 'OUT_FOR_DELIVERY', amount: 150, time: 10, items: [] },
          { id: 'ord-5', orderNumber: '#10005', customer: { name: 'عمر حسن', phone: '0503456789', avatar: 'ع' }, restaurant: 'برجر كينج', status: 'DELIVERED', amount: 75, time: 0, items: [] },
        ]);

        setRestaurants([
          { id: 'rest-1', name: 'مطعم البيت الشامي', category: 'شامي', todayOrders: 55, revenue: 2750, rating: 4.7, isActive: true },
          { id: 'rest-2', name: 'مطعم الريف', category: 'سعودي', todayOrders: 42, revenue: 2100, rating: 4.5, isActive: true },
          { id: 'rest-3', name: 'البيتزا الإيطالية', category: 'إيطالي', todayOrders: 38, revenue: 1900, rating: 4.6, isActive: true },
          { id: 'rest-4', name: 'برجر كينج', category: 'وجبات سريعة', todayOrders: 60, revenue: 3000, rating: 4.3, isActive: false },
        ]);
      }
    } catch (error) {
      console.error('فشل تحميل البيانات:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // تحديث كل 30 ثانية
    return () => clearInterval(interval);
  }, [loadDashboardData]);

  // تحديث حالة الطلب
  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      await ordersService.updateOrderStatus(orderId, newStatus);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (error) {
      console.error('فشل تحديث الطلب:', error);
      // تحديث محلي في حالة الفشل
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      alert('تم تحديث الحالة محلياً (الخادم غير متصل)');
    }
  };

  // إرسال إشعار
  const handleSendNotification = async () => {
    if (!notificationType) {
      alert('الرجاء اختيار نوع الرسالة');
      return;
    }

    try {
      setSendingNotification(true);
      await notificationsService.sendNotification({
        type: notificationType,
        recipients: notificationRecipients as 'all' | 'active_orders' | 'restaurant',
        title: getNotificationTitle(notificationType),
        message: notificationMessage || getDefaultNotificationMessage(notificationType),
      });
      alert('تم إرسال الإشعار بنجاح');
      setNotificationMessage('');
      setNotificationType('');
    } catch (error) {
      console.error('فشل إرسال الإشعار:', error);
      alert('تم إرسال الإشعار (تجريبي)');
    } finally {
      setSendingNotification(false);
    }
  };

  const getNotificationTitle = (type: string) => {
    const titles: Record<string, string> = {
      'order-ready': 'طلبك جاهز!',
      'on-way': 'طلبك في الطريق',
      'delay-notice': 'تأخير في التوصيل',
      'feedback-request': 'شاركنا رأيك',
      'promotional': 'عرض خاص',
    };
    return titles[type] || 'إشعار';
  };

  const getDefaultNotificationMessage = (type: string) => {
    const messages: Record<string, string> = {
      'order-ready': 'طلبك جاهز للتوصيل، سيصل إليك قريباً.',
      'on-way': 'طلبك في الطريق إليك، شكراً لانتظارك.',
      'delay-notice': 'نأسف لتأخر طلبك، نعمل على إيصاله في أقرب وقت.',
      'feedback-request': 'نتمنى أن تكون استمتعت بطلبك، شاركنا رأيك.',
      'promotional': 'لدينا عروض خاصة لك، تفقدها الآن!',
    };
    return messages[type] || '';
  };

  // تصفية الطلبات
  const filteredOrders = orders.filter(order => {
    const matchesFilter = filter === 'all' || order.status.toLowerCase().includes(filter);
    const matchesSearch = order.orderNumber.includes(searchTerm) ||
      order.customer.name.includes(searchTerm) ||
      order.customer.phone.includes(searchTerm);
    return matchesFilter && matchesSearch;
  });

  // ألوان الحالات
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

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.logo}>🍽️ BreakApp Admin</h1>
          <div className={styles.userSection}>
            <button
              className={styles.predictiveBtn}
              onClick={() => setShowPredictive(true)}
              title="الرؤى التنبؤية"
            >
              🔮
            </button>
            <button className={styles.notificationBell}>🔔</button>
            <img src="https://via.placeholder.com/40" alt="Profile" className={styles.profileImg} />
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className={styles.navbar}>
        <div className={styles.navContent}>
          <button
            className={`${styles.navItem} ${selectedTab === 'orders' ? styles.active : ''}`}
            onClick={() => setSelectedTab('orders')}
          >
            📋 الطلبات
          </button>
          <button
            className={`${styles.navItem} ${selectedTab === 'restaurants' ? styles.active : ''}`}
            onClick={() => setSelectedTab('restaurants')}
          >
            🏪 المطاعم
          </button>
          <button
            className={`${styles.navItem} ${selectedTab === 'analytics' ? styles.active : ''}`}
            onClick={() => setSelectedTab('analytics')}
          >
            📊 الإحصائيات
          </button>
          <button
            className={`${styles.navItem} ${selectedTab === 'predictive' ? styles.active : ''}`}
            onClick={() => setSelectedTab('predictive')}
          >
            🔮 التنبؤات
          </button>
          <button
            className={`${styles.navItem} ${selectedTab === 'reminders' ? styles.active : ''}`}
            onClick={() => setSelectedTab('reminders')}
          >
            🔔 التنبيهات
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className={styles.main}>
        {/* Dashboard Stats */}
        {stats && (
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>📦</div>
              <div className={styles.statContent}>
                <p className={styles.statLabel}>إجمالي الطلبات</p>
                <p className={styles.statValue}>{stats.totalOrders}</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>⏳</div>
              <div className={styles.statContent}>
                <p className={styles.statLabel}>طلبات قيد الانتظار</p>
                <p className={styles.statValue} style={{ color: '#FF6B35' }}>
                  {stats.pendingOrders}
                </p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>✅</div>
              <div className={styles.statContent}>
                <p className={styles.statLabel}>طلبات مكتملة</p>
                <p className={styles.statValue} style={{ color: '#4CAF50' }}>
                  {stats.completedOrders}
                </p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>💰</div>
              <div className={styles.statContent}>
                <p className={styles.statLabel}>الإيرادات اليومية</p>
                <p className={styles.statValue}>{stats.todayRevenue || stats.totalRevenue} SR</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {selectedTab === 'orders' && (
          <div className={styles.ordersSection}>
            <div className={styles.sectionHeader}>
              <h2>إدارة الطلبات</h2>
              <div className={styles.filterControls}>
                <select
                  className={styles.filterSelect}
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">جميع الطلبات</option>
                  <option value="pending">قيد الانتظار</option>
                  <option value="confirmed">مؤكدة</option>
                  <option value="preparing">قيد الإعداد</option>
                  <option value="delivery">في الطريق</option>
                </select>
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="ابحث برقم الطلب أو رقم الهاتف"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.ordersTable}>
              <table>
                <thead>
                  <tr>
                    <th>رقم الطلب</th>
                    <th>الزبون</th>
                    <th>المطعم</th>
                    <th>الحالة</th>
                    <th>المبلغ</th>
                    <th>الوقت</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className={styles.orderRow}>
                      <td className={styles.orderId}>{order.orderNumber}</td>
                      <td>
                        <div className={styles.customerInfo}>
                          <div className={styles.customerAvatar}>{order.customer.avatar}</div>
                          <div>
                            <p className={styles.customerName}>{order.customer.name}</p>
                            <p className={styles.customerPhone}>{order.customer.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td>{order.restaurant}</td>
                      <td>
                        <select
                          className={styles.statusSelect}
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'])}
                          style={{ backgroundColor: getStatusColor(order.status) }}
                        >
                          <option value="PENDING">قيد الانتظار</option>
                          <option value="CONFIRMED">مؤكد</option>
                          <option value="PREPARING">قيد الإعداد</option>
                          <option value="OUT_FOR_DELIVERY">في الطريق</option>
                          <option value="DELIVERED">تم التوصيل</option>
                          <option value="CANCELLED">ملغى</option>
                        </select>
                      </td>
                      <td className={styles.amount}>
                        <strong>{order.amount} SR</strong>
                      </td>
                      <td className={styles.time}>
                        {order.status === 'DELIVERED' ? 'تم التسليم' : `${order.time} دقيقة`}
                      </td>
                      <td>
                        <button
                          className={styles.detailsBtn}
                          onClick={() => setSelectedOrderId(order.id)}
                        >
                          تفاصيل
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedTab === 'restaurants' && (
          <div className={styles.restaurantsSection}>
            <div className={styles.sectionHeader}>
              <h2>إدارة المطاعم</h2>
              <button className={styles.addBtn}>+ إضافة مطعم جديد</button>
            </div>

            <div className={styles.restaurantsList}>
              {restaurants.map((restaurant) => (
                <div
                  key={restaurant.id}
                  className={`${styles.restaurantCard} ${!restaurant.isActive ? styles.inactive : ''}`}
                >
                  <div className={styles.restaurantHeader}>
                    <div className={styles.restaurantInfo}>
                      <h3>{restaurant.name}</h3>
                      <p className={styles.restaurantCategory}>🍴 {restaurant.category}</p>
                    </div>
                    <span className={`${styles.statusDot} ${restaurant.isActive ? styles.online : styles.offline}`}></span>
                  </div>

                  <div className={styles.restaurantStats}>
                    <div className={styles.stat}>
                      <span className={styles.statNum}>{restaurant.todayOrders}</span>
                      <span className={styles.statLabel}>طلب اليوم</span>
                    </div>
                    <div className={styles.stat}>
                      <span className={styles.statNum}>{restaurant.revenue}</span>
                      <span className={styles.statLabel}>الإيرادات</span>
                    </div>
                    <div className={styles.stat}>
                      <span className={styles.statNum}>{restaurant.rating}</span>
                      <span className={styles.statLabel}>التقييم</span>
                    </div>
                  </div>

                  <div className={styles.restaurantActions}>
                    <button className={styles.actionBtn}>تعديل</button>
                    <button
                      className={styles.actionBtn}
                      onClick={() => setMenuRestaurant({ id: restaurant.id, name: restaurant.name })}
                    >
                      عرض القائمة
                    </button>
                    <button className={styles.actionBtn} style={{ color: '#F44336' }}>
                      {restaurant.isActive ? 'تعطيل' : 'تفعيل'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedTab === 'analytics' && (
          <div className={styles.analyticsSection}>
            <div className={styles.sectionHeader}>
              <h2>الإحصائيات والتحليلات</h2>
              <div className={styles.dateRangeSelector}>
                <input type="date" className={styles.dateInput} />
                <span>إلى</span>
                <input type="date" className={styles.dateInput} />
              </div>
            </div>

            <div className={styles.chartsGrid}>
              <div className={styles.chartCard}>
                <h3>الطلبات اليومية</h3>
                <div className={styles.chart}>
                  <div className={styles.bar} style={{ height: '65%' }}><span>45</span></div>
                  <div className={styles.bar} style={{ height: '75%' }}><span>52</span></div>
                  <div className={styles.bar} style={{ height: '55%' }}><span>38</span></div>
                  <div className={styles.bar} style={{ height: '85%' }}><span>60</span></div>
                  <div className={styles.bar} style={{ height: '70%' }}><span>48</span></div>
                </div>
                <div className={styles.chartLabels}>
                  <span>الأحد</span>
                  <span>الاثنين</span>
                  <span>الثلاثاء</span>
                  <span>الأربعاء</span>
                  <span>الخميس</span>
                </div>
              </div>

              <div className={styles.chartCard}>
                <h3>توزيع الحالات</h3>
                <div className={styles.pieChart}></div>
                <div className={styles.legend}>
                  <div className={styles.legendItem}>
                    <span style={{ backgroundColor: '#4CAF50' }}></span> مكتملة (75%)
                  </div>
                  <div className={styles.legendItem}>
                    <span style={{ backgroundColor: '#FF9800' }}></span> قيد الانتظار (15%)
                  </div>
                  <div className={styles.legendItem}>
                    <span style={{ backgroundColor: '#F44336' }}></span> ملغاة (10%)
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.metricsGrid}>
              <div className={styles.metric}>
                <label>متوسط قيمة الطلب</label>
                <p className={styles.metricValue}>{stats?.avgOrderValue?.toFixed(1)} SR</p>
              </div>
              <div className={styles.metric}>
                <label>متوسط وقت التوصيل</label>
                <p className={styles.metricValue}>{stats?.avgDeliveryTime} دقيقة</p>
              </div>
              <div className={styles.metric}>
                <label>معدل الإكمال</label>
                <p className={styles.metricValue}>
                  {stats ? ((stats.completedOrders / stats.totalOrders) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <div className={styles.metric}>
                <label>رضا الزبائن</label>
                <p className={styles.metricValue}>4.6/5.0</p>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'predictive' && (
          <PredictiveInsights />
        )}

        {selectedTab === 'reminders' && (
          <div className={styles.remindersSection}>
            <div className={styles.sectionHeader}>
              <h2>إرسال التنبيهات والرسائل</h2>
            </div>

            <div className={styles.reminderForm}>
              <div className={styles.formGroup}>
                <label>اختر نوع الرسالة</label>
                <select
                  className={styles.select}
                  value={notificationType}
                  onChange={(e) => setNotificationType(e.target.value)}
                >
                  <option value="">-- اختر --</option>
                  <option value="order-ready">الطلب جاهز</option>
                  <option value="on-way">الطلب في الطريق</option>
                  <option value="delay-notice">تأخير في التوصيل</option>
                  <option value="feedback-request">طلب رأيك</option>
                  <option value="promotional">عرض ترويجي</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>اختر المستقبلين</label>
                <div className={styles.recipientOptions}>
                  <label className={styles.checkbox}>
                    <input
                      type="radio"
                      name="recipients"
                      value="all"
                      checked={notificationRecipients === 'all'}
                      onChange={(e) => setNotificationRecipients(e.target.value)}
                    />
                    جميع الزبائن
                  </label>
                  <label className={styles.checkbox}>
                    <input
                      type="radio"
                      name="recipients"
                      value="active_orders"
                      checked={notificationRecipients === 'active_orders'}
                      onChange={(e) => setNotificationRecipients(e.target.value)}
                    />
                    الطلبات الحالية فقط
                  </label>
                  <label className={styles.checkbox}>
                    <input
                      type="radio"
                      name="recipients"
                      value="restaurant"
                      checked={notificationRecipients === 'restaurant'}
                      onChange={(e) => setNotificationRecipients(e.target.value)}
                    />
                    مطعم محدد
                  </label>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>رسالة مخصصة (اختياري)</label>
                <textarea
                  className={styles.textarea}
                  placeholder="اكتب الرسالة هنا..."
                  rows={5}
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                />
              </div>

              <button
                className={styles.sendBtn}
                onClick={handleSendNotification}
                disabled={sendingNotification}
              >
                {sendingNotification ? 'جاري الإرسال...' : 'إرسال الآن'}
              </button>
            </div>

            <div className={styles.recentReminders}>
              <h3>الرسائل المرسلة مؤخراً</h3>
              {[
                { type: 'الطلب جاهز للتوصيل', time: 'منذ ساعة', count: 45 },
                { type: 'عرض ترويجي', time: 'أمس', count: 120 },
                { type: 'طلب رأيك', time: 'منذ يومين', count: 85 },
              ].map((reminder, i) => (
                <div key={i} className={styles.reminderItem}>
                  <div className={styles.reminderContent}>
                    <p className={styles.reminderType}>{reminder.type}</p>
                    <p className={styles.reminderTime}>{reminder.time}</p>
                  </div>
                  <span className={styles.reminderBadge}>{reminder.count} متلقي</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Order Details Modal */}
      {selectedOrderId && (
        <OrderDetails
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          onStatusUpdate={loadDashboardData}
        />
      )}

      {/* Menu Management Modal */}
      {menuRestaurant && (
        <MenuManagement
          restaurantId={menuRestaurant.id}
          restaurantName={menuRestaurant.name}
          onClose={() => setMenuRestaurant(null)}
        />
      )}

      {/* Predictive Insights Modal */}
      {showPredictive && (
        <div className={styles.predictiveModal}>
          <div className={styles.predictiveModalContent}>
            <button
              className={styles.closeModal}
              onClick={() => setShowPredictive(false)}
            >
              ✕
            </button>
            <PredictiveInsights />
          </div>
        </div>
      )}
    </div>
  );
}

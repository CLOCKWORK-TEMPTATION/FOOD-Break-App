/**
 * لوحة التحكم - المسؤول / صاحب المطعم
 * Dashboard للإدارة والمتابعة
 */

import React, { useState, useEffect } from 'react';
import styles from './AdminDashboard.module.css';

interface Order {
  id: string;
  restaurantId: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  totalAmount: number;
  createdAt: string;
  estimatedDeliveryTime: number;
  customerPhone: string;
  deliveryAddress: string;
}

interface Restaurant {
  id: string;
  name: string;
  totalOrders: number;
  todayOrders: number;
  totalRevenue: number;
}

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  avgDeliveryTime: number;
}

export default function AdminDashboard() {
  const [selectedTab, setSelectedTab] = useState('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // تحميل البيانات
  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // تحديث كل 30 ثانية
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // هنا يتم جلب البيانات من API
      // const response = await fetch('/api/admin/dashboard');
      // const data = await response.json();
      // setOrders(data.orders);
      // setRestaurants(data.restaurants);
      // setStats(data.stats);
      
      // بيانات تجريبية
      setStats({
        totalOrders: 245,
        pendingOrders: 12,
        completedOrders: 233,
        totalRevenue: 12450,
        avgOrderValue: 50.8,
        avgDeliveryTime: 32,
      });
    } catch (error) {
      console.error('فشل تحميل البيانات:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      // هنا يتم إرسال التحديث إلى API
      // const response = await fetch(`/api/admin/orders/${orderId}`, {
      //   method: 'PATCH',
      //   body: JSON.stringify({ status: newStatus }),
      // });
      alert(`تم تحديث حالة الطلب إلى: ${newStatus}`);
      loadDashboardData();
    } catch (error) {
      alert('فشل تحديث الطلب');
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

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.logo}>🍽️ BreakApp Admin</h1>
          <div className={styles.userSection}>
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
                <p className={styles.statValue}>{stats.totalRevenue} SR</p>
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
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilter(e.target.value)}
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
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
                  {/* أمثلة على الطلبات */}
                  {[1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className={styles.orderRow}>
                      <td className={styles.orderId}>#{String(1000 + i).padStart(5, '0')}</td>
                      <td>
                        <div className={styles.customerInfo}>
                          <div className={styles.customerAvatar}>أ</div>
                          <div>
                            <p className={styles.customerName}>أحمد محمد</p>
                            <p className={styles.customerPhone}>0501234567</p>
                          </div>
                        </div>
                      </td>
                      <td>مطعم البيت الشامي</td>
                      <td>
                        <select
                          className={styles.statusSelect}
                          defaultValue={['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'][i % 5]}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                            const status = e.target.value as Order['status'];
                            updateOrderStatus(`order-${i}`, status);
                          }}
                          style={{
                            backgroundColor: getStatusColor((['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'][i % 5]) as Order['status']),
                          }}
                        >
                          <option value="PENDING">قيد الانتظار</option>
                          <option value="CONFIRMED">مؤكد</option>
                          <option value="PREPARING">قيد الإعداد</option>
                          <option value="OUT_FOR_DELIVERY">في الطريق</option>
                          <option value="DELIVERED">تم التوصيل</option>
                        </select>
                      </td>
                      <td className={styles.amount}>
                        <strong>{85 + i * 10} SR</strong>
                      </td>
                      <td className={styles.time}>{12 + i} دقيقة</td>
                      <td>
                        <button className={styles.detailsBtn}>تفاصيل</button>
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
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={styles.restaurantCard}>
                  <div className={styles.restaurantHeader}>
                    <div className={styles.restaurantInfo}>
                      <h3>مطعم البيت {String.fromCharCode(64 + i)}</h3>
                      <p className={styles.restaurantCategory}>🍕 الأطعمة السريعة</p>
                    </div>
                    <button className={styles.moreBtn}>⋮</button>
                  </div>

                  <div className={styles.restaurantStats}>
                    <div className={styles.stat}>
                      <span className={styles.statNum}>{45 + i * 10}</span>
                      <span className={styles.statLabel}>طلب اليوم</span>
                    </div>
                    <div className={styles.stat}>
                      <span className={styles.statNum}>{2450 + i * 500}</span>
                      <span className={styles.statLabel}>الإيرادات</span>
                    </div>
                    <div className={styles.stat}>
                      <span className={styles.statNum}>4.{8 - i}</span>
                      <span className={styles.statLabel}>التقييم</span>
                    </div>
                  </div>

                  <div className={styles.restaurantActions}>
                    <button className={styles.actionBtn}>تعديل</button>
                    <button className={styles.actionBtn}>عرض القائمة</button>
                    <button className={styles.actionBtn} style={{ color: '#F44336' }}>
                      حذف
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
                  <div className={styles.bar} style={{ height: '65%' }}></div>
                  <div className={styles.bar} style={{ height: '75%' }}></div>
                  <div className={styles.bar} style={{ height: '55%' }}></div>
                  <div className={styles.bar} style={{ height: '85%' }}></div>
                  <div className={styles.bar} style={{ height: '45%' }}></div>
                </div>
              </div>

              <div className={styles.chartCard}>
                <h3>توزيع الحالات</h3>
                <div className={styles.pieChart}>
                  <div className={styles.pieSegment} style={{ '--segment-percent': '40%' } as React.CSSProperties}></div>
                  <div className={styles.pieSegment} style={{ '--segment-percent': '30%' } as React.CSSProperties}></div>
                  <div className={styles.pieSegment} style={{ '--segment-percent': '20%' } as React.CSSProperties}></div>
                  <div className={styles.pieSegment} style={{ '--segment-percent': '10%' } as React.CSSProperties}></div>
                </div>
              </div>
            </div>

            <div className={styles.metricsGrid}>
              <div className={styles.metric}>
                <label>متوسط قيمة الطلب</label>
                <p className={styles.metricValue}>{stats?.avgOrderValue} SR</p>
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

        {selectedTab === 'reminders' && (
          <div className={styles.remindersSection}>
            <div className={styles.sectionHeader}>
              <h2>إرسال التنبيهات والرسائل</h2>
            </div>

            <div className={styles.reminderForm}>
              <div className={styles.formGroup}>
                <label>اختر نوع الرسالة</label>
                <select className={styles.select}>
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
                    <input type="radio" name="recipients" defaultChecked />
                    جميع الزبائن
                  </label>
                  <label className={styles.checkbox}>
                    <input type="radio" name="recipients" />
                    الطلبات الحالية فقط
                  </label>
                  <label className={styles.checkbox}>
                    <input type="radio" name="recipients" />
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
                />
              </div>

              <button className={styles.sendBtn}>إرسال الآن</button>
            </div>

            <div className={styles.recentReminders}>
              <h3>الرسائل المرسلة مؤخراً</h3>
              {[1, 2, 3].map((i) => (
                <div key={i} className={styles.reminderItem}>
                  <div className={styles.reminderContent}>
                    <p className={styles.reminderType}>الطلب جاهز للتوصيل</p>
                    <p className={styles.reminderTime}>أمس الساعة {10 + i}:30</p>
                  </div>
                  <span className={styles.reminderBadge}>{45 + i * 5} متلقي</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
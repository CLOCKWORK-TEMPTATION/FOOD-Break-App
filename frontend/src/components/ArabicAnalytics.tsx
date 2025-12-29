import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import styles from './ArabicAnalytics.module.css';

interface AnalyticsData {
  orders: {
    daily: Array<{ date: string; count: number; revenue: number }>;
    monthly: Array<{ month: string; count: number; revenue: number }>;
    byCategory: Array<{ category: string; count: number; percentage: number }>;
  };
  users: {
    growth: Array<{ month: string; newUsers: number; totalUsers: number }>;
    demographics: Array<{ ageGroup: string; count: number; percentage: number }>;
    activity: Array<{ day: string; activeUsers: number }>;
  };
  restaurants: {
    performance: Array<{ name: string; orders: number; rating: number; revenue: number }>;
    categories: Array<{ category: string; count: number }>;
  };
  revenue: {
    daily: Array<{ date: string; amount: number }>;
    monthly: Array<{ month: string; amount: number; growth: number }>;
    byPaymentMethod: Array<{ method: string; amount: number; percentage: number }>;
  };
}

const ArabicAnalytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedMetric, setSelectedMetric] = useState<'orders' | 'revenue' | 'users'>('orders');

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedPeriod]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics?period=${selectedPeriod}`, {
        headers: {
          'Accept-Language': 'ar',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('فشل في جلب بيانات التحليلات');
      }
      
      const data = await response.json();
      setAnalyticsData(data);
    } catch (error) {
      console.error('خطأ في جلب التحليلات:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatArabicNumber = (num: number): string => {
    return num.toLocaleString('ar-SA');
  };

  const formatCurrency = (amount: number): string => {
    return `${formatArabicNumber(amount)} ريال`;
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>جاري تحميل التحليلات...</p>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className={styles.errorContainer}>
        <p>لا توجد بيانات تحليلات متاحة</p>
        <button onClick={fetchAnalyticsData} className={styles.retryButton}>
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <div className={styles.analyticsContainer}>
      <div className={styles.header}>
        <h1>تحليلات BreakApp</h1>
        <div className={styles.controls}>
          <select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className={styles.periodSelect}
          >
            <option value="daily">يومي</option>
            <option value="weekly">أسبوعي</option>
            <option value="monthly">شهري</option>
          </select>
          
          <select 
            value={selectedMetric} 
            onChange={(e) => setSelectedMetric(e.target.value as any)}
            className={styles.metricSelect}
          >
            <option value="orders">الطلبات</option>
            <option value="revenue">الإيرادات</option>
            <option value="users">المستخدمين</option>
          </select>
        </div>
      </div>

      {/* بطاقات الإحصائيات السريعة */}
      <div className={styles.statsCards}>
        <div className={styles.statCard}>
          <h3>إجمالي الطلبات</h3>
          <p className={styles.statNumber}>
            {formatArabicNumber(analyticsData.orders.daily.reduce((sum, item) => sum + item.count, 0))}
          </p>
          <span className={styles.statChange}>+١٢٪ من الشهر الماضي</span>
        </div>
        
        <div className={styles.statCard}>
          <h3>إجمالي الإيرادات</h3>
          <p className={styles.statNumber}>
            {formatCurrency(analyticsData.revenue.daily.reduce((sum, item) => sum + item.amount, 0))}
          </p>
          <span className={styles.statChange}>+٨٪ من الشهر الماضي</span>
        </div>
        
        <div className={styles.statCard}>
          <h3>المستخدمين النشطين</h3>
          <p className={styles.statNumber}>
            {formatArabicNumber(analyticsData.users.activity.reduce((sum, item) => sum + item.activeUsers, 0))}
          </p>
          <span className={styles.statChange}>+١٥٪ من الشهر الماضي</span>
        </div>
        
        <div className={styles.statCard}>
          <h3>المطاعم النشطة</h3>
          <p className={styles.statNumber}>
            {formatArabicNumber(analyticsData.restaurants.performance.length)}
          </p>
          <span className={styles.statChange}>+٥٪ من الشهر الماضي</span>
        </div>
      </div>

      {/* الرسوم البيانية */}
      <div className={styles.chartsGrid}>
        {/* رسم بياني للطلبات اليومية */}
        <div className={styles.chartCard}>
          <h3>الطلبات اليومية</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsData.orders.daily}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [formatArabicNumber(value as number), name === 'count' ? 'الطلبات' : 'الإيرادات']}
                labelFormatter={(label) => `التاريخ: ${label}`}
              />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#8884d8" name="عدد الطلبات" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* رسم بياني للإيرادات */}
        <div className={styles.chartCard}>
          <h3>الإيرادات الشهرية</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.revenue.monthly}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value) => [formatCurrency(value as number), 'الإيرادات']}
                labelFormatter={(label) => `الشهر: ${label}`}
              />
              <Legend />
              <Bar dataKey="amount" fill="#82ca9d" name="الإيرادات" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* رسم دائري لفئات الطلبات */}
        <div className={styles.chartCard}>
          <h3>توزيع الطلبات حسب الفئة</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analyticsData.orders.byCategory}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ category, percentage }) => `${category} (${formatArabicNumber(percentage)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {analyticsData.orders.byCategory.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [formatArabicNumber(value as number), 'الطلبات']} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* رسم بياني لنمو المستخدمين */}
        <div className={styles.chartCard}>
          <h3>نمو المستخدمين</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsData.users.growth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  formatArabicNumber(value as number), 
                  name === 'newUsers' ? 'مستخدمين جدد' : 'إجمالي المستخدمين'
                ]}
                labelFormatter={(label) => `الشهر: ${label}`}
              />
              <Legend />
              <Line type="monotone" dataKey="newUsers" stroke="#ff7300" name="مستخدمين جدد" />
              <Line type="monotone" dataKey="totalUsers" stroke="#387908" name="إجمالي المستخدمين" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* جدول أداء المطاعم */}
      <div className={styles.tableCard}>
        <h3>أداء المطاعم</h3>
        <div className={styles.tableContainer}>
          <table className={styles.performanceTable}>
            <thead>
              <tr>
                <th>اسم المطعم</th>
                <th>عدد الطلبات</th>
                <th>التقييم</th>
                <th>الإيرادات</th>
              </tr>
            </thead>
            <tbody>
              {analyticsData.restaurants.performance.map((restaurant, index) => (
                <tr key={index}>
                  <td>{restaurant.name}</td>
                  <td>{formatArabicNumber(restaurant.orders)}</td>
                  <td>
                    <div className={styles.rating}>
                      {restaurant.rating.toFixed(1)}
                      <span className={styles.stars}>
                        {'★'.repeat(Math.floor(restaurant.rating))}
                      </span>
                    </div>
                  </td>
                  <td>{formatCurrency(restaurant.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* تحليل طرق الدفع */}
      <div className={styles.chartCard}>
        <h3>توزيع طرق الدفع</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={analyticsData.revenue.byPaymentMethod}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ method, percentage }) => `${method} (${formatArabicNumber(percentage)}%)`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="amount"
            >
              {analyticsData.revenue.byPaymentMethod.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [formatCurrency(value as number), 'المبلغ']} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* تصدير التقارير */}
      <div className={styles.exportSection}>
        <h3>تصدير التقارير</h3>
        <div className={styles.exportButtons}>
          <button 
            onClick={() => window.open('/api/analytics/export/pdf', '_blank')}
            className={styles.exportButton}
          >
            تصدير PDF
          </button>
          <button 
            onClick={() => window.open('/api/analytics/export/excel', '_blank')}
            className={styles.exportButton}
          >
            تصدير Excel
          </button>
          <button 
            onClick={() => window.open('/api/analytics/export/csv', '_blank')}
            className={styles.exportButton}
          >
            تصدير CSV
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArabicAnalytics;
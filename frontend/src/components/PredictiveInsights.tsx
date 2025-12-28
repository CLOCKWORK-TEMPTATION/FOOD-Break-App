/**
 * رؤى تنبؤية للمطعم
 * Predictive Insights Component
 */

import { useState, useEffect } from 'react';
import styles from './PredictiveInsights.module.css';

interface Insight {
  id: string;
  type: 'demand_forecast' | 'peak_time' | 'popular_item' | 'reorder_suggestion' | 'quantity_alert';
  title: string;
  description: string;
  confidence: number;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
  data?: Record<string, unknown>;
}

interface PeakTime {
  hour: number;
  expectedOrders: number;
  confidence: number;
}

interface PopularItem {
  itemId: string;
  itemName: string;
  predictedOrders: number;
  trend: 'up' | 'down' | 'stable';
  percentageChange: number;
}

export default function PredictiveInsights() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [peakTimes, setPeakTimes] = useState<PeakTime[]>([]);
  const [popularItems, setPopularItems] = useState<PopularItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState<'insights' | 'peaks' | 'items'>('insights');

  useEffect(() => {
    loadPredictiveData();
  }, [selectedDate]);

  const loadPredictiveData = async () => {
    try {
      setLoading(true);
      // تحميل البيانات من API
      // const [insightsData, peakData] = await Promise.all([
      //   predictiveService.getPredictiveInsights(),
      //   predictiveService.getPeakTimePredictions(selectedDate),
      // ]);

      // بيانات تجريبية
      setInsights([
        {
          id: '1',
          type: 'demand_forecast',
          title: 'زيادة متوقعة في الطلبات',
          description: 'نتوقع زيادة بنسبة 35% في الطلبات يوم الجمعة القادم بناءً على أنماط الأسابيع السابقة.',
          confidence: 87,
          priority: 'high',
          actionable: true,
        },
        {
          id: '2',
          type: 'popular_item',
          title: 'شاورما الدجاج الأكثر طلباً',
          description: 'من المتوقع أن يكون هذا الطبق الأكثر طلباً خلال الأيام الثلاثة القادمة.',
          confidence: 92,
          priority: 'medium',
          actionable: true,
        },
        {
          id: '3',
          type: 'quantity_alert',
          title: 'تنبيه المخزون',
          description: 'بناءً على التوقعات، قد تحتاج إلى زيادة مخزون الدجاج بنسبة 25%.',
          confidence: 78,
          priority: 'high',
          actionable: true,
        },
        {
          id: '4',
          type: 'peak_time',
          title: 'ساعات الذروة المتوقعة',
          description: 'نتوقع ذروة الطلبات بين الساعة 1-3 ظهراً و 7-9 مساءً.',
          confidence: 85,
          priority: 'medium',
          actionable: false,
        },
        {
          id: '5',
          type: 'reorder_suggestion',
          title: 'اقتراح إعادة طلب',
          description: '12 عميل من المحتمل أن يعيدوا طلباتهم السابقة هذا الأسبوع.',
          confidence: 72,
          priority: 'low',
          actionable: true,
        },
      ]);

      setPeakTimes([
        { hour: 12, expectedOrders: 45, confidence: 88 },
        { hour: 13, expectedOrders: 62, confidence: 91 },
        { hour: 14, expectedOrders: 38, confidence: 85 },
        { hour: 19, expectedOrders: 55, confidence: 89 },
        { hour: 20, expectedOrders: 68, confidence: 92 },
        { hour: 21, expectedOrders: 42, confidence: 86 },
      ]);

      setPopularItems([
        { itemId: '1', itemName: 'شاورما دجاج', predictedOrders: 45, trend: 'up', percentageChange: 15 },
        { itemId: '2', itemName: 'برجر لحم', predictedOrders: 38, trend: 'up', percentageChange: 8 },
        { itemId: '3', itemName: 'فتوش', predictedOrders: 32, trend: 'stable', percentageChange: 2 },
        { itemId: '4', itemName: 'عصير برتقال', predictedOrders: 28, trend: 'down', percentageChange: -5 },
        { itemId: '5', itemName: 'بيتزا مارغريتا', predictedOrders: 25, trend: 'up', percentageChange: 12 },
      ]);
    } catch (error) {
      console.error('فشل تحميل البيانات التنبؤية:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      high: '#F44336',
      medium: '#FF9800',
      low: '#4CAF50',
    };
    return colors[priority] || '#666';
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      demand_forecast: '📈',
      peak_time: '⏰',
      popular_item: '⭐',
      reorder_suggestion: '🔄',
      quantity_alert: '📦',
    };
    return icons[type] || '💡';
  };

  const getTrendIcon = (trend: string) => {
    const icons: Record<string, string> = {
      up: '↑',
      down: '↓',
      stable: '→',
    };
    return icons[trend] || '→';
  };

  const getTrendColor = (trend: string) => {
    const colors: Record<string, string> = {
      up: '#4CAF50',
      down: '#F44336',
      stable: '#FF9800',
    };
    return colors[trend] || '#666';
  };

  const formatHour = (hour: number) => {
    if (hour === 0) return '12 ص';
    if (hour < 12) return `${hour} ص`;
    if (hour === 12) return '12 م';
    return `${hour - 12} م`;
  };

  if (loading) {
    return <div className={styles.loading}>جاري تحميل البيانات التنبؤية...</div>;
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2>🔮 الرؤى التنبؤية</h2>
          <p className={styles.subtitle}>تحليلات ذكية بناءً على بيانات الطلبات السابقة</p>
        </div>
        <div className={styles.dateSelector}>
          <label>التاريخ:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className={styles.dateInput}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'insights' ? styles.active : ''}`}
          onClick={() => setActiveTab('insights')}
        >
          💡 الرؤى ({insights.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'peaks' ? styles.active : ''}`}
          onClick={() => setActiveTab('peaks')}
        >
          ⏰ أوقات الذروة
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'items' ? styles.active : ''}`}
          onClick={() => setActiveTab('items')}
        >
          ⭐ العناصر المتوقعة
        </button>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {/* Insights Tab */}
        {activeTab === 'insights' && (
          <div className={styles.insightsList}>
            {insights.map(insight => (
              <div key={insight.id} className={styles.insightCard}>
                <div className={styles.insightIcon}>{getTypeIcon(insight.type)}</div>
                <div className={styles.insightContent}>
                  <div className={styles.insightHeader}>
                    <h4>{insight.title}</h4>
                    <div className={styles.insightMeta}>
                      <span
                        className={styles.priority}
                        style={{ backgroundColor: getPriorityColor(insight.priority) }}
                      >
                        {insight.priority === 'high' ? 'عاجل' : insight.priority === 'medium' ? 'متوسط' : 'منخفض'}
                      </span>
                      <span className={styles.confidence}>
                        دقة {insight.confidence}%
                      </span>
                    </div>
                  </div>
                  <p className={styles.insightDescription}>{insight.description}</p>
                  {insight.actionable && (
                    <button className={styles.actionBtn}>اتخاذ إجراء</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Peak Times Tab */}
        {activeTab === 'peaks' && (
          <div className={styles.peakTimesSection}>
            <div className={styles.chartContainer}>
              <h4>توزيع الطلبات المتوقعة حسب الساعة</h4>
              <div className={styles.barChart}>
                {peakTimes.map(peak => (
                  <div key={peak.hour} className={styles.barItem}>
                    <div className={styles.barWrapper}>
                      <div
                        className={styles.bar}
                        style={{ height: `${(peak.expectedOrders / 70) * 100}%` }}
                      >
                        <span className={styles.barValue}>{peak.expectedOrders}</span>
                      </div>
                    </div>
                    <span className={styles.barLabel}>{formatHour(peak.hour)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.peakSummary}>
              <div className={styles.summaryCard}>
                <span className={styles.summaryIcon}>🔥</span>
                <div>
                  <h5>ذروة الطلبات</h5>
                  <p>الساعة 8 مساءً (68 طلب متوقع)</p>
                </div>
              </div>
              <div className={styles.summaryCard}>
                <span className={styles.summaryIcon}>📊</span>
                <div>
                  <h5>إجمالي متوقع</h5>
                  <p>310 طلب خلال اليوم</p>
                </div>
              </div>
              <div className={styles.summaryCard}>
                <span className={styles.summaryIcon}>💡</span>
                <div>
                  <h5>توصية</h5>
                  <p>زيادة الطاقم بين 7-9 مساءً</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Popular Items Tab */}
        {activeTab === 'items' && (
          <div className={styles.itemsSection}>
            <div className={styles.itemsList}>
              {popularItems.map((item, index) => (
                <div key={item.itemId} className={styles.itemCard}>
                  <div className={styles.itemRank}>#{index + 1}</div>
                  <div className={styles.itemInfo}>
                    <h4>{item.itemName}</h4>
                    <p className={styles.predictedOrders}>
                      {item.predictedOrders} طلب متوقع
                    </p>
                  </div>
                  <div
                    className={styles.itemTrend}
                    style={{ color: getTrendColor(item.trend) }}
                  >
                    <span className={styles.trendIcon}>{getTrendIcon(item.trend)}</span>
                    <span className={styles.trendValue}>
                      {item.percentageChange > 0 ? '+' : ''}{item.percentageChange}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.recommendation}>
              <h4>💡 توصيات المخزون</h4>
              <ul>
                <li>زيادة مخزون الدجاج بنسبة 20% للأسبوع القادم</li>
                <li>الحفاظ على مستوى مخزون اللحم الحالي</li>
                <li>تقليل طلب البرتقال بنسبة 10%</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

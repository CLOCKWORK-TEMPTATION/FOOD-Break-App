import React, { useState } from 'react';
import axios from 'axios';
import styles from './ArabicReports.module.css';

interface Report {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  parameters: string[];
  format: string;
  icon: string;
}

interface ReportFormData {
  date?: string;
  year?: string;
  month?: string;
  startDate?: string;
  endDate?: string;
}

const ArabicReports: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ReportFormData>({});
  const [currentReport, setCurrentReport] = useState<string | null>(null);

  // تعريف التقارير المتاحة
  const availableReports: Report[] = [
    {
      id: 'daily-orders',
      name: 'تقرير الطلبات اليومية',
      description: 'تقرير بجميع الطلبات في يوم معين',
      endpoint: '/api/arabic-reports/daily-orders',
      parameters: ['date'],
      format: 'PDF',
      icon: '📊'
    },
    {
      id: 'monthly-orders',
      name: 'تقرير الطلبات الشهرية',
      description: 'تقرير بجميع الطلبات في شهر معين',
      endpoint: '/api/arabic-reports/monthly-orders',
      parameters: ['year', 'month'],
      format: 'PDF',
      icon: '📈'
    },
    {
      id: 'restaurants',
      name: 'تقرير المطاعم',
      description: 'تقرير بأداء جميع المطاعم',
      endpoint: '/api/arabic-reports/restaurants',
      parameters: [],
      format: 'PDF',
      icon: '🍽️'
    },
    {
      id: 'stats',
      name: 'تقرير الإحصائيات',
      description: 'تقرير إحصائي شامل',
      endpoint: '/api/arabic-reports/stats',
      parameters: ['startDate', 'endDate'],
      format: 'PDF',
      icon: '📋'
    }
  ];

  React.useEffect(() => {
    setReports(availableReports);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateReport = async (reportId: string) => {
    try {
      setLoading(true);
      setError(null);
      setCurrentReport(reportId);

      const report = availableReports.find(r => r.id === reportId);
      if (!report) return;

      let url = report.endpoint;
      
      // إضافة المعلمات للـ URL
      const params = new URLSearchParams();
      
      if (reportId === 'daily-orders' && formData.date) {
        params.append('date', formData.date);
      } else if (reportId === 'monthly-orders') {
        if (formData.year) params.append('year', formData.year);
        if (formData.month) params.append('month', formData.month);
      } else if (reportId === 'stats') {
        if (formData.startDate) params.append('startDate', formData.startDate);
        if (formData.endDate) params.append('endDate', formData.endDate);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      // إرسال الطلب
      const response = await axios.get(url, {
        responseType: 'blob',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      // تنزيل الملف
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${report.name}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

    } catch (err: any) {
      console.error('Error generating report:', err);
      setError(err.response?.data?.message || 'حدث خطأ أثناء إنشاء التقرير');
    } finally {
      setLoading(false);
      setCurrentReport(null);
    }
  };

  const getFormFields = (reportId: string) => {
    switch (reportId) {
      case 'daily-orders':
        return (
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="date">
              تاريخ اليوم
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date || ''}
              onChange={handleInputChange}
              className={styles.dateInput}
              required
            />
          </div>
        );

      case 'monthly-orders':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="year">
                السنة
              </label>
              <select
                id="year"
                name="year"
                value={formData.year || ''}
                onChange={handleInputChange}
                className={styles.selectInput}
                required
              >
                <option value="">اختر السنة</option>
                {Array.from({ length: 10 }, (_, i) => {
                  const year = new Date().getFullYear() - 5 + i;
                  return <option key={year} value={year}>{year}</option>;
                })}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="month">
                الشهر
              </label>
              <select
                id="month"
                name="month"
                value={formData.month || ''}
                onChange={handleInputChange}
                className={styles.selectInput}
                required
              >
                <option value="">اختر الشهر</option>
                {Array.from({ length: 12 }, (_, i) => {
                  const month = i + 1;
                  const monthName = new Date(2020, i, 1).toLocaleDateString('ar-EG', { month: 'long' });
                  return <option key={month} value={month}>{monthName}</option>;
                })}
              </select>
            </div>
          </div>
        );

      case 'stats':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="startDate">
                تاريخ البدء
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate || ''}
                onChange={handleInputChange}
                className={styles.dateInput}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="endDate">
                تاريخ الانتهاء
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate || ''}
                onChange={handleInputChange}
                className={styles.dateInput}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const isFormValid = (reportId: string) => {
    switch (reportId) {
      case 'daily-orders':
        return !!formData.date;
      case 'monthly-orders':
        return !!formData.year && !!formData.month;
      case 'stats':
        return !!formData.startDate && !!formData.endDate;
      default:
        return true;
    }
  };

  return (
    <div className={styles.reportsContainer}>
      <div className={styles.reportsHeader}>
        <div>
          <h1 className={styles.reportsTitle}>
            📊 نظام التقارير العربية
          </h1>
          <p className={styles.reportsSubtitle}>
            إنشاء وتصدير التقارير باللغة العربية
          </p>
        </div>
      </div>

      {error && (
        <div className={`${styles.alert} ${styles.error}`}>
          ❌ {error}
        </div>
      )}

      <div className={styles.reportsGrid}>
        {reports.map((report) => (
          <div key={report.id} className={styles.reportCard}>
            <div className={styles.reportCardHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span className={styles.reportIcon}>{report.icon}</span>
                <div>
                  <h3 className={styles.reportTitle}>{report.name}</h3>
                  <span style={{ fontSize: '0.8rem', color: '#718096' }}>
                    التنسيق: {report.format}
                  </span>
                </div>
              </div>
            </div>

            <p className={styles.reportDescription}>
              {report.description}
            </p>

            {getFormFields(report.id)}

            <div className={styles.reportActions}>
              <button
                className={`${styles.reportButton} ${styles.primary}`}
                onClick={() => generateReport(report.id)}
                disabled={loading || (currentReport === report.id) || !isFormValid(report.id)}
                style={{
                  opacity: loading || (currentReport === report.id) || !isFormValid(report.id) ? 0.5 : 1,
                  cursor: loading || (currentReport === report.id) || !isFormValid(report.id) ? 'not-allowed' : 'pointer'
                }}
              >
                {loading && currentReport === report.id ? (
                  <>
                    <span className={styles.loadingSpinner}></span>
                    جاري الإنشاء...
                  </>
                ) : (
                  <>
                    📥 تنزيل التقرير
                  </>
                )}
              </button>
              
              <button
                className={`${styles.reportButton} ${styles.secondary}`}
                onClick={() => window.open(report.endpoint, '_blank')}
                disabled={loading}
              >
                👁️ معاينة التقرير
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.alert} style={{ marginTop: '2rem' }}>
        <strong>ملاحظات:</strong>
        <ul style={{ marginTop: '0.5rem', paddingRight: '1rem' }}>
          <li>جميع التقارير تُنشأ بتنسيق PDF باللغة العربية</li>
          <li>النصوص مكتوبة من اليمين لليسار (RTL)</li>
          <li>الخطوط العربية مدعومة بالكامل</li>
          <li>التواريخ تُعرض بالصيغة العربية</li>
          <li>العملات تُعرض بالريال السعودي</li>
        </ul>
      </div>
    </div>
  );
};

export default ArabicReports;
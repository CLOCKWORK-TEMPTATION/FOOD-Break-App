/**
 * Budget Dashboard Component
 * لوحة تحكم الميزانيات والتنبيهات المالية
 */

import React, { useState, useEffect } from 'react';
import {
  Budget,
  CostAlert,
  BudgetAnalytics,
  getAllBudgets,
  getBudgetAlerts,
  getBudgetAnalytics,
  checkBudget,
  resolveAlert
} from '../services/budgetService';

interface BudgetDashboardProps {
  userRole?: 'ADMIN' | 'PRODUCER' | 'VIP' | 'REGULAR';
}

export const BudgetDashboard: React.FC<BudgetDashboardProps> = ({ userRole = 'REGULAR' }) => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [alerts, setAlerts] = useState<CostAlert[]>([]);
  const [analytics, setAnalytics] = useState<BudgetAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);

  // تحميل البيانات عند التحميل الأولي
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // تحميل الميزانيات
      const budgetsResult = await getAllBudgets({ isActive: true });
      setBudgets(budgetsResult.budgets);

      // تحميل الإحصائيات (للمديرين والمنتجين فقط)
      if (userRole === 'ADMIN' || userRole === 'PRODUCER') {
        const analyticsData = await getBudgetAnalytics();
        setAnalytics(analyticsData);
      }

      // تحميل التنبيهات للميزانية الأولى إن وجدت
      if (budgetsResult.budgets.length > 0) {
        const firstBudget = budgetsResult.budgets[0];
        setSelectedBudget(firstBudget);
        await loadBudgetAlerts(firstBudget.id);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل تحميل البيانات');
      console.error('Error loading budget data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadBudgetAlerts = async (budgetId: string) => {
    try {
      const alertsResult = await getBudgetAlerts(budgetId, { isResolved: false });
      setAlerts(alertsResult.alerts);
    } catch (err: any) {
      console.error('Error loading alerts:', err);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleCheckBudget = async (budgetId: string, amount: number) => {
    try {
      const result = await checkBudget(budgetId, amount);

      // تحديث الميزانية المحلية
      setBudgets(budgets.map(b =>
        b.id === budgetId ? result.budget : b
      ));

      // إذا تم إنشاء تنبيه، أضفه للقائمة
      if (result.alert) {
        setAlerts([result.alert, ...alerts]);
      }

      return result;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'فشل فحص الميزانية');
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      await resolveAlert(alertId);

      // تحديث قائمة التنبيهات
      setAlerts(alerts.filter(a => a.id !== alertId));
    } catch (err: any) {
      console.error('Error resolving alert:', err);
    }
  };

  if (loading) {
    return (
      <div className="budget-dashboard loading">
        <div className="spinner">جاري التحميل...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="budget-dashboard error">
        <div className="error-message">
          <h3>خطأ</h3>
          <p>{error}</p>
          <button onClick={loadData}>إعادة المحاولة</button>
        </div>
      </div>
    );
  }

  return (
    <div className="budget-dashboard">
      <header className="dashboard-header">
        <h1>لوحة تحكم الميزانيات</h1>
      </header>

      {/* الإحصائيات العامة */}
      {analytics && (
        <section className="analytics-section">
          <div className="stats-grid">
            <div className="stat-card">
              <h3>إجمالي الميزانيات</h3>
              <p className="stat-value">{analytics.totalBudgets}</p>
              <span className="stat-label">الميزانيات النشطة: {analytics.activeBudgets}</span>
            </div>

            <div className="stat-card">
              <h3>المخصص</h3>
              <p className="stat-value">{analytics.totalAllocated.toLocaleString()} جنيه</p>
              <span className="stat-label">إجمالي المخصص</span>
            </div>

            <div className="stat-card">
              <h3>المستخدم</h3>
              <p className="stat-value">{analytics.totalSpent.toLocaleString()} جنيه</p>
              <span className="stat-label">نسبة الاستخدام: {analytics.utilizationRate.toFixed(1)}%</span>
            </div>

            <div className="stat-card">
              <h3>المتبقي</h3>
              <p className="stat-value">{analytics.totalRemaining.toLocaleString()} جنيه</p>
              <span className="stat-label">المتاح للصرف</span>
            </div>

            <div className="stat-card alert">
              <h3>التنبيهات</h3>
              <p className="stat-value">{analytics.alertsCount}</p>
              <span className="stat-label critical">حرجة: {analytics.criticalAlertsCount}</span>
            </div>
          </div>
        </section>
      )}

      {/* قائمة الميزانيات */}
      <section className="budgets-section">
        <h2>الميزانيات النشطة</h2>
        {budgets.length === 0 ? (
          <div className="empty-state">
            <p>لا توجد ميزانيات نشطة حالياً</p>
          </div>
        ) : (
          <div className="budgets-grid">
            {budgets.map(budget => (
              <BudgetCard
                key={budget.id}
                budget={budget}
                onSelect={() => {
                  setSelectedBudget(budget);
                  loadBudgetAlerts(budget.id);
                }}
                isSelected={selectedBudget?.id === budget.id}
              />
            ))}
          </div>
        )}
      </section>

      {/* التنبيهات */}
      {selectedBudget && alerts.length > 0 && (
        <section className="alerts-section">
          <h2>التنبيهات المالية - {selectedBudget.name}</h2>
          <div className="alerts-list">
            {alerts.map(alert => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onResolve={() => handleResolveAlert(alert.id)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

// مكون بطاقة الميزانية
const BudgetCard: React.FC<{
  budget: Budget;
  onSelect: () => void;
  isSelected: boolean;
}> = ({ budget, onSelect, isSelected }) => {
  const percentage = (budget.usedAmount / budget.maxLimit) * 100;
  const isWarning = percentage >= budget.warningThreshold * 100;
  const isCritical = percentage >= 100;

  return (
    <div
      className={`budget-card ${isSelected ? 'selected' : ''} ${isCritical ? 'critical' : isWarning ? 'warning' : ''}`}
      onClick={onSelect}
    >
      <div className="budget-header">
        <h3>{budget.name}</h3>
        <span className="budget-type">{budget.type}</span>
      </div>

      <div className="budget-progress">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        <div className="progress-labels">
          <span>{budget.usedAmount.toLocaleString()} جنيه</span>
          <span>{budget.maxLimit.toLocaleString()} جنيه</span>
        </div>
      </div>

      <div className="budget-footer">
        <span className="percentage">{percentage.toFixed(1)}%</span>
        <span className="remaining">
          المتبقي: {(budget.maxLimit - budget.usedAmount).toLocaleString()} جنيه
        </span>
      </div>
    </div>
  );
};

// مكون بطاقة التنبيه
const AlertCard: React.FC<{
  alert: CostAlert;
  onResolve: () => void;
}> = ({ alert, onResolve }) => {
  return (
    <div className={`alert-card severity-${alert.severity.toLowerCase()}`}>
      <div className="alert-header">
        <h4>{alert.title}</h4>
        <span className={`alert-type ${alert.alertType.toLowerCase()}`}>
          {alert.alertType}
        </span>
      </div>

      <p className="alert-message">{alert.message}</p>

      <div className="alert-details">
        <span>المبلغ الحالي: {alert.currentAmount.toLocaleString()} جنيه</span>
        <span>الحد الأقصى: {alert.budgetLimit.toLocaleString()} جنيه</span>
        <span className="percentage">{alert.percentage.toFixed(1)}%</span>
      </div>

      <div className="alert-footer">
        <span className="alert-date">
          {new Date(alert.createdAt).toLocaleDateString('ar-EG')}
        </span>
        {!alert.isResolved && (
          <button onClick={onResolve} className="resolve-btn">
            وضع علامة كمحلول
          </button>
        )}
      </div>
    </div>
  );
};

export default BudgetDashboard;

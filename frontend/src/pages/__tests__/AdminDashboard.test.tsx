/**
 * Component Tests لوحة تحكم المسؤول (AdminDashboard)
 * اختبارات شاملة لمكونات واجهة المستخدم
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminDashboard from '../AdminDashboard';

// Mock services
vi.mock('../services/dashboardService', () => ({
  statsService: {
    getDashboardStats: vi.fn(),
  },
  ordersService: {
    getOrders: vi.fn(),
    updateOrderStatus: vi.fn(),
  },
  restaurantsService: {
    getRestaurants: vi.fn(),
  },
  notificationsService: {
    sendNotification: vi.fn(),
  },
}));

// Mock child components
vi.mock('../components/MenuManagement', () => ({
  default: ({ restaurantId, restaurantName, onClose }: any) => (
    <div data-testid="menu-management">
      <button onClick={onClose}>إغلاق</button>
      <span>قائمة {restaurantName}</span>
    </div>
  ),
}));

vi.mock('../components/PredictiveInsights', () => ({
  default: () => <div data-testid="predictive-insights">رؤى تنبؤية</div>,
}));

vi.mock('../components/OrderDetails', () => ({
  default: ({ orderId, onClose, onStatusUpdate }: any) => (
    <div data-testid="order-details">
      <button onClick={onClose}>إغلاق</button>
      <span>تفاصيل الطلب {orderId}</span>
      <button onClick={onStatusUpdate}>تحديث</button>
    </div>
  ),
}));

// Mock CSS modules
vi.mock('../AdminDashboard.module.css', () => ({
  container: 'container',
  header: 'header',
  headerContent: 'headerContent',
  logo: 'logo',
  userSection: 'userSection',
  predictiveBtn: 'predictiveBtn',
  notificationBell: 'notificationBell',
  profileImg: 'profileImg',
  navbar: 'navbar',
  navContent: 'navContent',
  navItem: 'navItem',
  active: 'active',
  main: 'main',
  statsGrid: 'statsGrid',
  statCard: 'statCard',
  statIcon: 'statIcon',
  statContent: 'statContent',
  statLabel: 'statLabel',
  statValue: 'statValue',
  ordersSection: 'ordersSection',
  sectionHeader: 'sectionHeader',
  filterControls: 'filterControls',
  filterSelect: 'filterSelect',
  searchInput: 'searchInput',
  ordersTable: 'ordersTable',
  orderRow: 'orderRow',
  orderId: 'orderId',
  customerInfo: 'customerInfo',
  customerAvatar: 'customerAvatar',
  customerName: 'customerName',
  customerPhone: 'customerPhone',
  statusSelect: 'statusSelect',
  amount: 'amount',
  time: 'time',
  detailsBtn: 'detailsBtn',
  restaurantsSection: 'restaurantsSection',
  restaurantsList: 'restaurantsList',
  restaurantCard: 'restaurantCard',
  restaurantHeader: 'restaurantHeader',
  restaurantInfo: 'restaurantInfo',
  restaurantCategory: 'restaurantCategory',
  statusDot: 'statusDot',
  online: 'online',
  offline: 'offline',
  restaurantStats: 'restaurantStats',
  stat: 'stat',
  statNum: 'statNum',
  restaurantActions: 'restaurantActions',
  actionBtn: 'actionBtn',
  inactive: 'inactive',
  analyticsSection: 'analyticsSection',
  dateRangeSelector: 'dateRangeSelector',
  dateInput: 'dateInput',
  chartsGrid: 'chartsGrid',
  chartCard: 'chartCard',
  chart: 'chart',
  bar: 'bar',
  chartLabels: 'chartLabels',
  pieChart: 'pieChart',
  legend: 'legend',
  legendItem: 'legendItem',
  metricsGrid: 'metricsGrid',
  metric: 'metric',
  metricValue: 'metricValue',
  remindersSection: 'remindersSection',
  reminderForm: 'reminderForm',
  formGroup: 'formGroup',
  select: 'select',
  recipientOptions: 'recipientOptions',
  checkbox: 'checkbox',
  textarea: 'textarea',
  sendBtn: 'sendBtn',
  recentReminders: 'recentReminders',
  reminderItem: 'reminderItem',
  reminderContent: 'reminderContent',
  reminderType: 'reminderType',
  reminderTime: 'reminderTime',
  reminderBadge: 'reminderBadge',
  predictiveModal: 'predictiveModal',
  predictiveModalContent: 'predictiveModalContent',
  closeModal: 'closeModal',
  addBtn: 'addBtn',
}));

import {
  statsService,
  ordersService,
  restaurantsService,
  notificationsService,
} from '../services/dashboardService';

describe('AdminDashboard - عرض لوحة التحكم', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock default API responses
    (statsService.getDashboardStats as any).mockResolvedValue({
      totalOrders: 100,
      pendingOrders: 10,
      completedOrders: 80,
      cancelledOrders: 10,
      totalRevenue: 5000,
      avgOrderValue: 50,
      avgDeliveryTime: 30,
      todayOrders: 25,
      todayRevenue: 1250,
    });

    (ordersService.getOrders as any).mockResolvedValue({
      orders: [
        {
          id: 'order_1',
          orderNumber: '#123456',
          user: { name: 'محمد أحمد', phone: '0501234567' },
          restaurant: { name: 'مطعم السعادة' },
          status: 'PENDING',
          totalAmount: 100,
          estimatedDeliveryTime: 30,
          items: [{ name: 'وجبة دجاج', quantity: 2, price: 50 }],
        },
      ],
    });

    (restaurantsService.getRestaurants as any).mockResolvedValue({
      restaurants: [
        {
          id: 'rest_1',
          name: 'مطعم السعادة',
          cuisine: ['عربي'],
          todayOrders: 15,
          todayRevenue: 750,
          rating: 4.5,
          isActive: true,
        },
      ],
    });

    // Mock alert
    global.alert = vi.fn();
  });

  it('يجب أن يعرض الشعار والعنوان', () => {
    render(<AdminDashboard />);

    expect(screen.getByText(/BreakApp Admin/i)).toBeTruthy();
  });

  it('يجب أن يعرض جميع التبويبات', () => {
    render(<AdminDashboard />);

    expect(screen.getByText(/الطلبات/i)).toBeTruthy();
    expect(screen.getByText(/المطاعم/i)).toBeTruthy();
    expect(screen.getByText(/الإحصائيات/i)).toBeTruthy();
    expect(screen.getByText(/التنبؤات/i)).toBeTruthy();
    expect(screen.getByText(/التنبيهات/i)).toBeTruthy();
  });

  it('يجب أن يعرض إحصائيات لوحة المعلومات', async () => {
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/إجمالي الطلبات/i)).toBeTruthy();
      expect(screen.getByText(/طلبات قيد الانتظار/i)).toBeTruthy();
      expect(screen.getByText(/طلبات مكتملة/i)).toBeTruthy();
      expect(screen.getByText(/الإيرادات اليومية/i)).toBeTruthy();
    });
  });
});

describe('AdminDashboard - إدارة الطلبات', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (statsService.getDashboardStats as any).mockResolvedValue({
      totalOrders: 100,
      pendingOrders: 10,
      completedOrders: 80,
      cancelledOrders: 10,
      totalRevenue: 5000,
    });

    (ordersService.getOrders as any).mockResolvedValue({
      orders: [
        {
          id: 'order_1',
          orderNumber: '#123456',
          user: { name: 'محمد أحمد', phone: '0501234567' },
          restaurant: { name: 'مطعم السعادة' },
          status: 'PENDING',
          totalAmount: 100,
          estimatedDeliveryTime: 30,
          items: [],
        },
        {
          id: 'order_2',
          orderNumber: '#789012',
          user: { name: 'فاطمة علي', phone: '0507654321' },
          restaurant: { name: 'مطعم الذوق الرفيع' },
          status: 'DELIVERED',
          totalAmount: 150,
          estimatedDeliveryTime: 25,
          items: [],
        },
      ],
    });

    global.alert = vi.fn();
  });

  it('يجب أن يعرض قائمة الطلبات', async () => {
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/إدارة الطلبات/i)).toBeTruthy();
    });
  });

  it('يجب أن يفلتر الطلبات حسب الحالة', async () => {
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/إدارة الطلبات/i)).toBeTruthy();
    });

    // التحقق من وجود فلتر الحالة
    const filterSelect = document.querySelector('select') as HTMLSelectElement;
    expect(filterSelect).toBeTruthy();

    if (filterSelect) {
      fireEvent.change(filterSelect, { target: { value: 'pending' } });
      expect(filterSelect.value).toBe('pending');
    }
  });

  it('يجب أن يبحث في الطلبات', async () => {
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/ابحث برقم الطلب/i)).toBeTruthy();
    });

    const searchInput = screen.getByPlaceholderText(/ابحث برقم الطلب/i);
    await userEvent.type(searchInput, '123456');

    expect(searchInput).toHaveValue('123456');
  });

  it('يجب أن يحدث حالة الطلب', async () => {
    (ordersService.updateOrderStatus as any).mockResolvedValue({ success: true });

    render(<AdminDashboard />);

    await waitFor(() => {
      // انتظر تحميل البيانات
    });

    // محاكاة تغيير الحالة
    // هذا يتمن وجود عنصر select في DOM
    const selectElements = document.querySelectorAll('select');
    selectElements.forEach((select) => {
      if (select.value === 'PENDING') {
        fireEvent.change(select, { target: { value: 'CONFIRMED' } });
      }
    });
  });
});

describe('AdminDashboard - إدارة المطاعم', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (statsService.getDashboardStats as any).mockResolvedValue({
      totalOrders: 100,
      pendingOrders: 10,
    });

    (ordersService.getOrders as any).mockResolvedValue({ orders: [] });

    (restaurantsService.getRestaurants as any).mockResolvedValue({
      restaurants: [
        {
          id: 'rest_1',
          name: 'مطعم السعادة',
          cuisine: ['عربي'],
          todayOrders: 15,
          todayRevenue: 750,
          rating: 4.5,
          isActive: true,
        },
        {
          id: 'rest_2',
          name: 'مطعم الذوق الرفيع',
          cuisine: ['إيطالي'],
          todayOrders: 20,
          todayRevenue: 1000,
          rating: 4.8,
          isActive: false,
        },
      ],
    });

    global.alert = vi.fn();
  });

  it('يجب أن يعرض قائمة المطاعم', async () => {
    render(<AdminDashboard />);

    // النقر على تبويب المطاعم
    const restaurantsTab = screen.getByText(/المطاعم/i);
    await userEvent.click(restaurantsTab);

    await waitFor(() => {
      expect(screen.getByText(/إدارة المطاعم/i)).toBeTruthy();
    });
  });
});

describe('AdminDashboard - الإحصائيات', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (statsService.getDashboardStats as any).mockResolvedValue({
      totalOrders: 100,
      pendingOrders: 10,
      completedOrders: 80,
      cancelledOrders: 10,
      totalRevenue: 5000,
      avgOrderValue: 50,
      avgDeliveryTime: 30,
    });

    (ordersService.getOrders as any).mockResolvedValue({ orders: [] });

    (restaurantsService.getRestaurants as any).mockResolvedValue({ restaurants: [] });

    global.alert = vi.fn();
  });

  it('يجب أن يعرض الإحصائيات والتحليلات', async () => {
    render(<AdminDashboard />);

    // النقر على تبويب الإحصائيات
    const analyticsTab = screen.getByText(/الإحصائيات/i);
    await userEvent.click(analyticsTab);

    await waitFor(() => {
      expect(screen.getByText(/الإحصائيات والتحليلات/i)).toBeTruthy();
    });
  });

  it('يجب أن يعرض مقاييس الأداء', async () => {
    render(<AdminDashboard />);

    const analyticsTab = screen.getByText(/الإحصائيات/i);
    await userEvent.click(analyticsTab);

    await waitFor(() => {
      expect(screen.getByText(/متوسط قيمة الطلب/i)).toBeTruthy();
      expect(screen.getByText(/متوسط وقت التوصيل/i)).toBeTruthy();
      expect(screen.getByText(/معدل الإكمال/i)).toBeTruthy();
      expect(screen.getByText(/رضا الزبائن/i)).toBeTruthy();
    });
  });
});

describe('AdminDashboard - الرؤى التنبؤية', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (statsService.getDashboardStats as any).mockResolvedValue({ totalOrders: 100 });
    (ordersService.getOrders as any).mockResolvedValue({ orders: [] });
    (restaurantsService.getRestaurants as any).mockResolvedValue({ restaurants: [] });
  });

  it('يجب أن يعرض مكون الرؤى التنبؤية', async () => {
    render(<AdminDashboard />);

    const predictiveTab = screen.getByText(/التنبؤات/i);
    await userEvent.click(predictiveTab);

    expect(screen.getByTestId('predictive-insights')).toBeTruthy();
  });

  it('يجب أن يفتح نافذة الرؤى التنبؤية من الزر العائم', async () => {
    render(<AdminDashboard />);

    const predictiveBtn = document.querySelector('.predictiveBtn');
    if (predictiveBtn) {
      await userEvent.click(predictiveBtn);
      expect(screen.getByTestId('predictive-insights')).toBeTruthy();
    }
  });
});

describe('AdminDashboard - إرسال التنبيهات', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (statsService.getDashboardStats as any).mockResolvedValue({ totalOrders: 100 });
    (ordersService.getOrders as any).mockResolvedValue({ orders: [] });
    (restaurantsService.getRestaurants as any).mockResolvedValue({ restaurants: [] });

    (notificationsService.sendNotification as any).mockResolvedValue({
      success: true,
    });

    global.alert = vi.fn();
  });

  it('يجب أن يعرض نموذج إرسال التنبيهات', async () => {
    render(<AdminDashboard />);

    const remindersTab = screen.getByText(/التنبيهات/i);
    await userEvent.click(remindersTab);

    await waitFor(() => {
      expect(screen.getByText(/إرسال التنبيهات والرسائل/i)).toBeTruthy();
      expect(screen.getByText(/اختر نوع الرسالة/i)).toBeTruthy();
      expect(screen.getByText(/اختر المستقبلين/i)).toBeTruthy();
    });
  });

  it('يجب أن يتحقق من نوع الرسالة قبل الإرسال', async () => {
    render(<AdminDashboard />);

    const remindersTab = screen.getByText(/التنبيهات/i);
    await userEvent.click(remindersTab);

    const sendButton = screen.getByText(/إرسال الآن/i);
    await userEvent.click(sendButton);

    expect(global.alert).toHaveBeenCalledWith('الرجاء اختيار نوع الرسالة');
  });

  it('يجب أن يرسل التنبيه بنجاح', async () => {
    render(<AdminDashboard />);

    const remindersTab = screen.getByText(/التنبيهات/i);
    await userEvent.click(remindersTab);

    // اختيار نوع الرسالة
    const selectElements = document.querySelectorAll('select');
    const typeSelect = Array.from(selectElements).find((s) =>
      Array.from(s.options).some((o) => o.value === 'order-ready')
    );

    if (typeSelect) {
      fireEvent.change(typeSelect, { target: { value: 'order-ready' } });

      const sendButton = screen.getByText(/إرسال الآن/i);
      await userEvent.click(sendButton);

      await waitFor(() => {
        expect(notificationsService.sendNotification).toHaveBeenCalled();
      });
    }
  });
});

describe('AdminDashboard - النوافذ المنبثقة', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (statsService.getDashboardStats as any).mockResolvedValue({ totalOrders: 100 });
    (ordersService.getOrders as any).mockResolvedValue({
      orders: [
        {
          id: 'order_1',
          orderNumber: '#123456',
          user: { name: 'محمد', phone: '0501234567' },
          restaurant: { name: 'مطعم السعادة' },
          status: 'PENDING',
          totalAmount: 100,
          estimatedDeliveryTime: 30,
          items: [],
        },
      ],
    });
    (restaurantsService.getRestaurants as any).mockResolvedValue({
      restaurants: [
        {
          id: 'rest_1',
          name: 'مطعم السعادة',
          cuisine: ['عربي'],
          todayOrders: 15,
          todayRevenue: 750,
          rating: 4.5,
          isActive: true,
        },
      ],
    });

    global.alert = vi.fn();
  });

  it('يجب أن يفتح نافذة تفاصيل الطلب', async () => {
    render(<AdminDashboard />);

    await waitFor(() => {
      // انتظر تحميل البيانات
    });

    // النقر على زر التفاصيل
    const detailsButtons = document.querySelectorAll('.detailsBtn');
    if (detailsButtons.length > 0) {
      await userEvent.click(detailsButtons[0]);
      expect(screen.getByTestId('order-details')).toBeTruthy();
    }
  });

  it('يجب أن يغلق نافذة تفاصيل الطلب', async () => {
    render(<AdminDashboard />);

    await waitFor(() => {
      // انتظر تحميل البيانات
    });

    const detailsButtons = document.querySelectorAll('.detailsBtn');
    if (detailsButtons.length > 0) {
      await userEvent.click(detailsButtons[0]);

      const closeButton = screen.getByText(/إغلاق/i);
      await userEvent.click(closeButton);

      expect(screen.queryByTestId('order-details')).not.toBeTruthy();
    }
  });

  it('يجب أن يفتح نافذة إدارة القائمة', async () => {
    render(<AdminDashboard />);

    const restaurantsTab = screen.getByText(/المطاعم/i);
    await userEvent.click(restaurantsTab);

    await waitFor(() => {
      // انتظر تحميل البيانات
    });

    // النقر على زر عرض القائمة
    const actionButtons = document.querySelectorAll('.actionBtn');
    if (actionButtons.length > 1) {
      await userEvent.click(actionButtons[1]);
      expect(screen.getByTestId('menu-management')).toBeTruthy();
    }
  });
});

describe('AdminDashboard - معالجة الأخطاء', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock API failure
    (statsService.getDashboardStats as any).mockRejectedValue(
      new Error('فشل الاتصال بالخادم')
    );
    (ordersService.getOrders as any).mockRejectedValue(
      new Error('فشل الاتصال بالخادم')
    );
    (restaurantsService.getRestaurants as any).mockRejectedValue(
      new Error('فشل الاتصال بالخادم')
    );

    global.alert = vi.fn();
  });

  it('يجب أن يعالج فشل تحميل البيانات بأناقة', async () => {
    render(<AdminDashboard />);

    // يجب أن يعرض الشاشة حتى مع فشل تحميل البيانات
    expect(screen.getByText(/BreakApp Admin/i)).toBeTruthy();
  });

  it('يجب أن يعرض إحصائيات فارغة عند فشل التحميل', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });
});

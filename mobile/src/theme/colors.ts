/**
 * نظام الألوان للتطبيق
 * App Color System
 */

export const colors = {
  // الألوان الأساسية
  primary: '#007AFF',
  primaryDark: '#0056b3',
  primaryLight: '#4da3ff',

  // الألوان الثانوية
  secondary: '#5856D6',
  secondaryDark: '#3634a3',
  secondaryLight: '#8583e1',

  // ألوان النجاح والخطأ والتحذير
  success: '#34C759',
  successLight: '#d4edda',
  error: '#FF3B30',
  errorLight: '#f8d7da',
  warning: '#FF9500',
  warningLight: '#fff3cd',
  info: '#5AC8FA',
  infoLight: '#d1ecf1',

  // ألوان النص
  textPrimary: '#1C1C1E',
  textSecondary: '#8E8E93',
  textLight: '#FFFFFF',
  textMuted: '#AEAEB2',

  // ألوان الخلفية
  background: '#F2F2F7',
  backgroundSecondary: '#FFFFFF',
  backgroundTertiary: '#E5E5EA',

  // ألوان الحدود
  border: '#E5E5EA',
  borderDark: '#C7C7CC',

  // ألوان الأيقونات
  icon: '#8E8E93',
  iconActive: '#007AFF',

  // ألوان الحالات
  online: '#34C759',
  offline: '#8E8E93',
  busy: '#FF9500',

  // ألوان التقييم
  star: '#FFD700',
  starEmpty: '#E5E5EA',

  // ألوان التصنيفات
  categoryFood: '#FF6B6B',
  categoryDrink: '#4ECDC4',
  categoryDessert: '#FFE66D',
  categorySnack: '#95E1D3',

  // ألوان حالة الطلب
  orderPending: '#FF9500',
  orderConfirmed: '#007AFF',
  orderPreparing: '#5856D6',
  orderDelivery: '#34C759',
  orderDelivered: '#34C759',
  orderCancelled: '#FF3B30',

  // الظلال
  shadow: 'rgba(0, 0, 0, 0.1)',
  shadowDark: 'rgba(0, 0, 0, 0.2)',

  // الشفافية
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(255, 255, 255, 0.9)',
};

export const gradients = {
  primary: ['#007AFF', '#5856D6'],
  secondary: ['#5856D6', '#FF2D55'],
  success: ['#34C759', '#30D158'],
  warning: ['#FF9500', '#FF3B30'],
  dark: ['#1C1C1E', '#3A3A3C'],
};

export default colors;

/**
 * نظام المسافات للتطبيق
 * App Spacing System
 */

export const spacing = {
  // المسافات الأساسية
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,

  // المسافات المحددة
  screenPadding: 16,
  cardPadding: 16,
  listItemPadding: 12,
  buttonPadding: 12,
  inputPadding: 12,

  // المسافات بين العناصر
  itemGap: 8,
  sectionGap: 24,
  screenGap: 32,

  // نصف القطر للحواف
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
};

export const sizes = {
  // أحجام الأيقونات
  iconXs: 16,
  iconSm: 20,
  iconMd: 24,
  iconLg: 32,
  iconXl: 48,

  // أحجام الصور
  avatarSm: 32,
  avatarMd: 48,
  avatarLg: 64,
  avatarXl: 96,

  // أحجام الأزرار
  buttonSm: 36,
  buttonMd: 44,
  buttonLg: 52,

  // أحجام الإدخال
  inputHeight: 48,
  inputHeightSm: 40,
  inputHeightLg: 56,

  // شريط التنقل
  tabBarHeight: 60,
  headerHeight: 56,
};

export default { spacing, sizes };

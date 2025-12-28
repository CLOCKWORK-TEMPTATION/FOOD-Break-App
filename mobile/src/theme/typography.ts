/**
 * نظام الخطوط للتطبيق
 * App Typography System
 */

import { StyleSheet, Platform } from 'react-native';
import colors from './colors';

export const fontFamilies = {
  regular: Platform.select({
    ios: 'System',
    android: 'Roboto',
  }),
  medium: Platform.select({
    ios: 'System',
    android: 'Roboto-Medium',
  }),
  bold: Platform.select({
    ios: 'System',
    android: 'Roboto-Bold',
  }),
  // للنصوص العربية
  arabicRegular: Platform.select({
    ios: 'System',
    android: 'Roboto',
  }),
};

export const fontSizes = {
  xs: 10,
  sm: 12,
  md: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
};

export const lineHeights = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
};

export const fontWeights = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const typography = StyleSheet.create({
  // العناوين
  h1: {
    fontSize: fontSizes['4xl'],
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    lineHeight: fontSizes['4xl'] * lineHeights.tight,
  },
  h2: {
    fontSize: fontSizes['3xl'],
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    lineHeight: fontSizes['3xl'] * lineHeights.tight,
  },
  h3: {
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
    lineHeight: fontSizes['2xl'] * lineHeights.tight,
  },
  h4: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
    lineHeight: fontSizes.xl * lineHeights.normal,
  },
  h5: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
    lineHeight: fontSizes.lg * lineHeights.normal,
  },

  // النصوص
  body: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.normal,
    color: colors.textPrimary,
    lineHeight: fontSizes.base * lineHeights.normal,
  },
  bodySmall: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.normal,
    color: colors.textPrimary,
    lineHeight: fontSizes.md * lineHeights.normal,
  },
  bodyLarge: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.normal,
    color: colors.textPrimary,
    lineHeight: fontSizes.lg * lineHeights.normal,
  },

  // التسميات
  label: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    color: colors.textSecondary,
    lineHeight: fontSizes.md * lineHeights.normal,
  },
  labelSmall: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: colors.textSecondary,
    lineHeight: fontSizes.sm * lineHeights.normal,
  },

  // النصوص المساعدة
  caption: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.normal,
    color: colors.textMuted,
    lineHeight: fontSizes.xs * lineHeights.normal,
  },

  // الأزرار
  button: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
    textAlign: 'center' as const,
  },
  buttonSmall: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
    textAlign: 'center' as const,
  },
  buttonLarge: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    textAlign: 'center' as const,
  },

  // الروابط
  link: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium,
    color: colors.primary,
    textDecorationLine: 'underline' as const,
  },

  // الأسعار
  price: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: colors.primary,
  },
  priceSmall: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
    color: colors.primary,
  },
  priceLarge: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    color: colors.primary,
  },

  // النص العربي
  arabic: {
    writingDirection: 'rtl' as const,
    textAlign: 'right' as const,
  },
});

export default typography;

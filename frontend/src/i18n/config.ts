/**
 * i18n Configuration - BreakApp
 * إعداد نظام الترجمة والتعريب
 *
 * Features / الميزات:
 * - Multi-language support / دعم متعدد اللغات
 * - RTL support / دعم RTL
 * - Dynamic language switching / تبديل اللغة الديناميكي
 * - Locale-specific formatting / تنسيق حسب اللغة
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import arTranslations from './locales/ar.json';
import enTranslations from './locales/en.json';

// Supported languages / اللغات المدعومة
export const supportedLanguages = {
  ar: {
    code: 'ar',
    name: 'العربية',
    nativeName: 'العربية',
    dir: 'rtl',
    flag: '🇪🇬', // Egyptian flag
  },
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    dir: 'ltr',
    flag: '🇺🇸',
  },
} as const;

// Translation resources
const resources = {
  ar: {
    translation: arTranslations,
  },
  en: {
    translation: enTranslations,
  },
};

// Initialize i18next
i18n
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n to React
  .init({
    resources,
    fallbackLng: 'ar', // Default to Arabic
    supportedLngs: ['ar', 'en'],
    debug: process.env.NODE_ENV === 'development',

    interpolation: {
      escapeValue: false, // React already escapes
    },

    detection: {
      // Language detection order
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },

    react: {
      useSuspense: true, // Enable Suspense for better UX
    },
  });

// Update document direction and language attributes
i18n.on('languageChanged', (lng) => {
  const dir = supportedLanguages[lng as keyof typeof supportedLanguages]?.dir || 'rtl';

  document.documentElement.dir = dir;
  document.documentElement.lang = lng;

  // Add RTL class to body for styling
  if (dir === 'rtl') {
    document.body.classList.add('rtl');
    document.body.classList.remove('ltr');
  } else {
    document.body.classList.add('ltr');
    document.body.classList.remove('rtl');
  }
});

// Set initial direction
const initialLng = i18n.language;
const initialDir =
  supportedLanguages[initialLng as keyof typeof supportedLanguages]?.dir || 'rtl';
document.documentElement.dir = initialDir;
document.documentElement.lang = initialLng;

export default i18n;

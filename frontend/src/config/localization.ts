/**
 * إعدادات التعريب للواجهة الأمامية
 * Frontend Localization Configuration
 */

export interface LocalizedMessages {
  [key: string]: string | LocalizedMessages;
}

export const messages: Record<string, LocalizedMessages> = {
  ar: {
    // رسائل عامة
    common: {
      loading: 'جاري التحميل...',
      error: 'حدث خطأ',
      success: 'تم بنجاح',
      cancel: 'إلغاء',
      confirm: 'تأكيد',
      save: 'حفظ',
      edit: 'تعديل',
      delete: 'حذف',
      add: 'إضافة',
      search: 'بحث',
      filter: 'تصفية',
      sort: 'ترتيب',
      refresh: 'تحديث',
      back: 'رجوع',
      next: 'التالي',
      previous: 'السابق',
      submit: 'إرسال',
      close: 'إغلاق',
      open: 'فتح',
      view: 'عرض',
      download: 'تحميل',
      upload: 'رفع',
      print: 'طباعة',
      export: 'تصدير',
      import: 'استيراد'
    },

    // التنقل
    navigation: {
      dashboard: 'لوحة التحكم',
      orders: 'الطلبات',
      menu: 'القائمة',
      restaurants: 'المطاعم',
      users: 'المستخدمون',
      reports: 'التقارير',
      settings: 'الإعدادات',
      profile: 'الملف الشخصي',
      logout: 'تسجيل الخروج',
      home: 'الرئيسية',
      about: 'حول',
      contact: 'اتصل بنا',
      help: 'مساعدة'
    },

    // المصادقة
    auth: {
      login: 'تسجيل الدخول',
      register: 'إنشاء حساب',
      email: 'البريد الإلكتروني',
      password: 'كلمة المرور',
      confirmPassword: 'تأكيد كلمة المرور',
      name: 'الاسم',
      phone: 'رقم الهاتف',
      forgotPassword: 'نسيت كلمة المرور؟',
      resetPassword: 'إعادة تعيين كلمة المرور',
      loginSuccess: 'تم تسجيل الدخول بنجاح',
      loginError: 'خطأ في تسجيل الدخول',
      registerSuccess: 'تم إنشاء الحساب بنجاح',
      registerError: 'خطأ في إنشاء الحساب',
      invalidCredentials: 'بيانات الدخول غير صحيحة',
      passwordMismatch: 'كلمات المرور غير متطابقة',
      weakPassword: 'كلمة المرور ضعيفة',
      emailRequired: 'البريد الإلكتروني مطلوب',
      passwordRequired: 'كلمة المرور مطلوبة',
      nameRequired: 'الاسم مطلوب'
    },

    // الطلبات
    orders: {
      title: 'إدارة الطلبات',
      newOrder: 'طلب جديد',
      orderHistory: 'تاريخ الطلبات',
      orderDetails: 'تفاصيل الطلب',
      orderNumber: 'رقم الطلب',
      orderDate: 'تاريخ الطلب',
      orderTime: 'وقت الطلب',
      orderStatus: 'حالة الطلب',
      orderTotal: 'إجمالي الطلب',
      orderItems: 'عناصر الطلب',
      deliveryAddress: 'عنوان التوصيل',
      deliveryTime: 'وقت التوصيل',
      paymentMethod: 'طريقة الدفع',
      orderNotes: 'ملاحظات الطلب',
      cancelOrder: 'إلغاء الطلب',
      confirmOrder: 'تأكيد الطلب',
      trackOrder: 'تتبع الطلب',
      reorder: 'إعادة الطلب',
      orderCancelled: 'تم إلغاء الطلب',
      orderConfirmed: 'تم تأكيد الطلب',
      orderPreparing: 'جاري تحضير الطلب',
      orderDelivered: 'تم توصيل الطلب',
      noOrders: 'لا توجد طلبات',
      orderCreated: 'تم إنشاء الطلب بنجاح'
    },

    // القوائم
    menu: {
      title: 'إدارة القوائم',
      menuItems: 'عناصر القائمة',
      addItem: 'إضافة عنصر',
      editItem: 'تعديل عنصر',
      deleteItem: 'حذف عنصر',
      itemName: 'اسم العنصر',
      itemDescription: 'وصف العنصر',
      itemPrice: 'سعر العنصر',
      itemCategory: 'فئة العنصر',
      itemImage: 'صورة العنصر',
      availability: 'التوفر',
      available: 'متوفر',
      unavailable: 'غير متوفر',
      categories: 'الفئات',
      addCategory: 'إضافة فئة',
      categoryName: 'اسم الفئة',
      noItems: 'لا توجد عناصر في القائمة',
      itemAdded: 'تم إضافة العنصر بنجاح',
      itemUpdated: 'تم تحديث العنصر بنجاح',
      itemDeleted: 'تم حذف العنصر بنجاح'
    },

    // المطاعم
    restaurants: {
      title: 'إدارة المطاعم',
      addRestaurant: 'إضافة مطعم',
      editRestaurant: 'تعديل مطعم',
      deleteRestaurant: 'حذف مطعم',
      restaurantName: 'اسم المطعم',
      restaurantAddress: 'عنوان المطعم',
      restaurantPhone: 'هاتف المطعم',
      restaurantEmail: 'بريد المطعم',
      cuisineType: 'نوع المطبخ',
      rating: 'التقييم',
      deliveryTime: 'وقت التوصيل',
      minimumOrder: 'الحد الأدنى للطلب',
      deliveryFee: 'رسوم التوصيل',
      workingHours: 'ساعات العمل',
      isActive: 'نشط',
      isPartner: 'شريك',
      noRestaurants: 'لا توجد مطاعم',
      restaurantAdded: 'تم إضافة المطعم بنجاح',
      restaurantUpdated: 'تم تحديث المطعم بنجاح',
      restaurantDeleted: 'تم حذف المطعم بنجاح'
    },

    // الميزانية
    budget: {
      title: 'إدارة الميزانية',
      totalBudget: 'إجمالي الميزانية',
      usedBudget: 'الميزانية المستخدمة',
      remainingBudget: 'الميزانية المتبقية',
      budgetPercentage: 'نسبة الاستخدام',
      dailySpending: 'الإنفاق اليومي',
      weeklySpending: 'الإنفاق الأسبوعي',
      monthlySpending: 'الإنفاق الشهري',
      budgetAlert: 'تنبيه الميزانية',
      budgetExceeded: 'تم تجاوز الميزانية',
      budgetWarning: 'تحذير الميزانية',
      setBudget: 'تحديد الميزانية',
      budgetLimit: 'حد الميزانية',
      spendingTrend: 'اتجاه الإنفاق',
      costAnalysis: 'تحليل التكاليف',
      savingsGoal: 'هدف التوفير',
      budgetForecast: 'توقعات الميزانية'
    },

    // التوصيات
    recommendations: {
      title: 'التوصيات الذكية',
      personalizedRecommendations: 'توصيات شخصية',
      weatherBasedRecommendations: 'توصيات حسب الطقس',
      nutritionRecommendations: 'توصيات غذائية',
      popularItems: 'الأطباق الشائعة',
      newItems: 'أطباق جديدة',
      similarItems: 'أطباق مشابهة',
      recommendedForYou: 'موصى لك',
      basedOnHistory: 'بناءً على تاريخك',
      tryThis: 'جرب هذا',
      perfectForToday: 'مثالي لليوم',
      comfortFood: 'طعام مريح',
      healthyOptions: 'خيارات صحية',
      quickMeals: 'وجبات سريعة',
      noRecommendations: 'لا توجد توصيات متاحة'
    },

    // التغذية
    nutrition: {
      title: 'التغذية والصحة',
      nutritionDashboard: 'لوحة التغذية',
      dailyNutrition: 'التغذية اليومية',
      weeklyReport: 'التقرير الأسبوعي',
      monthlyReport: 'التقرير الشهري',
      calories: 'السعرات الحرارية',
      protein: 'البروتين',
      carbs: 'الكربوهيدرات',
      fat: 'الدهون',
      fiber: 'الألياف',
      sugar: 'السكر',
      sodium: 'الصوديوم',
      nutritionGoals: 'أهداف التغذية',
      setGoals: 'تحديد الأهداف',
      goalAchieved: 'تم تحقيق الهدف',
      goalProgress: 'تقدم الهدف',
      healthyChoices: 'خيارات صحية',
      nutritionTips: 'نصائح غذائية',
      waterIntake: 'شرب الماء',
      vitamins: 'الفيتامينات',
      minerals: 'المعادن'
    },

    // الإعدادات
    settings: {
      title: 'الإعدادات',
      generalSettings: 'الإعدادات العامة',
      accountSettings: 'إعدادات الحساب',
      notificationSettings: 'إعدادات الإشعارات',
      privacySettings: 'إعدادات الخصوصية',
      language: 'اللغة',
      theme: 'المظهر',
      darkMode: 'الوضع المظلم',
      lightMode: 'الوضع الفاتح',
      notifications: 'الإشعارات',
      emailNotifications: 'إشعارات البريد',
      pushNotifications: 'الإشعارات المنبثقة',
      smsNotifications: 'إشعارات الرسائل',
      soundEnabled: 'تفعيل الصوت',
      vibrationEnabled: 'تفعيل الاهتزاز',
      autoLogin: 'تسجيل الدخول التلقائي',
      rememberMe: 'تذكرني',
      twoFactorAuth: 'المصادقة الثنائية',
      changePassword: 'تغيير كلمة المرور',
      deleteAccount: 'حذف الحساب',
      exportData: 'تصدير البيانات',
      importData: 'استيراد البيانات'
    },

    // رسائل التحقق
    validation: {
      required: 'هذا الحقل مطلوب',
      invalidEmail: 'البريد الإلكتروني غير صحيح',
      invalidPhone: 'رقم الهاتف غير صحيح',
      invalidDate: 'التاريخ غير صحيح',
      invalidNumber: 'الرقم غير صحيح',
      minLength: 'الحد الأدنى {min} أحرف',
      maxLength: 'الحد الأقصى {max} حرف',
      minValue: 'الحد الأدنى {min}',
      maxValue: 'الحد الأقصى {max}',
      mustBePositive: 'يجب أن تكون القيمة موجبة',
      mustBeInteger: 'يجب أن تكون القيمة رقم صحيح',
      passwordTooWeak: 'كلمة المرور ضعيفة',
      passwordMismatch: 'كلمات المرور غير متطابقة',
      fileTooBig: 'حجم الملف كبير جداً',
      invalidFileType: 'نوع الملف غير مدعوم'
    },

    // رسائل الأخطاء
    errors: {
      networkError: 'خطأ في الشبكة',
      serverError: 'خطأ في الخادم',
      notFound: 'غير موجود',
      unauthorized: 'غير مصرح',
      forbidden: 'ممنوع',
      timeout: 'انتهت المهلة الزمنية',
      unknownError: 'خطأ غير معروف',
      connectionLost: 'فقدان الاتصال',
      tryAgain: 'حاول مرة أخرى',
      contactSupport: 'اتصل بالدعم الفني'
    },

    // التواريخ والأوقات
    datetime: {
      now: 'الآن',
      today: 'اليوم',
      yesterday: 'أمس',
      tomorrow: 'غداً',
      thisWeek: 'هذا الأسبوع',
      lastWeek: 'الأسبوع الماضي',
      nextWeek: 'الأسبوع القادم',
      thisMonth: 'هذا الشهر',
      lastMonth: 'الشهر الماضي',
      nextMonth: 'الشهر القادم',
      thisYear: 'هذا العام',
      lastYear: 'العام الماضي',
      nextYear: 'العام القادم',
      morning: 'صباحاً',
      afternoon: 'بعد الظهر',
      evening: 'مساءً',
      night: 'ليلاً',
      am: 'ص',
      pm: 'م'
    }
  },

  en: {
    // English translations (fallback)
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      cancel: 'Cancel',
      confirm: 'Confirm',
      save: 'Save',
      edit: 'Edit',
      delete: 'Delete',
      add: 'Add',
      search: 'Search',
      filter: 'Filter',
      sort: 'Sort',
      refresh: 'Refresh',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      submit: 'Submit',
      close: 'Close',
      open: 'Open',
      view: 'View',
      download: 'Download',
      upload: 'Upload',
      print: 'Print',
      export: 'Export',
      import: 'Import'
    }
    // ... (يمكن إضافة باقي الترجمات الإنجليزية عند الحاجة)
  }
};

/**
 * الحصول على رسالة مترجمة
 */
export function getMessage(key: string, lang: string = 'ar', params: Record<string, any> = {}): string {
  try {
    const keys = key.split('.');
    let message: any = messages[lang];
    
    for (const k of keys) {
      message = message?.[k];
      if (!message) break;
    }
    
    // إذا لم توجد الرسالة بالعربية، استخدم الإنجليزية
    if (!message && lang === 'ar') {
      return getMessage(key, 'en', params);
    }
    
    // استبدال المعاملات
    if (message && typeof message === 'string') {
      Object.keys(params).forEach(param => {
        message = message.replace(`{${param}}`, params[param]);
      });
    }
    
    return message || key;
  } catch (error) {
    console.error('خطأ في الحصول على الرسالة:', error);
    return key;
  }
}

/**
 * تحديد اللغة من المتصفح
 */
export function getLanguageFromBrowser(): string {
  const browserLang = navigator.language || navigator.languages?.[0];
  return browserLang?.startsWith('ar') ? 'ar' : 'ar'; // افتراضي: العربية
}

/**
 * حفظ اللغة في localStorage
 */
export function saveLanguage(lang: string): void {
  localStorage.setItem('language', lang);
}

/**
 * الحصول على اللغة من localStorage
 */
export function getSavedLanguage(): string {
  return localStorage.getItem('language') || getLanguageFromBrowser();
}

/**
 * تحديد اتجاه النص
 */
export function getTextDirection(lang: string): 'rtl' | 'ltr' {
  return lang === 'ar' ? 'rtl' : 'ltr';
}

/**
 * Hook للترجمة
 */
export function useTranslation(lang: string = getSavedLanguage()) {
  const t = (key: string, params: Record<string, any> = {}) => getMessage(key, lang, params);
  const direction = getTextDirection(lang);
  
  return { t, lang, direction };
}
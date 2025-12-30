/**
 * رسائل التعريب الخاصة بجداول التصوير
 * Schedule Integration Localization Messages
 */

const scheduleMessages = {
  ar: {
    // رسائل جداول التصوير
    schedules: {
      scheduleCreated: 'تم إنشاء جدول التصوير بنجاح',
      scheduleCreationFailed: 'فشل في إنشاء جدول التصوير',
      scheduleUpdated: 'تم تحديث جدول التصوير بنجاح',
      scheduleUpdateFailed: 'فشل في تحديث جدول التصوير',
      scheduleDeleted: 'تم حذف جدول التصوير بنجاح',
      scheduleDeletionFailed: 'فشل في حذف جدول التصوير',
      scheduleNotFound: 'جدول التصوير غير موجود',
      schedulesFetchFailed: 'فشل في جلب جداول التصوير',
      todayScheduleNotFound: 'لا يوجد جدول تصوير لليوم',
      todayScheduleFetchFailed: 'فشل في جلب جدول اليوم',
      breakStarted: 'تم بدء فترة البريك بنجاح - يمكن للطاقم الآن طلب الوجبات',
      breakStartFailed: 'فشل في بدء البريك',
      breakEnded: 'تم إنهاء فترة البريك - لا يمكن طلب المزيد من الوجبات',
      breakEndFailed: 'فشل في إنهاء البريك',
      breakNotFound: 'جدول البريك غير موجود',
      activeBreaksFetchFailed: 'فشل في جلب البريكات النشطة',
      scheduleHasOrders: 'لا يمكن حذف الجدول لوجود طلبات مرتبطة به',
      scheduleReportFailed: 'فشل في إنشاء تقرير الجداول',
      breakStatsFailed: 'فشل في جلب إحصائيات البريكات',
      breakCheckFailed: 'فشل في فحص البريكات النشطة',
      scheduleDelayDetected: 'تم رصد تأخير في جدول التصوير: {minutes} دقيقة',
      breakDelayDetected: 'تم رصد تأخير في البريك: {minutes} دقيقة',
      scheduleDataRequired: 'البيانات المطلوبة مفقودة: اسم الجدول، تاريخ التصوير، ووقت الحضور',
      invalidDateFormat: 'صيغة التاريخ غير صحيحة. استخدم YYYY-MM-DD',
      invalidTimeFormat: 'صيغة الوقت غير صحيحة. استخدم HH:MM',
      invalidBreakData: 'بيانات البريك غير مكتملة',
      invalidBreakTime: 'أوقات البريك غير صحيحة',
      invalidBreakDuration: 'وقت انتهاء البريك يجب أن يكون بعد وقت البداية',
      invalidBreakType: 'نوع البريك غير صحيح',
      orderWindowOpened: 'تم فتح نافذة طلب {breakName}',
      orderWindowClosed: 'تم إغلاق نافذة طلب {breakName}',
      reminderSent: 'تم إرسال تذكير البريك: باقي {minutes} دقيقة للطلب',
      scheduleIntegrationEnabled: 'تم تفعيل تكامل الجداول بنجاح',
      scheduleIntegrationDisabled: 'تم إلغاء تفعيل تكامل الجداول',
      autoNotificationsEnabled: 'تم تفعيل الإشعارات التلقائية',
      autoNotificationsDisabled: 'تم إلغاء تفعيل الإشعارات التلقائية',
      deliveryTimesAdjusted: 'تم تعديل أوقات التوصيل بسبب التأخير',
      breakTimesAdjusted: 'تم تعديل أوقات البريك بسبب التأخير',
      cronJobsStarted: 'تم تشغيل المهام المجدولة لنظام الجداول بنجاح',
      cronJobsStopped: 'تم إيقاف المهام المجدولة بنجاح',
      breakMonitoringActive: 'مراقبة البريكات نشطة',
      orderRemindersActive: 'تذكيرات الطلبات نشطة',
      delayMonitoringActive: 'مراقبة التأخيرات نشطة',
      dataCleanupScheduled: 'تم جدولة تنظيف البيانات القديمة',
      systemHealthy: 'نظام تكامل الجداول يعمل بشكل طبيعي'
    },

    // حالات جداول التصوير
    scheduleStatus: {
      SCHEDULED: 'مجدول',
      IN_PROGRESS: 'قيد التنفيذ',
      ON_BREAK: 'في فترة راحة',
      DELAYED: 'متأخر',
      COMPLETED: 'مكتمل',
      CANCELLED: 'ملغي',
      POSTPONED: 'مؤجل'
    },

    // أنواع البريك
    breakTypes: {
      BREAKFAST: 'إفطار',
      LUNCH: 'غداء',
      DINNER: 'عشاء',
      SNACK: 'وجبة خفيفة',
      TEA_BREAK: 'استراحة شاي',
      MEAL_BREAK: 'استراحة وجبة'
    },

    // حالات البريك
    breakStatus: {
      SCHEDULED: 'مجدول',
      ACTIVE: 'نشط',
      IN_PROGRESS: 'قيد التنفيذ',
      COMPLETED: 'مكتمل',
      CANCELLED: 'ملغي',
      DELAYED: 'متأخر'
    },

    // أنواع التغييرات في الجدول
    changeTypes: {
      TIME_DELAY: 'تأخير في الوقت',
      TIME_ADVANCE: 'تقديم في الوقت',
      BREAK_ADDED: 'إضافة بريك',
      BREAK_REMOVED: 'حذف بريك',
      BREAK_MODIFIED: 'تعديل بريك',
      LOCATION_CHANGE: 'تغيير الموقع',
      CANCELLATION: 'إلغاء',
      POSTPONEMENT: 'تأجيل'
    },

    // رسائل المهام المجدولة
    cronJobs: {
      breakMonitoring: 'مراقبة البريكات',
      orderReminders: 'تذكيرات الطلبات',
      delayMonitoring: 'مراقبة التأخيرات',
      dataCleanup: 'تنظيف البيانات',
      breakChecked: 'تم فحص البريكات - بدء {started}، إنهاء {ended}',
      remindersSent: 'تم إرسال {count} تذكير للطلبات',
      delaysDetected: 'تم رصد {count} تأخير في الجداول',
      dataCleanedUp: 'تم تنظيف {count} سجل قديم',
      jobStarted: 'تم بدء المهمة: {jobName}',
      jobCompleted: 'تم إكمال المهمة: {jobName}',
      jobFailed: 'فشلت المهمة: {jobName} - {error}'
    },

    // رسائل الإشعارات
    notifications: {
      scheduleCreated: 'جدول تصوير جديد',
      scheduleChanged: 'تغيير في جدول التصوير',
      breakStarted: 'بدء فترة البريك',
      breakEnding: 'انتهاء فترة البريك قريباً',
      orderReminder: 'تذكير طلب البريك',
      scheduleDelay: 'تأخير في جدول التصوير',
      breakDelay: 'تأخير في البريك',
      orderWindowOpening: 'فتح نافذة الطلب قريباً',
      orderWindowClosing: 'إغلاق نافذة الطلب قريباً'
    }
  },

  en: {
    // English translations
    schedules: {
      scheduleCreated: 'Shooting schedule created successfully',
      scheduleCreationFailed: 'Failed to create shooting schedule',
      scheduleUpdated: 'Shooting schedule updated successfully',
      scheduleUpdateFailed: 'Failed to update shooting schedule',
      scheduleDeleted: 'Shooting schedule deleted successfully',
      scheduleDeletionFailed: 'Failed to delete shooting schedule',
      scheduleNotFound: 'Shooting schedule not found',
      schedulesFetchFailed: 'Failed to fetch shooting schedules',
      todayScheduleNotFound: 'No shooting schedule for today',
      todayScheduleFetchFailed: 'Failed to fetch today\'s schedule',
      breakStarted: 'Break started successfully - crew can now place orders',
      breakStartFailed: 'Failed to start break',
      breakEnded: 'Break ended - no more orders can be placed',
      breakEndFailed: 'Failed to end break',
      breakNotFound: 'Break schedule not found',
      activeBreaksFetchFailed: 'Failed to fetch active breaks',
      scheduleHasOrders: 'Cannot delete schedule with related orders',
      scheduleReportFailed: 'Failed to generate schedule report',
      breakStatsFailed: 'Failed to fetch break statistics',
      breakCheckFailed: 'Failed to check active breaks',
      scheduleDelayDetected: 'Schedule delay detected: {minutes} minutes',
      breakDelayDetected: 'Break delay detected: {minutes} minutes',
      scheduleDataRequired: 'Required data missing: schedule name, date, and call time',
      invalidDateFormat: 'Invalid date format. Use YYYY-MM-DD',
      invalidTimeFormat: 'Invalid time format. Use HH:MM',
      invalidBreakData: 'Break data is incomplete',
      invalidBreakTime: 'Break times are invalid',
      invalidBreakDuration: 'Break end time must be after start time',
      invalidBreakType: 'Invalid break type',
      orderWindowOpened: 'Order window opened for {breakName}',
      orderWindowClosed: 'Order window closed for {breakName}',
      reminderSent: 'Break reminder sent: {minutes} minutes remaining',
      scheduleIntegrationEnabled: 'Schedule integration enabled successfully',
      scheduleIntegrationDisabled: 'Schedule integration disabled',
      autoNotificationsEnabled: 'Auto notifications enabled',
      autoNotificationsDisabled: 'Auto notifications disabled',
      deliveryTimesAdjusted: 'Delivery times adjusted due to delay',
      breakTimesAdjusted: 'Break times adjusted due to delay'
    }
  }
};

/**
 * الحصول على رسالة جدول مترجمة
 * @param {string} key - مفتاح الرسالة
 * @param {string} lang - اللغة (ar/en)
 * @param {object} params - معاملات للاستبدال
 * @returns {string} الرسالة المترجمة
 */
function getScheduleMessage(key, lang = 'ar', params = {}) {
  try {
    const keys = key.split('.');
    let message = scheduleMessages[lang];
    
    for (const k of keys) {
      message = message[k];
      if (!message) break;
    }
    
    // إذا لم توجد الرسالة بالعربية، استخدم الإنجليزية
    if (!message && lang === 'ar') {
      return getScheduleMessage(key, 'en', params);
    }
    
    // استبدال المعاملات
    if (message && typeof message === 'string') {
      Object.keys(params).forEach(param => {
        message = message.replace(`{${param}}`, params[param]);
      });
    }
    
    return message || key;
  } catch (error) {
    console.error('خطأ في الحصول على رسالة الجدول:', error);
    return key;
  }
}

module.exports = {
  scheduleMessages,
  getScheduleMessage
};
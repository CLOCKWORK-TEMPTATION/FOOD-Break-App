/**
 * إعدادات التعريب والترجمة
 * Localization and Translation Configuration
 */

const messages = {
  ar: {
    // رسائل المصادقة
    auth: {
      loginSuccess: 'تم تسجيل الدخول بنجاح',
      loginFailed: 'فشل في تسجيل الدخول',
      registerSuccess: 'تم إنشاء الحساب بنجاح',
      registerFailed: 'فشل في إنشاء الحساب',
      invalidCredentials: 'بيانات الدخول غير صحيحة',
      userNotFound: 'المستخدم غير موجود',
      emailExists: 'البريد الإلكتروني مستخدم بالفعل',
      tokenExpired: 'انتهت صلاحية الرمز المميز',
      accessDenied: 'تم رفض الوصول',
      unauthorized: 'غير مصرح لك بالوصول',
      passwordTooWeak: 'كلمة المرور ضعيفة جداً',
      emailRequired: 'البريد الإلكتروني مطلوب',
      passwordRequired: 'كلمة المرور مطلوبة',
      nameRequired: 'الاسم مطلوب'
    },

    // رسائل الطلبات
    orders: {
      orderCreated: 'تم إنشاء الطلب بنجاح',
      orderUpdated: 'تم تحديث الطلب بنجاح',
      orderCancelled: 'تم إلغاء الطلب',
      orderNotFound: 'الطلب غير موجود',
      orderAlreadyConfirmed: 'الطلب مؤكد بالفعل',
      orderWindowClosed: 'انتهت فترة تقديم الطلبات',
      insufficientBalance: 'الرصيد غير كافي',
      itemNotAvailable: 'العنصر غير متوفر',
      quantityExceeded: 'تم تجاوز الكمية المسموحة',
      deliveryScheduled: 'تم جدولة التوصيل',
      orderDelivered: 'تم توصيل الطلب',
      orderPreparing: 'جاري تحضير الطلب',
      orderOutForDelivery: 'الطلب في الطريق',
      itemsRequired: 'يجب إضافة عنصر واحد على الأقل للطلب',
      orderCreationFailed: 'فشل في إنشاء الطلب',
      ordersFetchFailed: 'فشل في جلب الطلبات',
      orderAccessDenied: 'غير مصرح لك بالوصول إلى هذا الطلب',
      orderStatusUpdateDenied: 'غير مصرح لك بتحديث حالة الطلب',
      orderStatusRequired: 'حالة الطلب مطلوبة',
      orderStatusUpdated: 'تم تحديث حالة الطلب إلى {status}',
      orderStatusUpdateFailed: 'فشل في تحديث حالة الطلب',
      orderCancellationFailed: 'فشل في إلغاء الطلب',
      aggregationAccessDenied: 'غير مصرح لك بالوصول إلى تجميع الطلبات',
      aggregationSuccess: 'تم تجميع الطلبات بنجاح',
      aggregationFailed: 'فشل في تجميع الطلبات',
      summaryAccessDenied: 'غير مصرح لك بالوصول إلى ملخص الطلبات',
      summaryFetchFailed: 'فشل في جلب ملخص اليوم',
      exportAccessDenied: 'غير مصرح لك بتصدير التقارير',
      exportSuccess: 'تم تصدير التقرير بنجاح',
      exportFailed: 'فشل في تصدير التقرير',
      statsAccessDenied: 'غير مصرح لك بالوصول إلى الإحصائيات',
      statsFetchFailed: 'فشل في جلب الإحصائيات',
      usersInfoAccessDenied: 'غير مصرح لك بالوصول إلى هذه المعلومات',
      usersFetchFailed: 'فشل في جلب المستخدمين'
    },

    // رسائل القوائم والمطاعم
    menu: {
      menuItemAdded: 'تم إضافة عنصر القائمة',
      menuItemUpdated: 'تم تحديث عنصر القائمة',
      menuItemDeleted: 'تم حذف عنصر القائمة',
      menuItemNotFound: 'عنصر القائمة غير موجود',
      restaurantAdded: 'تم إضافة المطعم',
      restaurantUpdated: 'تم تحديث المطعم',
      restaurantNotFound: 'المطعم غير موجود',
      menuNotAvailable: 'القائمة غير متوفرة حالياً',
      priceRequired: 'السعر مطلوب',
      nameRequired: 'الاسم مطلوب',
      categoryRequired: 'الفئة مطلوبة'
    },

    // رسائل الاستثناءات
    exceptions: {
      exceptionCreated: 'تم إنشاء الاستثناء بنجاح',
      exceptionApproved: 'تم الموافقة على الاستثناء',
      exceptionRejected: 'تم رفض الاستثناء',
      exceptionNotFound: 'الاستثناء غير موجود',
      quotaExceeded: 'تم تجاوز حد الاستثناءات المسموح',
      insufficientPermissions: 'صلاحيات غير كافية',
      budgetExceeded: 'تم تجاوز الميزانية المحددة',
      reasonRequired: 'السبب مطلوب',
      amountRequired: 'المبلغ مطلوب',
      exceptionTypeRequired: 'نوع الاستثناء مطلوب',
      exceptionTypeAndTotalRequired: 'نوع الاستثناء وإجمالي الطلب مطلوبان'
    },

    // رسائل المدفوعات
    payments: {
      paymentSuccess: 'تم الدفع بنجاح',
      paymentFailed: 'فشل في الدفع',
      paymentPending: 'الدفع قيد المعالجة',
      paymentCancelled: 'تم إلغاء الدفع',
      refundProcessed: 'تم معالجة الاسترداد',
      invalidAmount: 'المبلغ غير صحيح',
      paymentMethodRequired: 'طريقة الدفع مطلوبة',
      cardDeclined: 'تم رفض البطاقة',
      insufficientFunds: 'الأموال غير كافية',
      invalidAmount: 'المبلغ غير صالح',
      paymentIntentCreateFailed: 'فشل إنشاء نية الدفع',
      paymentConfirmFailed: 'فشل تأكيد الدفع',
      paymentMethodSaveFailed: 'فشل حفظ طريقة الدفع',
      paymentMethodDeleteFailed: 'فشل حذف طريقة الدفع',
      paymentMethodsFetchFailed: 'فشل تحميل طرق الدفع',
      invoiceCreateFailed: 'فشل إنشاء الفاتورة',
      invoicesFetchFailed: 'فشل تحميل الفواتير',
      refundProcessFailed: 'فشل معالجة الاسترداد',
      paymentMethodSaved: 'تم حفظ طريقة الدفع بنجاح',
      paymentMethodDeleted: 'تم حذف طريقة الدفع بنجاح',
      invoiceCreated: 'تم إنشاء الفاتورة بنجاح',
      paymentInfoIncomplete: 'معلومات الدفع غير مكتملة',
      paymentInfoNotFound: 'لم يتم العثور على معلومات الدفع',
      paymentMethodIdRequired: 'معرف طريقة الدفع مطلوب',
      paymentMethodNotFound: 'لم يتم العثور على طريقة الدفع',
      invoiceAlreadyExists: 'يوجد فاتورة بالفعل لهذا الطلب',
      cannotRefundIncompletePayment: 'لا يمكن استرداد مبلغ من عملية دفع غير مكتملة',
      paymentIntentIdRequired: 'معرف عملية الدفع مطلوب',
      paymentNotFound: 'لم يتم العثور على عملية الدفع',
      orderAccessDenied: 'غير مصرح لك بإنشاء فاتورة لهذا الطلب'
    },

    // رسائل التوصيات
    recommendations: {
      recommendationsGenerated: 'تم إنشاء التوصيات',
      noRecommendations: 'لا توجد توصيات متاحة',
      recommendationSaved: 'تم حفظ التوصية',
      weatherDataUnavailable: 'بيانات الطقس غير متوفرة',
      aiServiceUnavailable: 'خدمة الذكاء الاصطناعي غير متوفرة',
      preferencesUpdated: 'تم تحديث التفضيلات'
    },

    // رسائل التغذية
    nutrition: {
      nutritionLogAdded: 'تم إضافة سجل التغذية',
      nutritionGoalSet: 'تم تحديد هدف التغذية',
      nutritionReportGenerated: 'تم إنشاء تقرير التغذية',
      challengeJoined: 'تم الانضمام للتحدي',
      challengeCompleted: 'تم إكمال التحدي',
      goalAchieved: 'تم تحقيق الهدف',
      streakBroken: 'انقطعت السلسلة',
      caloriesRequired: 'السعرات الحرارية مطلوبة',
      nutritionLogFailed: 'فشل تسجيل البيانات الغذائية',
      nutritionFetchFailed: 'فشل جلب البيانات الغذائية',
      nutritionLogsFetchFailed: 'فشل جلب سجلات التغذية',
      goalTypeRequired: 'يجب تحديد نوع الهدف',
      goalSetSuccess: 'تم تعيين الهدف بنجاح',
      goalSetFailed: 'فشل تعيين الهدف',
      goalsFetchFailed: 'فشل جلب الأهداف',
      reportGenerateSuccess: 'تم إنشاء التقرير بنجاح',
      reportGenerateFailed: 'فشل إنشاء التقرير',
      reportsFetchFailed: 'فشل جلب التقارير',
      challengeCreateSuccess: 'تم إنشاء التحدي بنجاح',
      challengeCreateFailed: 'فشل إنشاء التحدي',
      challengesFetchFailed: 'فشل جلب التحديات',
      challengeJoinSuccess: 'تم الانضمام للتحدي بنجاح',
      challengeJoinFailed: 'فشل الانضمام للتحدي',
      progressRequired: 'يجب تحديد قيمة التقدم',
      progressUpdateSuccess: 'تم تحديث التقدم بنجاح',
      progressUpdateFailed: 'فشل تحديث التقدم',
      leaderboardFetchFailed: 'فشل جلب لوحة الصدارة',
      userChallengesFetchFailed: 'فشل جلب تحديات المستخدم'
    },

    // رسائل الطوارئ
    emergency: {
      emergencyOrderCreated: 'تم إنشاء طلب طوارئ',
      emergencyProtocolActivated: 'تم تفعيل بروتوكول الطوارئ',
      medicalAlertTriggered: 'تم تفعيل تنبيه طبي',
      allergyAlertTriggered: 'تم تفعيل تنبيه حساسية',
      emergencyContactNotified: 'تم إشعار جهة الاتصال الطارئة',
      emergencyRestaurantNotified: 'تم إشعار مطعم الطوارئ'
    },

    // رسائل الحمية الغذائية
    dietary: {
      profileNotFound: 'لم يتم العثور على ملف الحمية الغذائية',
      profileUpdated: 'تم تحديث ملف الحمية الغذائية بنجاح',
      profileDeleted: 'تم حذف ملف الحمية الغذائية بنجاح',
      allergyProfileNotFound: 'لم يتم العثور على ملف الحساسية',
      allergyProfileUpdated: 'تم تحديث ملف الحساسية بنجاح',
      invalidInput: 'يجب توفير قائمة عناصر صالحة',
      labelNotFound: 'لم يتم العثور على تسمية الطعام',
      labelUpdated: 'تم تحديث تسمية الطعام بنجاح',
      labelVerified: 'تم التحقق من تسمية الطعام بنجاح',
      labelUnverified: 'تم إلغاء التحقق من تسمية الطعام',
      infoNotFound: 'لم يتم العثور على معلومات الحساسية',
      messageCreated: 'تم إنشاء الرسالة بنجاح',
      autoMessagesCreated: 'تم إنشاء {count} رسالة تلقائية',
      messageAcknowledged: 'تم إقرار الرسالة بنجاح',
      messageReplied: 'تم الرد على الرسالة بنجاح'
    },

    // رسائل الإدارة
    admin: {
      statsFetchFailed: 'فشل في جلب الإحصائيات',
      pendingOrdersFetchFailed: 'فشل في جلب الطلبات المعلقة',
      restaurantsFetchFailed: 'فشل في جلب المطاعم',
      restaurantNotFound: 'المطعم غير موجود',
      toggleFailed: 'فشل في تبديل الحالة',
      menuFetchFailed: 'فشل في جلب قائمة المطعم',
      menuUpdateFailed: 'فشل في تحديث عنصر القائمة',
      itemNotFound: 'العنصر غير موجود',
      notificationSendFailed: 'فشل في إرسال الإشعارات',
      notificationsSent: 'تم إرسال {count} إشعار'
    },

    // رسائل المشاعر والذكاء العاطفي
    emotion: {
      moodLogSuccess: 'تم تسجيل الحالة المزاجية بنجاح',
      moodLogFailed: 'فشل في تسجيل الحالة المزاجية',
      moodRequired: 'الحالة المزاجية مطلوبة',
      recommendationsFailed: 'فشل في جلب التوصيات',
      consentUpdated: 'تم تحديث الموافقة بنجاح',
      consentUpdateFailed: 'فشل في تحديث الموافقة'
    },

    // رسائل التعلم الآلي
    ml: {
      trainingDataCollected: 'تم جمع بيانات التدريب بنجاح',
      trainingDataCollectionError: 'حدث خطأ في جمع بيانات التدريب',
      modelTrainingSuccess: 'تم تدريب النموذج بنجاح',
      modelTrainingError: 'حدث خطأ في تدريب النموذج',
      insufficientData: 'بيانات التدريب غير كافية',
      allModelsTrainingSuccess: 'تم تدريب جميع النماذج بنجاح',
      allModelsTrainingPartial: 'تم تدريب بعض النماذج مع وجود أخطاء',
      allModelsTrainingError: 'حدث خطأ في تدريب النماذج',
      restaurantSearchError: 'حدث خطأ في البحث عن المطاعم',
      qualityAnalysisError: 'حدث خطأ في تحليل جودة المطعم',
      restaurantSuggestionError: 'حدث خطأ في اقتراح المطاعم',
      trialCreated: 'تم إنشاء سير عمل التجريب بنجاح',
      trialCreationError: 'حدث خطأ في إنشاء سير عمل التجريب',
      trialPassed: 'نجح المطعم في التجربة',
      trialFailed: 'فشل المطعم في التجربة',
      trialEvaluationError: 'حدث خطأ في تقييم التجربة',
      ratingAggregationError: 'حدث خطأ في تجميع التقييمات',
      coordinatesRequired: 'يجب تحديد الإحداثيات (latitude, longitude)',
      restaurantNameAndCoordinatesRequired: 'يجب تحديد اسم المطعم والإحداثيات'
    },

    // رسائل الطوارئ
    emergency: {
      emergencyOrderCreated: 'تم إنشاء طلب طوارئ',
      emergencyProtocolActivated: 'تم تفعيل بروتوكول الطوارئ',
      medicalAlertTriggered: 'تم تفعيل تنبيه طبي',
      allergyAlertTriggered: 'تم تفعيل تنبيه حساسية',
      emergencyContactNotified: 'تم إشعار جهة الاتصال الطارئة',
      emergencyRestaurantNotified: 'تم إشعار مطعم الطوارئ'
    },

    // رسائل التنبيهات الطبية
    medical: {
      profileUpdated: 'تم تحديث الملف الطبي بنجاح',
      profileUpdateFailed: 'فشل في تحديث الملف الطبي',
      profileNotFound: 'لم يتم العثور على الملف الطبي',
      incidentReported: 'تم تسجيل الحادثة الطبية بنجاح',
      incidentReportFailed: 'فشل في تسجيل الحادثة الطبية',
      consentUpdated: 'تم تحديث الموافقة الطبية بنجاح',
      consentUpdateFailed: 'فشل في تحديث الموافقة الطبية',
      ingredientAdded: 'تم إضافة المكون بنجاح',
      ingredientAddFailed: 'فشل في إضافة المكون',
      dataExported: 'تم تصدير البيانات الطبية بنجاح',
      dataExportFailed: 'فشل في تصدير البيانات الطبية',
      dataDeleted: 'تم حذف البيانات الطبية بنجاح',
      dataDeletionFailed: 'فشل في حذف البيانات الطبية'
    },

    // رسائل الطلب الصوتي
    voice: {
      audioDataRequired: 'بيانات الصوت مطلوبة',
      transcriptionFailed: 'فشل في تحويل الصوت إلى نص',
      processingFailed: 'فشل في معالجة الأمر الصوتي',
      sessionIdRequired: 'معرف الجلسة مطلوب',
      orderConfirmed: 'تم تأكيد الطلب بنجاح',
      orderCancelled: 'تم إلغاء الطلب',
      confirmationFailed: 'فشل في تأكيد الطلب',
      noUsualOrder: 'لا يوجد طلب معتاد محفوظ',
      searchFailed: 'فشل في البحث الصوتي',
      textRequired: 'النص مطلوب',
      ttsGenerationFailed: 'فشل في توليد الصوت',
      preferencesUpdated: 'تم تحديث تفضيلات الصوت بنجاح',
      preferencesUpdateFailed: 'فشل في تحديث تفضيلات الصوت',
      shortcutCreated: 'تم إنشاء الاختصار الصوتي بنجاح',
      shortcutCreationFailed: 'فشل في إنشاء الاختصار الصوتي',
      insufficientVoiceSamples: 'عينات الصوت غير كافية (يجب 5 عينات على الأقل)',
      personalModelTrained: 'تم تدريب النموذج الصوتي الشخصي بنجاح',
      trainingFailed: 'فشل في تدريب النموذج الصوتي'
    },

    // رسائل المشاريع
    projects: {
      projectCreated: 'تم إنشاء المشروع بنجاح',
      projectUpdated: 'تم تحديث المشروع بنجاح',
      projectDeleted: 'تم حذف المشروع',
      projectNotFound: 'المشروع غير موجود',
      qrCodeGenerated: 'تم إنشاء رمز QR',
      qrCodeInvalid: 'رمز QR غير صحيح',
      accessGranted: 'تم منح الوصول',
      accessDenied: 'تم رفض الوصول',
      orderWindowActive: 'نافذة الطلبات مفتوحة',
      orderWindowClosed: 'نافذة الطلبات مغلقة',
      qrTokenRequired: 'QR Token مطلوب',
      qrCodeInvalidOrExpired: 'QR Code غير صحيح أو منتهي الصلاحية',
      projectInactive: 'المشروع غير نشط',
      projectAccessSuccess: 'تم الوصول للمشروع بنجاح',
      projectDeactivated: 'تم إلغاء تفعيل المشروع بنجاح',
      qrCodeRegenerated: 'تم توليد QR Code جديد بنجاح'
    },

    // رسائل الإشعارات
    notifications: {
      fetchSuccess: 'تم جلب الإشعارات بنجاح',
      fetchFailed: 'فشل في جلب الإشعارات',
      markedAsRead: 'تم تحديد الإشعار كمقروء',
      markReadFailed: 'فشل في تحديد الإشعار كمقروء',
      allMarkedAsRead: 'تم تحديد جميع الإشعارات كمقروءة',
      markAllReadFailed: 'فشل في تحديد جميع الإشعارات كمقروءة',
      deleted: 'تم حذف الإشعار بنجاح',
      deleteFailed: 'فشل في حذف الإشعار',
      reminderSent: 'تم إرسال التذكير بنجاح',
      reminderSendFailed: 'فشل في إرسال التذكير',
      broadcastSent: 'تم إرسال الإشعار العام بنجاح',
      broadcastSendFailed: 'فشل في إرسال الإشعار العام'
    },

    // رسائل التنبؤ
    predictive: {
      noDataForAnalysis: 'لا توجد بيانات كافية للتحليل',
      analysisSuccess: 'تم تحليل السلوك بنجاح',
      analysisFailed: 'فشل في تحليل السلوك',
      patternDiscovered: 'تم اكتشاف الأنماط بنجاح',
      patternDiscoveryFailed: 'فشل في اكتشاف الأنماط',
      suggestionGenerated: 'تم إنشاء الاقتراح بنجاح',
      suggestionGenerationFailed: 'فشل في إنشاء الاقتراح',
      suggestionAccepted: 'تم قبول الاقتراح وإنشاء الطلب',
      suggestionRejected: 'تم رفض الاقتراح',
      suggestionModified: 'تم تعديل الاقتراح بنجاح'
    },

    // رسائل التذكيرات
    reminders: {
      settingsRetrieved: 'تم جلب إعدادات التذكير بنجاح',
      settingsFetchFailed: 'فشل في جلب إعدادات التذكير',
      settingsUpdated: 'تم تحديث إعدادات التذكير بنجاح',
      settingsUpdateFailed: 'فشل في تحديث إعدادات التذكير',
      preferencesRetrieved: 'تم جلب تفضيلات التذكير بنجاح',
      preferencesUpdated: 'تم تحديث تفضيلات التذكير بنجاح',
      reminderMarkedAsRead: 'تم تحديد التذكير كمقروء',
      actionRecorded: 'تم تسجيل الإجراء بنجاح',
      immediateSent: 'تم إرسال التذكيرات الفورية بنجاح',
      systemStatusRetrieved: 'تم جلب حالة النظام بنجاح',
      statsRetrieved: 'تم جلب إحصائيات التذكيرات بنجاح'
    },

    // رسائل سير العمل
    workflow: {
      qrValidated: 'تم التحقق من رمز QR بنجاح',
      orderSubmitted: 'تم تقديم الطلب بنجاح',
      orderConfirmed: 'تم تأكيد الطلب',
      orderCancelled: 'تم إلغاء الطلب',
      statusUpdated: 'تم تحديث حالة الطلب',
      remindersSent: 'تم إرسال التذكيرات',
      locationUpdated: 'تم تحديث الموقع',
      orderDelivered: 'تم تسليم الطلب بنجاح'
    },

    // رسائل الميزانية
    budget: {
      budgetCreated: 'تم إنشاء الميزانية بنجاح',
      budgetUpdated: 'تم تحديث الميزانية بنجاح',
      budgetDeleted: 'تم حذف الميزانية بنجاح',
      budgetNotFound: 'الميزانية غير موجودة',
      budgetCreateFailed: 'فشل في إنشاء الميزانية',
      budgetUpdateFailed: 'فشل في تحديث الميزانية',
      budgetsFetchSuccess: 'تم جلب الميزانيات بنجاح',
      budgetsFetchFailed: 'حدث خطأ في جلب الميزانيات',
      budgetFetchSuccess: 'تم جلب الميزانية بنجاح',
      budgetFetchFailed: 'فشل في جلب الميزانية',
      budgetCheckSuccess: 'تم فحص الميزانية بنجاح',
      budgetCheckFailed: 'فشل في فحص الميزانية',
      amountMustBePositive: 'المبلغ يجب أن يكون أكبر من صفر',
      alertsFetchSuccess: 'تم جلب تنبيهات الميزانية بنجاح',
      alertsFetchFailed: 'حدث خطأ في جلب تنبيهات الميزانية',
      alertResolved: 'تم حل التنبيه بنجاح',
      alertResolveFailed: 'فشل في حل التنبيه',
      userIdAndRoleRequired: 'معرف المستخدم ودوره مطلوبان',
      defaultBudgetCreated: 'تم إنشاء الميزانية الافتراضية بنجاح',
      defaultBudgetCreateFailed: 'فشل في إنشاء الميزانية الافتراضية',
      budgetReset: 'تم إعادة تعيين الميزانية بنجاح',
      budgetResetFailed: 'فشل في إعادة تعيين الميزانية',
      reportGenerated: 'تم إنشاء تقرير الميزانية بنجاح',
      reportGenerateFailed: 'حدث خطأ في إنشاء تقرير الميزانية',
      analyticsFetched: 'تم جلب الإحصائيات بنجاح',
      analyticsFetchFailed: 'حدث خطأ في جلب إحصائيات الميزانية'
    },

    // رسائل عامة
    general: {
      success: 'تم بنجاح',
      error: 'حدث خطأ',
      notFound: 'غير موجود',
      invalidInput: 'مدخل غير صحيح',
      serverError: 'خطأ في الخادم',
      validationError: 'خطأ في التحقق',
      permissionDenied: 'تم رفض الإذن',
      operationCompleted: 'تم إكمال العملية',
      operationFailed: 'فشلت العملية',
      dataUpdated: 'تم تحديث البيانات',
      dataSaved: 'تم حفظ البيانات',
      dataDeleted: 'تم حذف البيانات'
    },

    // رسائل التحقق
    validation: {
      required: 'هذا الحقل مطلوب',
      invalidEmail: 'البريد الإلكتروني غير صحيح',
      invalidPhone: 'رقم الهاتف غير صحيح',
      invalidDate: 'التاريخ غير صحيح',
      invalidNumber: 'الرقم غير صحيح',
      minLength: 'الحد الأدنى للطول هو {min} أحرف',
      maxLength: 'الحد الأقصى للطول هو {max} حرف',
      minValue: 'الحد الأدنى للقيمة هو {min}',
      maxValue: 'الحد الأقصى للقيمة هو {max}',
      mustBePositive: 'يجب أن تكون القيمة موجبة',
      mustBeInteger: 'يجب أن تكون القيمة رقم صحيح',
      coordinatesRequired: 'يجب توفير الإحداثيات (latitude, longitude)',
      searchQueryRequired: 'يجب توفير نص البحث (q)',
      dateRangeRequired: 'تاريخ البداية والنهاية مطلوبان'
    },

    // حالات الطلبات
    orderStatus: {
      PENDING: 'في الانتظار',
      CONFIRMED: 'مؤكد',
      PREPARING: 'قيد التحضير',
      OUT_FOR_DELIVERY: 'في الطريق',
      DELIVERED: 'تم التوصيل',
      CANCELLED: 'ملغي',
      REFUNDED: 'مسترد'
    },

    // أنواع الاستثناءات
    exceptionTypes: {
      FULL: 'استثناء كامل',
      LIMITED: 'استثناء محدود',
      SELF_PAID: 'مدفوع ذاتياً'
    },

    // أدوار المستخدمين
    userRoles: {
      REGULAR: 'عضو عادي',
      VIP: 'عضو مميز',
      ADMIN: 'مدير',
      PRODUCER: 'منتج'
    },

    // أنواع القوائم
    menuTypes: {
      CORE: 'القائمة الأساسية',
      GEOGRAPHIC: 'القائمة الجغرافية',
      SPECIAL: 'القائمة الخاصة'
    }
  },

  en: {
    // English translations (fallback)
    auth: {
      loginSuccess: 'Login successful',
      loginFailed: 'Login failed',
      registerSuccess: 'Account created successfully',
      registerFailed: 'Account creation failed',
      invalidCredentials: 'Invalid credentials',
      userNotFound: 'User not found',
      emailExists: 'Email already exists',
      tokenExpired: 'Token expired',
      accessDenied: 'Access denied',
      unauthorized: 'Unauthorized access',
      passwordTooWeak: 'Password too weak',
      emailRequired: 'Email is required',
      passwordRequired: 'Password is required',
      nameRequired: 'Name is required'
    },
    // ... (يمكن إضافة باقي الترجمات الإنجليزية عند الحاجة)
  }
};

/**
 * الحصول على رسالة مترجمة
 * @param {string} key - مفتاح الرسالة
 * @param {string} lang - اللغة (ar/en)
 * @param {object} params - معاملات للاستبدال
 * @returns {string} الرسالة المترجمة
 */
function getMessage(key, lang = 'ar', params = {}) {
  try {
    const keys = key.split('.');
    let message = messages[lang];
    
    for (const k of keys) {
      message = message[k];
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
 * تحديد اللغة من الطلب
 * @param {object} req - طلب Express
 * @returns {string} كود اللغة
 */
function getLanguageFromRequest(req) {
  // من header Accept-Language
  const acceptLanguage = req.headers['accept-language'];
  if (acceptLanguage && acceptLanguage.includes('ar')) {
    return 'ar';
  }
  
  // من query parameter
  if (req.query.lang) {
    return req.query.lang === 'en' ? 'en' : 'ar';
  }
  
  // من user preferences
  if (req.user && req.user.language) {
    return req.user.language;
  }
  
  // افتراضي: العربية
  return 'ar';
}

/**
 * middleware للتعريب
 */
function localizationMiddleware(req, res, next) {
  const lang = getLanguageFromRequest(req);
  
  // إضافة دالة الترجمة للطلب
  req.t = (key, params = {}) => getMessage(key, lang, params);
  req.lang = lang;
  
  // إضافة دالة الترجمة للاستجابة
  res.message = (key, params = {}) => getMessage(key, lang, params);
  
  next();
}

module.exports = {
  messages,
  getMessage,
  getLanguageFromRequest,
  localizationMiddleware
};
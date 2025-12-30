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

    // رسائل طلبات البريك في التصوير
    orders: {
      orderCreated: 'تم طلب وجبة البريك بنجاح',
      orderUpdated: 'تم تحديث طلب البريك بنجاح',
      orderCancelled: 'تم إلغاء طلب البريك',
      orderNotFound: 'طلب البريك غير موجود',
      orderAlreadyConfirmed: 'طلب البريك مؤكد بالفعل',
      orderWindowClosed: 'انتهت فترة طلب وجبات البريك لهذا اليوم',
      insufficientBalance: 'الرصيد غير كافي لطلب البريك',
      itemNotAvailable: 'هذا الطبق غير متوفر في قائمة البريك اليوم',
      quantityExceeded: 'تم تجاوز الكمية المسموحة لوجبة البريك',
      deliveryScheduled: 'تم جدولة توصيل وجبة البريك لموقع التصوير',
      orderDelivered: 'تم توصيل وجبة البريك لموقع التصوير',
      orderPreparing: 'جاري تحضير وجبة البريك',
      orderOutForDelivery: 'وجبة البريك في الطريق لموقع التصوير',
      itemsRequired: 'يجب اختيار وجبة واحدة على الأقل للبريك',
      orderCreationFailed: 'فشل في طلب وجبة البريك',
      ordersFetchFailed: 'فشل في جلب طلبات البريك',
      orderAccessDenied: 'غير مصرح لك بالوصول إلى طلب البريك هذا',
      orderStatusUpdateDenied: 'غير مصرح لك بتحديث حالة طلب البريك',
      orderStatusRequired: 'حالة طلب البريك مطلوبة',
      orderStatusUpdated: 'تم تحديث حالة طلب البريك إلى {status}',
      orderStatusUpdateFailed: 'فشل في تحديث حالة طلب البريك',
      orderCancellationFailed: 'فشل في إلغاء طلب البريك',
      aggregationAccessDenied: 'غير مصرح لك بالوصول إلى تجميع طلبات البريك',
      aggregationSuccess: 'تم تجميع طلبات البريك للفريق بنجاح',
      aggregationFailed: 'فشل في تجميع طلبات البريك',
      summaryAccessDenied: 'غير مصرح لك بالوصول إلى ملخص طلبات البريك',
      summaryFetchFailed: 'فشل في جلب ملخص طلبات البريك لليوم',
      exportAccessDenied: 'غير مصرح لك بتصدير تقارير البريك',
      exportSuccess: 'تم تصدير تقرير طلبات البريك بنجاح',
      exportFailed: 'فشل في تصدير تقرير طلبات البريك',
      statsAccessDenied: 'غير مصرح لك بالوصول إلى إحصائيات البريك',
      statsFetchFailed: 'فشل في جلب إحصائيات طلبات البريك',
      usersInfoAccessDenied: 'غير مصرح لك بالوصول إلى هذه المعلومات',
      usersFetchFailed: 'فشل في جلب قائمة الطاقم الذين لم يطلبوا البريك'
    },

    // رسائل قوائم الطعام والمطاعم
    menu: {
      menuItemAdded: 'تم إضافة طبق جديد لقائمة البريك',
      menuItemUpdated: 'تم تحديث طبق في قائمة البريك',
      menuItemDeleted: 'تم حذف طبق من قائمة البريك',
      menuItemNotFound: 'الطبق غير موجود في قائمة البريك',
      restaurantAdded: 'تم إضافة مطعم جديد لشراكة البريك',
      restaurantUpdated: 'تم تحديث معلومات مطعم البريك',
      restaurantNotFound: 'مطعم البريك غير موجود',
      menuNotAvailable: 'قائمة البريك غير متوفرة حالياً',
      priceRequired: 'سعر وجبة البريك مطلوب',
      nameRequired: 'اسم الطبق مطلوب',
      categoryRequired: 'فئة الطبق مطلوبة'
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

    // رسائل مشاريع التصوير
    projects: {
      projectCreated: 'تم إنشاء مشروع التصوير بنجاح',
      projectUpdated: 'تم تحديث مشروع التصوير بنجاح',
      projectDeleted: 'تم حذف مشروع التصوير',
      projectNotFound: 'مشروع التصوير غير موجود',
      qrCodeGenerated: 'تم إنشاء رمز QR لموقع التصوير',
      qrCodeInvalid: 'رمز QR لموقع التصوير غير صحيح',
      accessGranted: 'تم منح الوصول لموقع التصوير',
      accessDenied: 'تم رفض الوصول لموقع التصوير',
      orderWindowActive: 'نافذة طلب البريك مفتوحة الآن',
      orderWindowClosed: 'انتهت فترة طلب البريك لهذا اليوم',
      qrTokenRequired: 'رمز QR لموقع التصوير مطلوب',
      qrCodeInvalidOrExpired: 'رمز QR غير صحيح أو منتهي الصلاحية',
      projectInactive: 'مشروع التصوير غير نشط',
      projectAccessSuccess: 'تم الوصول لموقع التصوير بنجاح',
      projectDeactivated: 'تم إلغاء تفعيل مشروع التصوير بنجاح',
      qrCodeRegenerated: 'تم توليد رمز QR جديد لموقع التصوير بنجاح'
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

    // رسائل تتبع التوصيل GPS
    tracking: {
      trackingCreated: 'تم إنشاء تتبع توصيل البريك بنجاح',
      trackingCreationFailed: 'فشل في إنشاء تتبع التوصيل',
      locationUpdated: 'تم تحديث موقع سائق البريك',
      locationUpdateFailed: 'فشل في تحديث موقع السائق',
      statusUpdated: 'تم تحديث حالة توصيل البريك إلى {status}',
      statusUpdateFailed: 'فشل في تحديث حالة التوصيل',
      trackingNotFound: 'تتبع التوصيل غير موجود',
      trackingAccessDenied: 'غير مصرح لك بالوصول إلى تتبع هذا التوصيل',
      trackingFetchFailed: 'فشل في جلب معلومات التتبع',
      activeDeliveriesAccessDenied: 'غير مصرح لك بالوصول إلى التوصيلات النشطة',
      activeDeliveriesFetchFailed: 'فشل في جلب التوصيلات النشطة',
      driverAssignmentAccessDenied: 'غير مصرح لك بتعيين السائقين',
      driverInfoRequired: 'معلومات السائق (الاسم والهاتف) مطلوبة',
      driverAssigned: 'تم تعيين السائق {name} لتوصيل البريك',
      driverAssignmentFailed: 'فشل في تعيين السائق',
      routeFetchFailed: 'فشل في جلب مسار التوصيل',
      deliveryConfirmed: 'تم تأكيد تسليم البريك بنجاح',
      deliveryConfirmationFailed: 'فشل في تأكيد التسليم',
      driverNearby: 'سائق البريك قريب من موقع التصوير',
      estimatedArrival: 'الوصول المتوقع خلال {minutes} دقيقة',
      deliveryInProgress: 'جاري توصيل البريك لموقع التصوير',
      deliveryCompleted: 'تم توصيل البريك لموقع التصوير بنجاح'
    },

    // حالات التوصيل
    deliveryStatus: {
      PREPARING: 'قيد التحضير',
      DRIVER_ASSIGNED: 'تم تعيين السائق',
      PICKED_UP: 'تم الاستلام من المطعم',
      ON_THE_WAY: 'في الطريق لموقع التصوير',
      NEARBY: 'قريب من موقع التصوير',
      DELIVERED: 'تم التسليم',
      FAILED: 'فشل التسليم',
      RETURNED: 'تم الإرجاع'
    },
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

    // رسائل تتبع التوصيل GPS
    tracking: {
      trackingCreated: 'تم إنشاء تتبع توصيل البريك بنجاح',
      trackingCreationFailed: 'فشل في إنشاء تتبع التوصيل',
      locationUpdated: 'تم تحديث موقع سائق البريك',
      locationUpdateFailed: 'فشل في تحديث موقع السائق',
      statusUpdated: 'تم تحديث حالة توصيل البريك إلى {status}',
      statusUpdateFailed: 'فشل في تحديث حالة التوصيل',
      trackingNotFound: 'تتبع التوصيل غير موجود',
      trackingAccessDenied: 'غير مصرح لك بالوصول إلى تتبع هذا التوصيل',
      trackingFetchFailed: 'فشل في جلب معلومات التتبع',
      activeDeliveriesAccessDenied: 'غير مصرح لك بالوصول إلى التوصيلات النشطة',
      activeDeliveriesFetchFailed: 'فشل في جلب التوصيلات النشطة',
      driverAssignmentAccessDenied: 'غير مصرح لك بتعيين السائقين',
      driverInfoRequired: 'معلومات السائق (الاسم والهاتف) مطلوبة',
      driverAssigned: 'تم تعيين السائق {name} لتوصيل البريك',
      driverAssignmentFailed: 'فشل في تعيين السائق',
      routeFetchFailed: 'فشل في جلب مسار التوصيل',
      deliveryConfirmed: 'تم تأكيد تسليم البريك بنجاح',
      deliveryConfirmationFailed: 'فشل في تأكيد التسليم',
      driverNearby: 'سائق البريك قريب من موقع التصوير',
      estimatedArrival: 'الوصول المتوقع خلال {minutes} دقيقة',
      deliveryInProgress: 'جاري توصيل البريك لموقع التصوير',
      deliveryCompleted: 'تم توصيل البريك لموقع التصوير بنجاح'
    },

    // حالات التوصيل
    deliveryStatus: {
      PREPARING: 'قيد التحضير',
      DRIVER_ASSIGNED: 'تم تعيين السائق',
      PICKED_UP: 'تم الاستلام من المطعم',
      ON_THE_WAY: 'في الطريق لموقع التصوير',
      NEARBY: 'قريب من موقع التصوير',
      DELIVERED: 'تم التسليم',
      FAILED: 'فشل التسليم',
      RETURNED: 'تم الإرجاع'
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
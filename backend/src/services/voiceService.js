/**
 * Voice Service - خدمة الطلب الصوتي
 * يوفر جميع العمليات المتعلقة بمعالجة الأوامر الصوتية
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

// محاكاة خدمات الذكاء الاصطناعي الخارجية
// في التطبيق الحقيقي، ستستخدم Google Speech-to-Text, Azure Cognitive Services, إلخ
const AI_SERVICES = {
  SPEECH_TO_TEXT: process.env.SPEECH_TO_TEXT_SERVICE || 'google',
  TEXT_TO_SPEECH: process.env.TEXT_TO_SPEECH_SERVICE || 'google',
  NLP: process.env.NLP_SERVICE || 'openai'
};

/**
 * تحويل الصوت إلى نص
 */
async function speechToText(audioData, language = 'ar') {
  try {
    // محاكاة استدعاء خدمة تحويل الصوت إلى نص
    // في التطبيق الحقيقي، ستستدعي Google Speech-to-Text API أو Azure
    
    const mockTranscriptions = {
      ar: [
        'أريد طلب برجر',
        'اطلب لي الطلب المعتاد',
        'ما هي الخيارات المتاحة اليوم',
        'أريد شيء صحي',
        'اطلب لي بيتزا مارجريتا',
        'ألغي الطلب',
        'أضف سلطة للطلب'
      ],
      en: [
        'I want to order a burger',
        'Order my usual',
        'What are today\'s options',
        'I want something healthy',
        'Order me a margherita pizza',
        'Cancel the order',
        'Add a salad to the order'
      ]
    };

    // محاكاة معالجة الصوت
    await new Promise(resolve => setTimeout(resolve, 1000));

    const transcriptions = mockTranscriptions[language] || mockTranscriptions['ar'];
    const randomTranscription = transcriptions[Math.floor(Math.random() * transcriptions.length)];

    return {
      success: true,
      text: randomTranscription,
      confidence: 0.95,
      language: language
    };
  } catch (error) {
    logger.error('Error in speech-to-text:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * معالجة الأمر الصوتي
 */
async function processVoiceCommand(userId, text, language, sessionId) {
  try {
    // إنشاء جلسة جديدة إذا لم تكن موجودة
    if (!sessionId) {
      sessionId = crypto.randomUUID();
    }

    // تحليل النص باستخدام معالجة اللغة الطبيعية
    const intent = await analyzeIntent(text, language);
    
    // معالجة الأمر بناءً على النية المكتشفة
    let commandResult;
    
    switch (intent.action) {
      case 'ORDER_USUAL':
        commandResult = await handleUsualOrder(userId, sessionId);
        break;
      case 'ORDER_ITEM':
        commandResult = await handleItemOrder(userId, intent.entities, sessionId);
        break;
      case 'SEARCH_MENU':
        commandResult = await handleMenuSearch(userId, intent.entities, sessionId);
        break;
      case 'CANCEL_ORDER':
        commandResult = await handleCancelOrder(userId, sessionId);
        break;
      case 'ADD_TO_ORDER':
        commandResult = await handleAddToOrder(userId, intent.entities, sessionId);
        break;
      case 'GET_RECOMMENDATIONS':
        commandResult = await handleGetRecommendations(userId, intent.entities, sessionId);
        break;
      default:
        commandResult = {
          action: 'UNKNOWN',
          message: language === 'ar' ? 'لم أفهم طلبك، يرجى المحاولة مرة أخرى' : 'I didn\'t understand your request, please try again',
          suggestions: language === 'ar' ? 
            ['اطلب لي الطلب المعتاد', 'أريد برجر', 'ما هي الخيارات المتاحة'] :
            ['Order my usual', 'I want a burger', 'What are the available options']
        };
    }

    // حفظ الجلسة الصوتية
    await saveVoiceSession(userId, sessionId, text, intent, commandResult);

    return {
      ...commandResult,
      sessionId,
      originalText: text,
      detectedIntent: intent
    };
  } catch (error) {
    logger.error('Error processing voice command:', error);
    throw error;
  }
}

/**
 * تحليل النية من النص
 */
async function analyzeIntent(text, language) {
  try {
    const lowerText = text.toLowerCase();
    
    // قواعد بسيطة لتحليل النية (في التطبيق الحقيقي ستستخدم NLP متقدم)
    const intentPatterns = {
      ar: {
        'ORDER_USUAL': ['الطلب المعتاد', 'طلبي المعتاد', 'نفس الطلب', 'الطلب العادي'],
        'ORDER_ITEM': ['أريد', 'اطلب', 'أطلب', 'بدي'],
        'SEARCH_MENU': ['ما هي الخيارات', 'ما المتاح', 'اعرض القائمة', 'ما في القائمة'],
        'CANCEL_ORDER': ['ألغي', 'إلغاء', 'لا أريد', 'توقف'],
        'ADD_TO_ORDER': ['أضف', 'زيد', 'أريد أيضاً', 'وأيضاً'],
        'GET_RECOMMENDATIONS': ['اقترح', 'أنصحني', 'ما تنصح', 'شيء صحي', 'شيء خفيف']
      },
      en: {
        'ORDER_USUAL': ['usual order', 'my usual', 'same as always', 'regular order'],
        'ORDER_ITEM': ['i want', 'order', 'get me', 'i would like'],
        'SEARCH_MENU': ['what options', 'show menu', 'what\'s available', 'menu items'],
        'CANCEL_ORDER': ['cancel', 'stop', 'never mind', 'forget it'],
        'ADD_TO_ORDER': ['add', 'also', 'and', 'plus'],
        'GET_RECOMMENDATIONS': ['recommend', 'suggest', 'healthy', 'light']
      }
    };

    const patterns = intentPatterns[language] || intentPatterns['ar'];
    
    for (const [intent, keywords] of Object.entries(patterns)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return {
          action: intent,
          confidence: 0.9,
          entities: extractEntities(text, language)
        };
      }
    }

    return {
      action: 'UNKNOWN',
      confidence: 0.1,
      entities: []
    };
  } catch (error) {
    logger.error('Error analyzing intent:', error);
    return { action: 'UNKNOWN', confidence: 0, entities: [] };
  }
}

/**
 * استخراج الكيانات من النص
 */
function extractEntities(text, language) {
  const entities = [];
  
  // استخراج أسماء الأطعمة (قائمة بسيطة للمثال)
  const foodItems = {
    ar: ['برجر', 'بيتزا', 'سلطة', 'شاورما', 'فلافل', 'مندي', 'كبسة', 'مشاوي'],
    en: ['burger', 'pizza', 'salad', 'shawarma', 'falafel', 'mandi', 'kabsa', 'grilled']
  };

  const foods = foodItems[language] || foodItems['ar'];
  const lowerText = text.toLowerCase();

  foods.forEach(food => {
    if (lowerText.includes(food)) {
      entities.push({
        type: 'FOOD_ITEM',
        value: food,
        confidence: 0.9
      });
    }
  });

  // استخراج الكميات
  const quantityRegex = /(\d+|واحد|اثنين|ثلاثة|أربعة|خمسة|one|two|three|four|five)/gi;
  const quantityMatches = text.match(quantityRegex);
  
  if (quantityMatches) {
    entities.push({
      type: 'QUANTITY',
      value: quantityMatches[0],
      confidence: 0.8
    });
  }

  return entities;
}

/**
 * معالجة طلب الطلب المعتاد
 */
async function handleUsualOrder(userId, sessionId) {
  try {
    const usualOrder = await getUserUsualOrder(userId);
    
    if (!usualOrder) {
      return {
        action: 'NO_USUAL_ORDER',
        message: 'لا يوجد لديك طلب معتاد محفوظ. هل تريد إنشاء واحد؟',
        requiresConfirmation: false
      };
    }

    return {
      action: 'ORDER_USUAL',
      message: `طلبك المعتاد: ${usualOrder.items.map(item => item.name).join(', ')}. هل تريد تأكيد الطلب؟`,
      order: usualOrder,
      requiresConfirmation: true
    };
  } catch (error) {
    logger.error('Error handling usual order:', error);
    throw error;
  }
}

/**
 * معالجة طلب عنصر محدد
 */
async function handleItemOrder(userId, entities, sessionId) {
  try {
    const foodEntities = entities.filter(e => e.type === 'FOOD_ITEM');
    const quantityEntity = entities.find(e => e.type === 'QUANTITY');
    
    if (foodEntities.length === 0) {
      return {
        action: 'CLARIFY_ITEM',
        message: 'ما هو العنصر الذي تريد طلبه؟',
        requiresConfirmation: false
      };
    }

    // البحث عن العناصر في القائمة
    const searchResults = await searchMenuItems(foodEntities.map(e => e.value));
    
    if (searchResults.length === 0) {
      return {
        action: 'ITEM_NOT_FOUND',
        message: `لم أجد ${foodEntities[0].value} في القائمة. هل تريد البحث عن شيء آخر؟`,
        requiresConfirmation: false
      };
    }

    const quantity = quantityEntity ? parseInt(quantityEntity.value) || 1 : 1;
    
    return {
      action: 'ORDER_ITEM',
      message: `تريد طلب ${quantity} ${searchResults[0].name}؟ السعر ${searchResults[0].price * quantity} ريال`,
      order: {
        items: [{
          ...searchResults[0],
          quantity
        }],
        totalPrice: searchResults[0].price * quantity
      },
      requiresConfirmation: true
    };
  } catch (error) {
    logger.error('Error handling item order:', error);
    throw error;
  }
}

/**
 * معالجة البحث في القائمة
 */
async function handleMenuSearch(userId, entities, sessionId) {
  try {
    // الحصول على تفضيلات المستخدم
    const userPreferences = await getUserDietaryPreferences(userId);
    
    // البحث في القائمة مع مراعاة التفضيلات
    const menuItems = await getFilteredMenuItems(userPreferences);
    
    const itemsList = menuItems.slice(0, 5).map(item => 
      `${item.name} - ${item.price} ريال`
    ).join(', ');

    return {
      action: 'SHOW_MENU',
      message: `الخيارات المتاحة اليوم: ${itemsList}. أي منها تريد؟`,
      menuItems: menuItems.slice(0, 5),
      requiresConfirmation: false
    };
  } catch (error) {
    logger.error('Error handling menu search:', error);
    throw error;
  }
}

/**
 * معالجة إلغاء الطلب
 */
async function handleCancelOrder(userId, sessionId) {
  try {
    // إلغاء الجلسة الحالية
    await cancelVoiceSession(sessionId);
    
    return {
      action: 'CANCEL_ORDER',
      message: 'تم إلغاء الطلب. هل تريد شيئاً آخر؟',
      requiresConfirmation: false
    };
  } catch (error) {
    logger.error('Error handling cancel order:', error);
    throw error;
  }
}

/**
 * معالجة إضافة عنصر للطلب
 */
async function handleAddToOrder(userId, entities, sessionId) {
  try {
    // الحصول على الطلب الحالي من الجلسة
    const currentSession = await getVoiceSession(sessionId);
    
    if (!currentSession || !currentSession.currentOrder) {
      return {
        action: 'NO_CURRENT_ORDER',
        message: 'لا يوجد طلب حالي لإضافة عناصر إليه. هل تريد بدء طلب جديد؟',
        requiresConfirmation: false
      };
    }

    // معالجة العنصر الجديد
    const itemResult = await handleItemOrder(userId, entities, sessionId);
    
    if (itemResult.order) {
      // إضافة العنصر للطلب الحالي
      const updatedOrder = {
        ...currentSession.currentOrder,
        items: [...currentSession.currentOrder.items, ...itemResult.order.items],
        totalPrice: currentSession.currentOrder.totalPrice + itemResult.order.totalPrice
      };

      return {
        action: 'ADD_TO_ORDER',
        message: `تم إضافة ${itemResult.order.items[0].name}. إجمالي الطلب الآن ${updatedOrder.totalPrice} ريال`,
        order: updatedOrder,
        requiresConfirmation: true
      };
    }

    return itemResult;
  } catch (error) {
    logger.error('Error handling add to order:', error);
    throw error;
  }
}

/**
 * معالجة طلب التوصيات
 */
async function handleGetRecommendations(userId, entities, sessionId) {
  try {
    // الحصول على توصيات مخصصة للمستخدم
    const recommendations = await getPersonalizedRecommendations(userId, entities);
    
    const recList = recommendations.slice(0, 3).map(item => 
      `${item.name} - ${item.reason}`
    ).join(', ');

    return {
      action: 'SHOW_RECOMMENDATIONS',
      message: `أنصحك بـ: ${recList}. أي منها يعجبك؟`,
      recommendations,
      requiresConfirmation: false
    };
  } catch (error) {
    logger.error('Error handling recommendations:', error);
    throw error;
  }
}

/**
 * تأكيد الطلب الصوتي
 */
async function confirmVoiceOrder(userId, sessionId, confirmed) {
  try {
    const session = await getVoiceSession(sessionId);
    
    if (!session) {
      throw new Error('Voice session not found');
    }

    if (confirmed) {
      // تحديث الجلسة كمؤكدة
      await prisma.voiceSession.update({
        where: { id: sessionId },
        data: { 
          confirmed: true,
          confirmedAt: new Date()
        }
      });

      return {
        success: true,
        order: session.currentOrder
      };
    } else {
      // إلغاء الجلسة
      await cancelVoiceSession(sessionId);
      return {
        success: true,
        cancelled: true
      };
    }
  } catch (error) {
    logger.error('Error confirming voice order:', error);
    throw error;
  }
}

/**
 * الحصول على الطلب المعتاد للمستخدم
 */
async function getUserUsualOrder(userId) {
  try {
    // البحث عن أكثر الطلبات تكراراً
    const frequentOrders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            menuItem: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    if (frequentOrders.length === 0) {
      return null;
    }

    // تحليل الأنماط لإيجاد الطلب المعتاد
    const itemFrequency = {};
    
    frequentOrders.forEach(order => {
      order.items.forEach(item => {
        const key = item.menuItem.id;
        itemFrequency[key] = (itemFrequency[key] || 0) + item.quantity;
      });
    });

    // أخذ أكثر 3 عناصر تكراراً
    const topItems = Object.entries(itemFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);

    if (topItems.length === 0) {
      return null;
    }

    // بناء الطلب المعتاد
    const usualOrderItems = await Promise.all(
      topItems.map(async ([itemId, frequency]) => {
        const menuItem = await prisma.menuItem.findUnique({
          where: { id: itemId }
        });
        
        return {
          ...menuItem,
          quantity: Math.ceil(frequency / frequentOrders.length)
        };
      })
    );

    return {
      items: usualOrderItems,
      totalPrice: usualOrderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      restaurantId: usualOrderItems[0]?.restaurantId
    };
  } catch (error) {
    logger.error('Error getting usual order:', error);
    throw error;
  }
}

/**
 * البحث الصوتي في القائمة
 */
async function voiceSearchMenu(query, restaurantId, language, userId) {
  try {
    const searchTerms = query.toLowerCase().split(' ');
    
    const where = {
      isAvailable: true,
      OR: searchTerms.map(term => ({
        OR: [
          { name: { contains: term, mode: 'insensitive' } },
          { nameArabic: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
          { category: { contains: term, mode: 'insensitive' } }
        ]
      }))
    };

    if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    const results = await prisma.menuItem.findMany({
      where,
      include: {
        restaurant: {
          select: { name: true }
        }
      },
      take: 10
    });

    return results;
  } catch (error) {
    logger.error('Error in voice search menu:', error);
    throw error;
  }
}

/**
 * تحويل النص إلى صوت
 */
async function textToSpeech(text, language, voice) {
  try {
    // محاكاة تحويل النص إلى صوت
    // في التطبيق الحقيقي، ستستدعي Google Text-to-Speech API أو Azure
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      audioUrl: `/api/voice/audio/${crypto.randomUUID()}.mp3`,
      duration: Math.ceil(text.length / 10) // تقدير مدة الصوت
    };
  } catch (error) {
    logger.error('Error in text-to-speech:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * إعداد تفضيلات الصوت
 */
async function setVoicePreferences(userId, preferences) {
  try {
    const voicePrefs = await prisma.voicePreferences.upsert({
      where: { userId },
      update: {
        ...preferences,
        updatedAt: new Date()
      },
      create: {
        userId,
        ...preferences,
        createdAt: new Date()
      }
    });

    return voicePrefs;
  } catch (error) {
    logger.error('Error setting voice preferences:', error);
    throw error;
  }
}

/**
 * الحصول على تفضيلات الصوت
 */
async function getVoicePreferences(userId) {
  try {
    return await prisma.voicePreferences.findUnique({
      where: { userId }
    });
  } catch (error) {
    logger.error('Error getting voice preferences:', error);
    throw error;
  }
}

/**
 * إنشاء اختصار صوتي
 */
async function createVoiceShortcut(userId, shortcutData) {
  try {
    const shortcut = await prisma.voiceShortcut.create({
      data: {
        userId,
        ...shortcutData,
        createdAt: new Date()
      }
    });

    return shortcut;
  } catch (error) {
    logger.error('Error creating voice shortcut:', error);
    throw error;
  }
}

/**
 * الحصول على الاختصارات الصوتية
 */
async function getVoiceShortcuts(userId) {
  try {
    return await prisma.voiceShortcut.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    logger.error('Error getting voice shortcuts:', error);
    throw error;
  }
}

/**
 * تدريب نموذج الصوت الشخصي
 */
async function trainPersonalVoiceModel(userId, voiceSamples) {
  try {
    // محاكاة تدريب النموذج
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const modelId = crypto.randomUUID();
    
    // حفظ معلومات النموذج
    const personalModel = await prisma.personalVoiceModel.create({
      data: {
        userId,
        modelId,
        trainingData: JSON.stringify(voiceSamples),
        accuracy: 0.92,
        trainedAt: new Date()
      }
    });

    return {
      modelId,
      accuracy: personalModel.accuracy,
      status: 'trained'
    };
  } catch (error) {
    logger.error('Error training personal voice model:', error);
    throw error;
  }
}

/**
 * الحصول على إحصائيات الصوت
 */
async function getVoiceAnalytics(userId, dateRange) {
  try {
    const where = { userId };
    
    if (dateRange.startDate || dateRange.endDate) {
      where.createdAt = {};
      if (dateRange.startDate) where.createdAt.gte = dateRange.startDate;
      if (dateRange.endDate) where.createdAt.lte = dateRange.endDate;
    }

    const [totalSessions, successfulOrders, averageSessionDuration] = await Promise.all([
      prisma.voiceSession.count({ where }),
      prisma.voiceSession.count({ where: { ...where, confirmed: true } }),
      prisma.voiceSession.aggregate({
        where,
        _avg: { duration: true }
      })
    ]);

    const successRate = totalSessions > 0 ? (successfulOrders / totalSessions) * 100 : 0;

    return {
      totalSessions,
      successfulOrders,
      successRate: Math.round(successRate),
      averageSessionDuration: Math.round(averageSessionDuration._avg.duration || 0)
    };
  } catch (error) {
    logger.error('Error getting voice analytics:', error);
    throw error;
  }
}

// دوال مساعدة

async function saveVoiceSession(userId, sessionId, originalText, intent, result) {
  try {
    await prisma.voiceSession.upsert({
      where: { id: sessionId },
      update: {
        originalText,
        detectedIntent: JSON.stringify(intent),
        result: JSON.stringify(result),
        currentOrder: result.order ? JSON.stringify(result.order) : null,
        updatedAt: new Date()
      },
      create: {
        id: sessionId,
        userId,
        originalText,
        detectedIntent: JSON.stringify(intent),
        result: JSON.stringify(result),
        currentOrder: result.order ? JSON.stringify(result.order) : null,
        createdAt: new Date()
      }
    });
  } catch (error) {
    logger.error('Error saving voice session:', error);
  }
}

async function getVoiceSession(sessionId) {
  try {
    const session = await prisma.voiceSession.findUnique({
      where: { id: sessionId }
    });

    if (session && session.currentOrder) {
      session.currentOrder = JSON.parse(session.currentOrder);
    }

    return session;
  } catch (error) {
    logger.error('Error getting voice session:', error);
    return null;
  }
}

async function cancelVoiceSession(sessionId) {
  try {
    await prisma.voiceSession.update({
      where: { id: sessionId },
      data: { 
        cancelled: true,
        cancelledAt: new Date()
      }
    });
  } catch (error) {
    logger.error('Error cancelling voice session:', error);
  }
}

async function searchMenuItems(foodNames) {
  try {
    return await prisma.menuItem.findMany({
      where: {
        isAvailable: true,
        OR: foodNames.map(name => ({
          OR: [
            { name: { contains: name, mode: 'insensitive' } },
            { nameArabic: { contains: name, mode: 'insensitive' } }
          ]
        }))
      },
      take: 5
    });
  } catch (error) {
    logger.error('Error searching menu items:', error);
    return [];
  }
}

async function getUserDietaryPreferences(userId) {
  try {
    return await prisma.dietaryProfile.findUnique({
      where: { userId }
    });
  } catch (error) {
    logger.error('Error getting dietary preferences:', error);
    return null;
  }
}

async function getFilteredMenuItems(preferences) {
  try {
    const where = { isAvailable: true };
    
    if (preferences) {
      // تطبيق فلاتر الحمية
      if (preferences.dietTypes && preferences.dietTypes.length > 0) {
        where.dietTypes = {
          hasSome: preferences.dietTypes
        };
      }
    }

    return await prisma.menuItem.findMany({
      where,
      take: 10,
      orderBy: { rating: 'desc' }
    });
  } catch (error) {
    logger.error('Error getting filtered menu items:', error);
    return [];
  }
}

async function getPersonalizedRecommendations(userId, entities) {
  try {
    // الحصول على توصيات مخصصة بناءً على التاريخ والتفضيلات
    const recommendations = await prisma.menuItem.findMany({
      where: {
        isAvailable: true,
        rating: { gte: 4.0 }
      },
      take: 5,
      orderBy: { rating: 'desc' }
    });

    return recommendations.map(item => ({
      ...item,
      reason: 'عنصر عالي التقييم ومناسب لتفضيلاتك'
    }));
  } catch (error) {
    logger.error('Error getting personalized recommendations:', error);
    return [];
  }
}

module.exports = {
  speechToText,
  processVoiceCommand,
  confirmVoiceOrder,
  getUserUsualOrder,
  voiceSearchMenu,
  textToSpeech,
  setVoicePreferences,
  getVoicePreferences,
  createVoiceShortcut,
  getVoiceShortcuts,
  trainPersonalVoiceModel,
  getVoiceAnalytics
};
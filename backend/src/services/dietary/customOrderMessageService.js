/**
 * خدمة رسائل الطلب المخصصة
 * Custom Order Message Service - Communication with restaurants about dietary needs
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// قوالب الرسائل
const MESSAGE_TEMPLATES = {
  ALLERGY_WARNING: {
    type: 'ALLERGY_WARNING',
    priority: 'URGENT',
    subjectAr: 'تحذير حساسية - يرجى الانتباه',
    subjectEn: 'Allergy Warning - Please Pay Attention',
    template: (allergies) =>
      `هام جداً: الزبون لديه حساسية من: ${allergies.join('، ')}. يرجى التأكد من عدم تلوث الطعام وعدم استخدام هذه المكونات.`,
  },
  DIETARY_REQUEST: {
    type: 'DIETARY_REQUEST',
    priority: 'HIGH',
    subjectAr: 'طلب غذائي خاص',
    subjectEn: 'Special Dietary Request',
    template: (diets) =>
      `يرجى مراعاة أن الزبون يتبع نظام غذائي: ${diets.join('، ')}. يرجى تحضير الطعام وفقاً لذلك.`,
  },
  INGREDIENT_SWAP: {
    type: 'INGREDIENT_SWAP',
    priority: 'NORMAL',
    subjectAr: 'طلب استبدال مكون',
    subjectEn: 'Ingredient Swap Request',
    template: (fromIng, toIng) =>
      `يرجى استبدال "${fromIng}" بـ "${toIng}" في الطلب.`,
  },
  NO_INGREDIENT: {
    type: 'MODIFICATION',
    priority: 'NORMAL',
    subjectAr: 'إزالة مكون',
    subjectEn: 'Remove Ingredient',
    template: (ingredient) =>
      `يرجى إزالة "${ingredient}" من الطلب.`,
  },
  SPECIAL_COOKING: {
    type: 'SPECIAL_COOKING',
    priority: 'NORMAL',
    subjectAr: 'طريقة طهي خاصة',
    subjectEn: 'Special Cooking Method',
    template: (method) =>
      `يرجى تحضير الطعام بطريقة: ${method}.`,
  },
};

class CustomOrderMessageService {
  /**
   * إنشاء رسالة مخصصة للمطعم
   */
  async createMessage(messageData) {
    const message = await prisma.customOrderMessage.create({
      data: {
        orderId: messageData.orderId,
        userId: messageData.userId,
        restaurantId: messageData.restaurantId,
        messageType: messageData.messageType,
        subject: messageData.subject,
        message: messageData.message,
        dietaryNotes: messageData.dietaryNotes,
        allergyNotes: messageData.allergyNotes,
        specialRequests: messageData.specialRequests || [],
        priority: messageData.priority || 'NORMAL',
        status: 'PENDING',
      },
    });

    return message;
  }

  /**
   * إنشاء رسالة تحذير حساسية تلقائية
   */
  async createAllergyWarningMessage(orderId, userId, restaurantId, allergies) {
    const template = MESSAGE_TEMPLATES.ALLERGY_WARNING;

    return this.createMessage({
      orderId,
      userId,
      restaurantId,
      messageType: template.type,
      subject: template.subjectAr,
      message: template.template(allergies),
      allergyNotes: allergies.join('، '),
      priority: template.priority,
    });
  }

  /**
   * إنشاء رسالة طلب غذائي
   */
  async createDietaryRequestMessage(orderId, userId, restaurantId, diets) {
    const template = MESSAGE_TEMPLATES.DIETARY_REQUEST;

    return this.createMessage({
      orderId,
      userId,
      restaurantId,
      messageType: template.type,
      subject: template.subjectAr,
      message: template.template(diets),
      dietaryNotes: diets.join('، '),
      priority: template.priority,
    });
  }

  /**
   * إنشاء رسائل تلقائية بناءً على ملف المستخدم
   */
  async createAutoMessagesForOrder(orderId, userId, restaurantId) {
    const messages = [];

    // الحصول على ملف المستخدم
    const userPreferences = await prisma.userPreferences.findUnique({
      where: { userId },
      include: {
        dietaryProfile: {
          include: { allergyProfile: true },
        },
      },
    });

    if (!userPreferences?.dietaryProfile) {
      return messages;
    }

    const dietaryProfile = userPreferences.dietaryProfile;
    const allergyProfile = dietaryProfile.allergyProfile;

    // إنشاء رسالة الحساسية إذا وجدت
    if (allergyProfile) {
      const allergies = [];
      if (allergyProfile.hasPeanutAllergy) allergies.push('الفول السوداني');
      if (allergyProfile.hasTreeNutAllergy) allergies.push('المكسرات');
      if (allergyProfile.hasMilkAllergy) allergies.push('الحليب ومشتقاته');
      if (allergyProfile.hasEggAllergy) allergies.push('البيض');
      if (allergyProfile.hasWheatAllergy) allergies.push('القمح/الجلوتين');
      if (allergyProfile.hasSoyAllergy) allergies.push('الصويا');
      if (allergyProfile.hasFishAllergy) allergies.push('الأسماك');
      if (allergyProfile.hasShellfishAllergy) allergies.push('المحار والقشريات');
      if (allergyProfile.hasSesameAllergy) allergies.push('السمسم');
      allergies.push(...allergyProfile.otherAllergies);

      if (allergies.length > 0) {
        const allergyMessage = await this.createAllergyWarningMessage(
          orderId,
          userId,
          restaurantId,
          allergies
        );
        messages.push(allergyMessage);
      }
    }

    // إنشاء رسالة الحمية إذا وجدت
    const diets = [];
    if (dietaryProfile.isHalal) diets.push('حلال');
    if (dietaryProfile.isVegetarian) diets.push('نباتي');
    if (dietaryProfile.isVegan) diets.push('نباتي صرف');
    if (dietaryProfile.isGlutenFree) diets.push('خالي من الجلوتين');
    if (dietaryProfile.isKeto) diets.push('كيتو');
    if (dietaryProfile.isLowSodium) diets.push('قليل الصوديوم');
    if (dietaryProfile.isDairyFree) diets.push('خالي من الألبان');
    diets.push(...dietaryProfile.customDiets);

    if (diets.length > 0) {
      const dietMessage = await this.createDietaryRequestMessage(
        orderId,
        userId,
        restaurantId,
        diets
      );
      messages.push(dietMessage);
    }

    // إنشاء رسالة للمكونات المحظورة
    if (dietaryProfile.avoidIngredients.length > 0) {
      const avoidMessage = await this.createMessage({
        orderId,
        userId,
        restaurantId,
        messageType: 'MODIFICATION',
        subject: 'مكونات يجب تجنبها',
        message: `يرجى تجنب المكونات التالية: ${dietaryProfile.avoidIngredients.join('، ')}`,
        specialRequests: dietaryProfile.avoidIngredients,
        priority: 'HIGH',
      });
      messages.push(avoidMessage);
    }

    return messages;
  }

  /**
   * الحصول على رسائل طلب معين
   */
  async getOrderMessages(orderId) {
    return prisma.customOrderMessage.findMany({
      where: { orderId },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  /**
   * الحصول على رسائل مطعم معين
   */
  async getRestaurantMessages(restaurantId, options = {}) {
    const { status, limit = 50, offset = 0 } = options;

    const where = { restaurantId };
    if (status) {
      where.status = status;
    }

    return prisma.customOrderMessage.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
      skip: offset,
    });
  }

  /**
   * تحديث حالة الرسالة
   */
  async updateMessageStatus(messageId, status, restaurantReply = null) {
    const updateData = {
      status,
      updatedAt: new Date(),
    };

    if (restaurantReply) {
      updateData.restaurantReply = restaurantReply;
      updateData.repliedAt = new Date();
    }

    return prisma.customOrderMessage.update({
      where: { id: messageId },
      data: updateData,
    });
  }

  /**
   * إقرار الرسالة من المطعم
   */
  async acknowledgeMessage(messageId) {
    return this.updateMessageStatus(messageId, 'ACKNOWLEDGED');
  }

  /**
   * الرد على الرسالة
   */
  async replyToMessage(messageId, reply, newStatus = 'COMPLETED') {
    return this.updateMessageStatus(messageId, newStatus, reply);
  }

  /**
   * الحصول على الرسائل العاجلة غير المقروءة
   */
  async getUrgentUnreadMessages(restaurantId) {
    return prisma.customOrderMessage.findMany({
      where: {
        restaurantId,
        priority: 'URGENT',
        status: { in: ['PENDING', 'RECEIVED'] },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * الحصول على إحصائيات الرسائل
   */
  async getMessageStats(restaurantId) {
    const [total, pending, urgent, completed] = await Promise.all([
      prisma.customOrderMessage.count({ where: { restaurantId } }),
      prisma.customOrderMessage.count({ where: { restaurantId, status: 'PENDING' } }),
      prisma.customOrderMessage.count({ where: { restaurantId, priority: 'URGENT', status: { in: ['PENDING', 'RECEIVED'] } } }),
      prisma.customOrderMessage.count({ where: { restaurantId, status: 'COMPLETED' } }),
    ]);

    return { total, pending, urgent, completed };
  }
}

module.exports = new CustomOrderMessageService();
module.exports.MESSAGE_TEMPLATES = MESSAGE_TEMPLATES;

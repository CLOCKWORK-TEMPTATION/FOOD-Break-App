/**
 * خدمة تسميات الطعام
 * Food Label Service - Manages dietary labels for menu items
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// أيقونات التسميات
const LABEL_ICONS = {
  halal: '🕌',
  halalCertified: '✓🕌',
  vegetarian: '🥬',
  vegan: '🌱',
  glutenFree: '🌾',
  keto: '🥑',
  lowSodium: '🧂',
  lowCarb: '🍞',
  dairyFree: '🥛',
  nutFree: '🥜',
  organic: '🌿',
  spicy: '🌶️',
};

// ألوان التسميات
const LABEL_COLORS = {
  halal: '#2E7D32',
  halalCertified: '#1B5E20',
  vegetarian: '#4CAF50',
  vegan: '#8BC34A',
  glutenFree: '#FF9800',
  keto: '#9C27B0',
  lowSodium: '#03A9F4',
  lowCarb: '#FF5722',
  dairyFree: '#00BCD4',
  nutFree: '#795548',
  organic: '#689F38',
  spicy: '#F44336',
};

class FoodLabelService {
  /**
   * إنشاء أو تحديث تسمية طعام
   */
  async createOrUpdateFoodLabel(menuItemId, labelData) {
    const foodLabel = await prisma.foodLabel.upsert({
      where: { menuItemId },
      update: {
        isHalal: labelData.isHalal ?? false,
        isHalalCertified: labelData.isHalalCertified ?? false,
        isVegetarian: labelData.isVegetarian ?? false,
        isVegan: labelData.isVegan ?? false,
        isGlutenFree: labelData.isGlutenFree ?? false,
        isKeto: labelData.isKeto ?? false,
        isLowSodium: labelData.isLowSodium ?? false,
        isLowCarb: labelData.isLowCarb ?? false,
        isDairyFree: labelData.isDairyFree ?? false,
        isNutFree: labelData.isNutFree ?? false,
        isOrganic: labelData.isOrganic ?? false,
        isSpicy: labelData.isSpicy ?? false,
        spicyLevel: labelData.spicyLevel,
        containsAllergens: labelData.containsAllergens ?? [],
        mayContainAllergens: labelData.mayContainAllergens ?? [],
        crossContaminationRisk: labelData.crossContaminationRisk ?? false,
        ingredients: labelData.ingredients ?? [],
        warnings: labelData.warnings ?? [],
        certifications: labelData.certifications ?? [],
        isVerified: labelData.isVerified ?? false,
        verifiedBy: labelData.verifiedBy,
        verifiedAt: labelData.isVerified ? new Date() : null,
      },
      create: {
        menuItemId,
        isHalal: labelData.isHalal ?? false,
        isHalalCertified: labelData.isHalalCertified ?? false,
        isVegetarian: labelData.isVegetarian ?? false,
        isVegan: labelData.isVegan ?? false,
        isGlutenFree: labelData.isGlutenFree ?? false,
        isKeto: labelData.isKeto ?? false,
        isLowSodium: labelData.isLowSodium ?? false,
        isLowCarb: labelData.isLowCarb ?? false,
        isDairyFree: labelData.isDairyFree ?? false,
        isNutFree: labelData.isNutFree ?? false,
        isOrganic: labelData.isOrganic ?? false,
        isSpicy: labelData.isSpicy ?? false,
        spicyLevel: labelData.spicyLevel,
        containsAllergens: labelData.containsAllergens ?? [],
        mayContainAllergens: labelData.mayContainAllergens ?? [],
        crossContaminationRisk: labelData.crossContaminationRisk ?? false,
        ingredients: labelData.ingredients ?? [],
        warnings: labelData.warnings ?? [],
        certifications: labelData.certifications ?? [],
        isVerified: labelData.isVerified ?? false,
        verifiedBy: labelData.verifiedBy,
        verifiedAt: labelData.isVerified ? new Date() : null,
      },
    });

    return foodLabel;
  }

  /**
   * الحصول على تسمية طعام
   */
  async getFoodLabel(menuItemId) {
    return prisma.foodLabel.findUnique({
      where: { menuItemId },
    });
  }

  /**
   * الحصول على تسميات متعددة
   */
  async getFoodLabels(menuItemIds) {
    const labels = await prisma.foodLabel.findMany({
      where: { menuItemId: { in: menuItemIds } },
    });

    return new Map(labels.map(label => [label.menuItemId, label]));
  }

  /**
   * الحصول على التسميات النشطة لعنصر
   */
  async getActiveLabels(menuItemId) {
    const label = await this.getFoodLabel(menuItemId);
    if (!label) return [];

    const activeLabels = [];

    if (label.isHalal) {
      activeLabels.push({
        type: 'halal',
        text: 'حلال',
        textEn: 'Halal',
        icon: LABEL_ICONS.halal,
        color: LABEL_COLORS.halal,
      });
    }

    if (label.isHalalCertified) {
      activeLabels.push({
        type: 'halalCertified',
        text: 'معتمد حلال',
        textEn: 'Halal Certified',
        icon: LABEL_ICONS.halalCertified,
        color: LABEL_COLORS.halalCertified,
      });
    }

    if (label.isVegetarian) {
      activeLabels.push({
        type: 'vegetarian',
        text: 'نباتي',
        textEn: 'Vegetarian',
        icon: LABEL_ICONS.vegetarian,
        color: LABEL_COLORS.vegetarian,
      });
    }

    if (label.isVegan) {
      activeLabels.push({
        type: 'vegan',
        text: 'نباتي صرف',
        textEn: 'Vegan',
        icon: LABEL_ICONS.vegan,
        color: LABEL_COLORS.vegan,
      });
    }

    if (label.isGlutenFree) {
      activeLabels.push({
        type: 'glutenFree',
        text: 'خالي من الجلوتين',
        textEn: 'Gluten-Free',
        icon: LABEL_ICONS.glutenFree,
        color: LABEL_COLORS.glutenFree,
      });
    }

    if (label.isKeto) {
      activeLabels.push({
        type: 'keto',
        text: 'كيتو',
        textEn: 'Keto',
        icon: LABEL_ICONS.keto,
        color: LABEL_COLORS.keto,
      });
    }

    if (label.isLowSodium) {
      activeLabels.push({
        type: 'lowSodium',
        text: 'قليل الصوديوم',
        textEn: 'Low Sodium',
        icon: LABEL_ICONS.lowSodium,
        color: LABEL_COLORS.lowSodium,
      });
    }

    if (label.isLowCarb) {
      activeLabels.push({
        type: 'lowCarb',
        text: 'قليل الكربوهيدرات',
        textEn: 'Low Carb',
        icon: LABEL_ICONS.lowCarb,
        color: LABEL_COLORS.lowCarb,
      });
    }

    if (label.isDairyFree) {
      activeLabels.push({
        type: 'dairyFree',
        text: 'خالي من الألبان',
        textEn: 'Dairy-Free',
        icon: LABEL_ICONS.dairyFree,
        color: LABEL_COLORS.dairyFree,
      });
    }

    if (label.isNutFree) {
      activeLabels.push({
        type: 'nutFree',
        text: 'خالي من المكسرات',
        textEn: 'Nut-Free',
        icon: LABEL_ICONS.nutFree,
        color: LABEL_COLORS.nutFree,
      });
    }

    if (label.isOrganic) {
      activeLabels.push({
        type: 'organic',
        text: 'عضوي',
        textEn: 'Organic',
        icon: LABEL_ICONS.organic,
        color: LABEL_COLORS.organic,
      });
    }

    if (label.isSpicy) {
      activeLabels.push({
        type: 'spicy',
        text: `حار (${label.spicyLevel}/5)`,
        textEn: `Spicy (${label.spicyLevel}/5)`,
        icon: LABEL_ICONS.spicy,
        color: LABEL_COLORS.spicy,
        spicyLevel: label.spicyLevel,
      });
    }

    return activeLabels;
  }

  /**
   * الحصول على معلومات الحساسية
   */
  async getAllergenInfo(menuItemId) {
    const label = await this.getFoodLabel(menuItemId);
    if (!label) return null;

    return {
      contains: label.containsAllergens,
      mayContain: label.mayContainAllergens,
      crossContaminationRisk: label.crossContaminationRisk,
      warnings: label.warnings,
    };
  }

  /**
   * الحصول على قائمة المكونات
   */
  async getIngredients(menuItemId) {
    const label = await this.getFoodLabel(menuItemId);
    return label?.ingredients || [];
  }

  /**
   * التحقق من توافق عنصر مع حمية معينة
   */
  async checkDietCompatibility(menuItemId, dietType) {
    const label = await this.getFoodLabel(menuItemId);
    if (!label) return { compatible: false, reason: 'لا توجد معلومات' };

    const compatibilityMap = {
      halal: label.isHalal,
      vegetarian: label.isVegetarian,
      vegan: label.isVegan,
      glutenFree: label.isGlutenFree,
      keto: label.isKeto,
      lowSodium: label.isLowSodium,
      lowCarb: label.isLowCarb,
      dairyFree: label.isDairyFree,
      nutFree: label.isNutFree,
    };

    const isCompatible = compatibilityMap[dietType];

    return {
      compatible: isCompatible,
      reason: isCompatible ? 'متوافق' : 'غير متوافق',
      verified: label.isVerified,
    };
  }

  /**
   * التحقق من تسمية
   */
  async verifyLabel(menuItemId, verifiedBy) {
    return prisma.foodLabel.update({
      where: { menuItemId },
      data: {
        isVerified: true,
        verifiedBy,
        verifiedAt: new Date(),
      },
    });
  }

  /**
   * إلغاء التحقق من تسمية
   */
  async unverifyLabel(menuItemId) {
    return prisma.foodLabel.update({
      where: { menuItemId },
      data: {
        isVerified: false,
        verifiedBy: null,
        verifiedAt: null,
      },
    });
  }

  /**
   * الحصول على إحصائيات التسميات لمطعم
   */
  async getRestaurantLabelStats(restaurantId) {
    const menuItems = await prisma.menuItem.findMany({
      where: { restaurantId },
      select: { id: true },
    });

    const menuItemIds = menuItems.map(m => m.id);

    const labels = await prisma.foodLabel.findMany({
      where: { menuItemId: { in: menuItemIds } },
    });

    const stats = {
      total: menuItemIds.length,
      labeled: labels.length,
      verified: labels.filter(l => l.isVerified).length,
      halal: labels.filter(l => l.isHalal).length,
      vegetarian: labels.filter(l => l.isVegetarian).length,
      vegan: labels.filter(l => l.isVegan).length,
      glutenFree: labels.filter(l => l.isGlutenFree).length,
      keto: labels.filter(l => l.isKeto).length,
      lowSodium: labels.filter(l => l.isLowSodium).length,
      dairyFree: labels.filter(l => l.isDairyFree).length,
      nutFree: labels.filter(l => l.isNutFree).length,
    };

    return stats;
  }

  /**
   * البحث عن عناصر حسب التسميات
   */
  async findItemsByLabels(restaurantId, labels) {
    const conditions = {};

    if (labels.includes('halal')) conditions.isHalal = true;
    if (labels.includes('vegetarian')) conditions.isVegetarian = true;
    if (labels.includes('vegan')) conditions.isVegan = true;
    if (labels.includes('glutenFree')) conditions.isGlutenFree = true;
    if (labels.includes('keto')) conditions.isKeto = true;
    if (labels.includes('lowSodium')) conditions.isLowSodium = true;
    if (labels.includes('dairyFree')) conditions.isDairyFree = true;
    if (labels.includes('nutFree')) conditions.isNutFree = true;

    const menuItems = await prisma.menuItem.findMany({
      where: { restaurantId, isAvailable: true },
      select: { id: true },
    });

    const menuItemIds = menuItems.map(m => m.id);

    const matchingLabels = await prisma.foodLabel.findMany({
      where: {
        menuItemId: { in: menuItemIds },
        ...conditions,
      },
    });

    return matchingLabels.map(l => l.menuItemId);
  }

  /**
   * الحصول على جميع أنواع التسميات المتاحة
   */
  getAvailableLabelTypes() {
    return Object.entries(LABEL_ICONS).map(([type, icon]) => ({
      type,
      icon,
      color: LABEL_COLORS[type],
    }));
  }
}

module.exports = new FoodLabelService();
module.exports.LABEL_ICONS = LABEL_ICONS;
module.exports.LABEL_COLORS = LABEL_COLORS;

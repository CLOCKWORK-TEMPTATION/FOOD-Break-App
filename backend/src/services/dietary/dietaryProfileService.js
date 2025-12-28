/**
 * خدمة الملف الشخصي للحمية الغذائية
 * Dietary Profile Service
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// أنواع الحميات المدعومة
const DIET_TYPES = {
  HALAL: 'halal',
  VEGETARIAN: 'vegetarian',
  VEGAN: 'vegan',
  GLUTEN_FREE: 'glutenFree',
  KETO: 'keto',
  LOW_SODIUM: 'lowSodium',
  LOW_CARB: 'lowCarb',
  DAIRY_FREE: 'dairyFree',
  NUT_FREE: 'nutFree',
  PESCATARIAN: 'pescatarian',
};

// ترجمة أنواع الحميات للعربية
const DIET_LABELS_AR = {
  halal: 'حلال',
  vegetarian: 'نباتي',
  vegan: 'نباتي صرف',
  glutenFree: 'خالي من الجلوتين',
  keto: 'كيتو',
  lowSodium: 'قليل الصوديوم',
  lowCarb: 'قليل الكربوهيدرات',
  dairyFree: 'خالي من الألبان',
  nutFree: 'خالي من المكسرات',
  pescatarian: 'نباتي مع الأسماك',
};

class DietaryProfileService {
  /**
   * إنشاء أو تحديث الملف الشخصي للحمية
   */
  async createOrUpdateDietaryProfile(userId, profileData) {
    // التأكد من وجود تفضيلات المستخدم
    let userPreferences = await prisma.userPreferences.findUnique({
      where: { userId },
      include: { dietaryProfile: true },
    });

    if (!userPreferences) {
      // إنشاء تفضيلات جديدة
      userPreferences = await prisma.userPreferences.create({
        data: {
          userId,
          dietaryRestrictions: [],
          favoriteCuisines: [],
          allergies: [],
          healthGoals: [],
        },
      });
    }

    // إنشاء أو تحديث الملف الشخصي للحمية
    const dietaryProfile = await prisma.dietaryProfile.upsert({
      where: { userPreferencesId: userPreferences.id },
      update: {
        isHalal: profileData.isHalal ?? false,
        isVegetarian: profileData.isVegetarian ?? false,
        isVegan: profileData.isVegan ?? false,
        isGlutenFree: profileData.isGlutenFree ?? false,
        isKeto: profileData.isKeto ?? false,
        isLowSodium: profileData.isLowSodium ?? false,
        isLowCarb: profileData.isLowCarb ?? false,
        isDairyFree: profileData.isDairyFree ?? false,
        isNutFree: profileData.isNutFree ?? false,
        isPescatarian: profileData.isPescatarian ?? false,
        maxCaloriesPerMeal: profileData.maxCaloriesPerMeal,
        maxSodiumPerDay: profileData.maxSodiumPerDay,
        maxCarbsPerMeal: profileData.maxCarbsPerMeal,
        maxSugarPerDay: profileData.maxSugarPerDay,
        minProteinPerMeal: profileData.minProteinPerMeal,
        customDiets: profileData.customDiets ?? [],
        avoidIngredients: profileData.avoidIngredients ?? [],
        preferredIngredients: profileData.preferredIngredients ?? [],
        strictMode: profileData.strictMode ?? false,
        showWarnings: profileData.showWarnings ?? true,
      },
      create: {
        userPreferencesId: userPreferences.id,
        isHalal: profileData.isHalal ?? false,
        isVegetarian: profileData.isVegetarian ?? false,
        isVegan: profileData.isVegan ?? false,
        isGlutenFree: profileData.isGlutenFree ?? false,
        isKeto: profileData.isKeto ?? false,
        isLowSodium: profileData.isLowSodium ?? false,
        isLowCarb: profileData.isLowCarb ?? false,
        isDairyFree: profileData.isDairyFree ?? false,
        isNutFree: profileData.isNutFree ?? false,
        isPescatarian: profileData.isPescatarian ?? false,
        maxCaloriesPerMeal: profileData.maxCaloriesPerMeal,
        maxSodiumPerDay: profileData.maxSodiumPerDay,
        maxCarbsPerMeal: profileData.maxCarbsPerMeal,
        maxSugarPerDay: profileData.maxSugarPerDay,
        minProteinPerMeal: profileData.minProteinPerMeal,
        customDiets: profileData.customDiets ?? [],
        avoidIngredients: profileData.avoidIngredients ?? [],
        preferredIngredients: profileData.preferredIngredients ?? [],
        strictMode: profileData.strictMode ?? false,
        showWarnings: profileData.showWarnings ?? true,
      },
      include: {
        allergyProfile: true,
      },
    });

    return dietaryProfile;
  }

  /**
   * الحصول على الملف الشخصي للحمية
   */
  async getDietaryProfile(userId) {
    const userPreferences = await prisma.userPreferences.findUnique({
      where: { userId },
      include: {
        dietaryProfile: {
          include: {
            allergyProfile: true,
          },
        },
      },
    });

    return userPreferences?.dietaryProfile || null;
  }

  /**
   * الحصول على أنواع الحميات النشطة للمستخدم
   */
  async getActiveDiets(userId) {
    const profile = await this.getDietaryProfile(userId);
    if (!profile) return [];

    const activeDiets = [];

    if (profile.isHalal) activeDiets.push({ type: 'halal', label: DIET_LABELS_AR.halal });
    if (profile.isVegetarian) activeDiets.push({ type: 'vegetarian', label: DIET_LABELS_AR.vegetarian });
    if (profile.isVegan) activeDiets.push({ type: 'vegan', label: DIET_LABELS_AR.vegan });
    if (profile.isGlutenFree) activeDiets.push({ type: 'glutenFree', label: DIET_LABELS_AR.glutenFree });
    if (profile.isKeto) activeDiets.push({ type: 'keto', label: DIET_LABELS_AR.keto });
    if (profile.isLowSodium) activeDiets.push({ type: 'lowSodium', label: DIET_LABELS_AR.lowSodium });
    if (profile.isLowCarb) activeDiets.push({ type: 'lowCarb', label: DIET_LABELS_AR.lowCarb });
    if (profile.isDairyFree) activeDiets.push({ type: 'dairyFree', label: DIET_LABELS_AR.dairyFree });
    if (profile.isNutFree) activeDiets.push({ type: 'nutFree', label: DIET_LABELS_AR.nutFree });
    if (profile.isPescatarian) activeDiets.push({ type: 'pescatarian', label: DIET_LABELS_AR.pescatarian });

    // إضافة الحميات المخصصة
    profile.customDiets.forEach(diet => {
      activeDiets.push({ type: 'custom', label: diet });
    });

    return activeDiets;
  }

  /**
   * الحصول على جميع أنواع الحميات المتاحة
   */
  getAvailableDietTypes() {
    return Object.entries(DIET_LABELS_AR).map(([type, label]) => ({
      type,
      label,
      labelEn: type.replace(/([A-Z])/g, ' $1').trim(),
    }));
  }

  /**
   * حذف الملف الشخصي للحمية
   */
  async deleteDietaryProfile(userId) {
    const userPreferences = await prisma.userPreferences.findUnique({
      where: { userId },
      include: { dietaryProfile: true },
    });

    if (userPreferences?.dietaryProfile) {
      await prisma.dietaryProfile.delete({
        where: { id: userPreferences.dietaryProfile.id },
      });
    }

    return { success: true };
  }
}

module.exports = new DietaryProfileService();
module.exports.DIET_TYPES = DIET_TYPES;
module.exports.DIET_LABELS_AR = DIET_LABELS_AR;

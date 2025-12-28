/**
 * خدمة تصفية القائمة حسب الحمية والحساسية
 * Menu Filter Service - Filters menu items based on dietary preferences and allergies
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const allergyService = require('./allergyService');

class MenuFilterService {
  /**
   * تصفية عناصر القائمة حسب الملف الشخصي للمستخدم
   */
  async filterMenuItems(userId, menuItems) {
    // الحصول على ملف الحمية والحساسية
    const userPreferences = await prisma.userPreferences.findUnique({
      where: { userId },
      include: {
        dietaryProfile: {
          include: { allergyProfile: true },
        },
      },
    });

    if (!userPreferences?.dietaryProfile) {
      // لا يوجد ملف حمية، إرجاع كل العناصر
      return menuItems.map(item => ({
        ...item,
        dietaryInfo: {
          compatible: true,
          warnings: [],
          alerts: [],
          labels: [],
        },
      }));
    }

    const dietaryProfile = userPreferences.dietaryProfile;
    const allergyProfile = dietaryProfile.allergyProfile;

    // الحصول على تسميات الطعام لكل العناصر
    const menuItemIds = menuItems.map(item => item.id);
    const foodLabels = await prisma.foodLabel.findMany({
      where: { menuItemId: { in: menuItemIds } },
    });

    const foodLabelsMap = new Map(foodLabels.map(label => [label.menuItemId, label]));

    // تصفية وتحليل كل عنصر
    const processedItems = await Promise.all(
      menuItems.map(async item => {
        const label = foodLabelsMap.get(item.id);
        const analysis = await this._analyzeItem(item, label, dietaryProfile, allergyProfile);
        return {
          ...item,
          dietaryInfo: analysis,
        };
      })
    );

    // إذا كان الوضع الصارم مفعل، إخفاء العناصر غير المتوافقة
    if (dietaryProfile.strictMode) {
      return processedItems.filter(item => item.dietaryInfo.compatible);
    }

    // ترتيب العناصر: المتوافقة أولاً
    return processedItems.sort((a, b) => {
      if (a.dietaryInfo.compatible && !b.dietaryInfo.compatible) return -1;
      if (!a.dietaryInfo.compatible && b.dietaryInfo.compatible) return 1;
      return 0;
    });
  }

  /**
   * تحليل عنصر واحد
   */
  async _analyzeItem(item, foodLabel, dietaryProfile, allergyProfile) {
    const warnings = [];
    const alerts = [];
    const labels = [];
    let compatible = true;

    // إضافة التسميات
    if (foodLabel) {
      if (foodLabel.isHalal) labels.push({ type: 'halal', icon: '🕌', text: 'حلال' });
      if (foodLabel.isHalalCertified) labels.push({ type: 'halalCertified', icon: '✓🕌', text: 'معتمد حلال' });
      if (foodLabel.isVegetarian) labels.push({ type: 'vegetarian', icon: '🥬', text: 'نباتي' });
      if (foodLabel.isVegan) labels.push({ type: 'vegan', icon: '🌱', text: 'نباتي صرف' });
      if (foodLabel.isGlutenFree) labels.push({ type: 'glutenFree', icon: '🌾', text: 'خالي من الجلوتين' });
      if (foodLabel.isKeto) labels.push({ type: 'keto', icon: '🥑', text: 'كيتو' });
      if (foodLabel.isLowSodium) labels.push({ type: 'lowSodium', icon: '🧂', text: 'قليل الصوديوم' });
      if (foodLabel.isLowCarb) labels.push({ type: 'lowCarb', icon: '🍞', text: 'قليل الكربوهيدرات' });
      if (foodLabel.isDairyFree) labels.push({ type: 'dairyFree', icon: '🥛', text: 'خالي من الألبان' });
      if (foodLabel.isNutFree) labels.push({ type: 'nutFree', icon: '🥜', text: 'خالي من المكسرات' });
      if (foodLabel.isOrganic) labels.push({ type: 'organic', icon: '🌿', text: 'عضوي' });
      if (foodLabel.isSpicy) labels.push({ type: 'spicy', icon: '🌶️', text: `حار (${foodLabel.spicyLevel}/5)` });
    }

    // فحص توافق الحمية
    if (dietaryProfile.isHalal && foodLabel && !foodLabel.isHalal) {
      compatible = false;
      alerts.push({ type: 'diet', message: 'غير حلال', icon: '⚠️' });
    }

    if (dietaryProfile.isVegetarian && foodLabel && !foodLabel.isVegetarian) {
      compatible = false;
      alerts.push({ type: 'diet', message: 'يحتوي على لحوم', icon: '⚠️' });
    }

    if (dietaryProfile.isVegan && foodLabel && !foodLabel.isVegan) {
      compatible = false;
      alerts.push({ type: 'diet', message: 'يحتوي على منتجات حيوانية', icon: '⚠️' });
    }

    if (dietaryProfile.isGlutenFree && foodLabel && !foodLabel.isGlutenFree) {
      compatible = false;
      alerts.push({ type: 'diet', message: 'يحتوي على جلوتين', icon: '⚠️' });
    }

    if (dietaryProfile.isKeto && foodLabel && !foodLabel.isKeto) {
      warnings.push({ type: 'diet', message: 'قد لا يناسب نظام الكيتو', icon: '💡' });
    }

    if (dietaryProfile.isLowSodium && foodLabel && !foodLabel.isLowSodium) {
      warnings.push({ type: 'diet', message: 'قد يحتوي على نسبة عالية من الصوديوم', icon: '💡' });
    }

    if (dietaryProfile.isDairyFree && foodLabel && !foodLabel.isDairyFree) {
      compatible = false;
      alerts.push({ type: 'diet', message: 'يحتوي على منتجات ألبان', icon: '⚠️' });
    }

    if (dietaryProfile.isNutFree && foodLabel && !foodLabel.isNutFree) {
      compatible = false;
      alerts.push({ type: 'diet', message: 'يحتوي على مكسرات', icon: '⚠️' });
    }

    // فحص المكونات المحظورة
    if (foodLabel && dietaryProfile.avoidIngredients.length > 0) {
      const itemIngredients = foodLabel.ingredients.map(i => i.toLowerCase());
      for (const avoid of dietaryProfile.avoidIngredients) {
        if (itemIngredients.some(ing => ing.includes(avoid.toLowerCase()))) {
          warnings.push({
            type: 'ingredient',
            message: `يحتوي على "${avoid}"`,
            icon: '⚠️',
          });
        }
      }
    }

    // فحص الحساسيات
    if (allergyProfile && foodLabel) {
      const allergyCheck = await this._checkAllergies(allergyProfile, foodLabel);
      alerts.push(...allergyCheck.alerts);
      warnings.push(...allergyCheck.warnings);
      if (allergyCheck.alerts.length > 0) {
        compatible = false;
      }
    }

    // فحص الحدود الغذائية
    if (item.nutritionalInfo) {
      const nutritionWarnings = this._checkNutritionLimits(item.nutritionalInfo, dietaryProfile);
      warnings.push(...nutritionWarnings);
    }

    return {
      compatible,
      warnings: dietaryProfile.showWarnings ? warnings : [],
      alerts,
      labels,
      requiresConfirmation: alerts.length > 0 && allergyProfile?.requireConfirmation,
    };
  }

  /**
   * فحص الحساسيات لعنصر
   */
  async _checkAllergies(allergyProfile, foodLabel) {
    const alerts = [];
    const warnings = [];

    const allergenChecks = [
      { field: 'hasPeanutAllergy', allergen: 'peanut', label: 'الفول السوداني' },
      { field: 'hasTreeNutAllergy', allergen: 'nut', label: 'المكسرات' },
      { field: 'hasMilkAllergy', allergen: 'milk', label: 'الحليب' },
      { field: 'hasEggAllergy', allergen: 'egg', label: 'البيض' },
      { field: 'hasWheatAllergy', allergen: 'wheat', label: 'القمح' },
      { field: 'hasSoyAllergy', allergen: 'soy', label: 'الصويا' },
      { field: 'hasFishAllergy', allergen: 'fish', label: 'السمك' },
      { field: 'hasShellfishAllergy', allergen: 'shellfish', label: 'المحار' },
      { field: 'hasSesameAllergy', allergen: 'sesame', label: 'السمسم' },
    ];

    for (const check of allergenChecks) {
      if (allergyProfile[check.field]) {
        // فحص وجود الحساسية
        const containsAllergen = foodLabel.containsAllergens.some(
          a => a.toLowerCase().includes(check.allergen)
        );
        const mayContainAllergen = foodLabel.mayContainAllergens.some(
          a => a.toLowerCase().includes(check.allergen)
        );

        if (containsAllergen) {
          alerts.push({
            type: 'allergy',
            allergen: check.allergen,
            message: `⛔ تحذير حساسية: يحتوي على ${check.label}`,
            severity: allergyProfile.severityLevel,
            icon: '🚨',
          });
        } else if (mayContainAllergen) {
          warnings.push({
            type: 'allergy',
            allergen: check.allergen,
            message: `⚠️ قد يحتوي على آثار ${check.label}`,
            icon: '⚠️',
          });
        }
      }
    }

    // فحص خطر التلوث المتبادل
    if (foodLabel.crossContaminationRisk) {
      warnings.push({
        type: 'contamination',
        message: '⚠️ خطر التلوث المتبادل في المطبخ',
        icon: '⚠️',
      });
    }

    return { alerts, warnings };
  }

  /**
   * فحص الحدود الغذائية
   */
  _checkNutritionLimits(nutritionalInfo, dietaryProfile) {
    const warnings = [];

    if (dietaryProfile.maxCaloriesPerMeal && nutritionalInfo.calories) {
      if (nutritionalInfo.calories > dietaryProfile.maxCaloriesPerMeal) {
        warnings.push({
          type: 'nutrition',
          message: `السعرات (${nutritionalInfo.calories}) تتجاوز الحد (${dietaryProfile.maxCaloriesPerMeal})`,
          icon: '📊',
        });
      }
    }

    if (dietaryProfile.maxCarbsPerMeal && nutritionalInfo.carbs) {
      if (nutritionalInfo.carbs > dietaryProfile.maxCarbsPerMeal) {
        warnings.push({
          type: 'nutrition',
          message: `الكربوهيدرات (${nutritionalInfo.carbs}g) تتجاوز الحد`,
          icon: '📊',
        });
      }
    }

    if (dietaryProfile.minProteinPerMeal && nutritionalInfo.protein) {
      if (nutritionalInfo.protein < dietaryProfile.minProteinPerMeal) {
        warnings.push({
          type: 'nutrition',
          message: `البروتين (${nutritionalInfo.protein}g) أقل من المطلوب`,
          icon: '📊',
        });
      }
    }

    return warnings;
  }

  /**
   * البحث عن عناصر متوافقة مع حمية معينة
   */
  async findCompatibleItems(restaurantId, dietTypes, allergens = []) {
    const conditions = [];

    // بناء شروط الحمية
    const dietConditions = {};
    if (dietTypes.includes('halal')) dietConditions.isHalal = true;
    if (dietTypes.includes('vegetarian')) dietConditions.isVegetarian = true;
    if (dietTypes.includes('vegan')) dietConditions.isVegan = true;
    if (dietTypes.includes('glutenFree')) dietConditions.isGlutenFree = true;
    if (dietTypes.includes('keto')) dietConditions.isKeto = true;
    if (dietTypes.includes('lowSodium')) dietConditions.isLowSodium = true;
    if (dietTypes.includes('dairyFree')) dietConditions.isDairyFree = true;
    if (dietTypes.includes('nutFree')) dietConditions.isNutFree = true;

    // البحث عن العناصر
    const menuItems = await prisma.menuItem.findMany({
      where: {
        restaurantId,
        isAvailable: true,
      },
      include: {
        nutritionalInfo: true,
      },
    });

    const foodLabels = await prisma.foodLabel.findMany({
      where: {
        menuItemId: { in: menuItems.map(m => m.id) },
        ...dietConditions,
      },
    });

    const compatibleItemIds = new Set(foodLabels.map(l => l.menuItemId));

    // تصفية حسب الحساسيات
    let filteredLabels = foodLabels;
    if (allergens.length > 0) {
      filteredLabels = foodLabels.filter(label => {
        return !label.containsAllergens.some(a =>
          allergens.some(ua => a.toLowerCase().includes(ua.toLowerCase()))
        );
      });
    }

    const finalItemIds = new Set(filteredLabels.map(l => l.menuItemId));

    return menuItems.filter(item => finalItemIds.has(item.id));
  }
}

module.exports = new MenuFilterService();

/**
 * خدمة الحساسية الغذائية
 * Allergy Service
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// أنواع الحساسيات الشائعة
const COMMON_ALLERGENS = {
  PEANUT: 'peanut',
  TREE_NUT: 'treeNut',
  MILK: 'milk',
  EGG: 'egg',
  WHEAT: 'wheat',
  SOY: 'soy',
  FISH: 'fish',
  SHELLFISH: 'shellfish',
  SESAME: 'sesame',
};

// ترجمة الحساسيات للعربية
const ALLERGEN_LABELS_AR = {
  peanut: 'الفول السوداني',
  treeNut: 'المكسرات الشجرية',
  milk: 'الحليب ومشتقاته',
  egg: 'البيض',
  wheat: 'القمح',
  soy: 'فول الصويا',
  fish: 'الأسماك',
  shellfish: 'المحار والقشريات',
  sesame: 'السمسم',
};

// مستويات الخطورة
const SEVERITY_LEVELS = {
  MILD: { level: 'MILD', label: 'خفيفة', color: '#FFB74D' },
  MODERATE: { level: 'MODERATE', label: 'متوسطة', color: '#FF9800' },
  SEVERE: { level: 'SEVERE', label: 'شديدة', color: '#F44336' },
  CRITICAL: { level: 'CRITICAL', label: 'حرجة', color: '#B71C1C' },
};

class AllergyService {
  /**
   * إنشاء أو تحديث ملف الحساسية
   */
  async createOrUpdateAllergyProfile(userId, allergyData) {
    // الحصول على الملف الشخصي للحمية
    const userPreferences = await prisma.userPreferences.findUnique({
      where: { userId },
      include: {
        dietaryProfile: {
          include: { allergyProfile: true },
        },
      },
    });

    if (!userPreferences?.dietaryProfile) {
      throw new Error('يجب إنشاء ملف الحمية الغذائية أولاً');
    }

    const allergyProfile = await prisma.allergyProfile.upsert({
      where: { dietaryProfileId: userPreferences.dietaryProfile.id },
      update: {
        hasPeanutAllergy: allergyData.hasPeanutAllergy ?? false,
        hasTreeNutAllergy: allergyData.hasTreeNutAllergy ?? false,
        hasMilkAllergy: allergyData.hasMilkAllergy ?? false,
        hasEggAllergy: allergyData.hasEggAllergy ?? false,
        hasWheatAllergy: allergyData.hasWheatAllergy ?? false,
        hasSoyAllergy: allergyData.hasSoyAllergy ?? false,
        hasFishAllergy: allergyData.hasFishAllergy ?? false,
        hasShellfishAllergy: allergyData.hasShellfishAllergy ?? false,
        hasSesameAllergy: allergyData.hasSesameAllergy ?? false,
        otherAllergies: allergyData.otherAllergies ?? [],
        severityLevel: allergyData.severityLevel ?? 'MODERATE',
        showAlerts: allergyData.showAlerts ?? true,
        requireConfirmation: allergyData.requireConfirmation ?? true,
        emergencyContact: allergyData.emergencyContact,
      },
      create: {
        dietaryProfileId: userPreferences.dietaryProfile.id,
        hasPeanutAllergy: allergyData.hasPeanutAllergy ?? false,
        hasTreeNutAllergy: allergyData.hasTreeNutAllergy ?? false,
        hasMilkAllergy: allergyData.hasMilkAllergy ?? false,
        hasEggAllergy: allergyData.hasEggAllergy ?? false,
        hasWheatAllergy: allergyData.hasWheatAllergy ?? false,
        hasSoyAllergy: allergyData.hasSoyAllergy ?? false,
        hasFishAllergy: allergyData.hasFishAllergy ?? false,
        hasShellfishAllergy: allergyData.hasShellfishAllergy ?? false,
        hasSesameAllergy: allergyData.hasSesameAllergy ?? false,
        otherAllergies: allergyData.otherAllergies ?? [],
        severityLevel: allergyData.severityLevel ?? 'MODERATE',
        showAlerts: allergyData.showAlerts ?? true,
        requireConfirmation: allergyData.requireConfirmation ?? true,
        emergencyContact: allergyData.emergencyContact,
      },
    });

    return allergyProfile;
  }

  /**
   * الحصول على ملف الحساسية
   */
  async getAllergyProfile(userId) {
    const userPreferences = await prisma.userPreferences.findUnique({
      where: { userId },
      include: {
        dietaryProfile: {
          include: { allergyProfile: true },
        },
      },
    });

    return userPreferences?.dietaryProfile?.allergyProfile || null;
  }

  /**
   * الحصول على قائمة الحساسيات النشطة للمستخدم
   */
  async getActiveAllergies(userId) {
    const profile = await this.getAllergyProfile(userId);
    if (!profile) return [];

    const activeAllergies = [];

    if (profile.hasPeanutAllergy) {
      activeAllergies.push({ type: 'peanut', label: ALLERGEN_LABELS_AR.peanut });
    }
    if (profile.hasTreeNutAllergy) {
      activeAllergies.push({ type: 'treeNut', label: ALLERGEN_LABELS_AR.treeNut });
    }
    if (profile.hasMilkAllergy) {
      activeAllergies.push({ type: 'milk', label: ALLERGEN_LABELS_AR.milk });
    }
    if (profile.hasEggAllergy) {
      activeAllergies.push({ type: 'egg', label: ALLERGEN_LABELS_AR.egg });
    }
    if (profile.hasWheatAllergy) {
      activeAllergies.push({ type: 'wheat', label: ALLERGEN_LABELS_AR.wheat });
    }
    if (profile.hasSoyAllergy) {
      activeAllergies.push({ type: 'soy', label: ALLERGEN_LABELS_AR.soy });
    }
    if (profile.hasFishAllergy) {
      activeAllergies.push({ type: 'fish', label: ALLERGEN_LABELS_AR.fish });
    }
    if (profile.hasShellfishAllergy) {
      activeAllergies.push({ type: 'shellfish', label: ALLERGEN_LABELS_AR.shellfish });
    }
    if (profile.hasSesameAllergy) {
      activeAllergies.push({ type: 'sesame', label: ALLERGEN_LABELS_AR.sesame });
    }

    // إضافة الحساسيات الأخرى
    profile.otherAllergies.forEach(allergy => {
      activeAllergies.push({ type: 'other', label: allergy });
    });

    return activeAllergies;
  }

  /**
   * فحص عنصر قائمة للحساسيات
   */
  async checkItemForAllergies(userId, menuItemId) {
    const [allergyProfile, foodLabel] = await Promise.all([
      this.getAllergyProfile(userId),
      prisma.foodLabel.findUnique({ where: { menuItemId } }),
    ]);

    if (!allergyProfile) {
      return { safe: true, warnings: [], alerts: [] };
    }

    const warnings = [];
    const alerts = [];
    const userAllergies = await this.getActiveAllergies(userId);

    if (foodLabel) {
      // فحص الحساسيات المؤكدة
      const allergenTypes = userAllergies.map(a => a.type);

      foodLabel.containsAllergens.forEach(allergen => {
        const normalizedAllergen = allergen.toLowerCase();
        if (this._matchesUserAllergy(normalizedAllergen, allergenTypes)) {
          alerts.push({
            type: 'contains',
            allergen,
            message: `تحذير: يحتوي على ${allergen}`,
            severity: allergyProfile.severityLevel,
          });
        }
      });

      // فحص احتمال التلوث المتبادل
      foodLabel.mayContainAllergens.forEach(allergen => {
        const normalizedAllergen = allergen.toLowerCase();
        if (this._matchesUserAllergy(normalizedAllergen, allergenTypes)) {
          warnings.push({
            type: 'mayContain',
            allergen,
            message: `تنبيه: قد يحتوي على آثار ${allergen}`,
          });
        }
      });

      // تحذير التلوث المتبادل
      if (foodLabel.crossContaminationRisk && userAllergies.length > 0) {
        warnings.push({
          type: 'crossContamination',
          message: 'تحذير: خطر التلوث المتبادل في المطبخ',
        });
      }
    }

    return {
      safe: alerts.length === 0,
      warnings,
      alerts,
      requiresConfirmation: alerts.length > 0 && allergyProfile.requireConfirmation,
      severityLevel: allergyProfile.severityLevel,
    };
  }

  /**
   * مطابقة الحساسية مع قائمة المستخدم
   */
  _matchesUserAllergy(allergen, userAllergens) {
    const allergenMap = {
      peanut: ['peanut', 'فول سوداني', 'peanuts'],
      treenut: ['treeNut', 'مكسرات', 'nuts', 'almonds', 'cashews', 'walnuts'],
      milk: ['milk', 'حليب', 'dairy', 'لبن', 'cream'],
      egg: ['egg', 'بيض', 'eggs'],
      wheat: ['wheat', 'قمح', 'gluten', 'جلوتين'],
      soy: ['soy', 'صويا', 'soya'],
      fish: ['fish', 'سمك', 'أسماك'],
      shellfish: ['shellfish', 'محار', 'shrimp', 'crab', 'lobster'],
      sesame: ['sesame', 'سمسم'],
    };

    for (const [key, variants] of Object.entries(allergenMap)) {
      if (variants.some(v => allergen.includes(v.toLowerCase()))) {
        if (userAllergens.includes(key)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * الحصول على جميع أنواع الحساسيات المتاحة
   */
  getAvailableAllergens() {
    return Object.entries(ALLERGEN_LABELS_AR).map(([type, label]) => ({
      type,
      label,
    }));
  }

  /**
   * الحصول على مستويات الخطورة
   */
  getSeverityLevels() {
    return Object.values(SEVERITY_LEVELS);
  }
}

module.exports = new AllergyService();
module.exports.COMMON_ALLERGENS = COMMON_ALLERGENS;
module.exports.ALLERGEN_LABELS_AR = ALLERGEN_LABELS_AR;
module.exports.SEVERITY_LEVELS = SEVERITY_LEVELS;

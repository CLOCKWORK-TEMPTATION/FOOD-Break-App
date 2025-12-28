/**
 * خدمة الحمية الغذائية للموبايل
 * Dietary Service - Mobile API client for dietary features
 */

import apiClient from './apiClient';

// أنواع البيانات
export interface DietaryProfile {
  id?: string;
  isHalal: boolean;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  isKeto: boolean;
  isLowSodium: boolean;
  isLowCarb: boolean;
  isDairyFree: boolean;
  isNutFree: boolean;
  isPescatarian: boolean;
  maxCaloriesPerMeal?: number;
  maxSodiumPerDay?: number;
  maxCarbsPerMeal?: number;
  maxSugarPerDay?: number;
  minProteinPerMeal?: number;
  customDiets: string[];
  avoidIngredients: string[];
  preferredIngredients: string[];
  strictMode: boolean;
  showWarnings: boolean;
}

export interface AllergyProfile {
  id?: string;
  hasPeanutAllergy: boolean;
  hasTreeNutAllergy: boolean;
  hasMilkAllergy: boolean;
  hasEggAllergy: boolean;
  hasWheatAllergy: boolean;
  hasSoyAllergy: boolean;
  hasFishAllergy: boolean;
  hasShellfishAllergy: boolean;
  hasSesameAllergy: boolean;
  severityLevel: 'MILD' | 'MODERATE' | 'SEVERE' | 'CRITICAL';
  otherAllergies: string[];
  intolerances: string[];
  emergencyContact?: string;
  emergencyPhone?: string;
  requireConfirmation: boolean;
  notifyRestaurant: boolean;
}

export interface FoodLabel {
  type: string;
  text: string;
  textEn: string;
  icon: string;
  color: string;
  spicyLevel?: number;
}

export interface AllergenInfo {
  contains: string[];
  mayContain: string[];
  crossContaminationRisk: boolean;
  warnings: string[];
}

export interface MenuItemAnalysis {
  menuItemId: string;
  isCompatible: boolean;
  compatibilityScore: number;
  dietWarnings: string[];
  allergyWarnings: string[];
  labels: FoodLabel[];
  allergenInfo?: AllergenInfo;
}

export interface DietType {
  type: string;
  label: string;
  labelEn: string;
}

export interface AllergenType {
  type: string;
  label: string;
  labelEn: string;
}

// API Response types
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
}

class DietaryService {
  private baseUrl = '/dietary';

  /**
   * ==========================================
   * Dietary Profile
   * ==========================================
   */

  /**
   * الحصول على الملف الشخصي للحمية
   */
  async getDietaryProfile(): Promise<DietaryProfile | null> {
    try {
      const response = await apiClient.get<ApiResponse<DietaryProfile>>(
        `${this.baseUrl}/profile`
      );
      return response.data.data || null;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * تحديث الملف الشخصي للحمية
   */
  async updateDietaryProfile(profile: Partial<DietaryProfile>): Promise<DietaryProfile> {
    const response = await apiClient.post<ApiResponse<DietaryProfile>>(
      `${this.baseUrl}/profile`,
      profile
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'فشل تحديث الملف الشخصي');
    }
    return response.data.data;
  }

  /**
   * حذف الملف الشخصي للحمية
   */
  async deleteDietaryProfile(): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/profile`);
  }

  /**
   * الحصول على الحميات النشطة
   */
  async getActiveDiets(): Promise<DietType[]> {
    const response = await apiClient.get<ApiResponse<DietType[]>>(
      `${this.baseUrl}/active-diets`
    );
    return response.data.data || [];
  }

  /**
   * الحصول على أنواع الحميات المتاحة
   */
  async getAvailableDietTypes(): Promise<DietType[]> {
    const response = await apiClient.get<ApiResponse<DietType[]>>(
      `${this.baseUrl}/diet-types`
    );
    return response.data.data || [];
  }

  /**
   * ==========================================
   * Allergy Profile
   * ==========================================
   */

  /**
   * الحصول على ملف الحساسية
   */
  async getAllergyProfile(): Promise<AllergyProfile | null> {
    try {
      const response = await apiClient.get<ApiResponse<AllergyProfile>>(
        `${this.baseUrl}/allergies`
      );
      return response.data.data || null;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * تحديث ملف الحساسية
   */
  async updateAllergyProfile(profile: Partial<AllergyProfile>): Promise<AllergyProfile> {
    const response = await apiClient.post<ApiResponse<AllergyProfile>>(
      `${this.baseUrl}/allergies`,
      profile
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'فشل تحديث ملف الحساسية');
    }
    return response.data.data;
  }

  /**
   * الحصول على الحساسيات النشطة
   */
  async getActiveAllergies(): Promise<AllergenType[]> {
    const response = await apiClient.get<ApiResponse<AllergenType[]>>(
      `${this.baseUrl}/allergies/active`
    );
    return response.data.data || [];
  }

  /**
   * الحصول على مسببات الحساسية المتاحة
   */
  async getAvailableAllergens(): Promise<AllergenType[]> {
    const response = await apiClient.get<ApiResponse<AllergenType[]>>(
      `${this.baseUrl}/allergens`
    );
    return response.data.data || [];
  }

  /**
   * فحص عنصر للحساسية
   */
  async checkItemForAllergies(menuItemId: string): Promise<{
    safe: boolean;
    matchedAllergies: string[];
    warnings: string[];
  }> {
    const response = await apiClient.get<ApiResponse<{
      safe: boolean;
      matchedAllergies: string[];
      warnings: string[];
    }>>(`${this.baseUrl}/check-item/${menuItemId}`);
    return response.data.data || { safe: true, matchedAllergies: [], warnings: [] };
  }

  /**
   * ==========================================
   * Menu Filtering
   * ==========================================
   */

  /**
   * فلترة عناصر القائمة
   */
  async filterMenuItems(menuItems: any[]): Promise<MenuItemAnalysis[]> {
    const response = await apiClient.post<ApiResponse<MenuItemAnalysis[]>>(
      `${this.baseUrl}/filter-menu`,
      { menuItems }
    );
    return response.data.data || [];
  }

  /**
   * البحث عن عناصر متوافقة
   */
  async findCompatibleItems(
    restaurantId: string,
    diets?: string[],
    allergens?: string[]
  ): Promise<string[]> {
    const params = new URLSearchParams();
    if (diets?.length) params.append('diets', diets.join(','));
    if (allergens?.length) params.append('allergens', allergens.join(','));

    const response = await apiClient.get<ApiResponse<string[]>>(
      `${this.baseUrl}/compatible-items/${restaurantId}?${params.toString()}`
    );
    return response.data.data || [];
  }

  /**
   * ==========================================
   * Food Labels
   * ==========================================
   */

  /**
   * الحصول على تسميات عنصر
   */
  async getFoodLabels(menuItemId: string): Promise<FoodLabel[]> {
    const response = await apiClient.get<ApiResponse<FoodLabel[]>>(
      `${this.baseUrl}/labels/${menuItemId}/active`
    );
    return response.data.data || [];
  }

  /**
   * الحصول على معلومات الحساسية لعنصر
   */
  async getAllergenInfo(menuItemId: string): Promise<AllergenInfo | null> {
    try {
      const response = await apiClient.get<ApiResponse<AllergenInfo>>(
        `${this.baseUrl}/allergen-info/${menuItemId}`
      );
      return response.data.data || null;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * الحصول على أنواع التسميات المتاحة
   */
  async getAvailableLabelTypes(): Promise<{
    type: string;
    icon: string;
    color: string;
  }[]> {
    const response = await apiClient.get<ApiResponse<{
      type: string;
      icon: string;
      color: string;
    }[]>>(`${this.baseUrl}/label-types`);
    return response.data.data || [];
  }

  /**
   * ==========================================
   * Custom Order Messages
   * ==========================================
   */

  /**
   * إنشاء رسائل تلقائية للطلب
   */
  async createAutoMessages(orderId: string, restaurantId: string): Promise<any[]> {
    const response = await apiClient.post<ApiResponse<any[]>>(
      `${this.baseUrl}/messages/auto/${orderId}`,
      { restaurantId }
    );
    return response.data.data || [];
  }

  /**
   * الحصول على رسائل طلب
   */
  async getOrderMessages(orderId: string): Promise<any[]> {
    const response = await apiClient.get<ApiResponse<any[]>>(
      `${this.baseUrl}/messages/order/${orderId}`
    );
    return response.data.data || [];
  }

  /**
   * ==========================================
   * Helper Methods
   * ==========================================
   */

  /**
   * تحليل عناصر السلة للتوافق
   */
  async analyzeCartItems(cartItems: { menuItemId: string; quantity: number }[]): Promise<{
    allCompatible: boolean;
    analyses: MenuItemAnalysis[];
    warnings: string[];
  }> {
    const menuItems = cartItems.map((item) => ({
      id: item.menuItemId,
      quantity: item.quantity,
    }));

    const analyses = await this.filterMenuItems(menuItems);

    const allCompatible = analyses.every((a) => a.isCompatible);
    const warnings = analyses
      .filter((a) => !a.isCompatible)
      .flatMap((a) => [...a.dietWarnings, ...a.allergyWarnings]);

    return {
      allCompatible,
      analyses,
      warnings: [...new Set(warnings)],
    };
  }

  /**
   * التحقق من توافق طلب قبل الإرسال
   */
  async validateOrderForDiet(orderItems: any[]): Promise<{
    valid: boolean;
    blockers: string[];
    warnings: string[];
  }> {
    const profile = await this.getDietaryProfile();
    const allergyProfile = await this.getAllergyProfile();

    if (!profile && !allergyProfile) {
      return { valid: true, blockers: [], warnings: [] };
    }

    const analyses = await this.filterMenuItems(orderItems);

    const blockers: string[] = [];
    const warnings: string[] = [];

    for (const analysis of analyses) {
      if (!analysis.isCompatible) {
        if (profile?.strictMode) {
          blockers.push(...analysis.dietWarnings, ...analysis.allergyWarnings);
        } else {
          warnings.push(...analysis.dietWarnings, ...analysis.allergyWarnings);
        }
      }
    }

    return {
      valid: blockers.length === 0,
      blockers: [...new Set(blockers)],
      warnings: [...new Set(warnings)],
    };
  }
}

export default new DietaryService();

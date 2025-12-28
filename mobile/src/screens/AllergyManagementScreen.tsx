/**
 * شاشة إدارة الحساسيات
 * Allergy Management Screen - Manage user allergies for safe food ordering
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type AllergyNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AllergyManagement'>;

// مستويات شدة الحساسية
type SeverityLevel = 'MILD' | 'MODERATE' | 'SEVERE' | 'CRITICAL';

// معلومات مستوى الشدة
interface SeverityInfo {
  level: SeverityLevel;
  label: string;
  color: string;
  description: string;
}

const SEVERITY_LEVELS: SeverityInfo[] = [
  {
    level: 'MILD',
    label: 'خفيفة',
    color: '#FFC107',
    description: 'أعراض طفيفة مثل الحكة',
  },
  {
    level: 'MODERATE',
    label: 'متوسطة',
    color: '#FF9800',
    description: 'أعراض ملحوظة تحتاج انتباه',
  },
  {
    level: 'SEVERE',
    label: 'شديدة',
    color: '#F44336',
    description: 'أعراض خطيرة تحتاج علاج',
  },
  {
    level: 'CRITICAL',
    label: 'حرجة',
    color: '#B71C1C',
    description: 'قد تسبب صدمة تحسسية',
  },
];

// أنواع مسببات الحساسية الشائعة
interface AllergenType {
  key: string;
  label: string;
  labelEn: string;
  icon: string;
  examples: string;
}

const COMMON_ALLERGENS: AllergenType[] = [
  {
    key: 'hasPeanutAllergy',
    label: 'الفول السوداني',
    labelEn: 'Peanuts',
    icon: '🥜',
    examples: 'زبدة الفول السوداني، حلويات بالفول السوداني',
  },
  {
    key: 'hasTreeNutAllergy',
    label: 'المكسرات',
    labelEn: 'Tree Nuts',
    icon: '🌰',
    examples: 'اللوز، الجوز، الكاجو، البندق',
  },
  {
    key: 'hasMilkAllergy',
    label: 'الحليب ومشتقاته',
    labelEn: 'Milk & Dairy',
    icon: '🥛',
    examples: 'الجبن، الزبدة، الكريمة، الآيس كريم',
  },
  {
    key: 'hasEggAllergy',
    label: 'البيض',
    labelEn: 'Eggs',
    icon: '🥚',
    examples: 'المخبوزات، المايونيز، الباستا',
  },
  {
    key: 'hasWheatAllergy',
    label: 'القمح (الجلوتين)',
    labelEn: 'Wheat/Gluten',
    icon: '🌾',
    examples: 'الخبز، المعكرونة، البسكويت',
  },
  {
    key: 'hasSoyAllergy',
    label: 'الصويا',
    labelEn: 'Soy',
    icon: '🫘',
    examples: 'صلصة الصويا، التوفو، حليب الصويا',
  },
  {
    key: 'hasFishAllergy',
    label: 'الأسماك',
    labelEn: 'Fish',
    icon: '🐟',
    examples: 'السمك، صلصة السمك، زيت السمك',
  },
  {
    key: 'hasShellfishAllergy',
    label: 'المحار والقشريات',
    labelEn: 'Shellfish',
    icon: '🦐',
    examples: 'الروبيان، السلطعون، المحار',
  },
  {
    key: 'hasSesameAllergy',
    label: 'السمسم',
    labelEn: 'Sesame',
    icon: '🌱',
    examples: 'الطحينة، زيت السمسم، الفلافل',
  },
];

// ملف الحساسية
interface AllergyProfile {
  hasPeanutAllergy: boolean;
  hasTreeNutAllergy: boolean;
  hasMilkAllergy: boolean;
  hasEggAllergy: boolean;
  hasWheatAllergy: boolean;
  hasSoyAllergy: boolean;
  hasFishAllergy: boolean;
  hasShellfishAllergy: boolean;
  hasSesameAllergy: boolean;
  severityLevel: SeverityLevel;
  otherAllergies: string[];
  intolerances: string[];
  emergencyContact: string;
  emergencyPhone: string;
  requireConfirmation: boolean;
  notifyRestaurant: boolean;
}

const AllergyManagementScreen: React.FC = () => {
  const navigation = useNavigation<AllergyNavigationProp>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSeverityModal, setShowSeverityModal] = useState(false);
  const [profile, setProfile] = useState<AllergyProfile>({
    hasPeanutAllergy: false,
    hasTreeNutAllergy: false,
    hasMilkAllergy: false,
    hasEggAllergy: false,
    hasWheatAllergy: false,
    hasSoyAllergy: false,
    hasFishAllergy: false,
    hasShellfishAllergy: false,
    hasSesameAllergy: false,
    severityLevel: 'MODERATE',
    otherAllergies: [],
    intolerances: [],
    emergencyContact: '',
    emergencyPhone: '',
    requireConfirmation: true,
    notifyRestaurant: true,
  });
  const [newOtherAllergy, setNewOtherAllergy] = useState('');
  const [newIntolerance, setNewIntolerance] = useState('');

  useEffect(() => {
    loadAllergyProfile();
  }, []);

  const loadAllergyProfile = async () => {
    try {
      setLoading(true);
      // TODO: استبدل بـ API call حقيقي
      // const response = await apiService.dietary.getAllergyProfile();
      // if (response.data) setProfile(response.data);
    } catch (error: any) {
      console.error('Error loading allergy profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveAllergyProfile = async () => {
    try {
      setSaving(true);
      // TODO: استبدل بـ API call حقيقي
      // await apiService.dietary.updateAllergyProfile(profile);
      Alert.alert('تم الحفظ', 'تم حفظ معلومات الحساسية بنجاح');
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'فشل حفظ المعلومات');
    } finally {
      setSaving(false);
    }
  };

  const toggleAllergen = (key: string) => {
    setProfile((prev) => ({
      ...prev,
      [key]: !prev[key as keyof AllergyProfile],
    }));
  };

  const addOtherAllergy = () => {
    if (newOtherAllergy.trim()) {
      setProfile((prev) => ({
        ...prev,
        otherAllergies: [...prev.otherAllergies, newOtherAllergy.trim()],
      }));
      setNewOtherAllergy('');
    }
  };

  const removeOtherAllergy = (index: number) => {
    setProfile((prev) => ({
      ...prev,
      otherAllergies: prev.otherAllergies.filter((_, i) => i !== index),
    }));
  };

  const addIntolerance = () => {
    if (newIntolerance.trim()) {
      setProfile((prev) => ({
        ...prev,
        intolerances: [...prev.intolerances, newIntolerance.trim()],
      }));
      setNewIntolerance('');
    }
  };

  const removeIntolerance = (index: number) => {
    setProfile((prev) => ({
      ...prev,
      intolerances: prev.intolerances.filter((_, i) => i !== index),
    }));
  };

  const selectSeverity = (level: SeverityLevel) => {
    setProfile((prev) => ({ ...prev, severityLevel: level }));
    setShowSeverityModal(false);
  };

  const getActiveAllergiesCount = () => {
    let count = 0;
    COMMON_ALLERGENS.forEach((allergen) => {
      if (profile[allergen.key as keyof AllergyProfile]) count++;
    });
    return count + profile.otherAllergies.length;
  };

  const currentSeverity = SEVERITY_LEVELS.find((s) => s.level === profile.severityLevel);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F44336" />
          <Text style={styles.loadingText}>جاري التحميل...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>إدارة الحساسيات</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Warning Banner */}
        <View style={styles.warningBanner}>
          <Ionicons name="warning" size={24} color="#F44336" />
          <View style={styles.warningTextContainer}>
            <Text style={styles.warningTitle}>معلومات مهمة للسلامة</Text>
            <Text style={styles.warningText}>
              تأكد من إدخال جميع حساسياتك بدقة. سنقوم بتنبيهك وإبلاغ المطعم تلقائياً.
            </Text>
          </View>
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{getActiveAllergiesCount()}</Text>
            <Text style={styles.summaryLabel}>حساسية مسجلة</Text>
          </View>
          <View style={styles.summaryDivider} />
          <TouchableOpacity
            style={styles.summaryItem}
            onPress={() => setShowSeverityModal(true)}
          >
            <View
              style={[
                styles.severityIndicator,
                { backgroundColor: currentSeverity?.color },
              ]}
            />
            <Text style={styles.summaryLabel}>مستوى الشدة</Text>
            <Text style={[styles.severityText, { color: currentSeverity?.color }]}>
              {currentSeverity?.label}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Common Allergens Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>مسببات الحساسية الشائعة</Text>
          <Text style={styles.sectionSubtitle}>
            اختر جميع المواد التي لديك حساسية منها
          </Text>

          {COMMON_ALLERGENS.map((allergen) => (
            <TouchableOpacity
              key={allergen.key}
              style={[
                styles.allergenItem,
                profile[allergen.key as keyof AllergyProfile] && styles.allergenItemActive,
              ]}
              onPress={() => toggleAllergen(allergen.key)}
            >
              <Text style={styles.allergenIcon}>{allergen.icon}</Text>
              <View style={styles.allergenInfo}>
                <Text
                  style={[
                    styles.allergenLabel,
                    profile[allergen.key as keyof AllergyProfile] && styles.allergenLabelActive,
                  ]}
                >
                  {allergen.label}
                </Text>
                <Text style={styles.allergenExamples}>{allergen.examples}</Text>
              </View>
              <View
                style={[
                  styles.checkbox,
                  profile[allergen.key as keyof AllergyProfile] && styles.checkboxActive,
                ]}
              >
                {profile[allergen.key as keyof AllergyProfile] && (
                  <Ionicons name="checkmark" size={18} color="#fff" />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Other Allergies Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>حساسيات أخرى</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              placeholder="أضف حساسية أخرى..."
              value={newOtherAllergy}
              onChangeText={setNewOtherAllergy}
              onSubmitEditing={addOtherAllergy}
            />
            <TouchableOpacity style={styles.addButton} onPress={addOtherAllergy}>
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.tagsList}>
            {profile.otherAllergies.map((allergy, index) => (
              <View key={index} style={styles.allergyTag}>
                <Ionicons name="alert-circle" size={16} color="#F44336" />
                <Text style={styles.allergyTagText}>{allergy}</Text>
                <TouchableOpacity onPress={() => removeOtherAllergy(index)}>
                  <Ionicons name="close" size={18} color="#F44336" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Intolerances Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>عدم تحمل الطعام</Text>
          <Text style={styles.sectionSubtitle}>
            أطعمة تسبب انزعاج بدون أن تكون حساسية حقيقية
          </Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              placeholder="مثال: اللاكتوز، الكافيين..."
              value={newIntolerance}
              onChangeText={setNewIntolerance}
              onSubmitEditing={addIntolerance}
            />
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: '#FF9800' }]}
              onPress={addIntolerance}
            >
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.tagsList}>
            {profile.intolerances.map((intolerance, index) => (
              <View key={index} style={styles.intoleranceTag}>
                <Ionicons name="warning" size={16} color="#FF9800" />
                <Text style={styles.intoleranceTagText}>{intolerance}</Text>
                <TouchableOpacity onPress={() => removeIntolerance(index)}>
                  <Ionicons name="close" size={18} color="#FF9800" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Emergency Contact Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>جهة اتصال الطوارئ</Text>
          <TextInput
            style={styles.emergencyInput}
            placeholder="اسم جهة الاتصال"
            value={profile.emergencyContact}
            onChangeText={(text) =>
              setProfile((prev) => ({ ...prev, emergencyContact: text }))
            }
          />
          <TextInput
            style={styles.emergencyInput}
            placeholder="رقم الهاتف"
            value={profile.emergencyPhone}
            onChangeText={(text) =>
              setProfile((prev) => ({ ...prev, emergencyPhone: text }))
            }
            keyboardType="phone-pad"
          />
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>إعدادات السلامة</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="checkbox-outline" size={24} color="#4CAF50" />
              <View>
                <Text style={styles.settingTitle}>تأكيد قبل الطلب</Text>
                <Text style={styles.settingDescription}>
                  طلب تأكيد عند وجود مسببات حساسية محتملة
                </Text>
              </View>
            </View>
            <Switch
              value={profile.requireConfirmation}
              onValueChange={(value) =>
                setProfile((prev) => ({ ...prev, requireConfirmation: value }))
              }
              trackColor={{ false: '#767577', true: '#4CAF50' }}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="notifications" size={24} color="#2196F3" />
              <View>
                <Text style={styles.settingTitle}>إبلاغ المطعم تلقائياً</Text>
                <Text style={styles.settingDescription}>
                  إرسال تنبيه للمطعم بحساسياتك مع كل طلب
                </Text>
              </View>
            </View>
            <Switch
              value={profile.notifyRestaurant}
              onValueChange={(value) =>
                setProfile((prev) => ({ ...prev, notifyRestaurant: value }))
              }
              trackColor={{ false: '#767577', true: '#2196F3' }}
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={saveAllergyProfile}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="shield-checkmark" size={24} color="#fff" />
              <Text style={styles.saveButtonText}>حفظ معلومات السلامة</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Severity Modal */}
      <Modal
        visible={showSeverityModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSeverityModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>مستوى شدة الحساسية</Text>
            <Text style={styles.modalSubtitle}>
              اختر المستوى الذي يصف حالتك بشكل عام
            </Text>

            {SEVERITY_LEVELS.map((severity) => (
              <TouchableOpacity
                key={severity.level}
                style={[
                  styles.severityOption,
                  profile.severityLevel === severity.level && {
                    borderColor: severity.color,
                    backgroundColor: `${severity.color}10`,
                  },
                ]}
                onPress={() => selectSeverity(severity.level)}
              >
                <View
                  style={[styles.severityDot, { backgroundColor: severity.color }]}
                />
                <View style={styles.severityOptionInfo}>
                  <Text
                    style={[
                      styles.severityOptionLabel,
                      profile.severityLevel === severity.level && {
                        color: severity.color,
                      },
                    ]}
                  >
                    {severity.label}
                  </Text>
                  <Text style={styles.severityOptionDesc}>{severity.description}</Text>
                </View>
                {profile.severityLevel === severity.level && (
                  <Ionicons name="checkmark-circle" size={24} color={severity.color} />
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowSeverityModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#FFEBEE',
    gap: 12,
  },
  warningTextContainer: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#C62828',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 13,
    color: '#C62828',
    lineHeight: 20,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginTop: 12,
    padding: 20,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F44336',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    height: 50,
    backgroundColor: '#e0e0e0',
  },
  severityIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginBottom: 4,
  },
  severityText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
  },
  allergenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  allergenItemActive: {
    borderColor: '#F44336',
    backgroundColor: '#FFEBEE',
  },
  allergenIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  allergenInfo: {
    flex: 1,
  },
  allergenLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  allergenLabelActive: {
    color: '#C62828',
  },
  allergenExamples: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: '#F44336',
    borderColor: '#F44336',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  textInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: '#f9f9f9',
  },
  addButton: {
    width: 44,
    height: 44,
    backgroundColor: '#F44336',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  allergyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#FFCDD2',
    gap: 6,
  },
  allergyTagText: {
    fontSize: 13,
    color: '#C62828',
  },
  intoleranceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: '#FFE0B2',
    gap: 6,
  },
  intoleranceTagText: {
    fontSize: 13,
    color: '#E65100',
  },
  emergencyInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: '#f9f9f9',
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  settingDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  saveButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 16,
    padding: 16,
    backgroundColor: '#F44336',
    borderRadius: 12,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  severityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    marginBottom: 12,
  },
  severityDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  severityOptionInfo: {
    flex: 1,
  },
  severityOptionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  severityOptionDesc: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  modalCloseButton: {
    marginTop: 8,
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
});

export default AllergyManagementScreen;

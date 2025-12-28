/**
 * شاشة لوحة التغذية الشخصية
 * عرض السعرات والمغذيات اليومية مع الأهداف
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../services/apiService';

const { width } = Dimensions.get('window');

interface NutritionData {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  totalSugar: number;
  totalSodium: number;
  mealsCount: number;
}

interface NutritionGoal {
  id: string;
  goalType: string;
  targetCalories?: number;
  targetProtein?: number;
  targetCarbs?: number;
  targetFat?: number;
  targetFiber?: number;
  currentStreak: number;
  longestStreak: number;
  successDays: number;
  totalDays: number;
}

export default function NutritionDashboardScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [nutrition, setNutrition] = useState<NutritionData | null>(null);
  const [goal, setGoal] = useState<NutritionGoal | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTodayNutrition();
  }, []);

  const loadTodayNutrition = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/nutrition/today');
      
      if (response.data.success) {
        setNutrition(response.data.data.nutrition);
        setGoal(response.data.data.goals);
      }
    } catch (error) {
      Alert.alert('خطأ', error.message || 'فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTodayNutrition();
    setRefreshing(false);
  };

  const calculateProgress = (current: number, target?: number) => {
    if (!target || target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 90) return '#4CAF50'; // أخضر
    if (progress >= 70) return '#FFC107'; // أصفر
    return '#FF6B35'; // برتقالي
  };

  const renderMacroCard = (
    icon: string,
    label: string,
    current: number,
    target?: number,
    unit: string = 'g'
  ) => {
    const progress = calculateProgress(current, target);
    const color = getProgressColor(progress);

    return (
      <View style={styles.macroCard}>
        <View style={styles.macroHeader}>
          <Ionicons name={icon as any} size={24} color={color} />
          <Text style={styles.macroLabel}>{label}</Text>
        </View>
        
        <View style={styles.macroValues}>
          <Text style={[styles.currentValue, { color }]}>
            {Math.round(current)}
          </Text>
          {target && (
            <Text style={styles.targetValue}>/ {target} {unit}</Text>
          )}
        </View>

        {target && (
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${progress}%`, backgroundColor: color },
                ]}
              />
            </View>
            <Text style={styles.progressText}>{Math.round(progress)}%</Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>جاري التحميل...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#FF6B35', '#FF8F50']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>لوحة التغذية</Text>
          <TouchableOpacity onPress={onRefresh}>
            <Ionicons name="refresh" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
      >
        {/* إحصائيات اليوم */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 إحصائيات اليوم</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="flame" size={32} color="#FF6B35" />
              <Text style={styles.statValue}>
                {nutrition?.totalCalories || 0}
              </Text>
              <Text style={styles.statLabel}>سعرة حرارية</Text>
            </View>

            <View style={styles.statCard}>
              <Ionicons name="restaurant" size={32} color="#4CAF50" />
              <Text style={styles.statValue}>{nutrition?.mealsCount || 0}</Text>
              <Text style={styles.statLabel}>وجبات</Text>
            </View>
          </View>
        </View>

        {/* الهدف الحالي */}
        {goal && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎯 الهدف الحالي</Text>
            <View style={styles.goalCard}>
              <View style={styles.goalHeader}>
                <Text style={styles.goalType}>{getGoalTypeLabel(goal.goalType)}</Text>
                <View style={styles.streakBadge}>
                  <Ionicons name="flame" size={16} color="#FF6B35" />
                  <Text style={styles.streakText}>{goal.currentStreak} يوم</Text>
                </View>
              </View>
              
              <View style={styles.goalStats}>
                <View style={styles.goalStat}>
                  <Text style={styles.goalStatValue}>{goal.successDays}</Text>
                  <Text style={styles.goalStatLabel}>أيام ناجحة</Text>
                </View>
                <View style={styles.goalStat}>
                  <Text style={styles.goalStatValue}>{goal.longestStreak}</Text>
                  <Text style={styles.goalStatLabel}>أطول سلسلة</Text>
                </View>
                <View style={styles.goalStat}>
                  <Text style={styles.goalStatValue}>
                    {goal.totalDays > 0
                      ? Math.round((goal.successDays / goal.totalDays) * 100)
                      : 0}
                    %
                  </Text>
                  <Text style={styles.goalStatLabel}>نسبة النجاح</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* المغذيات الكبرى (Macronutrients) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🥗 المغذيات الكبرى</Text>
            <TouchableOpacity onPress={() => navigation.navigate('NutritionReport')}>
              <Text style={styles.viewAllText}>عرض التقرير</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.macrosGrid}>
            {renderMacroCard(
              'nutrition',
              'السعرات',
              nutrition?.totalCalories || 0,
              goal?.targetCalories,
              'kcal'
            )}
            {renderMacroCard(
              'barbell',
              'البروتين',
              nutrition?.totalProtein || 0,
              goal?.targetProtein,
              'g'
            )}
            {renderMacroCard(
              'leaf',
              'الكربوهيدرات',
              nutrition?.totalCarbs || 0,
              goal?.targetCarbs,
              'g'
            )}
            {renderMacroCard(
              'water',
              'الدهون',
              nutrition?.totalFat || 0,
              goal?.targetFat,
              'g'
            )}
          </View>
        </View>

        {/* أزرار سريعة */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ إجراءات سريعة</Text>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('NutritionReport')}
          >
            <Ionicons name="document-text" size={24} color="#FF6B35" />
            <Text style={styles.actionButtonText}>التقارير الأسبوعية</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Challenges')}
          >
            <Ionicons name="trophy" size={24} color="#FFD700" />
            <Text style={styles.actionButtonText}>التحديات الجماعية</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              Alert.alert('قريباً', 'ميزة تعيين الأهداف قيد التطوير');
            }}
          >
            <Ionicons name="create" size={24} color="#4CAF50" />
            <Text style={styles.actionButtonText}>تعيين أهداف جديدة</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* نصائح صحية */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 نصائح صحية</Text>
          <View style={styles.tipCard}>
            <Ionicons name="bulb" size={24} color="#FFC107" />
            <Text style={styles.tipText}>
              {getTipOfTheDay(nutrition)}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getGoalTypeLabel(goalType: string): string {
  const labels: Record<string, string> = {
    WEIGHT_LOSS: 'خسارة الوزن',
    WEIGHT_GAIN: 'زيادة الوزن',
    MUSCLE_BUILD: 'بناء العضلات',
    MAINTENANCE: 'الحفاظ على الوزن',
    HEALTHY_EATING: 'أكل صحي',
    CUSTOM: 'هدف مخصص',
  };
  return labels[goalType] || goalType;
}

function getTipOfTheDay(nutrition: NutritionData | null): string {
  if (!nutrition) {
    return 'ابدأ يومك بوجبة صحية متوازنة!';
  }

  if (nutrition.totalProtein < 30) {
    return 'حاول زيادة تناول البروتين! أضف البيض أو الدجاج لوجبتك';
  }

  if (nutrition.totalCalories < 500) {
    return 'تذكر تناول وجبة مغذية! جسمك يحتاج الطاقة';
  }

  if (nutrition.mealsCount === 0) {
    return 'لم تسجل أي وجبات اليوم. اطلب وجبة صحية الآن!';
  }

  return 'أحسنت! استمر على نظامك الغذائي الصحي 💪';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  goalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE0D6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  streakText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginLeft: 4,
  },
  goalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  goalStat: {
    alignItems: 'center',
  },
  goalStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  goalStatLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  macrosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  macroCard: {
    width: (width - 44) / 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  macroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  macroLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  macroValues: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  currentValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  targetValue: {
    fontSize: 14,
    color: '#999',
    marginLeft: 4,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
    width: 35,
    textAlign: 'right',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginLeft: 12,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
    lineHeight: 20,
  },
});

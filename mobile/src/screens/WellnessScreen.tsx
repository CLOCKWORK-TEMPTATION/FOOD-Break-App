// WellnessScreen.tsx
// شاشة أهداف الرفاهية والصحة النفسية

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../services/apiService';

const GOAL_TYPES = [
  {
    value: 'STRESS_REDUCTION',
    label: 'تقليل الضغط',
    icon: 'fitness',
    color: '#4CAF50',
  },
  {
    value: 'ENERGY_IMPROVEMENT',
    label: 'تحسين الطاقة',
    icon: 'flash',
    color: '#FF9800',
  },
  {
    value: 'MOOD_STABILITY',
    label: 'استقرار المزاج',
    icon: 'heart',
    color: '#E91E63',
  },
  {
    value: 'BETTER_SLEEP',
    label: 'نوم أفضل',
    icon: 'moon',
    color: '#673AB7',
  },
  {
    value: 'WORK_LIFE_BALANCE',
    label: 'توازن العمل والحياة',
    icon: 'balance',
    color: '#00BCD4',
  },
  {
    value: 'MINDFUL_EATING',
    label: 'أكل واعٍ',
    icon: 'restaurant',
    color: '#FF6B35',
  },
  {
    value: 'EMOTIONAL_AWARENESS',
    label: 'وعي عاطفي',
    icon: 'bulb',
    color: '#FFC107',
  },
];

export default function WellnessScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [goals, setGoals] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showInsightModal, setShowInsightModal] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<any>(null);

  // بيانات الهدف الجديد
  const [goalType, setGoalType] = useState('STRESS_REDUCTION');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [duration, setDuration] = useState('30');

  useEffect(() => {
    loadWellnessData();
  }, []);

  const loadWellnessData = async () => {
    try {
      setLoading(true);

      const [goalsRes, insightsRes] = await Promise.all([
        apiService.get('/emotion/wellness/goals'),
        apiService.get('/emotion/insights?limit=4'),
      ]);

      setGoals(goalsRes.data || []);
      setInsights(insightsRes.data || []);
    } catch (error: any) {
      console.error('Error loading wellness data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadWellnessData();
  };

  const handleCreateGoal = async () => {
    if (!title || !targetValue) {
      Alert.alert('خطأ', 'الرجاء إدخال عنوان الهدف والقيمة المستهدفة');
      return;
    }

    try {
      const goalData = {
        goalType,
        title,
        description,
        targetMetric: getTargetMetric(goalType),
        targetValue: parseFloat(targetValue),
        unit: getUnit(goalType),
        duration: parseInt(duration),
      };

      const response = await apiService.post('/emotion/wellness/goals', goalData);

      Alert.alert('نجح!', response.message || 'تم إنشاء هدفك بنجاح');
      
      setShowGoalModal(false);
      resetGoalForm();
      loadWellnessData();
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'حدث خطأ أثناء إنشاء الهدف');
    }
  };

  const handleGenerateInsight = async () => {
    try {
      setLoading(true);
      const response = await apiService.post('/emotion/insights/weekly');

      if (response.data) {
        Alert.alert('نجح!', response.message || 'تم توليد رؤيتك الأسبوعية');
        loadWellnessData();
      } else {
        Alert.alert('تنبيه', response.message || 'لا توجد بيانات كافية لتوليد رؤى');
      }
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'حدث خطأ أثناء توليد الرؤية');
    } finally {
      setLoading(false);
    }
  };

  const getTargetMetric = (type: string) => {
    const metrics: any = {
      STRESS_REDUCTION: 'avgStress',
      ENERGY_IMPROVEMENT: 'avgEnergy',
      MOOD_STABILITY: 'moodStability',
      BETTER_SLEEP: 'sleepQuality',
      WORK_LIFE_BALANCE: 'workLifeBalance',
      MINDFUL_EATING: 'mindfulMeals',
      EMOTIONAL_AWARENESS: 'emotionalAwareness',
    };
    return metrics[type] || 'custom';
  };

  const getUnit = (type: string) => {
    if (type === 'STRESS_REDUCTION' || type === 'ENERGY_IMPROVEMENT') {
      return 'points';
    }
    if (type === 'MINDFUL_EATING') {
      return 'meals';
    }
    return 'days';
  };

  const resetGoalForm = () => {
    setGoalType('STRESS_REDUCTION');
    setTitle('');
    setDescription('');
    setTargetValue('');
    setDuration('30');
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FFC107';
    if (score >= 40) return '#FF9800';
    return '#F44336';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'ممتاز';
    if (score >= 60) return 'جيد';
    if (score >= 40) return 'متوسط';
    return 'يحتاج تحسين';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6A1B9A" />
        <Text style={styles.loadingText}>جاري التحميل...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#4CAF50', '#66BB6A']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-forward" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>الرفاهية والصحة النفسية 🌱</Text>
        <Text style={styles.headerSubtitle}>تتبع أهدافك ورؤيتك الأسبوعية</Text>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* أهداف الرفاهية */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>أهدافك النشطة</Text>
            <TouchableOpacity onPress={() => setShowGoalModal(true)}>
              <Ionicons name="add-circle" size={28} color="#4CAF50" />
            </TouchableOpacity>
          </View>

          {goals.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="flag-outline" size={60} color="#CCC" />
              <Text style={styles.emptyText}>لا توجد أهداف بعد</Text>
              <TouchableOpacity
                style={styles.createGoalButton}
                onPress={() => setShowGoalModal(true)}
              >
                <Text style={styles.createGoalText}>أنشئ هدفك الأول</Text>
              </TouchableOpacity>
            </View>
          ) : (
            goals.map((goal) => {
              const goalTypeInfo = GOAL_TYPES.find((g) => g.value === goal.goalType);
              return (
                <View key={goal.id} style={styles.goalCard}>
                  <View style={styles.goalHeader}>
                    <View style={styles.goalTitleContainer}>
                      <Ionicons
                        name={goalTypeInfo?.icon as any}
                        size={24}
                        color={goalTypeInfo?.color || '#333'}
                      />
                      <Text style={styles.goalTitle}>{goal.title}</Text>
                    </View>
                    <View
                      style={[
                        styles.goalTypeBadge,
                        { backgroundColor: goalTypeInfo?.color + '20' || '#F0F0F0' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.goalTypeText,
                          { color: goalTypeInfo?.color || '#333' },
                        ]}
                      >
                        {goalTypeInfo?.label}
                      </Text>
                    </View>
                  </View>

                  {goal.description && (
                    <Text style={styles.goalDescription}>{goal.description}</Text>
                  )}

                  {/* شريط التقدم */}
                  <View style={styles.progressContainer}>
                    <View style={styles.progressInfo}>
                      <Text style={styles.progressText}>
                        {goal.currentValue.toFixed(1)} / {goal.targetValue} {goal.unit}
                      </Text>
                      <Text style={styles.progressPercent}>{goal.progress.toFixed(0)}%</Text>
                    </View>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${Math.min(goal.progress, 100)}%`,
                            backgroundColor: goalTypeInfo?.color || '#4CAF50',
                          },
                        ]}
                      />
                    </View>
                  </View>

                  {/* معلومات إضافية */}
                  <View style={styles.goalFooter}>
                    <View style={styles.goalStat}>
                      <Ionicons name="calendar-outline" size={16} color="#999" />
                      <Text style={styles.goalStatText}>
                        {Math.ceil(
                          (new Date(goal.endDate).getTime() - Date.now()) /
                            (1000 * 60 * 60 * 24)
                        )}{' '}
                        يوم متبقي
                      </Text>
                    </View>
                    <View style={styles.goalStat}>
                      <Ionicons name="checkmark-done-outline" size={16} color="#999" />
                      <Text style={styles.goalStatText}>{goal.checkIns} مراجعة</Text>
                    </View>
                  </View>

                  {goal.isCompleted && (
                    <View style={styles.completedBadge}>
                      <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                      <Text style={styles.completedText}>مكتمل! 🎉</Text>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* الرؤى الأسبوعية */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>رؤيتك الأسبوعية</Text>
            <TouchableOpacity onPress={handleGenerateInsight}>
              <Ionicons name="sparkles" size={28} color="#FF6B35" />
            </TouchableOpacity>
          </View>

          {insights.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="analytics-outline" size={60} color="#CCC" />
              <Text style={styles.emptyText}>لا توجد رؤى بعد</Text>
              <TouchableOpacity
                style={styles.createGoalButton}
                onPress={handleGenerateInsight}
              >
                <Text style={styles.createGoalText}>توليد رؤية جديدة</Text>
              </TouchableOpacity>
            </View>
          ) : (
            insights.map((insight, index) => (
              <TouchableOpacity
                key={insight.id}
                style={styles.insightCard}
                onPress={() => {
                  setSelectedInsight(insight);
                  setShowInsightModal(true);
                }}
              >
                <View style={styles.insightHeader}>
                  <View
                    style={[
                      styles.scoreCircle,
                      { borderColor: getScoreColor(insight.overallScore) },
                    ]}
                  >
                    <Text
                      style={[
                        styles.scoreValue,
                        { color: getScoreColor(insight.overallScore) },
                      ]}
                    >
                      {insight.overallScore.toFixed(0)}
                    </Text>
                  </View>

                  <View style={styles.insightInfo}>
                    <Text style={styles.insightPeriod}>
                      {new Date(insight.periodStart).toLocaleDateString('ar')} -{' '}
                      {new Date(insight.periodEnd).toLocaleDateString('ar')}
                    </Text>
                    <Text
                      style={[
                        styles.insightLabel,
                        { color: getScoreColor(insight.overallScore) },
                      ]}
                    >
                      {getScoreLabel(insight.overallScore)}
                    </Text>
                  </View>

                  <Ionicons name="chevron-back" size={24} color="#CCC" />
                </View>

                <View style={styles.insightPreview}>
                  {insight.strengths && insight.strengths.length > 0 && (
                    <Text style={styles.previewText}>
                      ✅ {insight.strengths[0]}
                    </Text>
                  )}
                  {insight.recommendations && insight.recommendations.length > 0 && (
                    <Text style={styles.previewText}>
                      💡 {insight.recommendations[0]}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* نصائح */}
        <View style={styles.tipCard}>
          <Ionicons name="information-circle" size={24} color="#2196F3" />
          <Text style={styles.tipText}>
            💙 أهداف الرفاهية تساعدك على تحسين صحتك النفسية بشكل تدريجي ومستدام
          </Text>
        </View>
      </ScrollView>

      {/* Modal إنشاء هدف */}
      <Modal
        visible={showGoalModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowGoalModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowGoalModal(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>إنشاء هدف جديد</Text>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>نوع الهدف</Text>
              <View style={styles.goalTypesGrid}>
                {GOAL_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.goalTypeCard,
                      goalType === type.value && {
                        borderColor: type.color,
                        borderWidth: 2,
                        backgroundColor: type.color + '10',
                      },
                    ]}
                    onPress={() => setGoalType(type.value)}
                  >
                    <Ionicons name={type.icon as any} size={24} color={type.color} />
                    <Text style={styles.goalTypeLabel}>{type.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>عنوان الهدف *</Text>
              <TextInput
                style={styles.input}
                placeholder="مثال: تقليل الضغط اليومي"
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.inputLabel}>الوصف (اختياري)</Text>
              <TextInput
                style={styles.textArea}
                placeholder="وصف مختصر لهدفك..."
                multiline
                numberOfLines={3}
                value={description}
                onChangeText={setDescription}
              />

              <Text style={styles.inputLabel}>القيمة المستهدفة *</Text>
              <TextInput
                style={styles.input}
                placeholder="مثال: 5"
                keyboardType="numeric"
                value={targetValue}
                onChangeText={setTargetValue}
              />

              <Text style={styles.inputLabel}>المدة (بالأيام)</Text>
              <TextInput
                style={styles.input}
                placeholder="مثال: 30"
                keyboardType="numeric"
                value={duration}
                onChangeText={setDuration}
              />

              <TouchableOpacity
                style={styles.createButton}
                onPress={handleCreateGoal}
              >
                <LinearGradient
                  colors={['#4CAF50', '#66BB6A']}
                  style={styles.createGradient}
                >
                  <Ionicons name="checkmark-circle" size={24} color="#FFF" />
                  <Text style={styles.createButtonText}>إنشاء الهدف</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal تفاصيل الرؤية */}
      <Modal
        visible={showInsightModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowInsightModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowInsightModal(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>تفاصيل الرؤية</Text>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedInsight && (
                <>
                  <View style={styles.scoreCard}>
                    <View
                      style={[
                        styles.bigScoreCircle,
                        { borderColor: getScoreColor(selectedInsight.overallScore) },
                      ]}
                    >
                      <Text
                        style={[
                          styles.bigScoreValue,
                          { color: getScoreColor(selectedInsight.overallScore) },
                        ]}
                      >
                        {selectedInsight.overallScore.toFixed(0)}
                      </Text>
                      <Text style={styles.scoreOutOf}>/100</Text>
                    </View>
                    <Text
                      style={[
                        styles.scoreLabel,
                        { color: getScoreColor(selectedInsight.overallScore) },
                      ]}
                    >
                      {getScoreLabel(selectedInsight.overallScore)}
                    </Text>
                  </View>

                  {selectedInsight.strengths && selectedInsight.strengths.length > 0 && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailTitle}>✅ نقاط القوة</Text>
                      {selectedInsight.strengths.map((strength: string, i: number) => (
                        <View key={i} style={styles.detailItem}>
                          <Text style={styles.detailText}>• {strength}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {selectedInsight.concerns && selectedInsight.concerns.length > 0 && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailTitle}>⚠️ نقاط التحسين</Text>
                      {selectedInsight.concerns.map((concern: string, i: number) => (
                        <View key={i} style={styles.detailItem}>
                          <Text style={styles.detailText}>• {concern}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {selectedInsight.recommendations &&
                    selectedInsight.recommendations.length > 0 && (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailTitle}>💡 التوصيات</Text>
                        {selectedInsight.recommendations.map(
                          (recommendation: string, i: number) => (
                            <View key={i} style={styles.detailItem}>
                              <Text style={styles.detailText}>• {recommendation}</Text>
                            </View>
                          )
                        )}
                      </View>
                    )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 20,
    paddingTop: 50,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'right',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFF',
    opacity: 0.9,
    textAlign: 'right',
    marginTop: 5,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
  },
  emptyState: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 15,
    marginBottom: 20,
  },
  createGoalButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 30,
  },
  createGoalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  goalCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
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
    marginBottom: 10,
  },
  goalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 10,
    flex: 1,
  },
  goalTypeBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
  },
  goalTypeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  goalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    textAlign: 'right',
    lineHeight: 20,
  },
  progressContainer: {
    marginBottom: 15,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#333',
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  goalStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalStatText: {
    fontSize: 12,
    color: '#999',
    marginRight: 5,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    padding: 10,
    marginTop: 15,
  },
  completedText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginRight: 5,
  },
  insightCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  scoreCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 15,
  },
  scoreValue: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  insightInfo: {
    flex: 1,
  },
  insightPeriod: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
    textAlign: 'right',
  },
  insightLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  insightPreview: {
    marginTop: 10,
  },
  previewText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 5,
    textAlign: 'right',
    lineHeight: 18,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginRight: 10,
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    marginTop: 15,
    textAlign: 'right',
  },
  goalTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  goalTypeCard: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#F9F9F9',
    borderRadius: 15,
    marginLeft: 10,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  goalTypeLabel: {
    fontSize: 11,
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    textAlign: 'right',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    textAlign: 'right',
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    textAlignVertical: 'top',
  },
  createButton: {
    marginTop: 30,
    marginBottom: 20,
    borderRadius: 15,
    overflow: 'hidden',
  },
  createGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginRight: 10,
  },
  scoreCard: {
    alignItems: 'center',
    marginBottom: 30,
  },
  bigScoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  bigScoreValue: {
    fontSize: 42,
    fontWeight: 'bold',
  },
  scoreOutOf: {
    fontSize: 16,
    color: '#999',
  },
  scoreLabel: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  detailSection: {
    marginBottom: 25,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'right',
  },
  detailItem: {
    marginBottom: 10,
  },
  detailText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'right',
    lineHeight: 22,
  },
});

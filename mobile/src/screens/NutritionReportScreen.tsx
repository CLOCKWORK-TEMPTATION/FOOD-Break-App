/**
 * شاشة التقارير الأسبوعية للتغذية
 * عرض تقارير تحليلية عن التغذية الأسبوعية
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

interface WeeklyReport {
  id: string;
  weekStart: string;
  weekEnd: string;
  avgCalories: number;
  avgProtein: number;
  avgCarbs: number;
  avgFat: number;
  avgFiber: number;
  totalMeals: number;
  healthyMealsCount: number;
  healthyMealsPercent: number;
  overallScore: number;
  strengths: string[];
  improvements: string[];
  recommendations: string[];
}

export default function NutritionReportScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<WeeklyReport | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/nutrition/reports/weekly?limit=4');
      
      if (response.data.success) {
        setReports(response.data.data);
        if (response.data.data.length > 0) {
          setSelectedReport(response.data.data[0]);
        }
      }
    } catch (error) {
      Alert.alert('خطأ', error.message || 'فشل تحميل التقارير');
    } finally {
      setLoading(false);
    }
  };

  const generateNewReport = async () => {
    try {
      setGenerating(true);
      const response = await apiService.post('/nutrition/reports/weekly');
      
      if (response.data.success) {
        Alert.alert('نجاح', 'تم إنشاء التقرير بنجاح');
        await loadReports();
      }
    } catch (error) {
      Alert.alert('خطأ', error.message || 'فشل إنشاء التقرير');
    } finally {
      setGenerating(false);
    }
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
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
          <Text style={styles.headerTitle}>التقارير الأسبوعية</Text>
          <TouchableOpacity onPress={generateNewReport} disabled={generating}>
            {generating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="add-circle" size={28} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {reports.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={80} color="#ccc" />
          <Text style={styles.emptyText}>لا توجد تقارير متاحة</Text>
          <Text style={styles.emptySubtext}>
            اضغط + لإنشاء تقرير أسبوعي جديد
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* اختيار التقرير */}
          <View style={styles.reportSelector}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.reportTabs}
            >
              {reports.map((report) => (
                <TouchableOpacity
                  key={report.id}
                  style={[
                    styles.reportTab,
                    selectedReport?.id === report.id && styles.reportTabActive,
                  ]}
                  onPress={() => setSelectedReport(report)}
                >
                  <Text
                    style={[
                      styles.reportTabText,
                      selectedReport?.id === report.id &&
                        styles.reportTabTextActive,
                    ]}
                  >
                    {formatDate(report.weekStart)} - {formatDate(report.weekEnd)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {selectedReport && (
            <>
              {/* النتيجة الإجمالية */}
              <View style={styles.section}>
                <View style={styles.scoreCard}>
                  <View style={styles.scoreCircle}>
                    <Text
                      style={[
                        styles.scoreValue,
                        { color: getScoreColor(selectedReport.overallScore) },
                      ]}
                    >
                      {Math.round(selectedReport.overallScore)}
                    </Text>
                    <Text style={styles.scoreMax}>/100</Text>
                  </View>
                  <View style={styles.scoreDetails}>
                    <Text style={styles.scoreLabel}>
                      {getScoreLabel(selectedReport.overallScore)}
                    </Text>
                    <Text style={styles.scoreDescription}>
                      التقييم الإجمالي للأسبوع
                    </Text>
                  </View>
                </View>
              </View>

              {/* إحصائيات سريعة */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📊 ملخص الأسبوع</Text>
                
                <View style={styles.statsGrid}>
                  <View style={styles.miniStatCard}>
                    <Ionicons name="flame" size={20} color="#FF6B35" />
                    <Text style={styles.miniStatValue}>
                      {Math.round(selectedReport.avgCalories)}
                    </Text>
                    <Text style={styles.miniStatLabel}>متوسط السعرات</Text>
                  </View>

                  <View style={styles.miniStatCard}>
                    <Ionicons name="restaurant" size={20} color="#4CAF50" />
                    <Text style={styles.miniStatValue}>
                      {selectedReport.totalMeals}
                    </Text>
                    <Text style={styles.miniStatLabel}>إجمالي الوجبات</Text>
                  </View>

                  <View style={styles.miniStatCard}>
                    <Ionicons name="checkmark-circle" size={20} color="#2196F3" />
                    <Text style={styles.miniStatValue}>
                      {Math.round(selectedReport.healthyMealsPercent)}%
                    </Text>
                    <Text style={styles.miniStatLabel}>وجبات صحية</Text>
                  </View>
                </View>
              </View>

              {/* المتوسطات الأسبوعية */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🥗 المتوسطات الأسبوعية</Text>
                
                <View style={styles.macrosList}>
                  {renderMacroRow('البروتين', selectedReport.avgProtein, 'barbell', '#FF6B35')}
                  {renderMacroRow('الكربوهيدرات', selectedReport.avgCarbs, 'leaf', '#4CAF50')}
                  {renderMacroRow('الدهون', selectedReport.avgFat, 'water', '#2196F3')}
                  {renderMacroRow('الألياف', selectedReport.avgFiber, 'nutrition', '#FFC107')}
                </View>
              </View>

              {/* نقاط القوة */}
              {selectedReport.strengths.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>💪 نقاط القوة</Text>
                  {selectedReport.strengths.map((strength, index) => (
                    <View key={index} style={styles.listItem}>
                      <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                      <Text style={styles.listItemText}>{strength}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* نقاط التحسين */}
              {selectedReport.improvements.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>📈 نقاط التحسين</Text>
                  {selectedReport.improvements.map((improvement, index) => (
                    <View key={index} style={styles.listItem}>
                      <Ionicons name="alert-circle" size={20} color="#FF9800" />
                      <Text style={styles.listItemText}>{improvement}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* التوصيات */}
              {selectedReport.recommendations.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>💡 التوصيات</Text>
                  {selectedReport.recommendations.map((recommendation, index) => (
                    <View key={index} style={styles.recommendationCard}>
                      <Ionicons name="bulb" size={24} color="#FFC107" />
                      <Text style={styles.recommendationText}>{recommendation}</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function renderMacroRow(label: string, value: number, icon: string, color: string) {
  return (
    <View style={styles.macroRow}>
      <View style={styles.macroRowLeft}>
        <Ionicons name={icon as any} size={20} color={color} />
        <Text style={styles.macroRowLabel}>{label}</Text>
      </View>
      <Text style={[styles.macroRowValue, { color }]}>
        {Math.round(value)}g
      </Text>
    </View>
  );
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  reportSelector: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  reportTabs: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  reportTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  reportTabActive: {
    backgroundColor: '#FF6B35',
  },
  reportTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  reportTabTextActive: {
    color: '#fff',
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  scoreCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  scoreMax: {
    fontSize: 16,
    color: '#999',
  },
  scoreDetails: {
    flex: 1,
  },
  scoreLabel: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  scoreDescription: {
    fontSize: 14,
    color: '#999',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  miniStatCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  miniStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  miniStatLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  macrosList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  macroRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  macroRowLabel: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  macroRowValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  listItemText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
    lineHeight: 20,
  },
  recommendationCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
    lineHeight: 20,
  },
});

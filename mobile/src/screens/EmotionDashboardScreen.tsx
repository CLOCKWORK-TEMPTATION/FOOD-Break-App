// EmotionDashboardScreen.tsx
// لوحة التحكم الذكية للذكاء العاطفي

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../services/apiService';

export default function EmotionDashboardScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [todayMood, setTodayMood] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [moodRes, profileRes, recRes, insightsRes] = await Promise.all([
        apiService.get('/emotion/mood/today'),
        apiService.get('/emotion/profile'),
        apiService.get('/emotion/recommendations'),
        apiService.get('/emotion/insights?limit=2'),
      ]);

      setTodayMood(moodRes.data);
      setProfile(profileRes.data);
      setRecommendations(recRes.data || []);
      setInsights(insightsRes.data || []);
    } catch (error: any) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
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

  const getMoodColor = (moodType: string) => {
    const colors: any = {
      HAPPY: '#4CAF50',
      EXCITED: '#FF9800',
      CALM: '#2196F3',
      STRESSED: '#F44336',
      TIRED: '#9E9E9E',
      ANXIOUS: '#FF5722',
      SAD: '#607D8B',
      FRUSTRATED: '#E91E63',
      MOTIVATED: '#8BC34A',
      RELAXED: '#00BCD4',
      OVERWHELMED: '#FF6B6B',
      CONTENT: '#66BB6A',
    };
    return colors[moodType] || '#757575';
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
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#6A1B9A', '#8E24AA']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-forward" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>لوحة الذكاء العاطفي 🧠</Text>
        <Text style={styles.headerSubtitle}>
          مرحباً! دعنا نعتني بصحتك النفسية
        </Text>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* بطاقة المزاج اليوم */}
        <View style={styles.todayMoodCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>مزاجك اليوم</Text>
            {todayMood ? (
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            ) : (
              <Ionicons name="alert-circle" size={24} color="#FF6B35" />
            )}
          </View>

          {todayMood ? (
            <View style={styles.moodDisplay}>
              <View
                style={[
                  styles.moodBadge,
                  { backgroundColor: getMoodColor(todayMood.moodType) + '20' },
                ]}
              >
                <Text style={styles.moodBadgeText}>{todayMood.moodType}</Text>
              </View>

              <View style={styles.metricsRow}>
                <View style={styles.metricItem}>
                  <Ionicons name="flash" size={20} color="#FF6B35" />
                  <Text style={styles.metricLabel}>شدة</Text>
                  <Text style={styles.metricValue}>{todayMood.intensity}/10</Text>
                </View>
                <View style={styles.metricItem}>
                  <Ionicons name="battery-charging" size={20} color="#4CAF50" />
                  <Text style={styles.metricLabel}>طاقة</Text>
                  <Text style={styles.metricValue}>{todayMood.energy}/10</Text>
                </View>
                <View style={styles.metricItem}>
                  <Ionicons name="thermometer" size={20} color="#F44336" />
                  <Text style={styles.metricLabel}>ضغط</Text>
                  <Text style={styles.metricValue}>{todayMood.stress}/10</Text>
                </View>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.trackMoodButton}
              onPress={() => navigation.navigate('MoodTracker')}
            >
              <Ionicons name="add-circle" size={24} color="#FF6B35" />
              <Text style={styles.trackMoodText}>سجل مزاجك الآن</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* الملف النفسي */}
        {profile && (
          <View style={styles.profileCard}>
            <Text style={styles.cardTitle}>ملفك النفسي</Text>

            <View style={styles.profileStats}>
              <View style={styles.profileStat}>
                <Text style={styles.profileStatValue}>{profile.totalMoodEntries}</Text>
                <Text style={styles.profileStatLabel}>سجلات المزاج</Text>
              </View>
              <View style={styles.profileStat}>
                <Text style={styles.profileStatValue}>{profile.consecutiveDays}</Text>
                <Text style={styles.profileStatLabel}>أيام متتالية</Text>
              </View>
              <View style={styles.profileStat}>
                <Text style={styles.profileStatValue}>{profile.longestStreak}</Text>
                <Text style={styles.profileStatLabel}>أطول سلسلة</Text>
              </View>
            </View>

            {profile.dominantMood && (
              <View style={styles.dominantMood}>
                <Text style={styles.dominantMoodLabel}>المزاج السائد:</Text>
                <View
                  style={[
                    styles.dominantMoodBadge,
                    { backgroundColor: getMoodColor(profile.dominantMood) },
                  ]}
                >
                  <Text style={styles.dominantMoodText}>{profile.dominantMood}</Text>
                </View>
              </View>
            )}

            {profile.avgStressLevel !== null && (
              <View style={styles.avgMetrics}>
                <View style={styles.avgMetricRow}>
                  <Text style={styles.avgMetricLabel}>متوسط الضغط</Text>
                  <Text style={styles.avgMetricValue}>
                    {profile.avgStressLevel.toFixed(1)}/10
                  </Text>
                </View>
                <View style={styles.avgMetricRow}>
                  <Text style={styles.avgMetricLabel}>متوسط الطاقة</Text>
                  <Text style={styles.avgMetricValue}>
                    {profile.avgEnergyLevel.toFixed(1)}/10
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* التوصيات المبنية على المزاج */}
        {recommendations.length > 0 && (
          <View style={styles.recommendationsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>توصيات مناسبة لمزاجك 🍽️</Text>
              <Ionicons name="sparkles" size={20} color="#FF6B35" />
            </View>

            {recommendations.map((rec) => (
              <TouchableOpacity key={rec.id} style={styles.recommendationCard}>
                <View style={styles.recLeft}>
                  {rec.menuItem.imageUrl ? (
                    <Image
                      source={{ uri: rec.menuItem.imageUrl }}
                      style={styles.recImage}
                    />
                  ) : (
                    <View style={styles.recImagePlaceholder}>
                      <Ionicons name="restaurant" size={32} color="#999" />
                    </View>
                  )}
                </View>

                <View style={styles.recContent}>
                  <Text style={styles.recName}>{rec.menuItem.name}</Text>
                  <Text style={styles.recRestaurant}>
                    {rec.menuItem.restaurant.name}
                  </Text>
                  <Text style={styles.recReason}>{rec.reason}</Text>

                  {rec.emotionalBenefit && rec.emotionalBenefit.length > 0 && (
                    <View style={styles.benefitsRow}>
                      {rec.emotionalBenefit.slice(0, 2).map((benefit: string, i: number) => (
                        <View key={i} style={styles.benefitTag}>
                          <Text style={styles.benefitText}>{benefit}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <View style={styles.recFooter}>
                    <View style={styles.confidenceBar}>
                      <View
                        style={[
                          styles.confidenceFill,
                          { width: `${rec.confidence * 100}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.confidenceText}>
                      {(rec.confidence * 100).toFixed(0)}% مناسب
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* الرؤى الأخيرة */}
        {insights.length > 0 && (
          <View style={styles.insightsSection}>
            <Text style={styles.sectionTitle}>رؤيتك الأخيرة 📊</Text>

            {insights.map((insight) => (
              <View key={insight.id} style={styles.insightCard}>
                <View style={styles.insightHeader}>
                  <View
                    style={[
                      styles.scoreCircle,
                      {
                        borderColor: getScoreColor(insight.overallScore),
                      },
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
                  <View style={styles.insightTitleContainer}>
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
                </View>

                {insight.strengths && insight.strengths.length > 0 && (
                  <View style={styles.insightSection}>
                    <Text style={styles.insightSectionTitle}>✅ نقاط القوة</Text>
                    {insight.strengths.slice(0, 2).map((strength: string, i: number) => (
                      <Text key={i} style={styles.insightText}>
                        • {strength}
                      </Text>
                    ))}
                  </View>
                )}

                {insight.concerns && insight.concerns.length > 0 && (
                  <View style={styles.insightSection}>
                    <Text style={styles.insightSectionTitle}>⚠️ نقاط التحسين</Text>
                    {insight.concerns.slice(0, 2).map((concern: string, i: number) => (
                      <Text key={i} style={styles.insightText}>
                        • {concern}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            ))}

            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => navigation.navigate('Wellness')}
            >
              <Text style={styles.viewAllText}>عرض جميع الرؤى</Text>
              <Ionicons name="chevron-back" size={20} color="#FF6B35" />
            </TouchableOpacity>
          </View>
        )}

        {/* أزرار الإجراءات */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('MoodTracker')}
          >
            <LinearGradient
              colors={['#FF6B35', '#FF8F50']}
              style={styles.actionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="create" size={24} color="#FFF" />
              <Text style={styles.actionText}>سجل مزاجك</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Wellness')}
          >
            <LinearGradient
              colors={['#6A1B9A', '#8E24AA']}
              style={styles.actionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="fitness" size={24} color="#FFF" />
              <Text style={styles.actionText}>الرفاهية</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* نصيحة */}
        <View style={styles.tipCard}>
          <Ionicons name="heart" size={24} color="#E91E63" />
          <Text style={styles.tipText}>
            💖 صحتك النفسية مهمة! تتبع مزاجك يومياً وسنعتني بك
          </Text>
        </View>
      </ScrollView>
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
  todayMoodCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
  },
  moodDisplay: {
    marginTop: 10,
  },
  moodBadge: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginBottom: 15,
  },
  moodBadgeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
  },
  trackMoodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5EE',
    borderWidth: 2,
    borderColor: '#FF6B35',
    borderRadius: 10,
    padding: 15,
    borderStyle: 'dashed',
  },
  trackMoodText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginRight: 10,
  },
  profileCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
    marginBottom: 15,
  },
  profileStat: {
    alignItems: 'center',
  },
  profileStatValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6A1B9A',
  },
  profileStatLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  dominantMood: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  dominantMoodLabel: {
    fontSize: 14,
    color: '#666',
  },
  dominantMoodBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
  },
  dominantMoodText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  avgMetrics: {
    marginTop: 15,
  },
  avgMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  avgMetricLabel: {
    fontSize: 14,
    color: '#666',
  },
  avgMetricValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  recommendationsSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
  },
  recommendationCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recLeft: {
    marginLeft: 15,
  },
  recImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  recImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recContent: {
    flex: 1,
  },
  recName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    textAlign: 'right',
  },
  recRestaurant: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
    textAlign: 'right',
  },
  recReason: {
    fontSize: 13,
    color: '#666',
    marginBottom: 10,
    textAlign: 'right',
  },
  benefitsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  benefitTag: {
    backgroundColor: '#E3F2FD',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginLeft: 5,
    marginBottom: 5,
  },
  benefitText: {
    fontSize: 11,
    color: '#1976D2',
  },
  recFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  confidenceBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
    marginLeft: 10,
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  confidenceText: {
    fontSize: 11,
    color: '#999',
  },
  insightsSection: {
    marginBottom: 20,
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
    fontSize: 24,
    fontWeight: 'bold',
  },
  insightTitleContainer: {
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
  insightSection: {
    marginTop: 15,
  },
  insightSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'right',
  },
  insightText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 5,
    textAlign: 'right',
    lineHeight: 18,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#FF6B35',
    borderRadius: 10,
    padding: 12,
  },
  viewAllText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginLeft: 5,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
  },
  actionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginRight: 8,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#FFEBEE',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E91E63',
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginRight: 10,
    lineHeight: 20,
  },
});

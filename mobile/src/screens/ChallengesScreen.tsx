/**
 * شاشة التحديات الصحية الجماعية
 * عرض والانضمام للتحديات الصحية مع الفريق
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../services/apiService';

interface Challenge {
  id: string;
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  challengeType: string;
  targetType: string;
  targetValue: number;
  currentValue: number;
  startDate: string;
  endDate: string;
  status: string;
  rewardPoints?: number;
  rewardBadge?: string;
  currentParticipants: number;
  maxParticipants?: number;
}

export default function ChallengesScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userChallenges, setUserChallenges] = useState<any[]>([]);
  const [selectedTab, setSelectedTab] = useState<'available' | 'joined'>('available');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [challengesRes, userChallengesRes] = await Promise.all([
        apiService.get('/nutrition/challenges'),
        apiService.get('/nutrition/user/challenges'),
      ]);

      if (challengesRes.data.success) {
        setChallenges(challengesRes.data.data);
      }
      if (userChallengesRes.data.success) {
        setUserChallenges(userChallengesRes.data.data);
      }
    } catch (error) {
      Alert.alert('خطأ', error.message || 'فشل تحميل التحديات');
    } finally {
      setLoading(false);
    }
  };

  const joinChallenge = async (challengeId: string) => {
    try {
      const response = await apiService.post(
        `/nutrition/challenges/${challengeId}/join`
      );
      
      if (response.data.success) {
        Alert.alert('نجاح', 'تم الانضمام للتحدي بنجاح! 🎉');
        await loadData();
        setSelectedTab('joined');
      }
    } catch (error) {
      Alert.alert('خطأ', error.message || 'فشل الانضمام للتحدي');
    }
  };

  const viewLeaderboard = (challengeId: string) => {
    // Navigate to leaderboard screen (to be implemented)
    Alert.alert('لوحة الصدارة', 'ميزة لوحة الصدارة قيد التطوير');
  };

  const getChallengeTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      CALORIE_GOAL: 'flame',
      HEALTHY_CHOICES: 'nutrition',
      VEGETABLE_DAYS: 'leaf',
      NO_SUGAR_WEEK: 'close-circle',
      PROTEIN_POWER: 'barbell',
      WATER_INTAKE: 'water',
      CUSTOM: 'trophy',
    };
    return icons[type] || 'trophy';
  };

  const renderChallengeCard = (challenge: Challenge, isJoined: boolean = false) => {
    const progress = (challenge.currentValue / challenge.targetValue) * 100;
    const daysLeft = Math.ceil(
      (new Date(challenge.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    return (
      <View key={challenge.id} style={styles.challengeCard}>
        <View style={styles.challengeHeader}>
          <View style={styles.challengeIcon}>
            <Ionicons
              name={getChallengeTypeIcon(challenge.challengeType) as any}
              size={32}
              color="#FF6B35"
            />
          </View>
          <View style={styles.challengeInfo}>
            <Text style={styles.challengeTitle}>
              {challenge.titleAr || challenge.title}
            </Text>
            <Text style={styles.challengeDescription}>
              {challenge.descriptionAr || challenge.description}
            </Text>
          </View>
        </View>

        {isJoined && (
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>تقدمك</Text>
              <Text style={styles.progressValue}>
                {Math.round(progress)}%
              </Text>
            </View>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.min(progress, 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {challenge.currentValue} / {challenge.targetValue}
            </Text>
          </View>
        )}

        <View style={styles.challengeMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="people" size={16} color="#666" />
            <Text style={styles.metaText}>
              {challenge.currentParticipants}
              {challenge.maxParticipants && ` / ${challenge.maxParticipants}`} مشارك
            </Text>
          </View>
          
          <View style={styles.metaItem}>
            <Ionicons name="calendar" size={16} color="#666" />
            <Text style={styles.metaText}>{daysLeft} يوم متبقي</Text>
          </View>

          {challenge.rewardPoints && (
            <View style={styles.metaItem}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.metaText}>{challenge.rewardPoints} نقطة</Text>
            </View>
          )}
        </View>

        <View style={styles.challengeActions}>
          {isJoined ? (
            <TouchableOpacity
              style={styles.leaderboardButton}
              onPress={() => viewLeaderboard(challenge.id)}
            >
              <Ionicons name="podium" size={20} color="#FF6B35" />
              <Text style={styles.leaderboardButtonText}>لوحة الصدارة</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.joinButton}
              onPress={() => joinChallenge(challenge.id)}
            >
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.joinButtonText}>انضم الآن</Text>
            </TouchableOpacity>
          )}
        </View>

        {challenge.rewardBadge && (
          <View style={styles.rewardBadge}>
            <Text style={styles.rewardBadgeText}>{challenge.rewardBadge}</Text>
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
          <Text style={styles.headerTitle}>التحديات الجماعية</Text>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'available' && styles.tabActive]}
          onPress={() => setSelectedTab('available')}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === 'available' && styles.tabTextActive,
            ]}
          >
            التحديات المتاحة
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'joined' && styles.tabActive]}
          onPress={() => setSelectedTab('joined')}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === 'joined' && styles.tabTextActive,
            ]}
          >
            تحدياتي ({userChallenges.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {selectedTab === 'available' ? (
          challenges.length > 0 ? (
            challenges.map((challenge) => renderChallengeCard(challenge, false))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="trophy-outline" size={80} color="#ccc" />
              <Text style={styles.emptyText}>لا توجد تحديات متاحة حالياً</Text>
            </View>
          )
        ) : userChallenges.length > 0 ? (
          userChallenges.map((item) =>
            renderChallengeCard(item.challenge, true)
          )
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="trophy-outline" size={80} color="#ccc" />
            <Text style={styles.emptyText}>لم تنضم لأي تحدي بعد</Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => setSelectedTab('available')}
            >
              <Text style={styles.browseButtonText}>تصفح التحديات</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
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
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#FF6B35',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  tabTextActive: {
    color: '#FF6B35',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  challengeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  challengeHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  challengeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFE0D6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  challengeInfo: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  challengeDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  progressValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FF6B35',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#999',
  },
  challengeMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  challengeActions: {
    flexDirection: 'row',
  },
  joinButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  leaderboardButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FFE0D6',
    borderRadius: 8,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leaderboardButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginLeft: 8,
  },
  rewardBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  rewardBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  browseButton: {
    marginTop: 20,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});

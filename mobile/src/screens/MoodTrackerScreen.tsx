// MoodTrackerScreen.tsx
// شاشة تتبع المزاج اليومي

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../services/apiService';

interface MoodData {
  moodType: string;
  intensity: number;
  energy: number;
  stress: number;
  context?: string;
  workType?: string;
  shootingHours?: number;
  isRestDay: boolean;
  notes?: string;
  triggers: string[];
}

const MOOD_TYPES = [
  { value: 'HAPPY', label: 'سعيد', icon: '😊', color: '#4CAF50' },
  { value: 'EXCITED', label: 'متحمس', icon: '🤩', color: '#FF9800' },
  { value: 'CALM', label: 'هادئ', icon: '😌', color: '#2196F3' },
  { value: 'STRESSED', label: 'مضغوط', icon: '😰', color: '#F44336' },
  { value: 'TIRED', label: 'متعب', icon: '😴', color: '#9E9E9E' },
  { value: 'ANXIOUS', label: 'قلق', icon: '😟', color: '#FF5722' },
  { value: 'SAD', label: 'حزين', icon: '😢', color: '#607D8B' },
  { value: 'FRUSTRATED', label: 'محبط', icon: '😤', color: '#E91E63' },
  { value: 'MOTIVATED', label: 'متحفز', icon: '💪', color: '#8BC34A' },
  { value: 'RELAXED', label: 'مسترخي', icon: '🧘', color: '#00BCD4' },
  { value: 'OVERWHELMED', label: 'مرهق', icon: '🥵', color: '#FF6B6B' },
  { value: 'CONTENT', label: 'راضٍ', icon: '☺️', color: '#66BB6A' },
];

const WORK_TYPES = [
  { value: 'LIGHT_SHOOT', label: 'تصوير خفيف' },
  { value: 'HEAVY_SHOOT', label: 'تصوير مكثف' },
  { value: 'REHEARSAL', label: 'بروفات' },
  { value: 'MEETING', label: 'اجتماعات' },
  { value: 'PREP', label: 'تحضيرات' },
  { value: 'WRAP', label: 'إنهاء' },
  { value: 'REST', label: 'راحة' },
];

export default function MoodTrackerScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);
  const [todayMood, setTodayMood] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  // بيانات النموذج
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [intensity, setIntensity] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [stress, setStress] = useState(5);
  const [context, setContext] = useState('');
  const [workType, setWorkType] = useState<string | null>(null);
  const [shootingHours, setShootingHours] = useState<string>('');
  const [isRestDay, setIsRestDay] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadTodayMood();
  }, []);

  const loadTodayMood = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/emotion/mood/today');
      
      if (response.data) {
        setTodayMood(response.data);
        // ملء البيانات للتعديل
        setSelectedMood(response.data.moodType);
        setIntensity(response.data.intensity);
        setEnergy(response.data.energy);
        setStress(response.data.stress);
        setContext(response.data.context || '');
        setWorkType(response.data.workType);
        setShootingHours(response.data.shootingHours?.toString() || '');
        setIsRestDay(response.data.isRestDay);
        setNotes(response.data.notes || '');
        setIsEditing(false);
      } else {
        setIsEditing(true);
      }
    } catch (error: any) {
      console.error('Error loading today mood:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedMood) {
      Alert.alert('خطأ', 'الرجاء اختيار مزاجك');
      return;
    }

    try {
      setLoading(true);

      const moodData: MoodData = {
        moodType: selectedMood,
        intensity,
        energy,
        stress,
        context,
        workType,
        shootingHours: shootingHours ? parseInt(shootingHours) : undefined,
        isRestDay,
        notes,
        triggers: [],
      };

      const response = await apiService.post('/emotion/mood/log', moodData);

      Alert.alert('نجح!', response.message || 'تم تسجيل مزاجك بنجاح', [
        {
          text: 'عرض التوصيات',
          onPress: () => navigation.navigate('EmotionDashboard'),
        },
        { text: 'حسناً', style: 'cancel' },
      ]);

      setTodayMood(response.data);
      setIsEditing(false);
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'حدث خطأ أثناء تسجيل المزاج');
    } finally {
      setLoading(false);
    }
  };

  const renderSlider = (
    label: string,
    value: number,
    setValue: (val: number) => void,
    icon: string,
    lowLabel: string,
    highLabel: string,
    color: string
  ) => (
    <View style={styles.sliderContainer}>
      <View style={styles.sliderHeader}>
        <View style={styles.sliderLabelContainer}>
          <Ionicons name={icon as any} size={20} color={color} />
          <Text style={styles.sliderLabel}>{label}</Text>
        </View>
        <Text style={[styles.sliderValue, { color }]}>{value}/10</Text>
      </View>

      {/* شريط التحكم */}
      <View style={styles.sliderTrack}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
          <TouchableOpacity
            key={num}
            style={[
              styles.sliderDot,
              value >= num && { backgroundColor: color },
            ]}
            onPress={() => setValue(num)}
          />
        ))}
      </View>

      <View style={styles.sliderLabels}>
        <Text style={styles.sliderLabelText}>{lowLabel}</Text>
        <Text style={styles.sliderLabelText}>{highLabel}</Text>
      </View>
    </View>
  );

  if (loading && !isEditing) {
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
      <LinearGradient colors={['#FF6B35', '#FF8F50']} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-forward" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تتبع المزاج اليومي</Text>
        <Text style={styles.headerSubtitle}>كيف تشعر اليوم؟ 🌈</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* عرض المزاج المسجل */}
        {todayMood && !isEditing && (
          <View style={styles.recordedMoodCard}>
            <View style={styles.recordedHeader}>
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              <Text style={styles.recordedTitle}>تم تسجيل مزاجك اليوم</Text>
            </View>
            
            <View style={styles.moodSummary}>
              {MOOD_TYPES.find((m) => m.value === todayMood.moodType) && (
                <Text style={styles.bigMoodIcon}>
                  {MOOD_TYPES.find((m) => m.value === todayMood.moodType)!.icon}
                </Text>
              )}
              <Text style={styles.moodLabel}>
                {MOOD_TYPES.find((m) => m.value === todayMood.moodType)?.label}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setIsEditing(true)}
            >
              <Ionicons name="create-outline" size={20} color="#FF6B35" />
              <Text style={styles.editButtonText}>تعديل</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* نموذج تسجيل المزاج */}
        {isEditing && (
          <>
            {/* اختيار المزاج */}
            <Text style={styles.sectionTitle}>اختر مزاجك</Text>
            <View style={styles.moodGrid}>
              {MOOD_TYPES.map((mood) => (
                <TouchableOpacity
                  key={mood.value}
                  style={[
                    styles.moodCard,
                    selectedMood === mood.value && {
                      borderColor: mood.color,
                      borderWidth: 3,
                      backgroundColor: mood.color + '15',
                    },
                  ]}
                  onPress={() => setSelectedMood(mood.value)}
                >
                  <Text style={styles.moodIcon}>{mood.icon}</Text>
                  <Text style={styles.moodLabel}>{mood.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* المقاييس */}
            <View style={styles.section}>
              {renderSlider(
                'شدة المشاعر',
                intensity,
                setIntensity,
                'flash',
                'خفيف',
                'قوي جداً',
                '#FF6B35'
              )}

              {renderSlider(
                'مستوى الطاقة',
                energy,
                setEnergy,
                'battery-charging',
                'منخفض',
                'عالي جداً',
                '#4CAF50'
              )}

              {renderSlider(
                'مستوى الضغط',
                stress,
                setStress,
                'thermometer',
                'مسترخي',
                'ضغط عالٍ',
                '#F44336'
              )}
            </View>

            {/* نوع العمل */}
            <Text style={styles.sectionTitle}>نوع العمل اليوم</Text>
            <View style={styles.workTypeContainer}>
              {WORK_TYPES.map((work) => (
                <TouchableOpacity
                  key={work.value}
                  style={[
                    styles.workTypeButton,
                    workType === work.value && styles.workTypeButtonActive,
                  ]}
                  onPress={() => setWorkType(work.value)}
                >
                  <Text
                    style={[
                      styles.workTypeText,
                      workType === work.value && styles.workTypeTextActive,
                    ]}
                  >
                    {work.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ساعات التصوير */}
            {workType && workType.includes('SHOOT') && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>ساعات التصوير</Text>
                <TextInput
                  style={styles.input}
                  placeholder="مثال: 8"
                  keyboardType="numeric"
                  value={shootingHours}
                  onChangeText={setShootingHours}
                />
              </View>
            )}

            {/* يوم راحة */}
            <TouchableOpacity
              style={styles.restDayButton}
              onPress={() => setIsRestDay(!isRestDay)}
            >
              <View style={styles.checkbox}>
                {isRestDay && <Ionicons name="checkmark" size={20} color="#FF6B35" />}
              </View>
              <Text style={styles.restDayText}>يوم راحة 🏖️</Text>
            </TouchableOpacity>

            {/* السياق */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>السياق (اختياري)</Text>
              <TextInput
                style={styles.textArea}
                placeholder="مثال: يوم تصوير صعب، تعاون الفريق ممتاز..."
                multiline
                numberOfLines={3}
                value={context}
                onChangeText={setContext}
              />
            </View>

            {/* ملاحظات */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>ملاحظات إضافية (اختياري)</Text>
              <TextInput
                style={styles.textArea}
                placeholder="أي ملاحظات أخرى تود إضافتها..."
                multiline
                numberOfLines={4}
                value={notes}
                onChangeText={setNotes}
              />
            </View>

            {/* زر الحفظ */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={loading}
            >
              <LinearGradient
                colors={['#FF6B35', '#FF8F50']}
                style={styles.submitGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={24} color="#FFF" />
                    <Text style={styles.submitText}>
                      {todayMood ? 'تحديث المزاج' : 'حفظ المزاج'}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}

        {/* نصيحة سريعة */}
        <View style={styles.tipCard}>
          <Ionicons name="bulb" size={24} color="#FFC107" />
          <Text style={styles.tipText}>
            💡 تتبع مزاجك يومياً يساعدنا في تقديم توصيات غذائية تناسب حالتك النفسية
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
  recordedMoodCard: {
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
  recordedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  recordedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginRight: 10,
  },
  moodSummary: {
    alignItems: 'center',
    marginVertical: 20,
  },
  bigMoodIcon: {
    fontSize: 80,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#FF6B35',
    borderRadius: 10,
    padding: 12,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginRight: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'right',
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  moodCard: {
    width: '22%',
    aspectRatio: 1,
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 10,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  moodIcon: {
    fontSize: 32,
    marginBottom: 5,
  },
  moodLabel: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  section: {
    marginBottom: 30,
  },
  sliderContainer: {
    marginBottom: 25,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sliderLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sliderLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  sliderValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sliderTrack: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 40,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingHorizontal: 10,
  },
  sliderDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  sliderLabelText: {
    fontSize: 12,
    color: '#999',
  },
  workTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  workTypeButton: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginLeft: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  workTypeButtonActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  workTypeText: {
    fontSize: 14,
    color: '#333',
  },
  workTypeTextActive: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'right',
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    textAlign: 'right',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    textAlign: 'right',
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    textAlignVertical: 'top',
  },
  restDayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  restDayText: {
    fontSize: 16,
    color: '#333',
  },
  submitButton: {
    marginBottom: 20,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  submitText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginRight: 10,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFEF0',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFC107',
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginRight: 10,
    lineHeight: 20,
  },
});

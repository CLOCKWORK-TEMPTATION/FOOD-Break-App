/**
 * شاشة الملف الشخصي
 * عرض معلومات المستخدم والإعدادات
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useSelector, useDispatch } from 'react-redux';
import apiService from '../services/apiService';

type ProfileNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Profile'>;

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  createdAt: string;
}

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<ProfileNavigationProp>();
  const dispatch = useDispatch();
  const { user } = useSelector((state: any) => state.auth || {});

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      // TODO: استبدل هذا بـ API call حقيقي
      if (user) {
        setProfile({
          id: user.id || '1',
          name: user.name || 'المستخدم',
          email: user.email || 'user@example.com',
          phone: user.phone || '+966500000000',
          avatar: user.avatar,
          createdAt: user.createdAt || new Date().toISOString(),
        });
      }
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'فشل تحميل الملف الشخصي');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = () => {
    // TODO: الانتقال لشاشة تعديل الملف الشخصي
    Alert.alert('قريباً', 'شاشة تعديل الملف الشخصي قريباً');
  };

  const handleChangePassword = () => {
    // TODO: الانتقال لشاشة تغيير كلمة المرور
    Alert.alert('قريباً', 'شاشة تغيير كلمة المرور قريباً');
  };

  const handleAddresses = () => {
    // TODO: الانتقال لشاشة العناوين
    Alert.alert('قريباً', 'شاشة العناوين قريباً');
  };

  const handlePaymentMethods = () => {
    // TODO: الانتقال لشاشة طرق الدفع
    Alert.alert('قريباً', 'شاشة طرق الدفع قريباً');
  };

  const handleLogout = () => {
    Alert.alert(
      'تسجيل الخروج',
      'هل أنت متأكد من رغبتك في تسجيل الخروج؟',
      [
        {
          text: 'إلغاء',
          style: 'cancel',
        },
        {
          text: 'تسجيل الخروج',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: استدعاء API لتسجيل الخروج
              // await apiService.authService.logout();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Welcome' }],
              });
            } catch (error: any) {
              Alert.alert('خطأ', error.message || 'فشل تسجيل الخروج');
            }
          },
        },
      ]
    );
  };

  const handleDietaryPreferences = () => {
    navigation.navigate('DietaryPreferences' as any);
  };

  const menuItems = [
    {
      id: 'edit',
      title: 'تعديل الملف الشخصي',
      icon: 'person-outline',
      onPress: handleEditProfile,
    },
    {
      id: 'dietary',
      title: 'تفضيلات الحمية الغذائية',
      icon: 'nutrition-outline',
      onPress: handleDietaryPreferences,
      badge: '🥗',
    },
    {
      id: 'password',
      title: 'تغيير كلمة المرور',
      icon: 'lock-closed-outline',
      onPress: handleChangePassword,
    },
    {
      id: 'addresses',
      title: 'العناوين',
      icon: 'location-outline',
      onPress: handleAddresses,
    },
    {
      id: 'payment',
      title: 'طرق الدفع',
      icon: 'card-outline',
      onPress: handlePaymentMethods,
    },
    {
      id: 'notifications',
      title: 'الإشعارات',
      icon: 'notifications-outline',
      rightComponent: (
        <Switch
          value={notificationsEnabled}
          onValueChange={setNotificationsEnabled}
          trackColor={{ false: '#767577', true: '#007AFF' }}
        />
      ),
    },
    {
      id: 'about',
      title: 'حول التطبيق',
      icon: 'information-circle-outline',
      onPress: () => Alert.alert('BreakApp', 'الإصدار 1.0.0'),
    },
    {
      id: 'support',
      title: 'الدعم الفني',
      icon: 'help-circle-outline',
      onPress: () => Alert.alert('الدعم الفني', 'يمكنك التواصل معنا عبر: support@breakapp.com'),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>الملف الشخصي</Text>
        </View>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {profile?.avatar ? (
              <Image source={{ uri: profile.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={50} color="#fff" />
              </View>
            )}
          </View>
          <Text style={styles.userName}>{profile?.name || 'المستخدم'}</Text>
          <Text style={styles.userEmail}>{profile?.email || 'user@example.com'}</Text>
          <Text style={styles.userPhone}>{profile?.phone || '+966500000000'}</Text>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={item.onPress}
              disabled={!item.onPress}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name={item.icon as any} size={24} color="#333" />
                <Text style={styles.menuItemText}>{item.title}</Text>
              </View>
              {item.rightComponent || (
                <Ionicons name="chevron-forward-outline" size={20} color="#999" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#F44336" />
          <Text style={styles.logoutText}>تسجيل الخروج</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  profileSection: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 14,
    color: '#999',
  },
  menuSection: {
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 32,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    color: '#F44336',
    fontWeight: 'bold',
  },
});

export default ProfileScreen;


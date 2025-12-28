/**
 * شاشة تفاصيل المطعم
 * عرض معلومات المطعم التفصيلية والقائمة
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import apiService from '../services/apiService';
import LoadingSpinner from '../components/ui/LoadingSpinner';

type RestaurantDetailRouteProp = RouteProp<RootStackParamList, 'RestaurantDetail'>;
type RestaurantDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'RestaurantDetail'>;

interface RestaurantDetail {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  reviews: number;
  deliveryTime: string;
  deliveryFee: number;
  image: string;
  isOpen: boolean;
  description: string;
  address: string;
  phone: string;
  openingHours: {
    day: string;
    hours: string;
  }[];
}

const RestaurantDetailScreen: React.FC = () => {
  const route = useRoute<RestaurantDetailRouteProp>();
  const navigation = useNavigation<RestaurantDetailNavigationProp>();
  const { restaurantId } = route.params;

  const [restaurant, setRestaurant] = useState<RestaurantDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRestaurantDetails();
  }, [restaurantId]);

  const loadRestaurantDetails = async () => {
    try {
      setLoading(true);
      // TODO: استبدل هذا بـ API call حقيقي
      const response = await apiService.restaurantService?.getRestaurantById?.(restaurantId);
      setRestaurant(response?.data || null);
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'فشل تحميل تفاصيل المطعم');
    } finally {
      setLoading(false);
    }
  };

  const handleViewMenu = () => {
    if (restaurant) {
      navigation.navigate('Menu', {
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
      });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  if (!restaurant) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>المطعم غير موجود</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Restaurant Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: restaurant.image || 'https://via.placeholder.com/400x200' }}
            style={styles.image}
            resizeMode="cover"
          />
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Restaurant Info */}
        <View style={styles.contentContainer}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={styles.name}>{restaurant.name}</Text>
              <Text style={styles.cuisine}>{restaurant.cuisine}</Text>
            </View>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={20} color="#FFD700" />
              <Text style={styles.rating}>{restaurant.rating.toFixed(1)}</Text>
              <Text style={styles.reviews}>({restaurant.reviews})</Text>
            </View>
          </View>

          {/* Status & Delivery Info */}
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons
                name={restaurant.isOpen ? 'checkmark-circle' : 'close-circle'}
                size={20}
                color={restaurant.isOpen ? '#4CAF50' : '#F44336'}
              />
              <Text style={[styles.infoText, { color: restaurant.isOpen ? '#4CAF50' : '#F44336' }]}>
                {restaurant.isOpen ? 'مفتوح' : 'مغلق'}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={20} color="#666" />
              <Text style={styles.infoText}>{restaurant.deliveryTime}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="car-outline" size={20} color="#666" />
              <Text style={styles.infoText}>{restaurant.deliveryFee} ريال</Text>
            </View>
          </View>

          {/* Description */}
          {restaurant.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>عن المطعم</Text>
              <Text style={styles.description}>{restaurant.description}</Text>
            </View>
          )}

          {/* Address */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>العنوان</Text>
            <View style={styles.addressContainer}>
              <Ionicons name="location-outline" size={20} color="#666" />
              <Text style={styles.address}>{restaurant.address}</Text>
            </View>
          </View>

          {/* Contact */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>اتصل بنا</Text>
            <TouchableOpacity style={styles.contactItem}>
              <Ionicons name="call-outline" size={20} color="#007AFF" />
              <Text style={styles.contactText}>{restaurant.phone}</Text>
            </TouchableOpacity>
          </View>

          {/* Opening Hours */}
          {restaurant.openingHours && restaurant.openingHours.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>ساعات العمل</Text>
              {restaurant.openingHours.map((schedule, index) => (
                <View key={index} style={styles.hoursRow}>
                  <Text style={styles.day}>{schedule.day}</Text>
                  <Text style={styles.hours}>{schedule.hours}</Text>
                </View>
              ))}
            </View>
          )}

          {/* View Menu Button */}
          <TouchableOpacity
            style={styles.menuButton}
            onPress={handleViewMenu}
            disabled={!restaurant.isOpen}
          >
            <Text style={styles.menuButtonText}>عرض القائمة</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  imageContainer: {
    height: 250,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  cuisine: {
    fontSize: 16,
    color: '#666',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  reviews: {
    fontSize: 14,
    color: '#666',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  address: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactText: {
    fontSize: 14,
    color: '#007AFF',
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  day: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  hours: {
    fontSize: 14,
    color: '#666',
  },
  menuButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  menuButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});

export default RestaurantDetailScreen;
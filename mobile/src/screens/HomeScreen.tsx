import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorMessage from '../components/ui/ErrorMessage';
import apiService from '../services/apiService';

interface HomeScreenProps {
  navigation: any;
}

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  deliveryTime: string;
  image: string;
  isOpen: boolean;
  deliveryFee: number;
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load restaurants and categories
      const [restaurantsData, categoriesData] = await Promise.all([
        loadRestaurants(),
        loadCategories(),
      ]);

      setRestaurants(restaurantsData);
      setCategories(categoriesData);
    } catch (error) {
      setError('فشل في تحميل البيانات');
      console.error('Error loading home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRestaurants = async (): Promise<Restaurant[]> => {
    try {
      // TODO: Replace with actual API call
      // const response = await apiService.getNearbyRestaurants(latitude, longitude);
      
      // Mock data for now
      return [
        {
          id: '1',
          name: 'مطعم الأصالة',
          cuisine: 'عربي',
          rating: 4.5,
          deliveryTime: '25-35 دقيقة',
          image: 'https://example.com/restaurant1.jpg',
          isOpen: true,
          deliveryFee: 15,
        },
        {
          id: '2',
          name: 'بيتزا هت',
          cuisine: 'إيطالي',
          rating: 4.2,
          deliveryTime: '30-40 دقيقة',
          image: 'https://example.com/restaurant2.jpg',
          isOpen: true,
          deliveryFee: 20,
        },
        {
          id: '3',
          name: 'كشري أبو طارق',
          cuisine: 'مصري',
          rating: 4.8,
          deliveryTime: '15-25 دقيقة',
          image: 'https://example.com/restaurant3.jpg',
          isOpen: true,
          deliveryFee: 10,
        },
        {
          id: '4',
          name: 'ماكدونالدز',
          cuisine: 'أمريكي',
          rating: 4.0,
          deliveryTime: '20-30 دقيقة',
          image: 'https://example.com/restaurant4.jpg',
          isOpen: false,
          deliveryFee: 25,
        },
      ];
    } catch (error) {
      throw new Error('فشل في تحميل المطاعم');
    }
  };

  const loadCategories = async (): Promise<Category[]> => {
    // Mock categories
    return [
      { id: '1', name: 'الكل', icon: '🍽️' },
      { id: '2', name: 'عربي', icon: '🥙' },
      { id: '3', name: 'إيطالي', icon: '🍕' },
      { id: '4', name: 'مصري', icon: '🍛' },
      { id: '5', name: 'آسيوي', icon: '🍜' },
      { id: '6', name: 'حلويات', icon: '🧁' },
      { id: '7', name: 'مشروبات', icon: '🥤' },
    ];
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHomeData();
    setRefreshing(false);
  };

  const handleRestaurantPress = (restaurant: Restaurant) => {
    navigation.navigate('RestaurantDetail', { restaurantId: restaurant.id });
  };

  const handleCategoryPress = (category: Category) => {
    navigation.navigate('RestaurantList', { category: category.name });
  };

  const handleSearchPress = () => {
    navigation.navigate('RestaurantList', { showSearch: true });
  };

  const handleQRPress = () => {
    navigation.navigate('QRScanner');
  };

  const renderRestaurant = ({ item }: { item: Restaurant }) => (
    <TouchableOpacity
      style={styles.restaurantCard}
      onPress={() => handleRestaurantPress(item)}
      activeOpacity={0.8}
    >
      <Image source={{ uri: item.image }} style={styles.restaurantImage} />
      <View style={styles.restaurantInfo}>
        <View style={styles.restaurantHeader}>
          <Text style={styles.restaurantName}>{item.name}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
        </View>
        <Text style={styles.cuisineText}>{item.cuisine}</Text>
        <View style={styles.restaurantFooter}>
          <View style={styles.deliveryInfo}>
            <Ionicons name="time-outline" size={14} color="#666" />
            <Text style={styles.deliveryText}>{item.deliveryTime}</Text>
          </View>
          <View style={styles.deliveryInfo}>
            <Ionicons name="bicycle-outline" size={14} color="#666" />
            <Text style={styles.deliveryText}>{item.deliveryFee} ج.م</Text>
          </View>
        </View>
        {!item.isOpen && (
          <View style={styles.closedBadge}>
            <Text style={styles.closedText}>مغلق</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderCategory = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => handleCategoryPress(item)}
      activeOpacity={0.8}
    >
      <Text style={styles.categoryIcon}>{item.icon}</Text>
      <Text style={styles.categoryName}>{item.name}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return <LoadingSpinner fullScreen message="جاري تحميل الصفحة الرئيسية..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        message={error}
        onRetry={loadHomeData}
        retryText="إعادة المحاولة"
        fullScreen
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>مرحباً!</Text>
              <Text style={styles.subGreeting}>ماذا ترغب أن تطلب اليوم؟</Text>
            </View>
            <TouchableOpacity style={styles.qrButton} onPress={handleQRPress}>
              <Ionicons name="qr-code-outline" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <TouchableOpacity style={styles.searchBar} onPress={handleSearchPress}>
            <Ionicons name="search-outline" size={20} color="#999" />
            <Text style={styles.searchPlaceholder}>ابحث عن مطاعم أو أطباق...</Text>
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>الفئات</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesContainer}
          >
            {categories.map((category) => (
              <View key={category.id}>{renderCategory({ item: category })}</View>
            ))}
          </ScrollView>
        </View>

        {/* Featured Restaurants */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>مطاعم مميزة</Text>
          <View style={styles.restaurantsContainer}>
            {restaurants.map((restaurant) => (
              <View key={restaurant.id}>{renderRestaurant({ item: restaurant })}</View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subGreeting: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  qrButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  searchPlaceholder: {
    marginLeft: 10,
    color: '#999',
    fontSize: 16,
  },
  section: {
    marginTop: 25,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  categoriesContainer: {
    marginBottom: 10,
  },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryIcon: {
    fontSize: 30,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  restaurantsContainer: {
    marginBottom: 20,
  },
  restaurantCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  restaurantImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  restaurantInfo: {
    padding: 15,
  },
  restaurantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff8e1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#f57c00',
  },
  cuisineText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  restaurantFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryText: {
    marginLeft: 6,
    fontSize: 13,
    color: '#666',
  },
  closedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  closedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
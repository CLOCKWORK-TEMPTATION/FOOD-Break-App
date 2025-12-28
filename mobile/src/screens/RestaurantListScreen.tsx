import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorMessage from '../components/ui/ErrorMessage';
import apiService from '../services/apiService';

interface RestaurantListScreenProps {
  navigation: any;
  route: any;
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
  distance: number;
  reviews: number;
}

interface Filter {
  id: string;
  name: string;
  type: 'cuisine' | 'rating' | 'deliveryTime' | 'price';
  value: any;
}

const RestaurantListScreen: React.FC<RestaurantListScreenProps> = ({ navigation, route }) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const filters: Filter[] = [
    { id: '1', name: 'عربي', type: 'cuisine', value: 'عربي' },
    { id: '2', name: 'إيطالي', type: 'cuisine', value: 'إيطالي' },
    { id: '3', name: 'مصري', type: 'cuisine', value: 'مصري' },
    { id: '4', name: 'آسيوي', type: 'cuisine', value: 'آسيوي' },
    { id: '5', name: '4+ نجوم', type: 'rating', value: 4 },
    { id: '6', name: 'توصيل سريع', type: 'deliveryTime', value: 30 },
    { id: '7', name: 'رسوم توصيل منخفضة', type: 'price', value: 15 },
  ];

  useEffect(() => {
    loadRestaurants();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, selectedFilters, restaurants]);

  const loadRestaurants = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual API call
      // const response = await apiService.getNearbyRestaurants(latitude, longitude);
      
      // Mock data
      const mockRestaurants: Restaurant[] = [
        {
          id: '1',
          name: 'مطعم الأصالة',
          cuisine: 'عربي',
          rating: 4.5,
          deliveryTime: '25-35 دقيقة',
          image: 'https://example.com/restaurant1.jpg',
          isOpen: true,
          deliveryFee: 15,
          distance: 2.3,
          reviews: 234,
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
          distance: 3.1,
          reviews: 189,
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
          distance: 1.8,
          reviews: 456,
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
          distance: 4.2,
          reviews: 321,
        },
        {
          id: '5',
          name: 'سوشي ماستر',
          cuisine: 'ياباني',
          rating: 4.6,
          deliveryTime: '35-45 دقيقة',
          image: 'https://example.com/restaurant5.jpg',
          isOpen: true,
          deliveryFee: 30,
          distance: 5.1,
          reviews: 167,
        },
        {
          id: '6',
          name: 'بيت الشاورما',
          cuisine: 'عربي',
          rating: 4.3,
          deliveryTime: '20-30 دقيقة',
          image: 'https://example.com/restaurant6.jpg',
          isOpen: true,
          deliveryFee: 12,
          distance: 2.7,
          reviews: 278,
        },
      ];

      setRestaurants(mockRestaurants);
      setFilteredRestaurants(mockRestaurants);
    } catch (error) {
      setError('فشل في تحميل المطاعم');
      console.error('Error loading restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...restaurants];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(restaurant =>
        restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        restaurant.cuisine.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Selected filters
    if (selectedFilters.length > 0) {
      selectedFilters.forEach(filterId => {
        const filter = filters.find(f => f.id === filterId);
        if (filter) {
          switch (filter.type) {
            case 'cuisine':
              filtered = filtered.filter(r => r.cuisine === filter.value);
              break;
            case 'rating':
              filtered = filtered.filter(r => r.rating >= filter.value);
              break;
            case 'deliveryTime':
              const maxMinutes = parseInt(filter.value.toString().split('-')[1] || filter.value.toString());
              filtered = filtered.filter(r => {
                const time = parseInt(r.deliveryTime.split('-')[1] || r.deliveryTime);
                return time <= maxMinutes;
              });
              break;
            case 'price':
              filtered = filtered.filter(r => r.deliveryFee <= filter.value);
              break;
          }
        }
      });
    }

    setFilteredRestaurants(filtered);
  };

  const toggleFilter = (filterId: string) => {
    setSelectedFilters(prev =>
      prev.includes(filterId)
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRestaurants();
    setRefreshing(false);
  };

  const handleRestaurantPress = (restaurant: Restaurant) => {
    navigation.navigate('RestaurantDetail', { restaurantId: restaurant.id });
  };

  const renderRestaurant = ({ item }: { item: Restaurant }) => (
    <TouchableOpacity
      style={styles.restaurantCard}
      onPress={() => handleRestaurantPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.restaurantImageContainer}>
        <Image source={{ uri: item.image }} style={styles.restaurantImage} />
        {!item.isOpen && (
          <View style={styles.closedOverlay}>
            <Text style={styles.closedText}>مغلق</Text>
          </View>
        )}
        <View style={styles.distanceBadge}>
          <Ionicons name="location-outline" size={12} color="#fff" />
          <Text style={styles.distanceText}>{item.distance} كم</Text>
        </View>
      </View>
      
      <View style={styles.restaurantInfo}>
        <View style={styles.restaurantHeader}>
          <Text style={styles.restaurantName}>{item.name}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.ratingText}>{item.rating}</Text>
            <Text style={styles.reviewsText}>({item.reviews})</Text>
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
      </View>
    </TouchableOpacity>
  );

  const renderFilter = ({ item }: { item: Filter }) => (
    <TouchableOpacity
      style={[
        styles.filterChip,
        selectedFilters.includes(item.id) && styles.filterChipActive,
      ]}
      onPress={() => toggleFilter(item.id)}
    >
      <Text
        style={[
          styles.filterText,
          selectedFilters.includes(item.id) && styles.filterTextActive,
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return <LoadingSpinner fullScreen message="جاري تحميل المطاعم..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        message={error}
        onRetry={loadRestaurants}
        retryText="إعادة المحاولة"
        fullScreen
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث عن مطاعم أو أطباق..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons
            name={showFilters ? "filter" : "filter-outline"}
            size={24}
            color={showFilters ? "#007AFF" : "#666"}
          />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <Text style={styles.filtersTitle}>تصفية حسب:</Text>
          <FlatList
            data={filters}
            renderItem={renderFilter}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersList}
          />
        </View>
      )}

      {/* Results Count */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>
          {filteredRestaurants.length} مطعم متاح
        </Text>
        {selectedFilters.length > 0 && (
          <TouchableOpacity onPress={() => setSelectedFilters([])}>
            <Text style={styles.clearFiltersText}>مسح التصفية</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Restaurants List */}
      <FlatList
        data={filteredRestaurants}
        renderItem={renderRestaurant}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.restaurantsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="restaurant-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>لا توجد مطاعم متاحة</Text>
            <Text style={styles.emptySubtext}>
              جرب تغيير معايير البحث أو التصفية
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 12,
  },
  filterButton: {
    padding: 8,
  },
  filtersContainer: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 16,
    marginBottom: 12,
  },
  filtersList: {
    paddingHorizontal: 16,
  },
  filterChip: {
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  resultsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  resultsText: {
    fontSize: 14,
    color: '#666',
  },
  clearFiltersText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  restaurantsList: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  restaurantCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,

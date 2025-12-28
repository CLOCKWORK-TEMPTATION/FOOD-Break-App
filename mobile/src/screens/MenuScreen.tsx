import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import * as Location from 'expo-location';
import { menuService, recommendationService } from '../services/apiService';

const MenuScreen = ({ route, navigation }) => {
  const { projectData } = route.params;
  const [menuItems, setMenuItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const [orderWindow, setOrderWindow] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);

  useEffect(() => {
    loadMenuItems();
    loadRecommendations();
    checkOrderWindow();

    // تحديث العد التنازلي كل دقيقة
    const timer = setInterval(() => {
      updateTimeRemaining();
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // تحميل عناصر القائمة
  const loadMenuItems = async () => {
    try {
      // محاولة جلب قائمة جغرافية (Location-aware) ثم fallback إلى CORE
      let response;
      try {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (perm.status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          response = await menuService.getGeographicMenu(loc.coords.latitude, loc.coords.longitude, 3);
        }
      } catch (_) {
        // تجاهل - سنسقط إلى CORE
      }

      if (!response) {
        response = await menuService.getMenus({ menuType: 'CORE', isAvailable: true, limit: 50 });
      }

      const apiItems = response?.data?.menuItems || [];
      const normalized = apiItems.map((item) => ({
        id: item.id,
        menuItemId: item.id,
        name: item.nameAr || item.name,
        restaurant: item.restaurant?.name || 'مطعم',
        restaurantId: item.restaurantId,
        price: item.price,
        image: item.imageUrl || 'https://example.com/default.jpg',
        description: item.descriptionAr || item.description || '',
      }));

      setMenuItems(normalized);
    } catch (error) {
      Alert.alert('خطأ', 'فشل في تحميل القائمة');
    }
  };

  // تحميل التوصيات
  const loadRecommendations = async () => {
    try {
      setLoadingRecommendations(true);
      const response = await recommendationService.getRecommendations();
      setRecommendations(response.data || []);
    } catch (error) {
      console.error('فشل في تحميل التوصيات:', error);
      // لا نعرض تنبيه لأن التوصيات اختيارية
    } finally {
      setLoadingRecommendations(false);
    }
  };

  // فحص نافذة الطلب
  const checkOrderWindow = () => {
    const now = new Date();
    const startTime = new Date();
    startTime.setHours(7, 0, 0, 0); // 7 صباحاً
    const endTime = new Date();
    endTime.setHours(9, 0, 0, 0); // 9 صباحاً
    
    setOrderWindow({ startTime, endTime });
    updateTimeRemaining();
  };

  // تحديث الوقت المتبقي
  const updateTimeRemaining = () => {
    if (!orderWindow) return;
    
    const now = new Date();
    const remaining = Math.max(0, orderWindow.endTime - now);
    setTimeRemaining(Math.ceil(remaining / (1000 * 60))); // بالدقائق
  };

  // إضافة عنصر للطلب
  const addToOrder = (item) => {
    if (selectedRestaurantId && item.restaurantId && item.restaurantId !== selectedRestaurantId) {
      Alert.alert('تنبيه', 'يمكنك الطلب من مطعم واحد فقط في نفس الطلب');
      return;
    }

    if (!selectedRestaurantId && item.restaurantId) {
      setSelectedRestaurantId(item.restaurantId);
    }

    const existingItem = selectedItems.find(selected => selected.id === item.id);
    
    if (existingItem) {
      setSelectedItems(selectedItems.map(selected =>
        selected.id === item.id
          ? { ...selected, quantity: selected.quantity + 1 }
          : selected
      ));
    } else {
      setSelectedItems([...selectedItems, { ...item, quantity: 1 }]);
    }
  };

  // إزالة عنصر من الطلب
  const removeFromOrder = (itemId) => {
    const existingItem = selectedItems.find(selected => selected.id === itemId);
    
    if (existingItem && existingItem.quantity > 1) {
      setSelectedItems(selectedItems.map(selected =>
        selected.id === itemId
          ? { ...selected, quantity: selected.quantity - 1 }
          : selected
      ));
    } else {
      const nextItems = selectedItems.filter(selected => selected.id !== itemId);
      setSelectedItems(nextItems);
      if (nextItems.length === 0) {
        setSelectedRestaurantId(null);
      }
    }
  };

  // حساب إجمالي السعر
  const getTotalPrice = () => {
    return selectedItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // تأكيد الطلب
  const confirmOrder = () => {
    if (selectedItems.length === 0) {
      Alert.alert('تنبيه', 'يرجى اختيار عنصر واحد على الأقل');
      return;
    }
    
    if (timeRemaining <= 0) {
      Alert.alert('انتهى الوقت', 'انتهت فترة تقديم الطلبات');
      return;
    }
    
    navigation.navigate('OrderConfirmationScreen', {
      selectedItems,
      totalPrice: getTotalPrice(),
      projectData,
    });
  };

  // عرض عنصر القائمة
  const renderMenuItem = ({ item }) => {
    const selectedItem = selectedItems.find(selected => selected.id === item.id);
    const quantity = selectedItem ? selectedItem.quantity : 0;
    
    return (
      <View style={styles.menuItem}>
        <Image source={{ uri: item.image }} style={styles.itemImage} />
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.restaurantName}>{item.restaurant}</Text>
          <Text style={styles.itemDescription}>{item.description}</Text>
          <Text style={styles.itemPrice}>{item.price} جنيه</Text>
        </View>
        <View style={styles.quantityControls}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => removeFromOrder(item.id)}
            disabled={quantity === 0}
          >
            <Text style={styles.quantityButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.quantity}>{quantity}</Text>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => addToOrder(item)}
          >
            <Text style={styles.quantityButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // عرض التوصية
  const renderRecommendation = ({ item }) => {
    const recommendation = item; // item is the recommendation object

    return (
      <View style={styles.recommendationCard}>
        <View style={styles.recommendationHeader}>
          <Text style={styles.recommendationType}>
            {recommendation.type === 'WEATHER_BASED' && '🌤️ بناءً على الطقس'}
            {recommendation.type === 'PERSONALIZED' && '👤 مخصص لك'}
            {recommendation.type === 'SIMILAR_ITEMS' && '🔄 مشابه لما تفضل'}
            {recommendation.type === 'DIETARY_DIVERSITY' && '🥗 لتنويع غذائك'}
            {recommendation.type === 'TRENDING' && '🔥 شائع الآن'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.recommendedItem}
          onPress={() => addToOrder(recommendation.menuItem)}
        >
          <Image source={{ uri: recommendation.menuItem.imageUrl || 'https://example.com/default.jpg' }} style={styles.recommendedImage} />
          <View style={styles.recommendedInfo}>
            <Text style={styles.recommendedName}>{recommendation.menuItem.name}</Text>
            <Text style={styles.recommendedReason}>{recommendation.reason}</Text>
            <Text style={styles.recommendedPrice}>{recommendation.menuItem.price} جنيه</Text>
          </View>
          <TouchableOpacity style={styles.addButton}>
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* رأس الشاشة */}
      <View style={styles.header}>
        <Text style={styles.projectName}>{projectData.projectName}</Text>
        <Text style={styles.timeRemaining}>
          الوقت المتبقي: {timeRemaining} دقيقة
        </Text>
      </View>

      <ScrollView style={styles.scrollContainer}>
        {/* قسم التوصيات */}
        {recommendations.length > 0 && (
          <View style={styles.recommendationsSection}>
            <Text style={styles.sectionTitle}>توصيات لك</Text>
            <FlatList
              horizontal
              data={recommendations}
              renderItem={renderRecommendation}
              keyExtractor={(item) => item.menuItem.id}
              showsHorizontalScrollIndicator={false}
              style={styles.recommendationsList}
            />
          </View>
        )}

        {/* قسم القائمة */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>القائمة</Text>
          {menuItems.map((item) => (
            <View key={item.id}>
              {renderMenuItem({ item })}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* شريط الطلب */}
      {selectedItems.length > 0 && (
        <View style={styles.orderBar}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderCount}>
              {selectedItems.length} عنصر
            </Text>
            <Text style={styles.totalPrice}>
              {getTotalPrice()} جنيه
            </Text>
          </View>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={confirmOrder}
          >
            <Text style={styles.confirmButtonText}>تأكيد الطلب</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  projectName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  timeRemaining: {
    fontSize: 16,
    color: '#ff6b6b',
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 20,
    marginVertical: 15,
    color: '#333',
  },
  recommendationsSection: {
    marginBottom: 10,
  },
  recommendationsList: {
    paddingHorizontal: 10,
  },
  recommendationCard: {
    backgroundColor: '#fff',
    marginHorizontal: 10,
    borderRadius: 12,
    width: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recommendationHeader: {
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  recommendationType: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontWeight: '600',
  },
  recommendedItem: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
  },
  recommendedImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  recommendedInfo: {
    flex: 1,
  },
  recommendedName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  recommendedReason: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  recommendedPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  menuSection: {
    flex: 1,
  },
  menuList: {
    flex: 1,
  },
  menuItem: {
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 8,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 15,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  restaurantName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  itemDescription: {
    fontSize: 12,
    color: '#888',
    marginBottom: 5,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quantity: {
    marginHorizontal: 15,
    fontSize: 16,
    fontWeight: 'bold',
  },
  orderBar: {
    backgroundColor: '#fff',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  orderInfo: {
    flex: 1,
  },
  orderCount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MenuScreen;
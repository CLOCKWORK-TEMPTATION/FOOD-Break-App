/**
 * شاشة سجل الطلبات
 * عرض جميع الطلبات السابقة والحالية للمستخدم
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import apiService from '../services/apiService';

export default function OrderHistoryScreen({ navigation }) {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    loadOrders();
  }, [selectedFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await apiService.orderService.getUserOrders({
        status: selectedFilter === 'all' ? undefined : selectedFilter,
        limit: 20,
      });
      setOrders(response.data || []);
    } catch (error) {
      Alert.alert('خطأ', error.message || 'فشل تحميل الطلبات');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    const colors = {
      'PENDING': '#FFA500',
      'CONFIRMED': '#4CAF50',
      'PREPARING': '#2196F3',
      'OUT_FOR_DELIVERY': '#9C27B0',
      'DELIVERED': '#4CAF50',
      'CANCELLED': '#F44336',
    };
    return colors[status] || '#666';
  };

  const getStatusText = (status) => {
    const texts = {
      'PENDING': 'قيد الانتظار',
      'CONFIRMED': 'تم التأكيد',
      'PREPARING': 'قيد التحضير',
      'OUT_FOR_DELIVERY': 'في الطريق',
      'DELIVERED': 'تم التسليم',
      'CANCELLED': 'ملغى',
    };
    return texts[status] || status;
  };

  const handleTrackOrder = (orderId) => {
    navigation.navigate('OrderTracking', { orderId });
  };

  const handleReorder = (order) => {
    // إعادة طلب نفس العناصر
    navigation.navigate('MenuScreen', { reorderItems: order.items });
  };

  const renderOrderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => handleTrackOrder(item.id)}
    >
      {/* Order Header */}
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderId}>طلب #{item.id.slice(-6)}</Text>
          <Text style={styles.orderDate}>
            {new Date(item.createdAt).toLocaleDateString('ar-SA')}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      {/* Restaurant Info */}
      <View style={styles.restaurantInfo}>
        <Text style={styles.restaurantName}>{item.restaurant?.name}</Text>
        <Text style={styles.itemCount}>
          {item.items?.length || 0} عناصر • {item.totalAmount} SR
        </Text>
      </View>

      {/* Items Preview */}
      {item.items && item.items.length > 0 && (
        <View style={styles.itemsPreview}>
          {item.items.slice(0, 2).map((itemData, idx) => (
            <Text key={idx} style={styles.itemText}>
              • {itemData.name} x{itemData.quantity}
            </Text>
          ))}
          {item.items.length > 2 && (
            <Text style={styles.moreItems}>
              +{item.items.length - 2} عنصر آخر
            </Text>
          )}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {item.status === 'DELIVERED' && (
          <TouchableOpacity
            style={styles.reorderButton}
            onPress={() => handleReorder(item)}
          >
            <Text style={styles.reorderButtonText}>إعادة طلب</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() => handleTrackOrder(item.id)}
        >
          <Text style={styles.detailsButtonText}>التفاصيل</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const filterButtons = [
    { key: 'all', label: 'الكل' },
    { key: 'PENDING', label: 'قيد الانتظار' },
    { key: 'DELIVERED', label: 'تم التسليم' },
    { key: 'CANCELLED', label: 'ملغى' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>سجل الطلبات</Text>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <FlatList
          data={filterButtons}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedFilter === item.key && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedFilter(item.key)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedFilter === item.key &&
                    styles.filterButtonTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={item => item.key}
          contentContainerStyle={styles.filterContentContainer}
        />
      </View>

      {/* Orders List */}
      {loading && (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
        </View>
      )}

      {!loading && orders.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyTitle}>لا توجد طلبات</Text>
          <Text style={styles.emptyText}>
            ابدأ بطلب جديد للاستمتاع بخدمتنا
          </Text>
          <TouchableOpacity
            style={styles.newOrderButton}
            onPress={() => navigation.navigate('RestaurantList')}
          >
            <Text style={styles.newOrderButtonText}>طلب جديد</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && orders.length > 0 && (
        <FlatList
          data={orders}
          renderItem={renderOrderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={onRefresh}
          scrollEventThrottle={16}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterContentContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterButtonActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  listContainer: {
    padding: 12,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  orderDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  restaurantInfo: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  restaurantName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  itemCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  itemsPreview: {
    marginBottom: 12,
  },
  itemText: {
    fontSize: 12,
    color: '#666',
    marginVertical: 2,
  },
  moreItems: {
    fontSize: 12,
    color: '#FF6B35',
    marginTop: 4,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  reorderButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#FF6B35',
    alignItems: 'center',
  },
  reorderButtonText: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: 'bold',
  },
  detailsButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
  },
  detailsButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  newOrderButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: '#FF6B35',
    borderRadius: 8,
  },
  newOrderButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
  },
});

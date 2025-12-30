/**
 * Active Deliveries Screen
 * شاشة التوصيلات النشطة
 *
 * Shows list of current active deliveries for the driver
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getWebSocket } from '../services/websocketService';
import { fetchActiveDeliveries } from '../services/apiService';

export default function ActiveDeliveriesScreen({ navigation }) {
  const [deliveries, setDeliveries] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeliveries();

    // Listen for WebSocket updates
    const socket = getWebSocket();
    if (socket) {
      socket.on('driver:deliveries', handleDeliveriesUpdate);
      socket.on('delivery:new', handleNewDelivery);
      socket.on('delivery:cancelled', handleCancelledDelivery);
    }

    return () => {
      if (socket) {
        socket.off('driver:deliveries', handleDeliveriesUpdate);
        socket.off('delivery:new', handleNewDelivery);
        socket.off('delivery:cancelled', handleCancelledDelivery);
      }
    };
  }, []);

  const loadDeliveries = async () => {
    try {
      setLoading(true);
      const data = await fetchActiveDeliveries();
      setDeliveries(data);
    } catch (error) {
      console.error('Error loading deliveries:', error);
      Alert.alert('خطأ', 'فشل تحميل التوصيلات');
    } finally {
      setLoading(false);
    }
  };

  const handleDeliveriesUpdate = (data) => {
    setDeliveries(data.deliveries);
  };

  const handleNewDelivery = (delivery) => {
    setDeliveries((prev) => [delivery, ...prev]);
    Alert.alert('توصيل جديد', `طلب جديد من ${delivery.restaurant.name}`);
  };

  const handleCancelledDelivery = (data) => {
    setDeliveries((prev) => prev.filter((d) => d.orderId !== data.orderId));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDeliveries();
    setRefreshing(false);
  };

  const acceptDelivery = async (orderId) => {
    try {
      const socket = getWebSocket();
      if (socket) {
        socket.emit('delivery:accept', { orderId });
        Alert.alert('نجح', 'تم قبول التوصيل');
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل قبول التوصيل');
    }
  };

  const navigateToDetail = (delivery) => {
    navigation.navigate('DeliveryDetail', { delivery });
  };

  const renderDeliveryItem = ({ item }) => (
    <TouchableOpacity
      style={styles.deliveryCard}
      onPress={() => navigateToDetail(item)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.statusBadge(item.status)}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
        <Text style={styles.orderId}>#{item.orderId.substring(0, 8)}</Text>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Ionicons name="restaurant" size={20} color="#667eea" />
          <Text style={styles.infoText}>{item.restaurant.name}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="location" size={20} color="#667eea" />
          <Text style={styles.infoText}>{item.delivery.address}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="person" size={20} color="#667eea" />
          <Text style={styles.infoText}>
            {item.customer.name} - {item.customer.phone}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="cash" size={20} color="#667eea" />
          <Text style={styles.amountText}>{item.totalAmount} جنيه</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        {item.status === 'PENDING' && (
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => acceptDelivery(item.orderId)}
          >
            <Text style={styles.acceptButtonText}>قبول التوصيل</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() => navigateToDetail(item)}
        >
          <Text style={styles.detailsButtonText}>التفاصيل</Text>
          <Ionicons name="chevron-forward" size={20} color="#667eea" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const getStatusText = (status) => {
    const statusMap = {
      PENDING: 'قيد الانتظار',
      CONFIRMED: 'مؤكد',
      PREPARING: 'قيد التحضير',
      OUT_FOR_DELIVERY: 'في الطريق',
      DELIVERED: 'تم التوصيل',
      CANCELLED: 'ملغى',
    };
    return statusMap[status] || status;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>التوصيلات النشطة</Text>
        <View style={styles.deliveryCount}>
          <Text style={styles.countText}>{deliveries.length}</Text>
        </View>
      </View>

      {deliveries.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="bicycle-outline" size={80} color="#ccc" />
          <Text style={styles.emptyText}>لا توجد توصيلات نشطة</Text>
          <Text style={styles.emptySubtext}>ستظهر هنا الطلبات الجديدة</Text>
        </View>
      ) : (
        <FlatList
          data={deliveries}
          renderItem={renderDeliveryItem}
          keyExtractor={(item) => item.orderId}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#667eea',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  deliveryCount: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#667eea',
  },
  listContainer: {
    padding: 15,
  },
  deliveryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
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
  statusBadge: (status) => ({
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor:
      status === 'PREPARING'
        ? '#ffeaa7'
        : status === 'OUT_FOR_DELIVERY'
        ? '#74b9ff'
        : '#dfe6e9',
  }),
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2d3436',
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3436',
  },
  cardBody: {
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#2d3436',
    flex: 1,
  },
  amountText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00b894',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#dfe6e9',
    paddingTop: 15,
  },
  acceptButton: {
    backgroundColor: '#00b894',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  acceptButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsButtonText: {
    color: '#667eea',
    fontWeight: 'bold',
    fontSize: 14,
    marginRight: 5,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#636e72',
    marginTop: 20,
    fontWeight: 'bold',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#b2bec3',
    marginTop: 5,
  },
});

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { restaurantService } from '../services/apiService';

type Restaurant = {
  id: string;
  name: string;
  address: string;
  cuisineType?: string | null;
  rating?: number | null;
  distance?: number | null;
};

interface Props {
  navigation: any;
}

export default function RestaurantListScreen({ navigation }: Props) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNearby = async () => {
    try {
      setLoading(true);
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('تنبيه', 'الرجاء السماح بالوصول للموقع لعرض المطاعم القريبة');
        setRestaurants([]);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const result = await restaurantService.getNearbyRestaurants(loc.coords.latitude, loc.coords.longitude, 3);

      if (result?.success) {
        setRestaurants(result.data || []);
      } else {
        setRestaurants([]);
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل في تحميل المطاعم القريبة');
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNearby();
  }, []);

  const renderItem = ({ item }: { item: Restaurant }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('RestaurantDetail', { restaurantId: item.id })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.rating}>
          {item.rating ? `${item.rating.toFixed(1)} ★` : '—'}
        </Text>
      </View>
      <Text style={styles.meta}>
        {item.cuisineType || 'عام'} • {item.distance != null ? `${item.distance} كم` : '—'}
      </Text>
      <Text style={styles.address} numberOfLines={1}>
        {item.address}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>المطاعم القريبة</Text>
        <TouchableOpacity onPress={loadNearby} style={styles.refreshBtn}>
          <Text style={styles.refreshText}>تحديث</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>جاري التحميل...</Text>
        </View>
      ) : (
        <FlatList
          data={restaurants}
          keyExtractor={(r) => r.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>لا توجد مطاعم ضمن النطاق</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 18, fontWeight: '700', color: '#111' },
  refreshBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  refreshText: { color: '#007AFF', fontWeight: '700' },
  list: { padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '700', color: '#111', flex: 1, paddingRight: 10 },
  rating: { fontSize: 14, fontWeight: '700', color: '#111' },
  meta: { marginTop: 6, fontSize: 12, color: '#666' },
  address: { marginTop: 6, fontSize: 12, color: '#888' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 10, color: '#666' },
  emptyText: { color: '#666' },
});


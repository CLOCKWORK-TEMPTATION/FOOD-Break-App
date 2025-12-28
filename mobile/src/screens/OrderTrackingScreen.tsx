import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { orderService } from '../services/apiService';

const OrderTrackingScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const [orderStatus, setOrderStatus] = useState('confirmed');
  const [driverLocation, setDriverLocation] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [eta, setEta] = useState(30);
  const [region, setRegion] = useState({
    latitude: 30.0444,
    longitude: 31.2357,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  useEffect(() => {
    getUserLocation();
    loadTracking();
    
    // تحديث الموقع كل 30 ثانية
    const locationInterval = setInterval(() => {
      loadTracking();
    }, 30000);
    
    return () => clearInterval(locationInterval);
  }, []);

  // الحصول على موقع المستخدم
  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('خطأ', 'لا يمكن الوصول للموقع');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const userPos = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      
      setUserLocation(userPos);
      setRegion({
        ...userPos,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } catch (error) {
      console.error('خطأ في الحصول على الموقع:', error);
    }
  };

  // تحميل حالة الطلب + التتبع من الـ API
  const loadTracking = async () => {
    try {
      const result = await orderService.getOrderTracking(orderId);
      if (!result?.success) return;

      const status = result.data?.status;
      if (status) {
        const normalized = String(status);
        const mapped =
          normalized === 'OUT_FOR_DELIVERY' ? 'in_transit'
          : normalized === 'CONFIRMED' ? 'confirmed'
          : normalized === 'PREPARING' ? 'preparing'
          : normalized === 'DELIVERED' ? 'delivered'
          : normalized === 'READY' ? 'ready'
          : String(status).toLowerCase();
        setOrderStatus(mapped);
      }

      const latest = result.data?.tracking?.latest;
      if (latest?.latitude && latest?.longitude) {
        setDriverLocation({ latitude: latest.latitude, longitude: latest.longitude });
      }

      if (latest?.etaMinutes) {
        setEta(latest.etaMinutes);
      }
    } catch (error) {
      console.error('خطأ في تحميل التتبع:', error);
    }
  };

  // تحديث يدوي
  const updateDriverLocation = async () => loadTracking();

  // حساب المسافة بين نقطتين
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // نصف قطر الأرض بالكيلومتر
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // رسائل حالة الطلب
  const getStatusMessage = () => {
    const messages = {
      confirmed: 'تم تأكيد طلبك',
      preparing: 'جاري تحضير طلبك',
      ready: 'طلبك جاهز للتوصيل',
      in_transit: 'المندوب في الطريق إليك',
      delivered: 'تم توصيل طلبك',
    };
    
    return messages[orderStatus] || 'جاري معالجة طلبك';
  };

  // لون حالة الطلب
  const getStatusColor = () => {
    const colors = {
      confirmed: '#ffa500',
      preparing: '#ff6b6b',
      ready: '#4ecdc4',
      in_transit: '#007AFF',
      delivered: '#51cf66',
    };
    
    return colors[orderStatus] || '#666';
  };

  return (
    <View style={styles.container}>
      {/* رأس الشاشة */}
      <View style={styles.header}>
        <Text style={styles.title}>تتبع الطلب</Text>
        <Text style={styles.orderId}>رقم الطلب: {orderId}</Text>
      </View>

      {/* حالة الطلب */}
      <View style={styles.statusSection}>
        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
        <View style={styles.statusInfo}>
          <Text style={styles.statusMessage}>{getStatusMessage()}</Text>
          {orderStatus === 'in_transit' && (
            <Text style={styles.etaText}>
              الوقت المتوقع للوصول: {eta} دقيقة
            </Text>
          )}
        </View>
      </View>

      {/* الخريطة */}
      {userLocation && (
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            region={region}
            onRegionChangeComplete={setRegion}
          >
            {/* موقع المستخدم */}
            <Marker
              coordinate={userLocation}
              title="موقعك"
              description="موقع التسليم"
              pinColor="blue"
            />
            
            {/* موقع المندوب */}
            {driverLocation && (
              <Marker
                coordinate={driverLocation}
                title="المندوب"
                description="موقع مندوب التوصيل"
                pinColor="red"
              />
            )}
            
            {/* خط المسار */}
            {driverLocation && (
              <Polyline
                coordinates={[driverLocation, userLocation]}
                strokeColor="#007AFF"
                strokeWidth={3}
                lineDashPattern={[5, 5]}
              />
            )}
          </MapView>
        </View>
      )}

      {/* معلومات إضافية */}
      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>حالة الطلب:</Text>
          <Text style={[styles.infoValue, { color: getStatusColor() }]}>
            {getStatusMessage()}
          </Text>
        </View>
        
        {orderStatus === 'in_transit' && (
          <>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>الوقت المتوقع:</Text>
              <Text style={styles.infoValue}>{eta} دقيقة</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>رقم المندوب:</Text>
              <Text style={styles.infoValue}>01234567890</Text>
            </View>
          </>
        )}
      </View>

      {/* أزرار التحكم */}
      <View style={styles.buttonSection}>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={updateDriverLocation}
        >
          <Text style={styles.refreshButtonText}>تحديث الموقع</Text>
        </TouchableOpacity>
        
        {orderStatus === 'in_transit' && (
          <TouchableOpacity
            style={styles.callButton}
            onPress={() => Alert.alert('اتصال', 'سيتم الاتصال بالمندوب')}
          >
            <Text style={styles.callButtonText}>اتصال بالمندوب</Text>
          </TouchableOpacity>
        )}
      </View>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  orderId: {
    fontSize: 16,
    color: '#666',
  },
  statusSection: {
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 8,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 15,
  },
  statusInfo: {
    flex: 1,
  },
  statusMessage: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  etaText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  mapContainer: {
    flex: 1,
    margin: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  infoSection: {
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 8,
    padding: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonSection: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
  },
  refreshButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  callButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  callButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default OrderTrackingScreen;
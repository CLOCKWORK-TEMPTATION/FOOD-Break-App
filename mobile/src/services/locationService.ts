import * as Location from 'expo-location';
import { Alert } from 'react-native';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

export interface LocationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: Location.PermissionStatus;
}

class LocationService {
  private currentLocation: LocationData | null = null;
  private watchSubscription: Location.LocationSubscription | null = null;
  private isTracking: boolean = false;

  // طلب إذن الوصول للموقع
  async requestLocationPermission(): Promise<LocationPermissionStatus> {
    try {
      // التحقق من الإذن الحالي
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      
      if (existingStatus === 'granted') {
        return {
          granted: true,
          canAskAgain: true,
          status: existingStatus
        };
      }

      // طلب الإذن إذا لم يكن ممنوحاً
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
      
      return {
        granted: status === 'granted',
        canAskAgain,
        status
      };
    } catch (error) {
      console.error('خطأ في طلب إذن الموقع:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: Location.PermissionStatus.DENIED
      };
    }
  }

  // الحصول على الموقع الحالي
  async getCurrentLocation(): Promise<LocationData | null> {
    try {
      const permission = await this.requestLocationPermission();
      
      if (!permission.granted) {
        Alert.alert(
          'إذن الموقع مطلوب',
          'يحتاج التطبيق للوصول لموقعك لإظهار المطاعم القريبة وتتبع التوصيل.',
          [{ text: 'موافق' }]
        );
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10
      });

      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || undefined,
        timestamp: location.timestamp
      };

      this.currentLocation = locationData;
      return locationData;
    } catch (error) {
      console.error('خطأ في الحصول على الموقع:', error);
      Alert.alert('خطأ', 'لا يمكن الحصول على موقعك الحالي');
      return null;
    }
  }

  // بدء تتبع الموقع المستمر
  async startLocationTracking(
    onLocationUpdate: (location: LocationData) => void,
    options?: {
      accuracy?: Location.Accuracy;
      timeInterval?: number;
      distanceInterval?: number;
    }
  ): Promise<boolean> {
    try {
      const permission = await this.requestLocationPermission();
      
      if (!permission.granted) {
        return false;
      }

      if (this.isTracking) {
        await this.stopLocationTracking();
      }

      const defaultOptions = {
        accuracy: Location.Accuracy.High,
        timeInterval: 10000, // 10 ثواني
        distanceInterval: 50, // 50 متر
        ...options
      };

      this.watchSubscription = await Location.watchPositionAsync(
        defaultOptions,
        (location) => {
          const locationData: LocationData = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy || undefined,
            timestamp: location.timestamp
          };

          this.currentLocation = locationData;
          onLocationUpdate(locationData);
        }
      );

      this.isTracking = true;
      return true;
    } catch (error) {
      console.error('خطأ في بدء تتبع الموقع:', error);
      return false;
    }
  }

  // إيقاف تتبع الموقع
  async stopLocationTracking(): Promise<void> {
    try {
      if (this.watchSubscription) {
        this.watchSubscription.remove();
        this.watchSubscription = null;
      }
      this.isTracking = false;
    } catch (error) {
      console.error('خطأ في إيقاف تتبع الموقع:', error);
    }
  }

  // حساب المسافة بين نقطتين (بالكيلومتر)
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // نصف قطر الأرض بالكيلومتر
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 100) / 100; // تقريب لرقمين عشريين
  }

  // تحويل الدرجات إلى راديان
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // الحصول على المطاعم القريبة بناءً على الموقع
  async getNearbyRestaurants(radius: number = 3): Promise<any[]> {
    try {
      const location = await this.getCurrentLocation();
      
      if (!location) {
        throw new Error('لا يمكن الحصول على الموقع الحالي');
      }

      // هنا يمكن استدعاء API للحصول على المطاعم القريبة
      // const apiService = require('./apiService').default;
      // return await apiService.getNearbyRestaurants(location.latitude, location.longitude, radius);
      
      return [];
    } catch (error) {
      console.error('خطأ في الحصول على المطاعم القريبة:', error);
      throw error;
    }
  }

  // تحديد ما إذا كان المطعم ضمن النطاق المسموح
  isRestaurantInRange(
    restaurantLat: number,
    restaurantLon: number,
    maxDistance: number = 3
  ): boolean {
    if (!this.currentLocation) {
      return false;
    }

    const distance = this.calculateDistance(
      this.currentLocation.latitude,
      this.currentLocation.longitude,
      restaurantLat,
      restaurantLon
    );

    return distance <= maxDistance;
  }

  // تقدير وقت الوصول بناءً على المسافة
  estimateDeliveryTime(
    restaurantLat: number,
    restaurantLon: number,
    averageSpeed: number = 30 // كم/ساعة
  ): number {
    if (!this.currentLocation) {
      return 0;
    }

    const distance = this.calculateDistance(
      this.currentLocation.latitude,
      this.currentLocation.longitude,
      restaurantLat,
      restaurantLon
    );

    // حساب الوقت بالدقائق (مسافة / سرعة * 60 + وقت إضافي للتحضير)
    const travelTime = (distance / averageSpeed) * 60;
    const preparationTime = 20; // 20 دقيقة للتحضير
    
    return Math.round(travelTime + preparationTime);
  }

  // الحصول على الموقع المحفوظ
  getCurrentLocationData(): LocationData | null {
    return this.currentLocation;
  }

  // التحقق من حالة التتبع
  isCurrentlyTracking(): boolean {
    return this.isTracking;
  }

  // تنسيق الموقع للعرض
  formatLocationForDisplay(location: LocationData): string {
    return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
  }

  // الحصول على عنوان تقريبي من الإحداثيات
  async reverseGeocode(latitude: number, longitude: number): Promise<string> {
    try {
      const result = await Location.reverseGeocodeAsync({
        latitude,
        longitude
      });

      if (result && result.length > 0) {
        const address = result[0];
        const parts = [
          address.name,
          address.street,
          address.district,
          address.city,
          address.region
        ].filter(Boolean);

        return parts.join(', ') || 'عنوان غير محدد';
      }

      return 'عنوان غير محدد';
    } catch (error) {
      console.error('خطأ في الحصول على العنوان:', error);
      return 'عنوان غير محدد';
    }
  }
}

// إنشاء مثيل واحد من الخدمة
const locationService = new LocationService();

export default locationService;
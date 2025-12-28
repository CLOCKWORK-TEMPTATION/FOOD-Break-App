/**
 * اختبارات شاملة لخدمة الموقع
 * Comprehensive tests for Location Service
 */

import * as Location from 'expo-location';
import { Alert } from 'react-native';
import locationService, { LocationData, LocationPermissionStatus } from '../locationService';

// Mock expo-location
jest.mock('expo-location');
jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
}));

describe('LocationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset service state
    (locationService as any).currentLocation = null;
    (locationService as any).watchSubscription = null;
    (locationService as any).isTracking = false;
  });

  // ==========================================
  // Permission Tests
  // ==========================================
  describe('Permission Management', () => {
    describe('requestLocationPermission', () => {
      it('should return granted permission when already granted', async () => {
        (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValueOnce({
          status: 'granted',
        });

        const result = await locationService.requestLocationPermission();

        expect(result.granted).toBe(true);
        expect(result.status).toBe('granted');
        expect(Location.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
      });

      it('should request permission when not granted', async () => {
        (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValueOnce({
          status: 'undetermined',
        });
        (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValueOnce({
          status: 'granted',
          canAskAgain: true,
        });

        const result = await locationService.requestLocationPermission();

        expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalled();
        expect(result.granted).toBe(true);
        expect(result.canAskAgain).toBe(true);
      });

      it('should handle permission denial', async () => {
        (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValueOnce({
          status: 'denied',
        });
        (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValueOnce({
          status: 'denied',
          canAskAgain: false,
        });

        const result = await locationService.requestLocationPermission();

        expect(result.granted).toBe(false);
        expect(result.canAskAgain).toBe(false);
        expect(result.status).toBe('denied');
      });

      it('should handle errors in permission request', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        (Location.getForegroundPermissionsAsync as jest.Mock).mockRejectedValueOnce(
          new Error('Permission error')
        );

        const result = await locationService.requestLocationPermission();

        expect(result.granted).toBe(false);
        expect(result.canAskAgain).toBe(false);
        expect(result.status).toBe(Location.PermissionStatus.DENIED);
        expect(consoleErrorSpy).toHaveBeenCalled();
        consoleErrorSpy.mockRestore();
      });
    });
  });

  // ==========================================
  // Get Current Location Tests
  // ==========================================
  describe('getCurrentLocation', () => {
    it('should get current location when permission granted', async () => {
      const mockLocation = {
        coords: {
          latitude: 30.0444,
          longitude: 31.2357,
          accuracy: 20,
        },
        timestamp: Date.now(),
      };

      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'granted',
      });
      (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValueOnce(mockLocation);

      const result = await locationService.getCurrentLocation();

      expect(Location.getCurrentPositionAsync).toHaveBeenCalledWith({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      });
      expect(result).toEqual({
        latitude: mockLocation.coords.latitude,
        longitude: mockLocation.coords.longitude,
        accuracy: mockLocation.coords.accuracy,
        timestamp: mockLocation.timestamp,
      });
    });

    it('should return null and show alert when permission denied', async () => {
      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'denied',
      });
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'denied',
        canAskAgain: false,
      });

      const result = await locationService.getCurrentLocation();

      expect(result).toBeNull();
      expect(Alert.alert).toHaveBeenCalledWith(
        'إذن الموقع مطلوب',
        expect.any(String),
        expect.any(Array)
      );
    });

    it('should handle location retrieval errors', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'granted',
      });
      (Location.getCurrentPositionAsync as jest.Mock).mockRejectedValueOnce(
        new Error('Location error')
      );

      const result = await locationService.getCurrentLocation();

      expect(result).toBeNull();
      expect(Alert.alert).toHaveBeenCalledWith('خطأ', expect.any(String));
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should store location in currentLocation property', async () => {
      const mockLocation = {
        coords: {
          latitude: 30.0444,
          longitude: 31.2357,
          accuracy: 15,
        },
        timestamp: Date.now(),
      };

      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'granted',
      });
      (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValueOnce(mockLocation);

      await locationService.getCurrentLocation();

      const storedLocation = (locationService as any).currentLocation;
      expect(storedLocation).not.toBeNull();
      expect(storedLocation.latitude).toBe(mockLocation.coords.latitude);
    });

    it('should handle location without accuracy', async () => {
      const mockLocation = {
        coords: {
          latitude: 30.0444,
          longitude: 31.2357,
          accuracy: null,
        },
        timestamp: Date.now(),
      };

      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'granted',
      });
      (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValueOnce(mockLocation);

      const result = await locationService.getCurrentLocation();

      expect(result?.accuracy).toBeUndefined();
    });
  });

  // ==========================================
  // Location Tracking Tests
  // ==========================================
  describe('startLocationTracking', () => {
    it('should start tracking with default options', async () => {
      const mockSubscription = { remove: jest.fn() };
      const onLocationUpdate = jest.fn();

      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'granted',
      });
      (Location.watchPositionAsync as jest.Mock).mockResolvedValueOnce(mockSubscription);

      const result = await locationService.startLocationTracking(onLocationUpdate);

      expect(result).toBe(true);
      expect(Location.watchPositionAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          accuracy: Location.Accuracy.High,
          timeInterval: 10000,
          distanceInterval: 50,
        }),
        expect.any(Function)
      );
    });

    it('should start tracking with custom options', async () => {
      const mockSubscription = { remove: jest.fn() };
      const onLocationUpdate = jest.fn();
      const customOptions = {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
        distanceInterval: 25,
      };

      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'granted',
      });
      (Location.watchPositionAsync as jest.Mock).mockResolvedValueOnce(mockSubscription);

      await locationService.startLocationTracking(onLocationUpdate, customOptions);

      expect(Location.watchPositionAsync).toHaveBeenCalledWith(
        expect.objectContaining(customOptions),
        expect.any(Function)
      );
    });

    it('should call onLocationUpdate callback when location changes', async () => {
      const mockSubscription = { remove: jest.fn() };
      const onLocationUpdate = jest.fn();
      let watchCallback: (location: any) => void;

      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'granted',
      });
      (Location.watchPositionAsync as jest.Mock).mockImplementationOnce(
        (options, callback) => {
          watchCallback = callback;
          return Promise.resolve(mockSubscription);
        }
      );

      await locationService.startLocationTracking(onLocationUpdate);

      const mockLocation = {
        coords: {
          latitude: 30.0444,
          longitude: 31.2357,
          accuracy: 10,
        },
        timestamp: Date.now(),
      };

      watchCallback!(mockLocation);

      expect(onLocationUpdate).toHaveBeenCalledWith({
        latitude: mockLocation.coords.latitude,
        longitude: mockLocation.coords.longitude,
        accuracy: mockLocation.coords.accuracy,
        timestamp: mockLocation.timestamp,
      });
    });

    it('should stop existing tracking before starting new one', async () => {
      const oldSubscription = { remove: jest.fn() };
      const newSubscription = { remove: jest.fn() };
      const onLocationUpdate = jest.fn();

      (locationService as any).watchSubscription = oldSubscription;
      (locationService as any).isTracking = true;

      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'granted',
      });
      (Location.watchPositionAsync as jest.Mock).mockResolvedValueOnce(newSubscription);

      await locationService.startLocationTracking(onLocationUpdate);

      expect(oldSubscription.remove).toHaveBeenCalled();
    });

    it('should return false when permission denied', async () => {
      const onLocationUpdate = jest.fn();

      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'denied',
      });
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'denied',
        canAskAgain: false,
      });

      const result = await locationService.startLocationTracking(onLocationUpdate);

      expect(result).toBe(false);
      expect(Location.watchPositionAsync).not.toHaveBeenCalled();
    });

    it('should handle tracking start errors', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const onLocationUpdate = jest.fn();

      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'granted',
      });
      (Location.watchPositionAsync as jest.Mock).mockRejectedValueOnce(
        new Error('Tracking error')
      );

      const result = await locationService.startLocationTracking(onLocationUpdate);

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('stopLocationTracking', () => {
    it('should stop active tracking', async () => {
      const mockSubscription = { remove: jest.fn() };
      (locationService as any).watchSubscription = mockSubscription;
      (locationService as any).isTracking = true;

      await locationService.stopLocationTracking();

      expect(mockSubscription.remove).toHaveBeenCalled();
      expect((locationService as any).watchSubscription).toBeNull();
      expect((locationService as any).isTracking).toBe(false);
    });

    it('should handle stop when no active tracking', async () => {
      (locationService as any).watchSubscription = null;
      (locationService as any).isTracking = false;

      await expect(locationService.stopLocationTracking()).resolves.not.toThrow();
    });

    it('should handle errors when stopping tracking', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const mockSubscription = {
        remove: jest.fn(() => {
          throw new Error('Remove error');
        }),
      };
      (locationService as any).watchSubscription = mockSubscription;

      await locationService.stopLocationTracking();

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  // ==========================================
  // Distance Calculation Tests
  // ==========================================
  describe('calculateDistance', () => {
    it('should calculate distance between two points correctly', () => {
      // Cairo to Alexandria (approximately 180 km)
      const lat1 = 30.0444;
      const lon1 = 31.2357;
      const lat2 = 31.2001;
      const lon2 = 29.9187;

      const distance = locationService.calculateDistance(lat1, lon1, lat2, lon2);

      // Allow some margin of error
      expect(distance).toBeGreaterThan(170);
      expect(distance).toBeLessThan(190);
    });

    it('should return 0 for identical coordinates', () => {
      const lat = 30.0444;
      const lon = 31.2357;

      const distance = locationService.calculateDistance(lat, lon, lat, lon);

      expect(distance).toBe(0);
    });

    it('should calculate short distances accurately', () => {
      // Very close points (about 1km)
      const lat1 = 30.0444;
      const lon1 = 31.2357;
      const lat2 = 30.0534;
      const lon2 = 31.2357;

      const distance = locationService.calculateDistance(lat1, lon1, lat2, lon2);

      expect(distance).toBeGreaterThan(0.5);
      expect(distance).toBeLessThan(1.5);
    });

    it('should calculate long distances correctly', () => {
      // Cairo to New York (approximately 9000 km)
      const lat1 = 30.0444;
      const lon1 = 31.2357;
      const lat2 = 40.7128;
      const lon2 = -74.0060;

      const distance = locationService.calculateDistance(lat1, lon1, lat2, lon2);

      expect(distance).toBeGreaterThan(8500);
      expect(distance).toBeLessThan(9500);
    });

    it('should handle negative coordinates', () => {
      const lat1 = -33.8688; // Sydney
      const lon1 = 151.2093;
      const lat2 = 51.5074; // London
      const lon2 = -0.1278;

      const distance = locationService.calculateDistance(lat1, lon1, lat2, lon2);

      expect(distance).toBeGreaterThan(15000); // Should be approximately 17,000 km
    });

    it('should round result to 2 decimal places', () => {
      const distance = locationService.calculateDistance(
        30.0444, 31.2357,
        30.0500, 31.2400
      );

      // Check that result has at most 2 decimal places
      const decimalPlaces = (distance.toString().split('.')[1] || '').length;
      expect(decimalPlaces).toBeLessThanOrEqual(2);
    });
  });

  // ==========================================
  // Restaurant Operations Tests
  // ==========================================
  describe('getNearbyRestaurants', () => {
    it('should get nearby restaurants with default radius', async () => {
      const mockLocation = {
        coords: { latitude: 30.0444, longitude: 31.2357 },
        timestamp: Date.now(),
      };

      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'granted',
      });
      (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValueOnce(mockLocation);

      const result = await locationService.getNearbyRestaurants();

      expect(result).toEqual([]);
      expect(Location.getCurrentPositionAsync).toHaveBeenCalled();
    });

    it('should throw error when location cannot be obtained', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'denied',
      });
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'denied',
        canAskAgain: false,
      });

      await expect(locationService.getNearbyRestaurants()).rejects.toThrow(
        'لا يمكن الحصول على الموقع الحالي'
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe('isRestaurantInRange', () => {
    it('should return true for restaurant within range', () => {
      (locationService as any).currentLocation = {
        latitude: 30.0444,
        longitude: 31.2357,
        timestamp: Date.now(),
      };

      const result = locationService.isRestaurantInRange(30.0500, 31.2400, 3);

      expect(result).toBe(true);
    });

    it('should return false for restaurant outside range', () => {
      (locationService as any).currentLocation = {
        latitude: 30.0444,
        longitude: 31.2357,
        timestamp: Date.now(),
      };

      const result = locationService.isRestaurantInRange(31.2001, 29.9187, 3);

      expect(result).toBe(false);
    });

    it('should return false when current location not set', () => {
      (locationService as any).currentLocation = null;

      const result = locationService.isRestaurantInRange(30.0444, 31.2357);

      expect(result).toBe(false);
    });

    it('should use default max distance of 3km', () => {
      (locationService as any).currentLocation = {
        latitude: 30.0444,
        longitude: 31.2357,
        timestamp: Date.now(),
      };

      // Point about 2km away
      const result = locationService.isRestaurantInRange(30.0624, 31.2357);

      expect(result).toBe(true);
    });
  });

  describe('estimateDeliveryTime', () => {
    it('should estimate delivery time correctly', () => {
      (locationService as any).currentLocation = {
        latitude: 30.0444,
        longitude: 31.2357,
        timestamp: Date.now(),
      };

      // Restaurant about 3km away, at 30 km/h = 6 minutes + 20 prep = 26 minutes
      const time = locationService.estimateDeliveryTime(30.0714, 31.2357, 30);

      expect(time).toBeGreaterThan(20);
      expect(time).toBeLessThan(35);
    });

    it('should return 0 when current location not set', () => {
      (locationService as any).currentLocation = null;

      const time = locationService.estimateDeliveryTime(30.0444, 31.2357);

      expect(time).toBe(0);
    });

    it('should use custom average speed', () => {
      (locationService as any).currentLocation = {
        latitude: 30.0444,
        longitude: 31.2357,
        timestamp: Date.now(),
      };

      const time1 = locationService.estimateDeliveryTime(30.0714, 31.2357, 20);
      const time2 = locationService.estimateDeliveryTime(30.0714, 31.2357, 40);

      // Slower speed should result in longer time
      expect(time1).toBeGreaterThan(time2);
    });

    it('should include preparation time', () => {
      (locationService as any).currentLocation = {
        latitude: 30.0444,
        longitude: 31.2357,
        timestamp: Date.now(),
      };

      // Same location = 0 travel time, but should still have 20 min prep
      const time = locationService.estimateDeliveryTime(30.0444, 31.2357);

      expect(time).toBe(20);
    });

    it('should round to nearest minute', () => {
      (locationService as any).currentLocation = {
        latitude: 30.0444,
        longitude: 31.2357,
        timestamp: Date.now(),
      };

      const time = locationService.estimateDeliveryTime(30.0500, 31.2400, 30);

      expect(Number.isInteger(time)).toBe(true);
    });
  });

  // ==========================================
  // Utility Methods Tests
  // ==========================================
  describe('getCurrentLocationData', () => {
    it('should return stored location data', () => {
      const mockData: LocationData = {
        latitude: 30.0444,
        longitude: 31.2357,
        accuracy: 15,
        timestamp: Date.now(),
      };
      (locationService as any).currentLocation = mockData;

      const result = locationService.getCurrentLocationData();

      expect(result).toEqual(mockData);
    });

    it('should return null when no location stored', () => {
      (locationService as any).currentLocation = null;

      const result = locationService.getCurrentLocationData();

      expect(result).toBeNull();
    });
  });

  describe('isCurrentlyTracking', () => {
    it('should return true when tracking is active', () => {
      (locationService as any).isTracking = true;

      expect(locationService.isCurrentlyTracking()).toBe(true);
    });

    it('should return false when tracking is not active', () => {
      (locationService as any).isTracking = false;

      expect(locationService.isCurrentlyTracking()).toBe(false);
    });
  });

  describe('formatLocationForDisplay', () => {
    it('should format location with 6 decimal places', () => {
      const location: LocationData = {
        latitude: 30.044442,
        longitude: 31.235733,
        timestamp: Date.now(),
      };

      const formatted = locationService.formatLocationForDisplay(location);

      expect(formatted).toBe('30.044442, 31.235733');
    });

    it('should handle very precise coordinates', () => {
      const location: LocationData = {
        latitude: 30.12345678,
        longitude: 31.98765432,
        timestamp: Date.now(),
      };

      const formatted = locationService.formatLocationForDisplay(location);

      // Should round to 6 decimal places
      expect(formatted).toBe('30.123457, 31.987654');
    });
  });

  describe('reverseGeocode', () => {
    it('should return formatted address from coordinates', async () => {
      const mockAddress = [
        {
          name: 'Building 123',
          street: 'Main Street',
          district: 'Downtown',
          city: 'Cairo',
          region: 'Cairo Governorate',
        },
      ];

      (Location.reverseGeocodeAsync as jest.Mock).mockResolvedValueOnce(mockAddress);

      const result = await locationService.reverseGeocode(30.0444, 31.2357);

      expect(result).toBe('Building 123, Main Street, Downtown, Cairo, Cairo Governorate');
    });

    it('should filter out null/undefined address parts', async () => {
      const mockAddress = [
        {
          name: 'Building 123',
          street: null,
          district: 'Downtown',
          city: null,
          region: 'Cairo',
        },
      ];

      (Location.reverseGeocodeAsync as jest.Mock).mockResolvedValueOnce(mockAddress);

      const result = await locationService.reverseGeocode(30.0444, 31.2357);

      expect(result).toBe('Building 123, Downtown, Cairo');
    });

    it('should return default message when no address found', async () => {
      (Location.reverseGeocodeAsync as jest.Mock).mockResolvedValueOnce([]);

      const result = await locationService.reverseGeocode(30.0444, 31.2357);

      expect(result).toBe('عنوان غير محدد');
    });

    it('should handle geocoding errors', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (Location.reverseGeocodeAsync as jest.Mock).mockRejectedValueOnce(
        new Error('Geocoding failed')
      );

      const result = await locationService.reverseGeocode(30.0444, 31.2357);

      expect(result).toBe('عنوان غير محدد');
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should handle null result from geocoding', async () => {
      (Location.reverseGeocodeAsync as jest.Mock).mockResolvedValueOnce(null);

      const result = await locationService.reverseGeocode(30.0444, 31.2357);

      expect(result).toBe('عنوان غير محدد');
    });
  });

  // ==========================================
  // Edge Cases Tests
  // ==========================================
  describe('Edge Cases', () => {
    it('should handle extreme latitude values', () => {
      const distance1 = locationService.calculateDistance(90, 0, -90, 0);
      expect(distance1).toBeGreaterThan(19000); // Approximately half Earth's circumference

      const distance2 = locationService.calculateDistance(0, 0, 0, 180);
      expect(distance2).toBeGreaterThan(19000);
    });

    it('should handle location updates with missing accuracy', async () => {
      const mockSubscription = { remove: jest.fn() };
      const onLocationUpdate = jest.fn();
      let watchCallback: (location: any) => void;

      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'granted',
      });
      (Location.watchPositionAsync as jest.Mock).mockImplementationOnce(
        (options, callback) => {
          watchCallback = callback;
          return Promise.resolve(mockSubscription);
        }
      );

      await locationService.startLocationTracking(onLocationUpdate);

      const mockLocation = {
        coords: {
          latitude: 30.0444,
          longitude: 31.2357,
          accuracy: null,
        },
        timestamp: Date.now(),
      };

      watchCallback!(mockLocation);

      expect(onLocationUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          accuracy: undefined,
        })
      );
    });

    it('should handle concurrent permission requests', async () => {
      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'undetermined',
      });
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
        canAskAgain: true,
      });

      const [result1, result2] = await Promise.all([
        locationService.requestLocationPermission(),
        locationService.requestLocationPermission(),
      ]);

      expect(result1.granted).toBe(true);
      expect(result2.granted).toBe(true);
    });

    it('should handle zero distance calculations', () => {
      (locationService as any).currentLocation = {
        latitude: 30.0444,
        longitude: 31.2357,
        timestamp: Date.now(),
      };

      const distance = locationService.calculateDistance(
        30.0444, 31.2357,
        30.0444, 31.2357
      );

      expect(distance).toBe(0);
    });
  });
});

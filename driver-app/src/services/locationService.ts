/**
 * Location Service for Driver App
 * خدمة الموقع لتطبيق السائق
 *
 * Handles GPS tracking and location updates
 */

import * as Location from 'expo-location';
import { updateDriverLocation } from './websocketService';

let locationSubscription: Location.LocationSubscription | null = null;
let currentOrderId: string | null = null;

/**
 * Start tracking driver location
 */
export async function startLocationTracking(driverId: string): Promise<void> {
  try {
    // Request permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.error('Location permission not granted');
      return;
    }

    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus !== 'granted') {
      console.warn('Background location permission not granted');
    }

    // Start watching position
    locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000, // Update every 5 seconds
        distanceInterval: 10, // Or every 10 meters
      },
      (location) => {
        handleLocationUpdate(location);
      }
    );

    console.log('Location tracking started');
  } catch (error) {
    console.error('Error starting location tracking:', error);
  }
}

/**
 * Stop location tracking
 */
export function stopLocationTracking(): void {
  if (locationSubscription) {
    locationSubscription.remove();
    locationSubscription = null;
    console.log('Location tracking stopped');
  }
}

/**
 * Handle location update
 */
function handleLocationUpdate(location: Location.LocationObject): void {
  const { latitude, longitude, heading, speed } = location.coords;

  console.log('Location update:', { latitude, longitude });

  // If there's an active order, send location to server
  if (currentOrderId) {
    updateDriverLocation({
      orderId: currentOrderId,
      latitude,
      longitude,
      heading: heading || undefined,
      speed: speed || undefined,
    });
  }
}

/**
 * Set current active order for tracking
 */
export function setActiveOrder(orderId: string | null): void {
  currentOrderId = orderId;
  console.log('Active order set:', orderId);
}

/**
 * Get current location once
 */
export async function getCurrentLocation(): Promise<Location.LocationObject | null> {
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    return location;
  } catch (error) {
    console.error('Error getting current location:', error);
    return null;
  }
}

export default {
  startLocationTracking,
  stopLocationTracking,
  setActiveOrder,
  getCurrentLocation,
};

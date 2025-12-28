/**
 * Tests for GPS Tracking Service
 */

jest.mock('@prisma/client');

const { PrismaClient } = require('@prisma/client');
const gpsTrackingService = require('../gpsTrackingService');

describe('GPS Tracking Service', () => {
  let mockPrisma;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPrisma = {
      deliveryTracking: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn()
      },
      order: {
        findUnique: jest.fn(),
        update: jest.fn()
      }
    };

    PrismaClient.mockImplementation(() => mockPrisma);
  });

  describe('recordOrderTrackingPoint', () => {
    it('should record tracking point successfully', async () => {
      const orderId = 'order123';
      const location = { latitude: 30.0444, longitude: 31.2357 };

      mockPrisma.order.findUnique.mockResolvedValue({
        id: orderId,
        deliveryLat: 30.0626,
        deliveryLng: 31.2497
      });

      mockPrisma.deliveryTracking.create.mockResolvedValue({
        id: 'tracking123',
        orderId,
        latitude: location.latitude,
        longitude: location.longitude
      });

      const result = await gpsTrackingService.recordOrderTrackingPoint(
        orderId,
        location
      );

      expect(result).toHaveProperty('trackingId');
      expect(result).toHaveProperty('etaMinutes');
    });

    it('should calculate ETA when destination available', async () => {
      const orderId = 'order123';
      const location = { latitude: 30.0444, longitude: 31.2357 };

      mockPrisma.order.findUnique.mockResolvedValue({
        id: orderId,
        deliveryLat: 30.0626,
        deliveryLng: 31.2497
      });

      mockPrisma.deliveryTracking.create.mockResolvedValue({
        id: 'tracking123',
        orderId,
        ...location
      });

      const result = await gpsTrackingService.recordOrderTrackingPoint(
        orderId,
        location
      );

      expect(result.etaMinutes).toBeGreaterThanOrEqual(0);
    });

    it('should handle missing order', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(
        gpsTrackingService.recordOrderTrackingPoint('invalid_order', {
          latitude: 30.0,
          longitude: 31.0
        })
      ).rejects.toThrow();
    });
  });

  describe('getOrderTracking', () => {
    it('should get order tracking history', async () => {
      const orderId = 'order123';

      mockPrisma.deliveryTracking.findMany.mockResolvedValue([
        {
          id: 'track1',
          orderId,
          latitude: 30.0444,
          longitude: 31.2357,
          createdAt: new Date()
        },
        {
          id: 'track2',
          orderId,
          latitude: 30.0500,
          longitude: 31.2400,
          createdAt: new Date()
        }
      ]);

      const tracking = await gpsTrackingService.getOrderTracking(orderId);

      expect(Array.isArray(tracking)).toBe(true);
      expect(tracking.length).toBe(2);
    });

    it('should return empty array when no tracking exists', async () => {
      mockPrisma.deliveryTracking.findMany.mockResolvedValue([]);

      const tracking = await gpsTrackingService.getOrderTracking('order123');

      expect(Array.isArray(tracking)).toBe(true);
      expect(tracking.length).toBe(0);
    });
  });

  describe('getCurrentLocation', () => {
    it('should get current (latest) location', async () => {
      const orderId = 'order123';

      mockPrisma.deliveryTracking.findFirst.mockResolvedValue({
        id: 'track1',
        orderId,
        latitude: 30.0500,
        longitude: 31.2400,
        createdAt: new Date()
      });

      const location = await gpsTrackingService.getCurrentLocation(orderId);

      expect(location).toHaveProperty('latitude');
      expect(location).toHaveProperty('longitude');
    });

    it('should return null when no tracking exists', async () => {
      mockPrisma.deliveryTracking.findFirst.mockResolvedValue(null);

      const location = await gpsTrackingService.getCurrentLocation('order123');

      expect(location).toBeNull();
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two points', () => {
      const point1 = { latitude: 30.0444, longitude: 31.2357 };
      const point2 = { latitude: 30.0626, longitude: 31.2497 };

      const distance = gpsTrackingService.calculateDistance(point1, point2);

      expect(typeof distance).toBe('number');
      expect(distance).toBeGreaterThan(0);
    });

    it('should return 0 for same points', () => {
      const point = { latitude: 30.0444, longitude: 31.2357 };

      const distance = gpsTrackingService.calculateDistance(point, point);

      expect(distance).toBe(0);
    });
  });

  describe('estimateArrivalTime', () => {
    it('should estimate arrival time based on distance', () => {
      const distance = 5; // 5 km
      const avgSpeed = 30; // 30 km/h

      const eta = gpsTrackingService.estimateArrivalTime(distance, avgSpeed);

      expect(typeof eta).toBe('number');
      expect(eta).toBeGreaterThan(0);
    });

    it('should return 0 for zero distance', () => {
      const eta = gpsTrackingService.estimateArrivalTime(0);

      expect(eta).toBe(0);
    });
  });

  describe('updateDeliveryStatus', () => {
    it('should update delivery status with location', async () => {
      const orderId = 'order123';
      const status = 'OUT_FOR_DELIVERY';
      const location = { latitude: 30.0444, longitude: 31.2357 };

      mockPrisma.order.update.mockResolvedValue({
        id: orderId,
        status
      });

      mockPrisma.deliveryTracking.create.mockResolvedValue({
        id: 'tracking123',
        orderId,
        ...location
      });

      const result = await gpsTrackingService.updateDeliveryStatus(
        orderId,
        status,
        location
      );

      expect(result).toHaveProperty('orderId');
      expect(result).toHaveProperty('status');
    });
  });

  describe('getDeliveryRoute', () => {
    it('should get complete delivery route', async () => {
      const orderId = 'order123';

      mockPrisma.deliveryTracking.findMany.mockResolvedValue([
        {
          latitude: 30.0444,
          longitude: 31.2357,
          createdAt: new Date('2025-01-01T10:00:00')
        },
        {
          latitude: 30.0500,
          longitude: 31.2400,
          createdAt: new Date('2025-01-01T10:05:00')
        },
        {
          latitude: 30.0626,
          longitude: 31.2497,
          createdAt: new Date('2025-01-01T10:10:00')
        }
      ]);

      const route = await gpsTrackingService.getDeliveryRoute(orderId);

      expect(Array.isArray(route)).toBe(true);
      expect(route.length).toBe(3);
      expect(route[0]).toHaveProperty('latitude');
      expect(route[0]).toHaveProperty('longitude');
    });
  });

  describe('isNearDestination', () => {
    it('should return true when near destination', () => {
      const currentLocation = { latitude: 30.0620, longitude: 31.2490 };
      const destination = { latitude: 30.0626, longitude: 31.2497 };
      const threshold = 0.5; // 0.5 km

      const isNear = gpsTrackingService.isNearDestination(
        currentLocation,
        destination,
        threshold
      );

      expect(isNear).toBe(true);
    });

    it('should return false when far from destination', () => {
      const currentLocation = { latitude: 30.0444, longitude: 31.2357 };
      const destination = { latitude: 30.0626, longitude: 31.2497 };
      const threshold = 0.5; // 0.5 km

      const isNear = gpsTrackingService.isNearDestination(
        currentLocation,
        destination,
        threshold
      );

      expect(isNear).toBe(false);
    });
  });
});

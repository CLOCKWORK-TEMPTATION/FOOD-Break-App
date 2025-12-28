/**
 * GPS Tracking Service Tests
 * اختبارات خدمة تتبع GPS
 */

const gpsTrackingService = require('../../../src/services/gpsTrackingService');
const axios = require('axios');
const logger = require('../../../src/utils/logger');

// Mock dependencies
jest.mock('axios');
jest.mock('../../../src/utils/logger');
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => global.mockPrisma)
}));

describe('GPS Tracking Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    global.mockPrisma.order = {
      findUnique: jest.fn()
    };

    global.mockPrisma.orderTracking = {
      create: jest.fn(),
      findMany: jest.fn()
    };

    // Default environment variables
    process.env.GOOGLE_MAPS_API_KEY = 'test-api-key';
    process.env.GOOGLE_MAPS_TRAVEL_MODE = 'driving';
    process.env.DEFAULT_DELIVERY_SPEED_KMH = '30';
  });

  afterEach(() => {
    delete process.env.GOOGLE_MAPS_API_KEY;
    delete process.env.GOOGLE_MAPS_TRAVEL_MODE;
    delete process.env.DEFAULT_DELIVERY_SPEED_KMH;
  });

  describe('recordOrderTrackingPoint', () => {
    it('should record tracking point with ETA', async () => {
      const orderId = 'order-123';
      const driverLocation = { latitude: 30.0, longitude: 31.0 };

      global.mockPrisma.order.findUnique.mockResolvedValue({
        id: orderId,
        deliveryLat: 30.1,
        deliveryLng: 31.1,
        deliveryAddress: 'Test Address'
      });

      axios.get.mockResolvedValue({
        data: {
          rows: [
            {
              elements: [
                {
                  duration: { value: 1200 } // 20 minutes in seconds
                }
              ]
            }
          ]
        }
      });

      const mockTracking = {
        id: 'tracking-123',
        orderId,
        latitude: driverLocation.latitude,
        longitude: driverLocation.longitude,
        etaMinutes: 20,
        recordedAt: new Date()
      };

      global.mockPrisma.orderTracking.create.mockResolvedValue(mockTracking);

      const result = await gpsTrackingService.recordOrderTrackingPoint(orderId, driverLocation);

      expect(result.tracking).toBeDefined();
      expect(result.etaMinutes).toBe(20);
      expect(global.mockPrisma.orderTracking.create).toHaveBeenCalled();
    });

    it('should use fallback ETA when Google Maps fails', async () => {
      const orderId = 'order-123';
      const driverLocation = { latitude: 30.0, longitude: 31.0 };

      global.mockPrisma.order.findUnique.mockResolvedValue({
        id: orderId,
        deliveryLat: 30.1,
        deliveryLng: 31.1,
        deliveryAddress: 'Test Address'
      });

      axios.get.mockRejectedValue(new Error('API Error'));

      const mockTracking = {
        id: 'tracking-123',
        orderId,
        latitude: driverLocation.latitude,
        longitude: driverLocation.longitude,
        etaMinutes: expect.any(Number),
        recordedAt: new Date()
      };

      global.mockPrisma.orderTracking.create.mockResolvedValue(mockTracking);

      const result = await gpsTrackingService.recordOrderTrackingPoint(orderId, driverLocation);

      expect(result.tracking).toBeDefined();
      expect(result.etaMinutes).toBeGreaterThan(0);
      expect(logger.warn).toHaveBeenCalled();
    });

    it('should handle missing delivery coordinates', async () => {
      const orderId = 'order-123';
      const driverLocation = { latitude: 30.0, longitude: 31.0 };

      global.mockPrisma.order.findUnique.mockResolvedValue({
        id: orderId,
        deliveryLat: null,
        deliveryLng: null
      });

      const mockTracking = {
        id: 'tracking-123',
        orderId,
        latitude: driverLocation.latitude,
        longitude: driverLocation.longitude,
        etaMinutes: null,
        recordedAt: new Date()
      };

      global.mockPrisma.orderTracking.create.mockResolvedValue(mockTracking);

      const result = await gpsTrackingService.recordOrderTrackingPoint(orderId, driverLocation);

      expect(result.tracking).toBeDefined();
      expect(result.etaMinutes).toBeNull();
    });
  });

  describe('getOrderTracking', () => {
    it('should return order tracking points', async () => {
      const orderId = 'order-123';
      const mockPoints = [
        {
          id: 'point-1',
          orderId,
          latitude: 30.0,
          longitude: 31.0,
          etaMinutes: 20,
          recordedAt: new Date()
        },
        {
          id: 'point-2',
          orderId,
          latitude: 30.05,
          longitude: 31.05,
          etaMinutes: 15,
          recordedAt: new Date()
        }
      ];

      global.mockPrisma.orderTracking.findMany.mockResolvedValue(mockPoints);

      const result = await gpsTrackingService.getOrderTracking(orderId);

      expect(result).toBeDefined();
      expect(result.latest).toEqual(mockPoints[0]);
      expect(global.mockPrisma.orderTracking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { orderId },
          orderBy: { recordedAt: 'desc' }
        })
      );
    });

    it('should handle empty tracking points', async () => {
      const orderId = 'order-123';

      global.mockPrisma.orderTracking.findMany.mockResolvedValue([]);

      const result = await gpsTrackingService.getOrderTracking(orderId);

      expect(result).toBeDefined();
      expect(result.latest).toBeNull();
    });

    it('should respect limit parameter', async () => {
      const orderId = 'order-123';
      const limit = 10;

      global.mockPrisma.orderTracking.findMany.mockResolvedValue([]);

      await gpsTrackingService.getOrderTracking(orderId, limit);

      expect(global.mockPrisma.orderTracking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: limit
        })
      );
    });

    it('should cap limit at maximum value', async () => {
      const orderId = 'order-123';
      const limit = 200; // More than max

      global.mockPrisma.orderTracking.findMany.mockResolvedValue([]);

      await gpsTrackingService.getOrderTracking(orderId, limit);

      expect(global.mockPrisma.orderTracking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100 // Should be capped at 100
        })
      );
    });
  });

  describe('Google Maps Integration', () => {
    it('should call Google Maps API with correct parameters', async () => {
      const orderId = 'order-123';
      const driverLocation = { latitude: 30.0, longitude: 31.0 };

      global.mockPrisma.order.findUnique.mockResolvedValue({
        id: orderId,
        deliveryLat: 30.1,
        deliveryLng: 31.1
      });

      axios.get.mockResolvedValue({
        data: {
          rows: [
            {
              elements: [
                {
                  duration: { value: 600 }
                }
              ]
            }
          ]
        }
      });

      global.mockPrisma.orderTracking.create.mockResolvedValue({
        id: 'tracking-123',
        orderId,
        latitude: driverLocation.latitude,
        longitude: driverLocation.longitude,
        etaMinutes: 10
      });

      await gpsTrackingService.recordOrderTrackingPoint(orderId, driverLocation);

      expect(axios.get).toHaveBeenCalledWith(
        'https://maps.googleapis.com/maps/api/distancematrix/json',
        expect.objectContaining({
          params: expect.objectContaining({
            origins: '30,31',
            destinations: '30.1,31.1',
            key: 'test-api-key',
            mode: 'driving',
            language: 'ar'
          })
        })
      );
    });

    it('should handle missing API key gracefully', async () => {
      delete process.env.GOOGLE_MAPS_API_KEY;

      const orderId = 'order-123';
      const driverLocation = { latitude: 30.0, longitude: 31.0 };

      global.mockPrisma.order.findUnique.mockResolvedValue({
        id: orderId,
        deliveryLat: 30.1,
        deliveryLng: 31.1
      });

      global.mockPrisma.orderTracking.create.mockResolvedValue({
        id: 'tracking-123',
        orderId,
        latitude: driverLocation.latitude,
        longitude: driverLocation.longitude,
        etaMinutes: expect.any(Number)
      });

      const result = await gpsTrackingService.recordOrderTrackingPoint(orderId, driverLocation);

      expect(axios.get).not.toHaveBeenCalled();
      expect(result.etaMinutes).toBeGreaterThan(0); // Should use fallback
    });
  });

  describe('Distance Calculation', () => {
    it('should calculate distance between two points', async () => {
      const orderId = 'order-123';
      const driverLocation = { latitude: 30.0, longitude: 31.0 };

      global.mockPrisma.order.findUnique.mockResolvedValue({
        id: orderId,
        deliveryLat: 30.1,
        deliveryLng: 31.0 // Same longitude, different latitude
      });

      // No API key to force fallback calculation
      delete process.env.GOOGLE_MAPS_API_KEY;

      global.mockPrisma.orderTracking.create.mockResolvedValue({
        id: 'tracking-123',
        orderId,
        latitude: driverLocation.latitude,
        longitude: driverLocation.longitude,
        etaMinutes: 1
      });

      const result = await gpsTrackingService.recordOrderTrackingPoint(orderId, driverLocation);

      expect(result.etaMinutes).toBeGreaterThan(0);
      expect(result.etaMinutes).toBeLessThan(100); // Reasonable ETA
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors', async () => {
      const orderId = 'order-123';
      const driverLocation = { latitude: 30.0, longitude: 31.0 };

      global.mockPrisma.order.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(
        gpsTrackingService.recordOrderTrackingPoint(orderId, driverLocation)
      ).rejects.toThrow('Database error');
    });

    it('should handle API timeout', async () => {
      const orderId = 'order-123';
      const driverLocation = { latitude: 30.0, longitude: 31.0 };

      global.mockPrisma.order.findUnique.mockResolvedValue({
        id: orderId,
        deliveryLat: 30.1,
        deliveryLng: 31.1
      });

      axios.get.mockRejectedValue({ code: 'ECONNABORTED', message: 'Timeout' });

      global.mockPrisma.orderTracking.create.mockResolvedValue({
        id: 'tracking-123',
        orderId,
        latitude: driverLocation.latitude,
        longitude: driverLocation.longitude,
        etaMinutes: expect.any(Number)
      });

      const result = await gpsTrackingService.recordOrderTrackingPoint(orderId, driverLocation);

      expect(result.tracking).toBeDefined();
      expect(logger.warn).toHaveBeenCalled();
    });
  });
});

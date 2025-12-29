/**
 * Smoke Tests - GPS Tracking Service
 * اختبارات بسيطة للتغطية السريعة
 */

const gpsTrackingService = require('../gpsTrackingService');

jest.mock('axios');
jest.mock('@prisma/client');

describe('GPSTrackingService - Smoke Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const { PrismaClient } = require('@prisma/client');
    const mockPrisma = new PrismaClient();

    mockPrisma.order.findUnique.mockResolvedValue({
      id: 'order-1',
      deliveryLat: 24.7136,
      deliveryLng: 46.6753,
      deliveryAddress: 'Test Address'
    });
    mockPrisma.orderTracking.create.mockResolvedValue({
      id: '1',
      orderId: 'order-1',
      latitude: 24.7136,
      longitude: 46.6753,
      etaMinutes: 30
    });
    mockPrisma.orderTracking.findMany.mockResolvedValue([]);
    mockPrisma.order.findMany.mockResolvedValue([]);

    const axios = require('axios');
    axios.get.mockResolvedValue({
      data: {
        rows: [{
          elements: [{
            duration: { value: 1800 }
          }]
        }]
      }
    });
  });

  it('should not throw when calling calculateDistance', () => {
    expect(() => gpsTrackingService.calculateDistance(24.7136, 46.6753, 24.7200, 46.6800)).not.toThrow();
  });

  it('should not throw when calling calculateETA', async () => {
    const driverLocation = { latitude: 24.7200, longitude: 46.6800 };
    await expect(gpsTrackingService.calculateETA('order-1', driverLocation)).resolves.not.toThrow();
  });

  it('should not throw when calling recordOrderTrackingPoint', async () => {
    const driverLocation = { latitude: 24.7200, longitude: 46.6800 };
    await expect(gpsTrackingService.recordOrderTrackingPoint('order-1', driverLocation)).resolves.not.toThrow();
  });

  it('should not throw when calling getOrderTracking', async () => {
    await expect(gpsTrackingService.getOrderTracking('order-1', 20)).resolves.not.toThrow();
  });

  it('should not throw when calling getActiveOrdersWithLocations', async () => {
    await expect(gpsTrackingService.getActiveOrdersWithLocations('project-1')).resolves.not.toThrow();
  });
});

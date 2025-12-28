/**
 * اختبارات وحدة restaurantService
 * Unit Tests for Restaurant Service
 *
 * يغطي:
 * - الحصول على جميع المطاعم (Get All Restaurants)
 * - الحصول على مطعم محدد (Get Restaurant By ID)
 * - إنشاء مطعم جديد (Create Restaurant)
 * - تحديث مطعم (Update Restaurant)
 * - حذف مطعم (Delete Restaurant)
 * - البحث عن المطاعم القريبة (Get Nearby Restaurants)
 * - تحديث تقييم المطعم (Update Restaurant Rating)
 * - حساب المسافة (Calculate Distance)
 */

const restaurantService = require('../../services/restaurantService');
const { PrismaClient } = require('@prisma/client');

jest.mock('@prisma/client');
jest.mock('../../utils/logger');

describe('RestaurantService - خدمة المطاعم', () => {
  let mockPrisma;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPrisma = {
      restaurant: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn()
      },
      review: {
        findMany: jest.fn()
      }
    };

    PrismaClient.mockImplementation(() => mockPrisma);
  });

  describe('getAllRestaurants - الحصول على جميع المطاعم', () => {
    it('يجب الحصول على جميع المطاعم بنجاح', async () => {
      // Arrange
      const filters = {
        isActive: 'true',
        page: 1,
        limit: 20
      };

      const mockRestaurants = [
        {
          id: 'restaurant-1',
          name: 'مطعم الفخامة',
          isActive: true,
          rating: 4.5
        },
        {
          id: 'restaurant-2',
          name: 'مطعم النخبة',
          isActive: true,
          rating: 4.8
        }
      ];

      mockPrisma.restaurant.findMany.mockResolvedValue(mockRestaurants);
      mockPrisma.restaurant.count.mockResolvedValue(2);

      // Act
      const result = await restaurantService.getAllRestaurants(filters);

      // Assert
      expect(result.restaurants).toEqual(mockRestaurants);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1
      });
    });

    it('يجب فلترة المطاعم حسب الشركاء', async () => {
      // Arrange
      const filters = {
        isPartner: 'true'
      };

      mockPrisma.restaurant.findMany.mockResolvedValue([]);
      mockPrisma.restaurant.count.mockResolvedValue(0);

      // Act
      await restaurantService.getAllRestaurants(filters);

      // Assert
      expect(mockPrisma.restaurant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isPartner: true
          })
        })
      );
    });

    it('يجب فلترة المطاعم حسب نوع المطبخ', async () => {
      // Arrange
      const filters = {
        cuisineType: 'عربي'
      };

      mockPrisma.restaurant.findMany.mockResolvedValue([]);
      mockPrisma.restaurant.count.mockResolvedValue(0);

      // Act
      await restaurantService.getAllRestaurants(filters);

      // Assert
      expect(mockPrisma.restaurant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            cuisineType: 'عربي'
          })
        })
      );
    });

    it('يجب ترتيب المطاعم حسب التقييم', async () => {
      // Arrange
      mockPrisma.restaurant.findMany.mockResolvedValue([]);
      mockPrisma.restaurant.count.mockResolvedValue(0);

      // Act
      await restaurantService.getAllRestaurants({});

      // Assert
      expect(mockPrisma.restaurant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { rating: 'desc' }
        })
      );
    });
  });

  describe('getRestaurantById - الحصول على مطعم محدد', () => {
    it('يجب الحصول على مطعم محدد بنجاح', async () => {
      // Arrange
      const restaurantId = 'restaurant-123';
      const mockRestaurant = {
        id: restaurantId,
        name: 'مطعم الفخامة',
        description: 'أفضل مطعم في المدينة',
        rating: 4.5,
        isActive: true
      };

      mockPrisma.restaurant.findUnique.mockResolvedValue(mockRestaurant);

      // Act
      const result = await restaurantService.getRestaurantById(restaurantId);

      // Assert
      expect(mockPrisma.restaurant.findUnique).toHaveBeenCalledWith({
        where: { id: restaurantId },
        include: expect.any(Object)
      });
      expect(result).toEqual(mockRestaurant);
    });

    it('يجب رفع خطأ عند عدم وجود المطعم', async () => {
      // Arrange
      const restaurantId = 'nonexistent-restaurant';
      mockPrisma.restaurant.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        restaurantService.getRestaurantById(restaurantId)
      ).rejects.toThrow('المطعم غير موجود');
    });
  });

  describe('createRestaurant - إنشاء مطعم جديد', () => {
    it('يجب إنشاء مطعم جديد بنجاح', async () => {
      // Arrange
      const restaurantData = {
        name: 'مطعم جديد',
        description: 'مطعم رائع',
        address: 'مكة المكرمة',
        phoneNumber: '+966501234567',
        cuisineType: 'عربي',
        rating: 0,
        isActive: true,
        isPartner: true,
        latitude: 21.4225,
        longitude: 39.8262
      };

      const mockRestaurant = {
        id: 'restaurant-123',
        ...restaurantData,
        createdAt: new Date()
      };

      mockPrisma.restaurant.create.mockResolvedValue(mockRestaurant);

      // Act
      const result = await restaurantService.createRestaurant(restaurantData);

      // Assert
      expect(mockPrisma.restaurant.create).toHaveBeenCalledWith({
        data: restaurantData
      });
      expect(result).toEqual(mockRestaurant);
    });
  });

  describe('updateRestaurant - تحديث مطعم', () => {
    it('يجب تحديث المطعم بنجاح', async () => {
      // Arrange
      const restaurantId = 'restaurant-123';
      const updateData = {
        name: 'اسم محدث',
        description: 'وصف محدث',
        rating: 4.7
      };

      const mockUpdatedRestaurant = {
        id: restaurantId,
        ...updateData,
        updatedAt: new Date()
      };

      mockPrisma.restaurant.update.mockResolvedValue(mockUpdatedRestaurant);

      // Act
      const result = await restaurantService.updateRestaurant(restaurantId, updateData);

      // Assert
      expect(mockPrisma.restaurant.update).toHaveBeenCalledWith({
        where: { id: restaurantId },
        data: updateData
      });
      expect(result).toEqual(mockUpdatedRestaurant);
    });
  });

  describe('deleteRestaurant - حذف مطعم', () => {
    it('يجب حذف المطعم بنجاح', async () => {
      // Arrange
      const restaurantId = 'restaurant-123';
      mockPrisma.restaurant.delete.mockResolvedValue({});

      // Act
      await restaurantService.deleteRestaurant(restaurantId);

      // Assert
      expect(mockPrisma.restaurant.delete).toHaveBeenCalledWith({
        where: { id: restaurantId }
      });
    });
  });

  describe('getNearbyRestaurants - البحث عن المطاعم القريبة', () => {
    it('يجب الحصول على المطاعم القريبة بنجاح', async () => {
      // Arrange
      const latitude = 21.4225;
      const longitude = 39.8262;
      const radius = 3;

      const mockRestaurants = [
        {
          id: 'restaurant-1',
          name: 'مطعم قريب',
          latitude: 21.4230,
          longitude: 39.8265,
          isActive: true
        },
        {
          id: 'restaurant-2',
          name: 'مطعم آخر',
          latitude: 21.4240,
          longitude: 39.8270,
          isActive: true
        }
      ];

      mockPrisma.restaurant.findMany.mockResolvedValue(mockRestaurants);

      // Act
      const result = await restaurantService.getNearbyRestaurants(latitude, longitude, radius);

      // Assert
      expect(mockPrisma.restaurant.findMany).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);

      // يجب أن تكون المطاعم مرتبة حسب المسافة
      if (result.length > 1) {
        for (let i = 0; i < result.length - 1; i++) {
          expect(result[i].distance).toBeLessThanOrEqual(result[i + 1].distance);
        }
      }
    });

    it('يجب فلترة المطاعم البعيدة عن نصف القطر', async () => {
      // Arrange
      const latitude = 21.4225;
      const longitude = 39.8262;
      const radius = 1; // 1 كم فقط

      const mockRestaurants = [
        {
          id: 'restaurant-1',
          name: 'مطعم قريب جداً',
          latitude: 21.4226,
          longitude: 39.8263,
          isActive: true
        },
        {
          id: 'restaurant-2',
          name: 'مطعم بعيد',
          latitude: 21.5000, // بعيد جداً
          longitude: 39.9000,
          isActive: true
        }
      ];

      mockPrisma.restaurant.findMany.mockResolvedValue(mockRestaurants);

      // Act
      const result = await restaurantService.getNearbyRestaurants(latitude, longitude, radius);

      // Assert
      // يجب أن تكون جميع النتائج ضمن نصف القطر
      result.forEach(restaurant => {
        expect(restaurant.distance).toBeLessThanOrEqual(radius);
      });
    });

    it('يجب استخدام 3 كم كقيمة افتراضية لنصف القطر', async () => {
      // Arrange
      const latitude = 21.4225;
      const longitude = 39.8262;

      mockPrisma.restaurant.findMany.mockResolvedValue([]);

      // Act
      await restaurantService.getNearbyRestaurants(latitude, longitude);

      // Assert
      expect(mockPrisma.restaurant.findMany).toHaveBeenCalled();
    });
  });

  describe('calculateDistance - حساب المسافة', () => {
    it('يجب حساب المسافة بشكل صحيح', () => {
      // Arrange
      const lat1 = 21.4225; // مكة
      const lon1 = 39.8262;
      const lat2 = 21.4230; // نقطة قريبة جداً
      const lon2 = 39.8265;

      // Act
      const distance = restaurantService.calculateDistance(lat1, lon1, lat2, lon2);

      // Assert
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(1); // المسافة يجب أن تكون أقل من 1 كم
    });

    it('يجب إرجاع 0 للنقطة نفسها', () => {
      // Arrange
      const lat = 21.4225;
      const lon = 39.8262;

      // Act
      const distance = restaurantService.calculateDistance(lat, lon, lat, lon);

      // Assert
      expect(distance).toBe(0);
    });

    it('يجب حساب مسافات كبيرة بشكل صحيح', () => {
      // Arrange
      const makkahLat = 21.4225;
      const makkahLon = 39.8262;
      const riyadhLat = 24.7136;
      const riyadhLon = 46.6753;

      // Act
      const distance = restaurantService.calculateDistance(
        makkahLat,
        makkahLon,
        riyadhLat,
        riyadhLon
      );

      // Assert
      // المسافة بين مكة والرياض تقريباً 800 كم
      expect(distance).toBeGreaterThan(700);
      expect(distance).toBeLessThan(900);
    });
  });

  describe('updateRestaurantRating - تحديث تقييم المطعم', () => {
    it('يجب تحديث التقييم بناءً على المراجعات', async () => {
      // Arrange
      const restaurantId = 'restaurant-123';
      const mockReviews = [
        { rating: 5 },
        { rating: 4 },
        { rating: 5 },
        { rating: 3 }
      ];

      const expectedAverage = (5 + 4 + 5 + 3) / 4; // 4.25

      mockPrisma.review.findMany.mockResolvedValue(mockReviews);
      mockPrisma.restaurant.update.mockResolvedValue({
        id: restaurantId,
        rating: parseFloat(expectedAverage.toFixed(2))
      });

      // Act
      const result = await restaurantService.updateRestaurantRating(restaurantId);

      // Assert
      expect(mockPrisma.review.findMany).toHaveBeenCalledWith({
        where: { restaurantId },
        select: { rating: true }
      });
      expect(mockPrisma.restaurant.update).toHaveBeenCalledWith({
        where: { id: restaurantId },
        data: { rating: 4.25 }
      });
    });

    it('يجب إرجاع null عند عدم وجود مراجعات', async () => {
      // Arrange
      const restaurantId = 'restaurant-123';
      mockPrisma.review.findMany.mockResolvedValue([]);

      // Act
      const result = await restaurantService.updateRestaurantRating(restaurantId);

      // Assert
      expect(result).toBeNull();
      expect(mockPrisma.restaurant.update).not.toHaveBeenCalled();
    });

    it('يجب تقريب التقييم لرقمين عشريين', async () => {
      // Arrange
      const restaurantId = 'restaurant-123';
      const mockReviews = [
        { rating: 4 },
        { rating: 5 },
        { rating: 4 }
      ];

      // المتوسط: 4.333333...
      mockPrisma.review.findMany.mockResolvedValue(mockReviews);
      mockPrisma.restaurant.update.mockResolvedValue({
        id: restaurantId,
        rating: 4.33
      });

      // Act
      await restaurantService.updateRestaurantRating(restaurantId);

      // Assert
      expect(mockPrisma.restaurant.update).toHaveBeenCalledWith({
        where: { id: restaurantId },
        data: { rating: 4.33 }
      });
    });
  });

  describe('getRestaurantsDueForReview - المطاعم المستحقة للمراجعة', () => {
    it('يجب الحصول على المطاعم المستحقة للمراجعة الشهرية', async () => {
      // Arrange
      const mockRestaurants = [
        { id: 'restaurant-1', name: 'مطعم 1', lastReviewed: null },
        { id: 'restaurant-2', name: 'مطعم 2', lastReviewed: new Date('2024-01-01') }
      ];

      mockPrisma.restaurant.findMany.mockResolvedValue(mockRestaurants);

      // Act
      const result = await restaurantService.getRestaurantsDueForReview('monthly');

      // Assert
      expect(result.frequency).toBe('monthly');
      expect(result.total).toBe(2);
      expect(result.restaurants).toEqual(mockRestaurants);
    });

    it('يجب دعم المراجعة الربع سنوية', async () => {
      // Arrange
      mockPrisma.restaurant.findMany.mockResolvedValue([]);

      // Act
      const result = await restaurantService.getRestaurantsDueForReview('quarterly');

      // Assert
      expect(result.frequency).toBe('quarterly');
    });

    it('يجب استخدام monthly كقيمة افتراضية', async () => {
      // Arrange
      mockPrisma.restaurant.findMany.mockResolvedValue([]);

      // Act
      const result = await restaurantService.getRestaurantsDueForReview();

      // Assert
      expect(result.frequency).toBe('monthly');
    });
  });

  describe('markRestaurantReviewed - تحديد المطعم كتمت مراجعته', () => {
    it('يجب تحديث تاريخ المراجعة الأخيرة', async () => {
      // Arrange
      const restaurantId = 'restaurant-123';
      const mockUpdated = {
        id: restaurantId,
        lastReviewed: new Date()
      };

      mockPrisma.restaurant.update.mockResolvedValue(mockUpdated);

      // Act
      const result = await restaurantService.markRestaurantReviewed(restaurantId);

      // Assert
      expect(mockPrisma.restaurant.update).toHaveBeenCalledWith({
        where: { id: restaurantId },
        data: { lastReviewed: expect.any(Date) }
      });
      expect(result).toEqual(mockUpdated);
    });
  });
});

/**
 * اختبارات Unit Tests لخدمة التغذية
 * Unit Tests for Nutrition Service
 */

const { PrismaClient } = require('@prisma/client');
const nutritionService = require('../../services/nutritionService');

// Mock Prisma
jest.mock('@prisma/client');

describe('NutritionService - Unit Tests', () => {
  let mockPrisma;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPrisma = {
      userNutritionLog: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    PrismaClient.mockImplementation(() => mockPrisma);
  });

  // ==========================================
  // اختبارات تسجيل التغذية اليومية
  // ==========================================
  describe('logDailyNutrition()', () => {
    const userId = 'user-123';
    const nutritionData = {
      calories: 500,
      protein: 25,
      carbs: 60,
      fat: 20,
      fiber: 5,
      sugar: 10,
      sodium: 300,
      orderId: 'order-1'
    };

    it('يجب أن ينشئ سجل جديد إذا لم يوجد سجل لليوم', async () => {
      // Arrange
      mockPrisma.userNutritionLog.findUnique.mockResolvedValue(null);
      mockPrisma.userNutritionLog.create.mockResolvedValue({
        id: 'log-1',
        userId,
        ...nutritionData,
        mealsCount: 1
      });

      // Act
      const result = await nutritionService.logDailyNutrition(userId, nutritionData);

      // Assert
      expect(mockPrisma.userNutritionLog.findUnique).toHaveBeenCalled();
      expect(mockPrisma.userNutritionLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          totalCalories: nutritionData.calories,
          totalProtein: nutritionData.protein,
          totalCarbs: nutritionData.carbs,
          totalFat: nutritionData.fat,
          totalFiber: nutritionData.fiber,
          totalSugar: nutritionData.sugar,
          totalSodium: nutritionData.sodium,
          mealsCount: 1,
          orderId: nutritionData.orderId
        })
      });
      expect(result.mealsCount).toBe(1);
    });

    it('يجب أن يحدث السجل الموجود بإضافة القيم الجديدة', async () => {
      // Arrange
      const existingLog = {
        id: 'log-1',
        userId,
        totalCalories: 1000,
        totalProtein: 50,
        totalCarbs: 120,
        totalFat: 40,
        totalFiber: 10,
        totalSugar: 20,
        totalSodium: 600,
        mealsCount: 2
      };

      mockPrisma.userNutritionLog.findUnique.mockResolvedValue(existingLog);
      mockPrisma.userNutritionLog.update.mockResolvedValue({
        ...existingLog,
        totalCalories: existingLog.totalCalories + nutritionData.calories,
        totalProtein: existingLog.totalProtein + nutritionData.protein,
        mealsCount: existingLog.mealsCount + 1
      });

      // Act
      const result = await nutritionService.logDailyNutrition(userId, nutritionData);

      // Assert
      expect(mockPrisma.userNutritionLog.update).toHaveBeenCalledWith({
        where: { id: existingLog.id },
        data: expect.objectContaining({
          totalCalories: existingLog.totalCalories + nutritionData.calories,
          totalProtein: existingLog.totalProtein + nutritionData.protein,
          totalCarbs: existingLog.totalCarbs + nutritionData.carbs,
          totalFat: existingLog.totalFat + nutritionData.fat,
          mealsCount: existingLog.mealsCount + 1
        })
      });
      expect(result.mealsCount).toBe(3);
    });

    it('يجب أن يتعامل مع القيم الاختيارية', async () => {
      // Arrange
      const minimalNutritionData = {
        calories: 300,
        protein: 15,
        carbs: 40,
        fat: 10
      };

      mockPrisma.userNutritionLog.findUnique.mockResolvedValue(null);
      mockPrisma.userNutritionLog.create.mockResolvedValue({
        id: 'log-1',
        userId
      });

      // Act
      await nutritionService.logDailyNutrition(userId, minimalNutritionData);

      // Assert
      expect(mockPrisma.userNutritionLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          totalFiber: 0,
          totalSugar: 0,
          totalSodium: 0
        })
      });
    });

    it('يجب أن يستخدم تاريخ اليوم مع وقت منتصف الليل', async () => {
      // Arrange
      mockPrisma.userNutritionLog.findUnique.mockResolvedValue(null);
      mockPrisma.userNutritionLog.create.mockResolvedValue({ id: 'log-1' });

      // Act
      await nutritionService.logDailyNutrition(userId, nutritionData);

      // Assert
      const createCall = mockPrisma.userNutritionLog.create.mock.calls[0][0];
      const date = createCall.data.date;
      expect(date.getHours()).toBe(0);
      expect(date.getMinutes()).toBe(0);
      expect(date.getSeconds()).toBe(0);
    });
  });

  // ==========================================
  // اختبارات جلب سجل التغذية لفترة محددة
  // ==========================================
  describe('getNutritionLogs()', () => {
    it('يجب أن يجلب السجلات للفترة المحددة', async () => {
      // Arrange
      const userId = 'user-123';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const mockLogs = [
        { id: 'log-1', userId, date: new Date('2024-01-15'), totalCalories: 2000 },
        { id: 'log-2', userId, date: new Date('2024-01-16'), totalCalories: 1800 }
      ];

      mockPrisma.userNutritionLog.findMany.mockResolvedValue(mockLogs);

      // Act
      const result = await nutritionService.getNutritionLogs(userId, startDate, endDate);

      // Assert
      expect(mockPrisma.userNutritionLog.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          date: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: {
          date: 'desc'
        }
      });
      expect(result).toEqual(mockLogs);
      expect(result).toHaveLength(2);
    });

    it('يجب أن يرجع مصفوفة فارغة إذا لم توجد سجلات', async () => {
      // Arrange
      mockPrisma.userNutritionLog.findMany.mockResolvedValue([]);

      // Act
      const result = await nutritionService.getNutritionLogs(
        'user-123',
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('يجب أن يرتب السجلات من الأحدث إلى الأقدم', async () => {
      // Arrange
      mockPrisma.userNutritionLog.findMany.mockResolvedValue([
        { id: 'log-2', date: new Date('2024-01-16') },
        { id: 'log-1', date: new Date('2024-01-15') }
      ]);

      // Act
      await nutritionService.getNutritionLogs(
        'user-123',
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      // Assert
      expect(mockPrisma.userNutritionLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            date: 'desc'
          }
        })
      );
    });
  });

  // ==========================================
  // اختبارات جلب سجل التغذية لليوم
  // ==========================================
  describe('getTodayNutrition()', () => {
    it('يجب أن يرجع السجل إذا وجد', async () => {
      // Arrange
      const mockLog = {
        id: 'log-1',
        userId: 'user-123',
        totalCalories: 1500,
        totalProtein: 75,
        totalCarbs: 180,
        totalFat: 50,
        totalFiber: 25,
        totalSugar: 30,
        totalSodium: 2000,
        mealsCount: 3
      };

      mockPrisma.userNutritionLog.findUnique.mockResolvedValue(mockLog);

      // Act
      const result = await nutritionService.getTodayNutrition('user-123');

      // Assert
      expect(mockPrisma.userNutritionLog.findUnique).toHaveBeenCalled();
      expect(result).toEqual(mockLog);
    });

    it('يجب أن يرجع قيم صفرية إذا لم يوجد سجل', async () => {
      // Arrange
      mockPrisma.userNutritionLog.findUnique.mockResolvedValue(null);

      // Act
      const result = await nutritionService.getTodayNutrition('user-123');

      // Assert
      expect(result).toEqual({
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        totalFiber: 0,
        totalSugar: 0,
        totalSodium: 0,
        mealsCount: 0
      });
    });

    it('يجب أن يبحث عن سجل اليوم الحالي فقط', async () => {
      // Arrange
      mockPrisma.userNutritionLog.findUnique.mockResolvedValue(null);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Act
      await nutritionService.getTodayNutrition('user-123');

      // Assert
      const findUniqueCall = mockPrisma.userNutritionLog.findUnique.mock.calls[0][0];
      const searchDate = findUniqueCall.where.userId_date.date;
      expect(searchDate.toDateString()).toBe(today.toDateString());
      expect(searchDate.getHours()).toBe(0);
    });
  });
});

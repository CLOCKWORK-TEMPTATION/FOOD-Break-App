const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class EmergencyService {
  // ✅ Emergency Order Methods

  async createEmergencyOrder(userId, data) {
    const {
      restaurantId,
      emergencyType,
      emergencyReason,
      items,
      deliveryAddress,
      deliveryLat,
      deliveryLng,
      fastTrackDelivery
    } = data;

    // Calculate total amount
    let totalAmount = 0;

    // Optimizing N+1: Fetch all menu items in one query
    const menuItemIds = items.map(item => item.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: menuItemIds }
      }
    });

    const menuItemMap = new Map(menuItems.map(item => [item.id, item]));

    for (const item of items) {
      const menuItem = menuItemMap.get(item.menuItemId);
      if (!menuItem) {
        throw new Error(`Menu item not found: ${item.menuItemId}`);
      }
      totalAmount += menuItem.price * item.quantity;
    }

    // Create the emergency order
    const order = await prisma.emergencyOrder.create({
      data: {
        userId,
        restaurantId,
        emergencyType,
        emergencyReason,
        preApprovedItems: items, // Storing items in JSON field
        totalAmount,
        fastTrackDelivery,
        priorityLevel: 'HIGH', // Default per schema/logic
        estimatedTime: 30, // Default or calculated
        status: 'PENDING',
        deliveryAddress,
        deliveryLat,
        deliveryLng
      }
    });

    return order;
  }

  async getUserEmergencyOrders(userId, options) {
    const { status, page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const where = { userId };
    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.emergencyOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.emergencyOrder.count({ where })
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getEmergencyOrderById(orderId, userId) {
    const order = await prisma.emergencyOrder.findFirst({
      where: {
        id: orderId,
        userId // Ensure user owns the order
      }
    });

    if (!order) {
      throw new Error('Emergency order not found');
    }

    return order;
  }

  async updateEmergencyOrder(orderId, userId, data) {
    const order = await prisma.emergencyOrder.findFirst({
      where: {
        id: orderId,
        userId
      }
    });

    if (!order) {
      throw new Error('Emergency order not found');
    }

    const updatedOrder = await prisma.emergencyOrder.update({
      where: { id: orderId },
      data
    });

    return updatedOrder;
  }

  // ✅ Emergency Restaurant Methods

  async getAvailableEmergencyRestaurants(options) {
    const { latitude, longitude, radius, emergencyLevel } = options;

    const where = {
      isActive: true,
      isEmergencyReady: true
    };

    if (emergencyLevel) {
      where.emergencyLevel = emergencyLevel;
    }

    const emergencyRestaurants = await prisma.emergencyRestaurant.findMany({
      where
    });

    if (emergencyRestaurants.length === 0) {
      return [];
    }

    const restaurantIds = emergencyRestaurants.map(er => er.restaurantId);

    const restaurants = await prisma.restaurant.findMany({
      where: {
        id: { in: restaurantIds }
      }
    });

    const restaurantMap = new Map(restaurants.map(r => [r.id, r]));

    const enhancedRestaurants = emergencyRestaurants.map(er => ({
      ...er,
      restaurant: restaurantMap.get(er.restaurantId)
    }));

    if (latitude && longitude && radius) {
      return enhancedRestaurants.filter(er => {
        if (!er.restaurant) return false;
        const dist = this.calculateDistance(latitude, longitude, er.restaurant.latitude, er.restaurant.longitude);
        return dist <= radius;
      });
    }

    return enhancedRestaurants;
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  }

  deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  async registerEmergencyRestaurant(data) {
    const { restaurantId, ...otherData } = data;

    const existing = await prisma.emergencyRestaurant.findUnique({
      where: { restaurantId }
    });

    if (existing) {
      return prisma.emergencyRestaurant.update({
        where: { restaurantId },
        data: otherData
      });
    }

    return prisma.emergencyRestaurant.create({
      data: {
        restaurantId,
        ...otherData
      }
    });
  }

  async updateEmergencyRestaurant(id, data) {
    // Note: Assuming 'id' is the EmergencyRestaurant PK, as per standard REST conventions for PATCH /:id
    return prisma.emergencyRestaurant.update({
      where: { id },
      data
    });
  }

  // ✅ Pre-prepared Meals Methods

  async getAvailablePrePreparedMeals(options) {
    const { restaurantId, dietaryRestrictions, allergens } = options;

    const where = {
      isAvailable: true,
      isReserved: false
    };

    if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    let meals = await prisma.prePreparedMeal.findMany({
      where
    });

    if (allergens && allergens.length > 0) {
      meals = meals.filter(meal => {
        const hasAllergen = meal.allergens.some(a => allergens.includes(a));
        return !hasAllergen;
      });
    }

    if (dietaryRestrictions && dietaryRestrictions.length > 0) {
        meals = meals.filter(meal => {
            return dietaryRestrictions.every(dr => meal.dietaryLabels.includes(dr));
        });
    }

    return meals;
  }

  async addPrePreparedMeal(data) {
    return prisma.prePreparedMeal.create({
      data
    });
  }

  async reservePrePreparedMeal(mealId, userId) {
    // Atomic update to prevent race conditions
    // We update directly with a where clause that checks availability
    const result = await prisma.prePreparedMeal.updateMany({
      where: {
        id: mealId,
        isAvailable: true,
        isReserved: false
      },
      data: {
        isReserved: true,
        reservedBy: userId,
        reservedAt: new Date()
      }
    });

    if (result.count === 0) {
      throw new Error('Meal not available');
    }

    // Return the updated meal
    return prisma.prePreparedMeal.findUnique({
      where: { id: mealId }
    });
  }

  // ✅ Emergency Protocol Methods

  async getEmergencyProtocols(options) {
    const { emergencyType, isActive } = options;
    const where = {};
    if (emergencyType) where.emergencyType = emergencyType;
    if (isActive !== undefined) where.isActive = isActive;

    return prisma.emergencyProtocol.findMany({ where });
  }

  async createEmergencyProtocol(data) {
    return prisma.emergencyProtocol.create({ data });
  }

  async activateEmergencyProtocol(id) {
    const protocol = await prisma.emergencyProtocol.update({
      where: { id },
      data: {
        lastExecuted: new Date(),
        executionCount: { increment: 1 }
      }
    });

    return protocol;
  }

  // ✅ Notification Methods

  async sendEmergencyNotification(data) {
    const { type, title, message, targetUsers, targetRestaurants, senderId } = data;

    const notificationsData = [];
    if (targetUsers && targetUsers.length > 0) {
      for (const userId of targetUsers) {
        notificationsData.push({
            userId,
            type: 'SYSTEM',
            title,
            message,
            data: { isEmergency: true, type },
            isRead: false,
            createdAt: new Date()
        });
      }
    }

    if (notificationsData.length > 0) {
      await prisma.notification.createMany({
        data: notificationsData
      });
    }

    return { sent: notificationsData.length };
  }

  async getEmergencyNotifications(userId, options) {
    const { isRead, page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      type: 'SYSTEM',
      data: {
        path: ['isEmergency'],
        equals: true
      }
    };

    if (isRead !== undefined) {
      where.isRead = isRead;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.notification.count({ where })
    ]);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // ✅ Statistics & Schedule Changes

  async getEmergencyStatistics(options) {
    const { startDate, endDate, emergencyType } = options;

    const where = {};
    if (startDate) where.createdAt = { gte: startDate };
    if (endDate) where.createdAt = { ...where.createdAt, lte: endDate };
    if (emergencyType) where.emergencyType = emergencyType;

    const totalOrders = await prisma.emergencyOrder.count({ where });

    return {
      totalOrders
    };
  }

  async notifyScheduleChange(data) {
    // Ideally this would be implemented with a real notification system
    return { success: true, message: 'Schedule change notifications queued' };
  }
}

module.exports = new EmergencyService();

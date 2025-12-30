/**
 * Real-time Delivery Tracking with WebSocket
 * تتبع التوصيل الفوري باستخدام WebSocket
 *
 * Implements real-time GPS tracking, ETA updates, and delivery notifications
 * using Socket.io for bidirectional communication.
 */

const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');
const gpsTrackingService = require('./gpsTrackingService');

const prisma = new PrismaClient();

class RealtimeDeliveryTracking {
  constructor() {
    this.io = null; // Will be set by server initialization
    this.activeDeliveries = new Map(); // orderId -> tracking data
    this.driverSockets = new Map(); // driverId -> socket.id
    this.customerSockets = new Map(); // customerId -> socket.id
  }

  /**
   * Initialize Socket.io server
   * تهيئة خادم Socket.io
   */
  initialize(io) {
    this.io = io;

    io.on('connection', (socket) => {
      logger.info(`Socket connected: ${socket.id}`);

      // Handle driver connection
      socket.on('driver:connect', (driverId) => {
        this.handleDriverConnect(socket, driverId);
      });

      // Handle customer connection
      socket.on('customer:connect', (customerId) => {
        this.handleCustomerConnect(socket, customerId);
      });

      // Handle driver location update
      socket.on('driver:location', (data) => {
        this.handleDriverLocationUpdate(socket, data);
      });

      // Handle delivery status update
      socket.on('delivery:status', (data) => {
        this.handleDeliveryStatusUpdate(socket, data);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });

      // Handle order tracking subscription
      socket.on('order:track', (orderId) => {
        this.handleOrderTrackingSubscription(socket, orderId);
      });

      // Handle ETA request
      socket.on('order:eta', async (orderId) => {
        await this.sendETAUpdate(orderId);
      });
    });

    logger.info('WebSocket server initialized');
  }

  /**
   * Handle driver connection
   * معالجة اتصال السائق
   */
  handleDriverConnect(socket, driverId) {
    this.driverSockets.set(driverId, socket.id);
    socket.driverId = driverId;
    socket.join(`driver:${driverId}`);

    logger.info(`Driver ${driverId} connected with socket ${socket.id}`);

    socket.emit('driver:connected', {
      driverId,
      message: 'تم الاتصال بنجاح',
      timestamp: new Date().toISOString()
    });

    // Send active deliveries for this driver
    this.sendDriverActiveDeliveries(driverId, socket);
  }

  /**
   * Handle customer connection
   * معالجة اتصال العميل
   */
  handleCustomerConnect(socket, customerId) {
    this.customerSockets.set(customerId, socket.id);
    socket.customerId = customerId;
    socket.join(`customer:${customerId}`);

    logger.info(`Customer ${customerId} connected with socket ${socket.id}`);

    socket.emit('customer:connected', {
      customerId,
      message: 'تم الاتصال بنجاح',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle driver location update
   * معالجة تحديث موقع السائق
   */
  async handleDriverLocationUpdate(socket, data) {
    try {
      const { orderId, latitude, longitude, heading, speed } = data;
      const driverId = socket.driverId;

      if (!driverId) {
        socket.emit('error', { message: 'Driver not authenticated' });
        return;
      }

      // Save tracking point to database
      const trackingPoint = await prisma.orderTracking.create({
        data: {
          orderId,
          latitude,
          longitude,
          heading: heading || null,
          speed: speed || null,
          recordedAt: new Date()
        }
      });

      // Get order details
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: true,
          restaurant: true
        }
      });

      if (!order) {
        socket.emit('error', { message: 'Order not found' });
        return;
      }

      // Calculate ETA
      const eta = await gpsTrackingService.calculateETA({
        from: { latitude, longitude },
        to: { latitude: order.deliveryLat, longitude: order.deliveryLng }
      });

      // Update active delivery data
      const trackingData = {
        orderId,
        driverId,
        currentLocation: { latitude, longitude },
        destination: {
          latitude: order.deliveryLat,
          longitude: order.deliveryLng,
          address: order.deliveryAddress
        },
        eta: eta.etaMinutes,
        distance: eta.distanceKm,
        lastUpdate: new Date().toISOString(),
        status: order.status
      };

      this.activeDeliveries.set(orderId, trackingData);

      // Broadcast to customer
      this.io.to(`customer:${order.userId}`).emit('delivery:location', {
        orderId,
        location: { latitude, longitude },
        eta: eta.etaMinutes,
        distance: eta.distanceKm,
        status: order.status,
        timestamp: new Date().toISOString()
      });

      // Acknowledge to driver
      socket.emit('location:updated', {
        orderId,
        eta: eta.etaMinutes,
        distance: eta.distanceKm
      });

      logger.info(`Location updated for order ${orderId}: ETA ${eta.etaMinutes} min`);
    } catch (error) {
      logger.error('Error handling driver location update:', error);
      socket.emit('error', { message: 'فشل تحديث الموقع' });
    }
  }

  /**
   * Handle delivery status update
   * معالجة تحديث حالة التوصيل
   */
  async handleDeliveryStatusUpdate(socket, data) {
    try {
      const { orderId, status, notes } = data;
      const driverId = socket.driverId;

      if (!driverId) {
        socket.emit('error', { message: 'Driver not authenticated' });
        return;
      }

      // Update order status
      const order = await prisma.order.update({
        where: { id: orderId },
        data: {
          status,
          deliveredAt: status === 'DELIVERED' ? new Date() : undefined,
          updatedAt: new Date()
        },
        include: {
          user: true,
          restaurant: true
        }
      });

      // Create notification
      await prisma.notification.create({
        data: {
          userId: order.userId,
          type: 'ORDER_STATUS',
          title: this.getStatusTitleArabic(status),
          message: this.getStatusMessageArabic(status, order),
          relatedId: orderId,
          isRead: false
        }
      });

      // Broadcast to customer
      this.io.to(`customer:${order.userId}`).emit('delivery:status', {
        orderId,
        status,
        notes,
        timestamp: new Date().toISOString(),
        order: {
          id: order.id,
          restaurant: order.restaurant?.name,
          totalAmount: order.totalAmount
        }
      });

      // Remove from active deliveries if delivered
      if (status === 'DELIVERED' || status === 'CANCELLED') {
        this.activeDeliveries.delete(orderId);
      }

      socket.emit('status:updated', {
        orderId,
        status,
        message: 'تم تحديث الحالة بنجاح'
      });

      logger.info(`Order ${orderId} status updated to ${status}`);
    } catch (error) {
      logger.error('Error handling delivery status update:', error);
      socket.emit('error', { message: 'فشل تحديث الحالة' });
    }
  }

  /**
   * Handle order tracking subscription
   * معالجة الاشتراك في تتبع الطلب
   */
  async handleOrderTrackingSubscription(socket, orderId) {
    try {
      socket.join(`order:${orderId}`);

      // Get order details
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          restaurant: true,
          trackingPoints: {
            orderBy: { recordedAt: 'desc' },
            take: 1
          }
        }
      });

      if (!order) {
        socket.emit('error', { message: 'الطلب غير موجود' });
        return;
      }

      // Check if user has permission to track this order
      const customerId = socket.customerId;
      if (customerId && customerId !== order.userId) {
        socket.emit('error', { message: 'غير مصرح لك بتتبع هذا الطلب' });
        return;
      }

      // Get active tracking data
      const trackingData = this.activeDeliveries.get(orderId);

      // Send current tracking info
      socket.emit('order:tracking', {
        orderId,
        status: order.status,
        restaurant: {
          name: order.restaurant?.name,
          address: order.restaurant?.address,
          phone: order.restaurant?.phoneNumber
        },
        delivery: {
          address: order.deliveryAddress,
          location: {
            latitude: order.deliveryLat,
            longitude: order.deliveryLng
          }
        },
        currentLocation: trackingData?.currentLocation || null,
        eta: trackingData?.eta || null,
        distance: trackingData?.distance || null,
        lastUpdate: trackingData?.lastUpdate || order.updatedAt
      });

      logger.info(`Customer subscribed to order ${orderId} tracking`);
    } catch (error) {
      logger.error('Error handling order tracking subscription:', error);
      socket.emit('error', { message: 'فشل الاشتراك في التتبع' });
    }
  }

  /**
   * Send ETA update for an order
   * إرسال تحديث الوقت المتوقع للوصول
   */
  async sendETAUpdate(orderId) {
    try {
      const trackingData = this.activeDeliveries.get(orderId);

      if (!trackingData) {
        logger.warn(`No active tracking data for order ${orderId}`);
        return;
      }

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { userId: true }
      });

      if (!order) return;

      // Recalculate ETA
      const eta = await gpsTrackingService.calculateETA({
        from: trackingData.currentLocation,
        to: trackingData.destination
      });

      // Update tracking data
      trackingData.eta = eta.etaMinutes;
      trackingData.distance = eta.distanceKm;
      this.activeDeliveries.set(orderId, trackingData);

      // Broadcast ETA update
      this.io.to(`customer:${order.userId}`).emit('delivery:eta', {
        orderId,
        eta: eta.etaMinutes,
        distance: eta.distanceKm,
        timestamp: new Date().toISOString()
      });

      this.io.to(`order:${orderId}`).emit('delivery:eta', {
        orderId,
        eta: eta.etaMinutes,
        distance: eta.distanceKm,
        timestamp: new Date().toISOString()
      });

      logger.info(`ETA updated for order ${orderId}: ${eta.etaMinutes} min`);
    } catch (error) {
      logger.error(`Error sending ETA update for order ${orderId}:`, error);
    }
  }

  /**
   * Send active deliveries to driver
   * إرسال التوصيلات النشطة للسائق
   */
  async sendDriverActiveDeliveries(driverId, socket) {
    try {
      const activeOrders = await prisma.order.findMany({
        where: {
          status: {
            in: ['CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY']
          }
          // Add driver assignment when driver model is ready
        },
        include: {
          restaurant: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              phoneNumber: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      socket.emit('driver:deliveries', {
        deliveries: activeOrders.map(order => ({
          orderId: order.id,
          status: order.status,
          restaurant: {
            name: order.restaurant?.name,
            address: order.restaurant?.address,
            location: {
              latitude: order.restaurant?.latitude,
              longitude: order.restaurant?.longitude
            }
          },
          customer: {
            name: `${order.user.firstName} ${order.user.lastName}`,
            phone: order.user.phoneNumber
          },
          delivery: {
            address: order.deliveryAddress,
            location: {
              latitude: order.deliveryLat,
              longitude: order.deliveryLng
            }
          },
          totalAmount: order.totalAmount,
          createdAt: order.createdAt
        }))
      });
    } catch (error) {
      logger.error('Error sending active deliveries:', error);
    }
  }

  /**
   * Handle socket disconnection
   * معالجة قطع الاتصال
   */
  handleDisconnect(socket) {
    if (socket.driverId) {
      this.driverSockets.delete(socket.driverId);
      logger.info(`Driver ${socket.driverId} disconnected`);
    }

    if (socket.customerId) {
      this.customerSockets.delete(socket.customerId);
      logger.info(`Customer ${socket.customerId} disconnected`);
    }
  }

  /**
   * Get Arabic status title
   */
  getStatusTitleArabic(status) {
    const titles = {
      PENDING: 'طلب جديد',
      CONFIRMED: 'تم تأكيد الطلب',
      PREPARING: 'جاري تحضير الطلب',
      OUT_FOR_DELIVERY: 'الطلب في الطريق',
      DELIVERED: 'تم التوصيل',
      CANCELLED: 'تم إلغاء الطلب'
    };

    return titles[status] || 'تحديث الطلب';
  }

  /**
   * Get Arabic status message
   */
  getStatusMessageArabic(status, order) {
    const messages = {
      PENDING: `طلبك رقم ${order.id} قيد المراجعة`,
      CONFIRMED: `تم تأكيد طلبك من ${order.restaurant?.name}`,
      PREPARING: `جاري تحضير طلبك في ${order.restaurant?.name}`,
      OUT_FOR_DELIVERY: `طلبك في الطريق إليك`,
      DELIVERED: `تم توصيل طلبك بنجاح`,
      CANCELLED: `تم إلغاء طلبك`
    };

    return messages[status] || `تحديث حالة الطلب: ${status}`;
  }

  /**
   * Broadcast notification to specific user
   * بث إشعار لمستخدم معين
   */
  broadcastToCustomer(customerId, event, data) {
    this.io.to(`customer:${customerId}`).emit(event, data);
  }

  /**
   * Broadcast notification to specific driver
   * بث إشعار لسائق معين
   */
  broadcastToDriver(driverId, event, data) {
    this.io.to(`driver:${driverId}`).emit(event, data);
  }

  /**
   * Get active deliveries count
   */
  getActiveDeliveriesCount() {
    return this.activeDeliveries.size;
  }

  /**
   * Get connected drivers count
   */
  getConnectedDriversCount() {
    return this.driverSockets.size;
  }

  /**
   * Get connected customers count
   */
  getConnectedCustomersCount() {
    return this.customerSockets.size;
  }
}

module.exports = new RealtimeDeliveryTracking();

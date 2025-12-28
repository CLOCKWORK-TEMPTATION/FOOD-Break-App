const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * Why: نحتاج تتبع فعلي (DB-backed) وليس mock data.
 * يتم حفظ نقاط GPS في جدول OrderTracking.
 */

const getGoogleMapsEtaMinutes = async (origin, destination) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  try {
    const url = 'https://maps.googleapis.com/maps/api/distancematrix/json';
    const response = await axios.get(url, {
      params: {
        origins: `${origin.latitude},${origin.longitude}`,
        destinations: `${destination.latitude},${destination.longitude}`,
        key: apiKey,
        mode: process.env.GOOGLE_MAPS_TRAVEL_MODE || 'driving',
        language: 'ar'
      },
      timeout: 15000
    });

    const element = response.data?.rows?.[0]?.elements?.[0];
    const seconds = element?.duration?.value;
    if (!seconds) return null;
    return Math.max(1, Math.ceil(seconds / 60));
  } catch (error) {
    logger.warn(`فشل Google ETA: ${error.message}`);
    return null;
  }
};

// حساب المسافة بين نقطتين (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // نصف قطر الأرض بالكيلومتر
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const calculateFallbackEtaMinutes = (origin, destination) => {
  const distanceKm = calculateDistance(origin.latitude, origin.longitude, destination.latitude, destination.longitude);
  const averageSpeedKmH = Number(process.env.DEFAULT_DELIVERY_SPEED_KMH || 30);
  const etaHours = distanceKm / Math.max(1, averageSpeedKmH);
  return Math.max(1, Math.ceil(etaHours * 60));
};

const calculateETA = async (orderId, driverLocation) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { deliveryLat: true, deliveryLng: true, deliveryAddress: true }
  });

  if (!order?.deliveryLat || !order?.deliveryLng) {
    return null;
  }

  const destination = { latitude: order.deliveryLat, longitude: order.deliveryLng };
  const googleEta = await getGoogleMapsEtaMinutes(driverLocation, destination);
  if (googleEta) return googleEta;

  return calculateFallbackEtaMinutes(driverLocation, destination);
};

const recordOrderTrackingPoint = async (orderId, driverLocation) => {
  const etaMinutes = await calculateETA(orderId, driverLocation);

  const tracking = await prisma.orderTracking.create({
    data: {
      orderId,
      latitude: driverLocation.latitude,
      longitude: driverLocation.longitude,
      etaMinutes: etaMinutes || null
    }
  });

  return { tracking, etaMinutes };
};

const getOrderTracking = async (orderId, limit = 20) => {
  const points = await prisma.orderTracking.findMany({
    where: { orderId },
    orderBy: { recordedAt: 'desc' },
    take: Math.min(Number(limit) || 20, 100)
  });

  const latest = points[0] || null;
  return {
    latest,
    history: points.reverse()
  };
};

const getActiveOrdersWithLocations = async (projectId = null) => {
  const where = {
    status: { in: ['CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY'] }
  };
  if (projectId) where.projectId = projectId;

  const orders = await prisma.order.findMany({
    where,
    include: {
      user: { select: { id: true, firstName: true, lastName: true } },
      restaurant: { select: { id: true, name: true, latitude: true, longitude: true } },
      trackingPoints: {
        orderBy: { recordedAt: 'desc' },
        take: 1
      }
    }
  });

  return orders.map(order => ({
    orderId: order.id,
    status: order.status,
    user: order.user,
    restaurant: order.restaurant,
    destination: { lat: order.deliveryLat, lng: order.deliveryLng },
    currentLocation: order.trackingPoints[0] || null,
    estimatedTime: order.estimatedTime
  }));
};

module.exports = {
  calculateDistance,
  calculateETA,
  recordOrderTrackingPoint,
  getOrderTracking,
  getActiveOrdersWithLocations
};
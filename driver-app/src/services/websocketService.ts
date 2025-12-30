/**
 * WebSocket Service for Driver App
 * خدمة WebSocket لتطبيق السائق
 *
 * Handles real-time communication with backend server
 */

import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:3001';

let socket: Socket | null = null;
let driverId: string | null = null;

/**
 * Initialize WebSocket connection
 */
export function initializeWebSocket(driverIdParam: string): Socket {
  if (socket && socket.connected) {
    return socket;
  }

  driverId = driverIdParam;

  socket = io(SOCKET_URL, {
    transports: ['websocket'],
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    console.log('WebSocket connected:', socket?.id);

    // Authenticate as driver
    socket?.emit('driver:connect', driverId);
  });

  socket.on('driver:connected', (data) => {
    console.log('Driver authenticated:', data);
  });

  socket.on('disconnect', (reason) => {
    console.log('WebSocket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('WebSocket connection error:', error);
  });

  socket.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  return socket;
}

/**
 * Get current WebSocket instance
 */
export function getWebSocket(): Socket | null {
  return socket;
}

/**
 * Disconnect WebSocket
 */
export function disconnectWebSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Update driver location
 */
export function updateDriverLocation(data: {
  orderId: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
}): void {
  if (socket && socket.connected) {
    socket.emit('driver:location', data);
  } else {
    console.warn('Cannot update location: Socket not connected');
  }
}

/**
 * Update delivery status
 */
export function updateDeliveryStatus(data: {
  orderId: string;
  status: string;
  notes?: string;
}): void {
  if (socket && socket.connected) {
    socket.emit('delivery:status', data);
  } else {
    console.warn('Cannot update status: Socket not connected');
  }
}

/**
 * Accept delivery
 */
export function acceptDelivery(orderId: string): void {
  if (socket && socket.connected) {
    socket.emit('delivery:accept', { orderId });
  }
}

/**
 * Reject delivery
 */
export function rejectDelivery(orderId: string, reason: string): void {
  if (socket && socket.connected) {
    socket.emit('delivery:reject', { orderId, reason });
  }
}

export default {
  initializeWebSocket,
  getWebSocket,
  disconnectWebSocket,
  updateDriverLocation,
  updateDeliveryStatus,
  acceptDelivery,
  rejectDelivery,
};

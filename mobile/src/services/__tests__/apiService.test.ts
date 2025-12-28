/**
 * اختبارات شاملة لخدمة API
 * Comprehensive tests for API Service
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../apiService';

// Mock fetch globally
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('ApiService', () => {
  // إعداد قبل كل اختبار
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the singleton instance
    (apiService as any).token = null;
  });

  // ==========================================
  // Token Management Tests
  // ==========================================
  describe('Token Management', () => {
    it('should load token from AsyncStorage on initialization', async () => {
      const mockToken = 'test-token-123';
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(mockToken);

      await (apiService as any).loadToken();

      expect(AsyncStorage.getItem).toHaveBeenCalledWith('authToken');
      expect((apiService as any).token).toBe(mockToken);
    });

    it('should handle error when loading token fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      await (apiService as any).loadToken();

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should save token to AsyncStorage', async () => {
      const mockToken = 'new-token-456';
      (AsyncStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);

      await (apiService as any).saveToken(mockToken);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('authToken', mockToken);
      expect((apiService as any).token).toBe(mockToken);
    });

    it('should handle error when saving token fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      await (apiService as any).saveToken('test-token');

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should remove token from AsyncStorage', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValueOnce(undefined);
      (apiService as any).token = 'existing-token';

      await (apiService as any).removeToken();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('authToken');
      expect((apiService as any).token).toBeNull();
    });

    it('should handle error when removing token fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (AsyncStorage.removeItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      await (apiService as any).removeToken();

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  // ==========================================
  // Request Configuration Tests
  // ==========================================
  describe('Request Configuration', () => {
    it('should create request config with default headers', () => {
      const config = (apiService as any).getRequestConfig();

      expect(config.headers).toEqual({
        'Content-Type': 'application/json',
      });
    });

    it('should add Authorization header when token exists', () => {
      (apiService as any).token = 'test-token';
      const config = (apiService as any).getRequestConfig();

      expect(config.headers).toEqual({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
      });
    });

    it('should merge custom headers with defaults', () => {
      const customHeaders = { 'X-Custom-Header': 'custom-value' };
      const config = (apiService as any).getRequestConfig({ headers: customHeaders });

      expect(config.headers).toEqual({
        'Content-Type': 'application/json',
        'X-Custom-Header': 'custom-value',
      });
    });

    it('should preserve other request options', () => {
      const options = {
        method: 'POST',
        body: '{"test": "data"}',
      };
      const config = (apiService as any).getRequestConfig(options);

      expect(config.method).toBe('POST');
      expect(config.body).toBe('{"test": "data"}');
    });
  });

  // ==========================================
  // HTTP Methods Tests
  // ==========================================
  describe('GET Requests', () => {
    it('should make successful GET request', async () => {
      const mockData = { success: true, data: { id: 1, name: 'Test' } };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const result = await apiService.get('/test-endpoint');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test-endpoint'),
        expect.objectContaining({ method: 'GET' })
      );
      expect(result).toEqual(mockData);
    });

    it('should handle GET request with query parameters', async () => {
      const mockData = { success: true, data: [] };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      await apiService.get('/test?page=1&limit=10');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('test?page=1&limit=10'),
        expect.any(Object)
      );
    });

    it('should throw error on failed GET request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: { message: 'Not found' } }),
      } as Response);

      await expect(apiService.get('/test')).rejects.toThrow('Not found');
    });
  });

  describe('POST Requests', () => {
    it('should make successful POST request with data', async () => {
      const postData = { name: 'Test', value: 123 };
      const mockResponse = { success: true, data: { id: 1, ...postData } };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiService.post('/test', postData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(postData),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should make POST request without data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      await apiService.post('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: undefined,
        })
      );
    });

    it('should handle POST request error with custom message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: { message: 'Validation failed' } }),
      } as Response);

      await expect(apiService.post('/test', {})).rejects.toThrow('Validation failed');
    });

    it('should handle POST request error without error message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      } as Response);

      await expect(apiService.post('/test', {})).rejects.toThrow('حدث خطأ في الطلب');
    });
  });

  describe('PUT Requests', () => {
    it('should make successful PUT request', async () => {
      const updateData = { name: 'Updated' };
      const mockResponse = { success: true, data: updateData };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiService.put('/test/1', updateData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test/1'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData),
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('PATCH Requests', () => {
    it('should make successful PATCH request', async () => {
      const patchData = { status: 'active' };
      const mockResponse = { success: true, data: patchData };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiService.patch('/test/1', patchData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test/1'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(patchData),
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('DELETE Requests', () => {
    it('should make successful DELETE request', async () => {
      const mockResponse = { success: true };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiService.delete('/test/1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test/1'),
        expect.objectContaining({ method: 'DELETE' })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle DELETE request failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: { message: 'Resource not found' } }),
      } as Response);

      await expect(apiService.delete('/test/999')).rejects.toThrow('Resource not found');
    });
  });

  // ==========================================
  // Authentication Tests
  // ==========================================
  describe('Authentication', () => {
    it('should login successfully and save token', async () => {
      const mockToken = 'auth-token-123';
      const mockResponse = {
        success: true,
        data: { token: mockToken, user: { id: 1, email: 'test@example.com' } },
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);

      const result = await apiService.login('test@example.com', 'password123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
        })
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('authToken', mockToken);
      expect(result).toEqual(mockResponse);
    });

    it('should not save token if login fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: { message: 'Invalid credentials' } }),
      } as Response);

      await expect(apiService.login('test@example.com', 'wrong')).rejects.toThrow();
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it('should register new user', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        phone: '01234567890',
      };
      const mockResponse = { success: true, data: { id: 1, ...userData } };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiService.register(userData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/register'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(userData),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should logout and remove token', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValueOnce(undefined);
      (apiService as any).token = 'existing-token';

      const result = await apiService.logout();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('authToken');
      expect((apiService as any).token).toBeNull();
      expect(result).toEqual({ success: true });
    });
  });

  // ==========================================
  // Project & QR Code Tests
  // ==========================================
  describe('Project Operations', () => {
    it('should access project by QR code', async () => {
      const qrToken = 'qr-token-123';
      const mockResponse = {
        success: true,
        data: { projectId: 'proj-1', access: 'granted' },
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiService.accessProjectByQR(qrToken);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/qr/access'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ qrToken }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should get project details', async () => {
      const projectId = 'proj-123';
      const mockResponse = {
        success: true,
        data: { id: projectId, name: 'Test Project' },
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiService.getProject(projectId);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/projects/${projectId}`),
        expect.objectContaining({ method: 'GET' })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  // ==========================================
  // Restaurant Tests
  // ==========================================
  describe('Restaurant Operations', () => {
    it('should get nearby restaurants with default radius', async () => {
      const lat = 30.0444;
      const lng = 31.2357;
      const mockResponse = { success: true, data: [] };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      await apiService.getNearbyRestaurants(lat, lng);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`lat=${lat}&lng=${lng}&radius=3`),
        expect.any(Object)
      );
    });

    it('should get nearby restaurants with custom radius', async () => {
      const lat = 30.0444;
      const lng = 31.2357;
      const radius = 5;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      } as Response);

      await apiService.getNearbyRestaurants(lat, lng, radius);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`radius=${radius}`),
        expect.any(Object)
      );
    });

    it('should get restaurant menu', async () => {
      const restaurantId = 'rest-123';
      const mockResponse = { success: true, data: { menu: [] } };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiService.getRestaurantMenu(restaurantId);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/restaurants/${restaurantId}/menu`),
        expect.objectContaining({ method: 'GET' })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  // ==========================================
  // Order Tests
  // ==========================================
  describe('Order Operations', () => {
    it('should create order successfully', async () => {
      const orderData = {
        projectId: 'proj-1',
        restaurantId: 'rest-1',
        items: [
          { menuItemId: 'item-1', quantity: 2, price: 50, notes: 'Extra sauce' },
        ],
        totalAmount: 100,
        deliveryAddress: 'Test Address',
        notes: 'Ring doorbell',
      };
      const mockResponse = {
        success: true,
        data: { orderId: 'order-123', ...orderData },
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiService.createOrder(orderData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/orders'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(orderData),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should get user orders with default pagination', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      } as Response);

      await apiService.getUserOrders();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('page=1&limit=10'),
        expect.any(Object)
      );
    });

    it('should get user orders with custom pagination', async () => {
      const page = 2;
      const limit = 20;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      } as Response);

      await apiService.getUserOrders(page, limit);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`page=${page}&limit=${limit}`),
        expect.any(Object)
      );
    });

    it('should get order details', async () => {
      const orderId = 'order-123';
      const mockResponse = {
        success: true,
        data: { id: orderId, status: 'pending' },
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiService.getOrder(orderId);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/orders/${orderId}`),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should track order by QR code', async () => {
      const qrData = 'qr-tracking-data';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: {} }),
      } as Response);

      await apiService.trackOrderByQR(qrData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/orders/track/qr'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ qrData }),
        })
      );
    });
  });

  // ==========================================
  // Exception Requests Tests
  // ==========================================
  describe('Exception Operations', () => {
    it('should create exception request', async () => {
      const exceptionData = {
        projectId: 'proj-1',
        reason: 'Special dietary requirement',
        requestedItems: [
          {
            restaurantId: 'rest-1',
            itemName: 'Gluten-free pizza',
            quantity: 1,
            estimatedPrice: 100,
          },
        ],
        additionalCost: 50,
        urgency: 'HIGH' as const,
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: {} }),
      } as Response);

      await apiService.createException(exceptionData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/exceptions'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(exceptionData),
        })
      );
    });

    it('should get exceptions without project filter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      } as Response);

      await apiService.getExceptions();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/exceptions'),
        expect.any(Object)
      );
      expect(mockFetch).not.toHaveBeenCalledWith(
        expect.stringContaining('projectId'),
        expect.any(Object)
      );
    });

    it('should get exceptions with project filter', async () => {
      const projectId = 'proj-123';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      } as Response);

      await apiService.getExceptions(projectId);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`projectId=${projectId}`),
        expect.any(Object)
      );
    });
  });

  // ==========================================
  // Notification Tests
  // ==========================================
  describe('Notification Operations', () => {
    it('should get all notifications', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      } as Response);

      await apiService.getNotifications();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('page=1&unreadOnly=false'),
        expect.any(Object)
      );
    });

    it('should get only unread notifications', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      } as Response);

      await apiService.getNotifications(1, true);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('unreadOnly=true'),
        expect.any(Object)
      );
    });

    it('should mark notification as read', async () => {
      const notificationId = 'notif-123';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      await apiService.markNotificationAsRead(notificationId);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/notifications/${notificationId}/read`),
        expect.objectContaining({ method: 'PATCH' })
      );
    });
  });

  // ==========================================
  // Location & Delivery Tests
  // ==========================================
  describe('Location and Delivery Operations', () => {
    it('should update user location', async () => {
      const lat = 30.0444;
      const lng = 31.2357;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      await apiService.updateLocation(lat, lng);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/location/update'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ latitude: lat, longitude: lng }),
        })
      );
    });

    it('should get delivery updates for order', async () => {
      const orderId = 'order-123';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: {} }),
      } as Response);

      await apiService.getDeliveryUpdates(orderId);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/orders/${orderId}/delivery-updates`),
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  // ==========================================
  // Error Handling Tests
  // ==========================================
  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(apiService.get('/test')).rejects.toThrow('Network error');
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should handle JSON parse errors', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      } as Response);

      await expect(apiService.get('/test')).rejects.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should handle timeout errors', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockFetch.mockRejectedValueOnce(new Error('Request timeout'));

      await expect(apiService.post('/test', {})).rejects.toThrow('Request timeout');
      consoleErrorSpy.mockRestore();
    });
  });

  // ==========================================
  // Edge Cases Tests
  // ==========================================
  describe('Edge Cases', () => {
    it('should handle empty response data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => null,
      } as Response);

      const result = await apiService.get('/test');
      expect(result).toBeNull();
    });

    it('should handle very long endpoint URLs', async () => {
      const longEndpoint = '/test/' + 'a'.repeat(1000);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      await apiService.get(longEndpoint);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(longEndpoint),
        expect.any(Object)
      );
    });

    it('should handle special characters in request data', async () => {
      const specialData = {
        text: 'Test with special chars: <>&"\'',
        unicode: '你好世界 مرحبا بالعالم',
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      await apiService.post('/test', specialData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify(specialData),
        })
      );
    });

    it('should handle null and undefined values in request data', async () => {
      const dataWithNulls = {
        name: 'Test',
        optional: null,
        missing: undefined,
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      await apiService.post('/test', dataWithNulls);

      expect(mockFetch).toHaveBeenCalled();
    });
  });
});

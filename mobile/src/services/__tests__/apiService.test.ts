import { authService, orderService, MenuItem, OrderData } from '../apiService';
import { apiClient } from '../apiService';

// Mock apiClient
jest.mock('../apiService', () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
    patch: jest.fn(),
    defaults: { headers: { common: {} } }
  },
  authService: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn()
  },
  orderService: {
    submitOrder: jest.fn(),
    getUserOrders: jest.fn()
  }
}));

describe('ApiService Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Auth Service', () => {
    it('should login successfully', async () => {
      const mockResponse = { success: true, data: { token: '123' } };
      (authService.login as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authService.login('test@test.com', 'password');
      expect(result).toEqual(mockResponse);
      expect(authService.login).toHaveBeenCalledWith('test@test.com', 'password');
    });
  });

  describe('Order Service', () => {
    it('should submit order', async () => {
      const orderData: OrderData = {
        totalAmount: 100,
        items: [{ menuItemId: '1', quantity: 1, price: 100 }]
      };
      const mockResponse = { success: true, data: { id: 'order-1' } };
      (orderService.submitOrder as jest.Mock).mockResolvedValue(mockResponse);

      const result = await orderService.submitOrder(orderData);
      expect(result).toEqual(mockResponse);
      expect(orderService.submitOrder).toHaveBeenCalledWith(orderData);
    });
  });
});

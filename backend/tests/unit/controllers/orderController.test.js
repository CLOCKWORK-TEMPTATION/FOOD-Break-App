const orderController = require('../../../src/controllers/orderController');
const orderService = require('../../../src/services/orderService');

jest.mock('../../../src/services/orderService');

describe('Order Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: { id: 'user-123', role: 'REGULAR' },
      body: {},
      query: {},
      params: {},
      t: jest.fn((key) => key) // Mock localization function
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    it('should create order successfully', async () => {
      req.body = {
        projectId: 'proj-1',
        restaurantId: 'rest-1',
        items: [{ menuItemId: 'item-1', quantity: 2 }],
        deliveryAddress: 'Address'
      };
      orderService.createOrder.mockResolvedValue({ id: 'order-1' });

      await orderController.createOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { id: 'order-1' },
        message: 'تم إنشاء الطلب بنجاح'
      });
    });

    it('should reject order without items', async () => {
      req.body = { items: [] };

      await orderController.createOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'يجب إضافة عنصر واحد على الأقل للطلب'
      });
    });
  });

  describe('getOrderById', () => {
    it('should return order for owner', async () => {
      req.params.id = 'order-1';
      orderService.getOrderById.mockResolvedValue({ id: 'order-1', userId: 'user-123' });

      await orderController.getOrderById(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { id: 'order-1', userId: 'user-123' }
      });
    });

    it('should reject access for non-owner', async () => {
      req.params.id = 'order-1';
      orderService.getOrderById.mockResolvedValue({ id: 'order-1', userId: 'other-user' });

      await orderController.getOrderById(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('updateOrderStatus', () => {
    it('should update status for admin', async () => {
      req.user.role = 'ADMIN';
      req.params.id = 'order-1';
      req.body = { status: 'CONFIRMED' };
      orderService.updateOrderStatus.mockResolvedValue({ id: 'order-1', status: 'CONFIRMED' });

      await orderController.updateOrderStatus(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { id: 'order-1', status: 'CONFIRMED' },
        message: 'تم تحديث حالة الطلب إلى CONFIRMED'
      });
    });

    it('should reject status update for regular user', async () => {
      req.params.id = 'order-1';
      req.body = { status: 'CONFIRMED' };

      await orderController.updateOrderStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('cancelOrder', () => {
    it('should cancel order successfully', async () => {
      req.params.id = 'order-1';
      req.body = { reason: 'Changed mind' };
      orderService.cancelOrder.mockResolvedValue({ id: 'order-1', status: 'CANCELLED' });

      await orderController.cancelOrder(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { id: 'order-1', status: 'CANCELLED' },
        message: 'تم إلغاء الطلب بنجاح'
      });
    });
  });
});

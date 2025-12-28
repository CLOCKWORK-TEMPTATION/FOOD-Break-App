const menuController = require('../../../src/controllers/menuController');
const menuService = require('../../../src/services/menuService');

jest.mock('../../../src/services/menuService');

describe('Menu Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = { query: {}, params: {}, body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('getAllMenuItems', () => {
    it('should return all menu items', async () => {
      menuService.getAllMenuItems.mockResolvedValue([{ id: '1', name: 'Pizza' }]);

      await menuController.getAllMenuItems(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [{ id: '1', name: 'Pizza' }]
      });
    });
  });

  describe('getGeographicMenu', () => {
    it('should return geographic menu with coordinates', async () => {
      req.query = { latitude: '24.7136', longitude: '46.6753', radius: '5' };
      menuService.getGeographicMenu.mockResolvedValue([{ id: '1', distance: 2.5 }]);

      await menuController.getGeographicMenu(req, res, next);

      expect(menuService.getGeographicMenu).toHaveBeenCalledWith(24.7136, 46.6753, 5);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [{ id: '1', distance: 2.5 }]
      });
    });

    it('should reject request without coordinates', async () => {
      req.query = {};

      await menuController.getGeographicMenu(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('searchMenuItems', () => {
    it('should search menu items', async () => {
      req.query = { q: 'burger' };
      menuService.searchMenuItems.mockResolvedValue([{ id: '1', name: 'Burger' }]);

      await menuController.searchMenuItems(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { query: 'burger', results: [{ id: '1', name: 'Burger' }], total: 1 }
      });
    });

    it('should reject search without query', async () => {
      req.query = {};

      await menuController.searchMenuItems(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('createMenuItem', () => {
    it('should create menu item', async () => {
      req.body = { name: 'Pasta', price: 25 };
      menuService.createMenuItem.mockResolvedValue({ id: '1', name: 'Pasta' });

      await menuController.createMenuItem(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
    });
  });
});

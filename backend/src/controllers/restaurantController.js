const restaurantService = require('../services/restaurantService');

/**
 * Controller - الحصول على جميع المطاعم
 * GET /api/v1/restaurants
 */
const getAllRestaurants = async (req, res, next) => {
  try {
    const result = await restaurantService.getAllRestaurants(req.query);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller - الحصول على مطعم محدد
 * GET /api/v1/restaurants/:id
 */
const getRestaurantById = async (req, res, next) => {
  try {
    const restaurant = await restaurantService.getRestaurantById(req.params.id);

    res.json({
      success: true,
      data: restaurant
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller - إنشاء مطعم جديد
 * POST /api/v1/restaurants
 */
const createRestaurant = async (req, res, next) => {
  try {
    const restaurant = await restaurantService.createRestaurant(req.body);

    res.status(201).json({
      success: true,
      message: req.__('menu.restaurantAdded'),
      data: restaurant
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller - تحديث مطعم
 * PUT /api/v1/restaurants/:id
 */
const updateRestaurant = async (req, res, next) => {
  try {
    const restaurant = await restaurantService.updateRestaurant(req.params.id, req.body);

    res.json({
      success: true,
      message: req.__('menu.restaurantUpdated'),
      data: restaurant
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller - حذف مطعم
 * DELETE /api/v1/restaurants/:id
 */
const deleteRestaurant = async (req, res, next) => {
  try {
    await restaurantService.deleteRestaurant(req.params.id);

    res.json({
      success: true,
      message: req.__('menu.restaurantDeleted')
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller - البحث عن المطاعم القريبة
 * GET /api/v1/restaurants/nearby
 */
const getNearbyRestaurants = async (req, res, next) => {
  try {
    const { latitude, longitude, radius } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: req.__('validation.coordinatesRequired')
      });
    }

    const restaurants = await restaurantService.getNearbyRestaurants(
      parseFloat(latitude),
      parseFloat(longitude),
      radius ? parseFloat(radius) : 3
    );

    res.json({
      success: true,
      data: restaurants
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  getNearbyRestaurants
};

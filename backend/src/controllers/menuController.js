const menuService = require('../services/menuService');

/**
 * Controller - الحصول على جميع عناصر القائمة
 * GET /api/v1/menus
 */
const getAllMenuItems = async (req, res, next) => {
  try {
    const result = await menuService.getAllMenuItems(req.query);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller - الحصول على عنصر قائمة محدد
 * GET /api/v1/menus/:id
 */
const getMenuItemById = async (req, res, next) => {
  try {
    const menuItem = await menuService.getMenuItemById(req.params.id);

    res.json({
      success: true,
      data: menuItem
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller - إنشاء عنصر قائمة جديد
 * POST /api/v1/menus
 */
const createMenuItem = async (req, res, next) => {
  try {
    const menuItem = await menuService.createMenuItem(req.body);

    res.status(201).json({
      success: true,
      message: 'تم إنشاء عنصر القائمة بنجاح',
      data: menuItem
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller - تحديث عنصر قائمة
 * PUT /api/v1/menus/:id
 */
const updateMenuItem = async (req, res, next) => {
  try {
    const menuItem = await menuService.updateMenuItem(req.params.id, req.body);

    res.json({
      success: true,
      message: 'تم تحديث عنصر القائمة بنجاح',
      data: menuItem
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller - حذف عنصر قائمة
 * DELETE /api/v1/menus/:id
 */
const deleteMenuItem = async (req, res, next) => {
  try {
    await menuService.deleteMenuItem(req.params.id);

    res.json({
      success: true,
      message: 'تم حذف عنصر القائمة بنجاح'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller - الحصول على القائمة الأساسية
 * GET /api/v1/menus/core
 */
const getCoreMenu = async (req, res, next) => {
  try {
    const coreMenu = await menuService.getCoreMenu();

    res.json({
      success: true,
      data: coreMenu
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller - الحصول على القائمة الجغرافية
 * GET /api/v1/menus/geographic
 */
const getGeographicMenu = async (req, res, next) => {
  try {
    const { latitude, longitude, radius } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: 'يجب توفير الإحداثيات (latitude, longitude)'
      });
    }

    const geographicMenu = await menuService.getGeographicMenu(
      parseFloat(latitude),
      parseFloat(longitude),
      radius ? parseFloat(radius) : 3
    );

    res.json({
      success: true,
      data: geographicMenu
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller - البحث في القوائم
 * GET /api/v1/menus/search
 */
const searchMenuItems = async (req, res, next) => {
  try {
    const { q, ...filters } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'يجب توفير نص البحث (q)'
      });
    }

    const results = await menuService.searchMenuItems(q, filters);

    res.json({
      success: true,
      data: {
        query: q,
        results,
        total: results.length
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getCoreMenu,
  getGeographicMenu,
  searchMenuItems
};

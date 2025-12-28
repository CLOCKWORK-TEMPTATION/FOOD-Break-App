/**
 * متحكم الحمية الغذائية العربي
 * Dietary Controller - Handles all dietary-related API endpoints with Arabic localization
 */

const dietaryProfileService = require('../services/dietary/dietaryProfileService');
const allergyService = require('../services/dietary/allergyService');
const menuFilterService = require('../services/dietary/menuFilterService');
const foodLabelService = require('../services/dietary/foodLabelService');
const customOrderMessageService = require('../services/dietary/customOrderMessageService');

/**
 * ==========================================
 * Dietary Profile Endpoints
 * ==========================================
 */

/**
 * الحصول على الملف الشخصي للحمية
 * GET /api/dietary/profile
 */
const getDietaryProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await dietaryProfileService.getDietaryProfile(userId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROFILE_NOT_FOUND',
          message: req.t('dietary.profileNotFound'),
        },
      });
    }

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error('Error getting dietary profile:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: req.t('general.serverError'),
      },
    });
  }
};

/**
 * إنشاء أو تحديث الملف الشخصي للحمية
 * POST /api/dietary/profile
 */
const updateDietaryProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profileData = req.body;

    const profile = await dietaryProfileService.createOrUpdateDietaryProfile(
      userId,
      profileData
    );

    res.json({
      success: true,
      data: profile,
      message: req.t('dietary.profileUpdated'),
    });
  } catch (error) {
    console.error('Error updating dietary profile:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: req.t('general.serverError'),
      },
    });
  }
};

/**
 * الحصول على الحميات النشطة
 * GET /api/dietary/active-diets
 */
const getActiveDiets = async (req, res) => {
  try {
    const userId = req.user.id;
    const activeDiets = await dietaryProfileService.getActiveDiets(userId);

    res.json({
      success: true,
      data: activeDiets,
    });
  } catch (error) {
    console.error('Error getting active diets:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: req.__('general.serverError'),
      },
    });
  }
};

/**
 * الحصول على أنواع الحميات المتاحة
 * GET /api/dietary/diet-types
 */
const getAvailableDietTypes = async (req, res) => {
  try {
    const dietTypes = dietaryProfileService.getAvailableDietTypes();

    res.json({
      success: true,
      data: dietTypes,
    });
  } catch (error) {
    console.error('Error getting diet types:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: req.__('general.serverError'),
      },
    });
  }
};

/**
 * حذف الملف الشخصي للحمية
 * DELETE /api/dietary/profile
 */
const deleteDietaryProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    await dietaryProfileService.deleteDietaryProfile(userId);

    res.json({
      success: true,
      message: req.t('dietary.profileDeleted'),
    });
  } catch (error) {
    console.error('Error deleting dietary profile:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: req.__('general.serverError'),
      },
    });
  }
};

/**
 * ==========================================
 * Allergy Profile Endpoints
 * ==========================================
 */

/**
 * الحصول على ملف الحساسية
 * GET /api/dietary/allergies
 */
const getAllergyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await allergyService.getAllergyProfile(userId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ALLERGY_PROFILE_NOT_FOUND',
          message: req.t('dietary.allergyProfileNotFound'),
        },
      });
    }

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error('Error getting allergy profile:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: req.__('general.serverError'),
      },
    });
  }
};

/**
 * تحديث ملف الحساسية
 * POST /api/dietary/allergies
 */
const updateAllergyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const allergyData = req.body;

    const profile = await allergyService.createOrUpdateAllergyProfile(
      userId,
      allergyData
    );

    res.json({
      success: true,
      data: profile,
      message: req.t('dietary.allergyProfileUpdated'),
    });
  } catch (error) {
    console.error('Error updating allergy profile:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: req.__('general.serverError'),
      },
    });
  }
};

/**
 * الحصول على الحساسيات النشطة
 * GET /api/dietary/allergies/active
 */
const getActiveAllergies = async (req, res) => {
  try {
    const userId = req.user.id;
    const allergies = await allergyService.getActiveAllergies(userId);

    res.json({
      success: true,
      data: allergies,
    });
  } catch (error) {
    console.error('Error getting active allergies:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: req.__('general.serverError'),
      },
    });
  }
};

/**
 * الحصول على مسببات الحساسية المتاحة
 * GET /api/dietary/allergens
 */
const getAvailableAllergens = async (req, res) => {
  try {
    const allergens = allergyService.getAvailableAllergens();

    res.json({
      success: true,
      data: allergens,
    });
  } catch (error) {
    console.error('Error getting allergens:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: req.__('general.serverError'),
      },
    });
  }
};

/**
 * فحص عنصر للحساسية
 * GET /api/dietary/check-item/:menuItemId
 */
const checkItemForAllergies = async (req, res) => {
  try {
    const userId = req.user.id;
    const { menuItemId } = req.params;

    const result = await allergyService.checkItemForAllergies(userId, menuItemId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error checking item for allergies:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: req.__('general.serverError'),
      },
    });
  }
};

/**
 * ==========================================
 * Menu Filtering Endpoints
 * ==========================================
 */

/**
 * فلترة عناصر القائمة
 * POST /api/dietary/filter-menu
 */
const filterMenuItems = async (req, res) => {
  try {
    const userId = req.user.id;
    const { menuItems } = req.body;

    if (!menuItems || !Array.isArray(menuItems)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: req.t('dietary.invalidInput'),
        },
      });
    }

    const filteredItems = await menuFilterService.filterMenuItems(userId, menuItems);

    res.json({
      success: true,
      data: filteredItems,
    });
  } catch (error) {
    console.error('Error filtering menu items:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: req.__('general.serverError'),
      },
    });
  }
};

/**
 * البحث عن عناصر متوافقة
 * GET /api/dietary/compatible-items/:restaurantId
 */
const findCompatibleItems = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { diets, allergens } = req.query;

    const dietTypes = diets ? diets.split(',') : [];
    const allergenTypes = allergens ? allergens.split(',') : [];

    const items = await menuFilterService.findCompatibleItems(
      restaurantId,
      dietTypes,
      allergenTypes
    );

    res.json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error('Error finding compatible items:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: req.__('general.serverError'),
      },
    });
  }
};

/**
 * ==========================================
 * Food Label Endpoints
 * ==========================================
 */

/**
 * الحصول على تسمية عنصر
 * GET /api/dietary/labels/:menuItemId
 */
const getFoodLabel = async (req, res) => {
  try {
    const { menuItemId } = req.params;
    const label = await foodLabelService.getFoodLabel(menuItemId);

    if (!label) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'LABEL_NOT_FOUND',
          message: req.__('dietary.labelNotFound'),
        },
      });
    }

    res.json({
      success: true,
      data: label,
    });
  } catch (error) {
    console.error('Error getting food label:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: req.__('general.serverError'),
      },
    });
  }
};

/**
 * الحصول على التسميات النشطة لعنصر
 * GET /api/dietary/labels/:menuItemId/active
 */
const getActiveLabels = async (req, res) => {
  try {
    const { menuItemId } = req.params;
    const labels = await foodLabelService.getActiveLabels(menuItemId);

    res.json({
      success: true,
      data: labels,
    });
  } catch (error) {
    console.error('Error getting active labels:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: req.__('general.serverError'),
      },
    });
  }
};

/**
 * إنشاء أو تحديث تسمية عنصر
 * POST /api/dietary/labels/:menuItemId
 */
const updateFoodLabel = async (req, res) => {
  try {
    const { menuItemId } = req.params;
    const labelData = req.body;

    const label = await foodLabelService.createOrUpdateFoodLabel(
      menuItemId,
      labelData
    );

    res.json({
      success: true,
      data: label,
      message: req.__('dietary.labelUpdated'),
    });
  } catch (error) {
    console.error('Error updating food label:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: req.__('general.serverError'),
      },
    });
  }
};

/**
 * التحقق من تسمية
 * POST /api/dietary/labels/:menuItemId/verify
 */
const verifyFoodLabel = async (req, res) => {
  try {
    const { menuItemId } = req.params;
    const verifiedBy = req.user.id;

    const label = await foodLabelService.verifyLabel(menuItemId, verifiedBy);

    res.json({
      success: true,
      data: label,
      message: req.__('dietary.labelVerified'),
    });
  } catch (error) {
    console.error('Error verifying food label:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: req.__('general.serverError'),
      },
    });
  }
};

/**
 * إلغاء التحقق من تسمية
 * POST /api/dietary/labels/:menuItemId/unverify
 */
const unverifyFoodLabel = async (req, res) => {
  try {
    const { menuItemId } = req.params;

    const label = await foodLabelService.unverifyLabel(menuItemId);

    res.json({
      success: true,
      data: label,
      message: req.__('dietary.labelUnverified'),
    });
  } catch (error) {
    console.error('Error unverifying food label:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: req.__('general.serverError'),
      },
    });
  }
};

/**
 * الحصول على إحصائيات التسميات للمطعم
 * GET /api/dietary/labels/stats/:restaurantId
 */
const getRestaurantLabelStats = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const stats = await foodLabelService.getRestaurantLabelStats(restaurantId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error getting label stats:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: req.__('general.serverError'),
      },
    });
  }
};

/**
 * الحصول على أنواع التسميات المتاحة
 * GET /api/dietary/label-types
 */
const getAvailableLabelTypes = async (req, res) => {
  try {
    const labelTypes = foodLabelService.getAvailableLabelTypes();

    res.json({
      success: true,
      data: labelTypes,
    });
  } catch (error) {
    console.error('Error getting label types:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: req.__('general.serverError'),
      },
    });
  }
};

/**
 * معلومات الحساسية لعنصر
 * GET /api/dietary/allergen-info/:menuItemId
 */
const getAllergenInfo = async (req, res) => {
  try {
    const { menuItemId } = req.params;
    const info = await foodLabelService.getAllergenInfo(menuItemId);

    if (!info) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'INFO_NOT_FOUND',
          message: req.__('dietary.infoNotFound'),
        },
      });
    }

    res.json({
      success: true,
      data: info,
    });
  } catch (error) {
    console.error('Error getting allergen info:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: req.__('general.serverError'),
      },
    });
  }
};

/**
 * ==========================================
 * Custom Order Message Endpoints
 * ==========================================
 */

/**
 * إنشاء رسالة مخصصة
 * POST /api/dietary/messages
 */
const createOrderMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const messageData = { ...req.body, userId };

    const message = await customOrderMessageService.createMessage(messageData);

    res.status(201).json({
      success: true,
      data: message,
      message: req.__('dietary.messageCreated'),
    });
  } catch (error) {
    console.error('Error creating order message:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: req.__('general.serverError'),
      },
    });
  }
};

/**
 * إنشاء رسائل تلقائية للطلب
 * POST /api/dietary/messages/auto/:orderId
 */
const createAutoMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;
    const { restaurantId } = req.body;

    const messages = await customOrderMessageService.createAutoMessagesForOrder(
      orderId,
      userId,
      restaurantId
    );

    res.status(201).json({
      success: true,
      data: messages,
      message: req.__('dietary.autoMessagesCreated', { count: messages.length }),
    });
  } catch (error) {
    console.error('Error creating auto messages:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: req.__('general.serverError'),
      },
    });
  }
};

/**
 * الحصول على رسائل طلب
 * GET /api/dietary/messages/order/:orderId
 */
const getOrderMessages = async (req, res) => {
  try {
    const { orderId } = req.params;
    const messages = await customOrderMessageService.getOrderMessages(orderId);

    res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error('Error getting order messages:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: req.__('general.serverError'),
      },
    });
  }
};

/**
 * الحصول على رسائل المطعم
 * GET /api/dietary/messages/restaurant/:restaurantId
 */
const getRestaurantMessages = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { status, limit, offset } = req.query;

    const messages = await customOrderMessageService.getRestaurantMessages(
      restaurantId,
      {
        status,
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined,
      }
    );

    res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error('Error getting restaurant messages:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: req.__('general.serverError'),
      },
    });
  }
};

/**
 * الحصول على الرسائل العاجلة
 * GET /api/dietary/messages/urgent/:restaurantId
 */
const getUrgentMessages = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const messages = await customOrderMessageService.getUrgentUnreadMessages(
      restaurantId
    );

    res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error('Error getting urgent messages:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: req.__('general.serverError'),
      },
    });
  }
};

/**
 * إقرار رسالة
 * POST /api/dietary/messages/:messageId/acknowledge
 */
const acknowledgeMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await customOrderMessageService.acknowledgeMessage(messageId);

    res.json({
      success: true,
      data: message,
      message: req.__('dietary.messageAcknowledged'),
    });
  } catch (error) {
    console.error('Error acknowledging message:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: req.__('general.serverError'),
      },
    });
  }
};

/**
 * الرد على رسالة
 * POST /api/dietary/messages/:messageId/reply
 */
const replyToMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { reply, status } = req.body;

    const message = await customOrderMessageService.replyToMessage(
      messageId,
      reply,
      status
    );

    res.json({
      success: true,
      data: message,
      message: req.__('dietary.messageReplied'),
    });
  } catch (error) {
    console.error('Error replying to message:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: req.__('general.serverError'),
      },
    });
  }
};

/**
 * إحصائيات رسائل المطعم
 * GET /api/dietary/messages/stats/:restaurantId
 */
const getMessageStats = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const stats = await customOrderMessageService.getMessageStats(restaurantId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error getting message stats:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: req.__('general.serverError'),
      },
    });
  }
};

module.exports = {
  // Dietary Profile
  getDietaryProfile,
  updateDietaryProfile,
  getActiveDiets,
  getAvailableDietTypes,
  deleteDietaryProfile,
  // Allergy Profile
  getAllergyProfile,
  updateAllergyProfile,
  getActiveAllergies,
  getAvailableAllergens,
  checkItemForAllergies,
  // Menu Filtering
  filterMenuItems,
  findCompatibleItems,
  // Food Labels
  getFoodLabel,
  getActiveLabels,
  updateFoodLabel,
  verifyFoodLabel,
  unverifyFoodLabel,
  getRestaurantLabelStats,
  getAvailableLabelTypes,
  getAllergenInfo,
  // Custom Order Messages
  createOrderMessage,
  createAutoMessages,
  getOrderMessages,
  getRestaurantMessages,
  getUrgentMessages,
  acknowledgeMessage,
  replyToMessage,
  getMessageStats,
};

/**
 * Nutrition Controller
 * معالج طلبات API الخاصة بالتغذية
 */

const nutritionService = require('../services/nutritionService');
const logger = require('../utils/logger');

/**
 * سجل التغذية اليومية
 * POST /api/nutrition/log
 */
async function logNutrition(req, res) {
  try {
    const userId = req.user.id;
    const { calories, protein, carbs, fat, fiber, sugar, sodium, orderId } = req.body;

    const log = await nutritionService.logDailyNutrition(userId, {
      calories,
      protein,
      carbs,
      fat,
      fiber,
      sugar,
      sodium,
      orderId,
    });

    // تحديث تقدم الأهداف
    await nutritionService.updateGoalProgress(userId);

    res.status(200).json({
      success: true,
      data: log,
      message: 'تم تسجيل البيانات الغذائية بنجاح',
    });
  } catch (error) {
    logger.error('Error logging nutrition:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'NUTRITION_LOG_ERROR',
        message: error.message || 'فشل تسجيل البيانات الغذائية',
      },
    });
  }
}

/**
 * الحصول على سجل التغذية اليوم
 * GET /api/nutrition/today
 */
async function getTodayNutrition(req, res) {
  try {
    const userId = req.user.id;
    const nutrition = await nutritionService.getTodayNutrition(userId);
    const goals = await nutritionService.getActiveGoals(userId);

    res.status(200).json({
      success: true,
      data: {
        nutrition,
        goals: goals.length > 0 ? goals[0] : null,
      },
    });
  } catch (error) {
    logger.error('Error getting today nutrition:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_NUTRITION_ERROR',
        message: error.message || 'فشل جلب البيانات الغذائية',
      },
    });
  }
}

/**
 * الحصول على سجل التغذية لفترة محددة
 * GET /api/nutrition/logs?startDate=...&endDate=...
 */
async function getNutritionLogs(req, res) {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMS',
          message: 'يجب تحديد تاريخ البداية والنهاية',
        },
      });
    }

    const logs = await nutritionService.getNutritionLogs(
      userId,
      new Date(startDate),
      new Date(endDate)
    );

    res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    logger.error('Error getting nutrition logs:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_LOGS_ERROR',
        message: error.message || 'فشل جلب سجلات التغذية',
      },
    });
  }
}

/**
 * تعيين أهداف التغذية
 * POST /api/nutrition/goals
 */
async function setGoal(req, res) {
  try {
    const userId = req.user.id;
    const {
      goalType,
      targetCalories,
      targetProtein,
      targetCarbs,
      targetFat,
      targetFiber,
      targetWater,
      endDate,
    } = req.body;

    if (!goalType) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_GOAL_TYPE',
          message: 'يجب تحديد نوع الهدف',
        },
      });
    }

    const goal = await nutritionService.setNutritionGoal(userId, {
      goalType,
      targetCalories,
      targetProtein,
      targetCarbs,
      targetFat,
      targetFiber,
      targetWater,
      endDate: endDate ? new Date(endDate) : null,
    });

    res.status(201).json({
      success: true,
      data: goal,
      message: 'تم تعيين الهدف بنجاح',
    });
  } catch (error) {
    logger.error('Error setting goal:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SET_GOAL_ERROR',
        message: error.message || 'فشل تعيين الهدف',
      },
    });
  }
}

/**
 * الحصول على الأهداف النشطة
 * GET /api/nutrition/goals
 */
async function getGoals(req, res) {
  try {
    const userId = req.user.id;
    const goals = await nutritionService.getActiveGoals(userId);

    res.status(200).json({
      success: true,
      data: goals,
    });
  } catch (error) {
    logger.error('Error getting goals:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_GOALS_ERROR',
        message: error.message || 'فشل جلب الأهداف',
      },
    });
  }
}

/**
 * إنشاء تقرير أسبوعي
 * POST /api/nutrition/reports/weekly
 */
async function generateReport(req, res) {
  try {
    const userId = req.user.id;
    const report = await nutritionService.generateWeeklyReport(userId);

    res.status(200).json({
      success: true,
      data: report,
      message: 'تم إنشاء التقرير بنجاح',
    });
  } catch (error) {
    logger.error('Error generating report:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GENERATE_REPORT_ERROR',
        message: error.message || 'فشل إنشاء التقرير',
      },
    });
  }
}

/**
 * الحصول على التقارير الأسبوعية
 * GET /api/nutrition/reports/weekly
 */
async function getReports(req, res) {
  try {
    const userId = req.user.id;
    const { limit = 4 } = req.query;

    const reports = await nutritionService.getWeeklyReports(userId, parseInt(limit));

    res.status(200).json({
      success: true,
      data: reports,
    });
  } catch (error) {
    logger.error('Error getting reports:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_REPORTS_ERROR',
        message: error.message || 'فشل جلب التقارير',
      },
    });
  }
}

/**
 * إنشاء تحدي جماعي (Admin فقط)
 * POST /api/nutrition/challenges
 */
async function createChallenge(req, res) {
  try {
    const createdBy = req.user.id;
    const challengeData = {
      ...req.body,
      createdBy,
      startDate: new Date(req.body.startDate),
      endDate: new Date(req.body.endDate),
    };

    const challenge = await nutritionService.createTeamChallenge(challengeData);

    res.status(201).json({
      success: true,
      data: challenge,
      message: 'تم إنشاء التحدي بنجاح',
    });
  } catch (error) {
    logger.error('Error creating challenge:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_CHALLENGE_ERROR',
        message: error.message || 'فشل إنشاء التحدي',
      },
    });
  }
}

/**
 * الحصول على التحديات النشطة
 * GET /api/nutrition/challenges
 */
async function getChallenges(req, res) {
  try {
    const challenges = await nutritionService.getActiveChallenges();

    res.status(200).json({
      success: true,
      data: challenges,
    });
  } catch (error) {
    logger.error('Error getting challenges:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_CHALLENGES_ERROR',
        message: error.message || 'فشل جلب التحديات',
      },
    });
  }
}

/**
 * الانضمام لتحدي
 * POST /api/nutrition/challenges/:id/join
 */
async function joinChallenge(req, res) {
  try {
    const userId = req.user.id;
    const { id: challengeId } = req.params;

    const participant = await nutritionService.joinChallenge(challengeId, userId);

    res.status(200).json({
      success: true,
      data: participant,
      message: 'تم الانضمام للتحدي بنجاح',
    });
  } catch (error) {
    logger.error('Error joining challenge:', error);
    res.status(400).json({
      success: false,
      error: {
        code: 'JOIN_CHALLENGE_ERROR',
        message: error.message || 'فشل الانضمام للتحدي',
      },
    });
  }
}

/**
 * تحديث تقدم التحدي
 * PATCH /api/nutrition/challenges/:id/progress
 */
async function updateProgress(req, res) {
  try {
    const userId = req.user.id;
    const { id: challengeId } = req.params;
    const { progress } = req.body;

    if (typeof progress !== 'number') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PROGRESS',
          message: 'يجب تحديد قيمة التقدم',
        },
      });
    }

    const participant = await nutritionService.updateChallengeProgress(
      challengeId,
      userId,
      progress
    );

    res.status(200).json({
      success: true,
      data: participant,
      message: 'تم تحديث التقدم بنجاح',
    });
  } catch (error) {
    logger.error('Error updating progress:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_PROGRESS_ERROR',
        message: error.message || 'فشل تحديث التقدم',
      },
    });
  }
}

/**
 * الحصول على لوحة الصدارة للتحدي
 * GET /api/nutrition/challenges/:id/leaderboard
 */
async function getLeaderboard(req, res) {
  try {
    const { id: challengeId } = req.params;
    const leaderboard = await nutritionService.getChallengeLeaderboard(challengeId);

    res.status(200).json({
      success: true,
      data: leaderboard,
    });
  } catch (error) {
    logger.error('Error getting leaderboard:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_LEADERBOARD_ERROR',
        message: error.message || 'فشل جلب لوحة الصدارة',
      },
    });
  }
}

/**
 * الحصول على تحديات المستخدم
 * GET /api/nutrition/user/challenges
 */
async function getUserChallenges(req, res) {
  try {
    const userId = req.user.id;
    const challenges = await nutritionService.getUserChallenges(userId);

    res.status(200).json({
      success: true,
      data: challenges,
    });
  } catch (error) {
    logger.error('Error getting user challenges:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_USER_CHALLENGES_ERROR',
        message: error.message || 'فشل جلب تحديات المستخدم',
      },
    });
  }
}

module.exports = {
  logNutrition,
  getTodayNutrition,
  getNutritionLogs,
  setGoal,
  getGoals,
  generateReport,
  getReports,
  createChallenge,
  getChallenges,
  joinChallenge,
  updateProgress,
  getLeaderboard,
  getUserChallenges,
};

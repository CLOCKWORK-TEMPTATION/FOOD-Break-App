/**
 * Nutrition Service
 * خدمة إدارة التغذية والتقارير الصحية
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * سجل التغذية اليومية للمستخدم
 */
async function logDailyNutrition(userId, nutritionData) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // البحث عن سجل اليوم أو إنشاء واحد جديد
  const existingLog = await prisma.userNutritionLog.findUnique({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
  });

  if (existingLog) {
    // تحديث السجل الموجود
    return await prisma.userNutritionLog.update({
      where: { id: existingLog.id },
      data: {
        totalCalories: existingLog.totalCalories + nutritionData.calories,
        totalProtein: existingLog.totalProtein + nutritionData.protein,
        totalCarbs: existingLog.totalCarbs + nutritionData.carbs,
        totalFat: existingLog.totalFat + nutritionData.fat,
        totalFiber: existingLog.totalFiber + (nutritionData.fiber || 0),
        totalSugar: existingLog.totalSugar + (nutritionData.sugar || 0),
        totalSodium: existingLog.totalSodium + (nutritionData.sodium || 0),
        mealsCount: existingLog.mealsCount + 1,
      },
    });
  } else {
    // إنشاء سجل جديد
    return await prisma.userNutritionLog.create({
      data: {
        userId,
        date: today,
        totalCalories: nutritionData.calories || 0,
        totalProtein: nutritionData.protein || 0,
        totalCarbs: nutritionData.carbs || 0,
        totalFat: nutritionData.fat || 0,
        totalFiber: nutritionData.fiber || 0,
        totalSugar: nutritionData.sugar || 0,
        totalSodium: nutritionData.sodium || 0,
        mealsCount: 1,
        orderId: nutritionData.orderId,
      },
    });
  }
}

/**
 * الحصول على سجل التغذية لفترة محددة
 */
async function getNutritionLogs(userId, startDate, endDate) {
  return await prisma.userNutritionLog.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      date: 'desc',
    },
  });
}

/**
 * الحصول على سجل التغذية اليوم
 */
async function getTodayNutrition(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const log = await prisma.userNutritionLog.findUnique({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
  });

  // إذا لم يوجد سجل، إرجاع قيم فارغة
  if (!log) {
    return {
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      totalFiber: 0,
      totalSugar: 0,
      totalSodium: 0,
      mealsCount: 0,
    };
  }

  return log;
}

/**
 * إنشاء أو تحديث أهداف التغذية
 */
async function setNutritionGoal(userId, goalData) {
  // إلغاء تفعيل الأهداف النشطة السابقة
  await prisma.nutritionGoal.updateMany({
    where: {
      userId,
      isActive: true,
    },
    data: {
      isActive: false,
    },
  });

  // إنشاء هدف جديد
  return await prisma.nutritionGoal.create({
    data: {
      userId,
      goalType: goalData.goalType,
      targetCalories: goalData.targetCalories,
      targetProtein: goalData.targetProtein,
      targetCarbs: goalData.targetCarbs,
      targetFat: goalData.targetFat,
      targetFiber: goalData.targetFiber,
      targetWater: goalData.targetWater,
      endDate: goalData.endDate,
    },
  });
}

/**
 * الحصول على الأهداف النشطة
 */
async function getActiveGoals(userId) {
  return await prisma.nutritionGoal.findMany({
    where: {
      userId,
      isActive: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * تحديث تقدم الهدف اليومي
 */
async function updateGoalProgress(userId) {
  const goals = await getActiveGoals(userId);
  const todayNutrition = await getTodayNutrition(userId);

  for (const goal of goals) {
    // التحقق من تحقيق الأهداف اليومية
    let isGoalMet = true;

    if (goal.targetCalories && todayNutrition.totalCalories > goal.targetCalories * 1.1) {
      isGoalMet = false;
    }
    if (goal.targetProtein && todayNutrition.totalProtein < goal.targetProtein * 0.9) {
      isGoalMet = false;
    }

    // تحديث الإحصائيات
    if (isGoalMet) {
      await prisma.nutritionGoal.update({
        where: { id: goal.id },
        data: {
          currentStreak: goal.currentStreak + 1,
          longestStreak: Math.max(goal.longestStreak, goal.currentStreak + 1),
          successDays: goal.successDays + 1,
          totalDays: goal.totalDays + 1,
        },
      });
    } else {
      await prisma.nutritionGoal.update({
        where: { id: goal.id },
        data: {
          currentStreak: 0,
          totalDays: goal.totalDays + 1,
        },
      });
    }
  }
}

/**
 * إنشاء تقرير التغذية الأسبوعي
 */
async function generateWeeklyReport(userId) {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(now);
  weekEnd.setHours(23, 59, 59, 999);

  // الحصول على سجلات الأسبوع
  const logs = await getNutritionLogs(userId, weekStart, weekEnd);

  if (logs.length === 0) {
    throw new Error('لا توجد بيانات تغذية لهذا الأسبوع');
  }

  // حساب المتوسطات
  const totalLogs = logs.length;
  const avgCalories = logs.reduce((sum, log) => sum + log.totalCalories, 0) / totalLogs;
  const avgProtein = logs.reduce((sum, log) => sum + log.totalProtein, 0) / totalLogs;
  const avgCarbs = logs.reduce((sum, log) => sum + log.totalCarbs, 0) / totalLogs;
  const avgFat = logs.reduce((sum, log) => sum + log.totalFat, 0) / totalLogs;
  const avgFiber = logs.reduce((sum, log) => sum + log.totalFiber, 0) / totalLogs;

  // حساب الوجبات الصحية (معايير بسيطة)
  const healthyMeals = logs.filter(log => {
    return (
      log.totalCalories >= 400 && log.totalCalories <= 700 &&
      log.totalProtein >= 20 &&
      log.totalFiber >= 5
    );
  });

  const totalMeals = logs.reduce((sum, log) => sum + log.mealsCount, 0);
  const healthyMealsPercent = (healthyMeals.length / totalLogs) * 100;

  // توليد التوصيات
  const recommendations = [];
  const strengths = [];
  const improvements = [];

  if (avgProtein >= 50) {
    strengths.push('مستوى جيد من البروتين');
  } else {
    improvements.push('زيادة تناول البروتين');
    recommendations.push('أضف مصادر بروتين مثل الدجاج، السمك، أو البقوليات');
  }

  if (avgFiber >= 25) {
    strengths.push('تناول جيد للألياف');
  } else {
    improvements.push('زيادة تناول الألياف');
    recommendations.push('أضف المزيد من الخضروات والحبوب الكاملة');
  }

  if (avgCalories <= 2500) {
    strengths.push('سعرات حرارية متوازنة');
  } else {
    improvements.push('تقليل السعرات الحرارية');
    recommendations.push('حاول تقليل الوجبات الغنية بالسعرات');
  }

  // حساب النقاط الإجمالية (0-100)
  let overallScore = 0;
  overallScore += Math.min((avgProtein / 60) * 25, 25); // 25% للبروتين
  overallScore += Math.min((avgFiber / 30) * 25, 25);   // 25% للألياف
  overallScore += Math.min((2500 / avgCalories) * 25, 25); // 25% للسعرات
  overallScore += healthyMealsPercent * 0.25; // 25% للوجبات الصحية

  // التحقق من وجود تقرير سابق لنفس الأسبوع
  const existingReport = await prisma.weeklyNutritionReport.findUnique({
    where: {
      userId_weekStart: {
        userId,
        weekStart,
      },
    },
  });

  const reportData = {
    userId,
    weekStart,
    weekEnd,
    avgCalories,
    avgProtein,
    avgCarbs,
    avgFat,
    avgFiber,
    totalMeals,
    healthyMealsCount: healthyMeals.length,
    healthyMealsPercent,
    overallScore,
    strengths,
    improvements,
    recommendations,
  };

  if (existingReport) {
    return await prisma.weeklyNutritionReport.update({
      where: { id: existingReport.id },
      data: reportData,
    });
  } else {
    return await prisma.weeklyNutritionReport.create({
      data: reportData,
    });
  }
}

/**
 * الحصول على التقارير الأسبوعية
 */
async function getWeeklyReports(userId, limit = 4) {
  return await prisma.weeklyNutritionReport.findMany({
    where: { userId },
    orderBy: { weekStart: 'desc' },
    take: limit,
  });
}

/**
 * إنشاء تحدي جماعي
 */
async function createTeamChallenge(challengeData) {
  return await prisma.teamChallenge.create({
    data: {
      title: challengeData.title,
      titleAr: challengeData.titleAr,
      description: challengeData.description,
      descriptionAr: challengeData.descriptionAr,
      challengeType: challengeData.challengeType,
      targetType: challengeData.targetType,
      targetValue: challengeData.targetValue,
      startDate: challengeData.startDate,
      endDate: challengeData.endDate,
      rewardPoints: challengeData.rewardPoints,
      rewardBadge: challengeData.rewardBadge,
      rewardDescription: challengeData.rewardDescription,
      maxParticipants: challengeData.maxParticipants,
      createdBy: challengeData.createdBy,
    },
  });
}

/**
 * الحصول على التحديات النشطة
 */
async function getActiveChallenges() {
  const now = new Date();
  
  return await prisma.teamChallenge.findMany({
    where: {
      status: 'ACTIVE',
      startDate: { lte: now },
      endDate: { gte: now },
    },
    include: {
      participants: {
        select: {
          userId: true,
          currentProgress: true,
          rank: true,
        },
      },
      _count: {
        select: {
          participants: true,
        },
      },
    },
    orderBy: {
      startDate: 'desc',
    },
  });
}

/**
 * الانضمام لتحدي
 */
async function joinChallenge(challengeId, userId) {
  // التحقق من التحدي
  const challenge = await prisma.teamChallenge.findUnique({
    where: { id: challengeId },
    include: {
      _count: {
        select: { participants: true },
      },
    },
  });

  if (!challenge) {
    throw new Error('التحدي غير موجود');
  }

  if (challenge.status !== 'ACTIVE' && challenge.status !== 'UPCOMING') {
    throw new Error('لا يمكن الانضمام لهذا التحدي');
  }

  if (challenge.maxParticipants && challenge._count.participants >= challenge.maxParticipants) {
    throw new Error('التحدي ممتلئ');
  }

  // التحقق من عدم الانضمام سابقاً
  const existing = await prisma.challengeParticipant.findUnique({
    where: {
      challengeId_userId: {
        challengeId,
        userId,
      },
    },
  });

  if (existing) {
    throw new Error('أنت مشترك في هذا التحدي بالفعل');
  }

  // الانضمام
  const participant = await prisma.challengeParticipant.create({
    data: {
      challengeId,
      userId,
    },
  });

  // تحديث عدد المشاركين
  await prisma.teamChallenge.update({
    where: { id: challengeId },
    data: {
      currentParticipants: { increment: 1 },
    },
  });

  return participant;
}

/**
 * تحديث تقدم المشارك في التحدي
 */
async function updateChallengeProgress(challengeId, userId, progress) {
  const challenge = await prisma.teamChallenge.findUnique({
    where: { id: challengeId },
  });

  if (!challenge) {
    throw new Error('التحدي غير موجود');
  }

  const progressPercent = (progress / challenge.targetValue) * 100;
  const completed = progress >= challenge.targetValue;

  const participant = await prisma.challengeParticipant.update({
    where: {
      challengeId_userId: {
        challengeId,
        userId,
      },
    },
    data: {
      currentProgress: progress,
      progressPercent,
      status: completed ? 'COMPLETED' : 'ACTIVE',
      completedAt: completed ? new Date() : undefined,
      pointsEarned: completed ? challenge.rewardPoints : 0,
      badgeEarned: completed ? challenge.rewardBadge : undefined,
    },
  });

  // تحديث لوحة الصدارة
  await updateLeaderboard(challengeId);

  return participant;
}

/**
 * تحديث لوحة الصدارة للتحدي
 */
async function updateLeaderboard(challengeId) {
  const participants = await prisma.challengeParticipant.findMany({
    where: { challengeId },
    orderBy: {
      currentProgress: 'desc',
    },
  });

  // تحديث الترتيب
  for (let i = 0; i < participants.length; i++) {
    const participant = participants[i];
    const rank = i + 1;

    await prisma.challengeParticipant.update({
      where: { id: participant.id },
      data: { rank },
    });

    // تحديث أو إنشاء سجل في لوحة الصدارة
    await prisma.challengeLeaderboard.upsert({
      where: {
        challengeId_userId: {
          challengeId,
          userId: participant.userId,
        },
      },
      create: {
        challengeId,
        userId: participant.userId,
        score: participant.currentProgress,
        rank,
        achievements: [],
      },
      update: {
        score: participant.currentProgress,
        rank,
      },
    });
  }
}

/**
 * الحصول على لوحة الصدارة للتحدي
 */
async function getChallengeLeaderboard(challengeId) {
  return await prisma.challengeLeaderboard.findMany({
    where: { challengeId },
    orderBy: { rank: 'asc' },
    take: 50,
  });
}

/**
 * الحصول على تحديات المستخدم
 */
async function getUserChallenges(userId) {
  return await prisma.challengeParticipant.findMany({
    where: { userId },
    include: {
      challenge: true,
    },
    orderBy: {
      joinedAt: 'desc',
    },
  });
}

module.exports = {
  logDailyNutrition,
  getNutritionLogs,
  getTodayNutrition,
  setNutritionGoal,
  getActiveGoals,
  updateGoalProgress,
  generateWeeklyReport,
  getWeeklyReports,
  createTeamChallenge,
  getActiveChallenges,
  joinChallenge,
  updateChallengeProgress,
  getChallengeLeaderboard,
  getUserChallenges,
};

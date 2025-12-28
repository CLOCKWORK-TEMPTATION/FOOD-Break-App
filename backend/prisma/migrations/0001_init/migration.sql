-- CreateEnum
CREATE TYPE "AllergySeverity" AS ENUM ('MILD', 'MODERATE', 'SEVERE', 'CRITICAL');

-- CreateEnum
CREATE TYPE "OrderMessageType" AS ENUM ('DIETARY_REQUEST', 'ALLERGY_WARNING', 'MODIFICATION', 'SPECIAL_COOKING', 'INGREDIENT_SWAP', 'GENERAL_NOTE');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('PENDING', 'RECEIVED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'COMPLETED', 'CANNOT_FULFILL');

-- CreateEnum
CREATE TYPE "MessagePriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('REGULAR', 'VIP', 'ADMIN', 'PRODUCER');

-- CreateEnum
CREATE TYPE "MenuType" AS ENUM ('CORE', 'GEOGRAPHIC');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('REGULAR', 'EXCEPTION');

-- CreateEnum
CREATE TYPE "ExceptionType" AS ENUM ('FULL', 'LIMITED', 'SELF_PAID');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ORDER_CONFIRMED', 'ORDER_READY', 'ORDER_DELIVERED', 'EXCEPTION_APPROVED', 'REMINDER', 'SYSTEM');

-- CreateEnum
CREATE TYPE "BudgetType" AS ENUM ('VIP', 'PRODUCER', 'DEPARTMENT', 'PROJECT');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('WARNING', 'CRITICAL', 'EXCEEDED', 'RESET');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ProjectMemberRole" AS ENUM ('MEMBER', 'VIP', 'PRODUCER', 'ADMIN');

-- CreateEnum
CREATE TYPE "RecommendationType" AS ENUM ('WEATHER_BASED', 'PERSONALIZED', 'SIMILAR_ITEMS', 'DIETARY_DIVERSITY', 'TRENDING');

-- CreateEnum
CREATE TYPE "PatternType" AS ENUM ('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'SEASONAL', 'WEATHER_BASED');

-- CreateEnum
CREATE TYPE "SuggestionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'MODIFIED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "CapacityStatus" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('DRAFT', 'GENERATED', 'SENT', 'RESPONDED', 'NEGOTIATING', 'AGREED', 'REJECTED');

-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('WEIGHT_LOSS', 'WEIGHT_GAIN', 'MUSCLE_BUILD', 'MAINTENANCE', 'HEALTHY_EATING', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ChallengeType" AS ENUM ('CALORIE_GOAL', 'HEALTHY_CHOICES', 'VEGETABLE_DAYS', 'NO_SUGAR_WEEK', 'PROTEIN_POWER', 'WATER_INTAKE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "TargetType" AS ENUM ('TOTAL_CALORIES', 'AVG_CALORIES', 'TOTAL_PROTEIN', 'HEALTHY_MEALS', 'VEGETABLE_SERVINGS', 'WATER_LITERS', 'SUGAR_FREE_DAYS');

-- CreateEnum
CREATE TYPE "ChallengeStatus" AS ENUM ('UPCOMING', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ParticipantStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'WITHDRAWN', 'DISQUALIFIED');

-- CreateEnum
CREATE TYPE "MoodType" AS ENUM ('HAPPY', 'EXCITED', 'CALM', 'FOCUSED', 'TIRED', 'STRESSED', 'SAD', 'ANXIOUS', 'HUNGRY');

-- CreateEnum
CREATE TYPE "ConsentType" AS ENUM ('TERMS_OF_SERVICE', 'PRIVACY_POLICY', 'DATA_PROCESSING', 'MARKETING_COMMUNICATIONS', 'AI_ANALYSIS', 'HEALTH_DATA_PROCESSING');

-- CreateEnum
CREATE TYPE "ConsentStatus" AS ENUM ('GRANTED', 'DENIED', 'REVOKED');

-- CreateEnum
CREATE TYPE "EmergencyLevel" AS ENUM ('STANDARD', 'PRIORITY', 'CRITICAL', 'DISASTER');

-- CreateEnum
CREATE TYPE "EmergencyType" AS ENUM ('NATURAL_DISASTER', 'MEDICAL_EMERGENCY', 'SECURITY_EMERGENCY', 'SYSTEM_FAILURE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "PriorityLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "EmergencyOrderStatus" AS ENUM ('PENDING', 'APPROVED', 'PREPARING', 'DELIVERING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AlertLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "MedicalAlertType" AS ENUM ('WARNING', 'BLOCKING', 'CONFIRMATION');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "MedicalAlertSeverity" AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'REGULAR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dietaryRestrictions" TEXT[],
    "favoriteCuisines" TEXT[],
    "spiceLevel" INTEGER,
    "allergies" TEXT[],
    "healthGoals" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dietary_profiles" (
    "id" TEXT NOT NULL,
    "userPreferencesId" TEXT NOT NULL,
    "isHalal" BOOLEAN NOT NULL DEFAULT false,
    "isVegetarian" BOOLEAN NOT NULL DEFAULT false,
    "isVegan" BOOLEAN NOT NULL DEFAULT false,
    "isGlutenFree" BOOLEAN NOT NULL DEFAULT false,
    "isKeto" BOOLEAN NOT NULL DEFAULT false,
    "isLowSodium" BOOLEAN NOT NULL DEFAULT false,
    "isLowCarb" BOOLEAN NOT NULL DEFAULT false,
    "isDairyFree" BOOLEAN NOT NULL DEFAULT false,
    "isNutFree" BOOLEAN NOT NULL DEFAULT false,
    "isPescatarian" BOOLEAN NOT NULL DEFAULT false,
    "maxCaloriesPerMeal" INTEGER,
    "maxSodiumPerDay" INTEGER,
    "maxCarbsPerMeal" INTEGER,
    "maxSugarPerDay" INTEGER,
    "minProteinPerMeal" INTEGER,
    "customDiets" TEXT[],
    "avoidIngredients" TEXT[],
    "preferredIngredients" TEXT[],
    "strictMode" BOOLEAN NOT NULL DEFAULT false,
    "showWarnings" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dietary_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "allergy_profiles" (
    "id" TEXT NOT NULL,
    "dietaryProfileId" TEXT NOT NULL,
    "hasPeanutAllergy" BOOLEAN NOT NULL DEFAULT false,
    "hasTreeNutAllergy" BOOLEAN NOT NULL DEFAULT false,
    "hasMilkAllergy" BOOLEAN NOT NULL DEFAULT false,
    "hasEggAllergy" BOOLEAN NOT NULL DEFAULT false,
    "hasWheatAllergy" BOOLEAN NOT NULL DEFAULT false,
    "hasSoyAllergy" BOOLEAN NOT NULL DEFAULT false,
    "hasFishAllergy" BOOLEAN NOT NULL DEFAULT false,
    "hasShellfishAllergy" BOOLEAN NOT NULL DEFAULT false,
    "hasSesameAllergy" BOOLEAN NOT NULL DEFAULT false,
    "otherAllergies" TEXT[],
    "severityLevel" "AllergySeverity" NOT NULL DEFAULT 'MODERATE',
    "showAlerts" BOOLEAN NOT NULL DEFAULT true,
    "requireConfirmation" BOOLEAN NOT NULL DEFAULT true,
    "emergencyContact" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "allergy_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_labels" (
    "id" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "isHalal" BOOLEAN NOT NULL DEFAULT false,
    "isHalalCertified" BOOLEAN NOT NULL DEFAULT false,
    "isVegetarian" BOOLEAN NOT NULL DEFAULT false,
    "isVegan" BOOLEAN NOT NULL DEFAULT false,
    "isGlutenFree" BOOLEAN NOT NULL DEFAULT false,
    "isKeto" BOOLEAN NOT NULL DEFAULT false,
    "isLowSodium" BOOLEAN NOT NULL DEFAULT false,
    "isLowCarb" BOOLEAN NOT NULL DEFAULT false,
    "isDairyFree" BOOLEAN NOT NULL DEFAULT false,
    "isNutFree" BOOLEAN NOT NULL DEFAULT false,
    "isOrganic" BOOLEAN NOT NULL DEFAULT false,
    "isSpicy" BOOLEAN NOT NULL DEFAULT false,
    "spicyLevel" INTEGER,
    "containsAllergens" TEXT[],
    "mayContainAllergens" TEXT[],
    "crossContaminationRisk" BOOLEAN NOT NULL DEFAULT false,
    "ingredients" TEXT[],
    "warnings" TEXT[],
    "certifications" TEXT[],
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "food_labels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_order_messages" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "messageType" "OrderMessageType" NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "dietaryNotes" TEXT,
    "allergyNotes" TEXT,
    "specialRequests" TEXT[],
    "status" "MessageStatus" NOT NULL DEFAULT 'PENDING',
    "restaurantReply" TEXT,
    "repliedAt" TIMESTAMP(3),
    "priority" "MessagePriority" NOT NULL DEFAULT 'NORMAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_order_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "cuisineType" TEXT,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "phoneNumber" TEXT,
    "email" TEXT,
    "isPartner" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "rating" DOUBLE PRECISION DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastReviewed" TIMESTAMP(3),

    CONSTRAINT "restaurants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_items" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "description" TEXT,
    "descriptionAr" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "category" TEXT,
    "imageUrl" TEXT,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "menuType" "MenuType" NOT NULL DEFAULT 'CORE',
    "qualityScore" DOUBLE PRECISION DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nutritional_info" (
    "id" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "calories" DOUBLE PRECISION,
    "protein" DOUBLE PRECISION,
    "carbs" DOUBLE PRECISION,
    "fat" DOUBLE PRECISION,
    "fiber" DOUBLE PRECISION,
    "sugar" DOUBLE PRECISION,
    "sodium" DOUBLE PRECISION,
    "vitamins" JSONB,
    "allergens" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nutritional_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "restaurantId" TEXT,
    "projectId" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "orderType" "OrderType" NOT NULL DEFAULT 'REGULAR',
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "exceptionType" "ExceptionType",
    "exceptionAmount" DOUBLE PRECISION,
    "deliveryAddress" TEXT,
    "deliveryLat" DOUBLE PRECISION,
    "deliveryLng" DOUBLE PRECISION,
    "estimatedTime" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_tracking" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "etaMinutes" INTEGER,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price" DOUBLE PRECISION NOT NULL,
    "specialInstructions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exceptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" TEXT,
    "exceptionType" "ExceptionType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "quotaUsed" BOOLEAN NOT NULL DEFAULT true,
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exceptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "menuItemId" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "images" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "orderId" TEXT,
    "projectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_budgets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "BudgetType" NOT NULL,
    "targetUserId" TEXT,
    "maxLimit" DOUBLE PRECISION NOT NULL,
    "usedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "warningThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "cost_budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_alerts" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "alertType" "AlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "currentAmount" DOUBLE PRECISION NOT NULL,
    "budgetLimit" DOUBLE PRECISION NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cost_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "qrCode" TEXT NOT NULL,
    "location" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastAccessedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_members" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "ProjectMemberRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "recommendationType" "RecommendationType" NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "weatherData" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_behaviors" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "timeSlot" TEXT NOT NULL,
    "avgOrderValue" DOUBLE PRECISION NOT NULL,
    "orderFrequency" DOUBLE PRECISION NOT NULL,
    "preferredCuisines" TEXT[],
    "preferredItems" TEXT[],
    "lastOrderDate" TIMESTAMP(3),
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_behaviors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_patterns" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "patternType" "PatternType" NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "frequency" INTEGER NOT NULL,
    "menuItemIds" TEXT[],
    "restaurantId" TEXT,
    "dayOfWeek" INTEGER,
    "timePreference" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastTriggered" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_patterns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quantity_forecasts" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "forecastDate" TIMESTAMP(3) NOT NULL,
    "predictedQty" INTEGER NOT NULL,
    "actualQty" INTEGER,
    "confidence" DOUBLE PRECISION NOT NULL,
    "factors" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quantity_forecasts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auto_order_suggestions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "suggestedItems" JSONB NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "suggestedTime" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "status" "SuggestionStatus" NOT NULL DEFAULT 'PENDING',
    "userResponse" TEXT,
    "respondedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auto_order_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_schedules" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "timeSlot" TEXT NOT NULL,
    "predictedOrders" INTEGER NOT NULL,
    "actualOrders" INTEGER,
    "isPeakTime" BOOLEAN NOT NULL DEFAULT false,
    "capacityStatus" "CapacityStatus" NOT NULL DEFAULT 'NORMAL',
    "recommendedDrivers" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demand_forecast_reports" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "reportPeriod" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "totalPredictedOrders" INTEGER NOT NULL,
    "totalPredictedRevenue" DOUBLE PRECISION NOT NULL,
    "itemForecasts" JSONB NOT NULL,
    "bulkDiscountEligible" BOOLEAN NOT NULL DEFAULT false,
    "suggestedDiscount" DOUBLE PRECISION,
    "status" "ReportStatus" NOT NULL DEFAULT 'DRAFT',
    "sentToRestaurant" BOOLEAN NOT NULL DEFAULT false,
    "restaurantResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "demand_forecast_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_nutrition_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orderId" TEXT,
    "totalCalories" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalProtein" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCarbs" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalFat" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalFiber" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalSugar" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalSodium" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mealsCount" INTEGER NOT NULL DEFAULT 0,
    "waterIntake" DOUBLE PRECISION,
    "exerciseMinutes" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_nutrition_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nutrition_goals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "goalType" "GoalType" NOT NULL,
    "targetCalories" DOUBLE PRECISION,
    "targetProtein" DOUBLE PRECISION,
    "targetCarbs" DOUBLE PRECISION,
    "targetFat" DOUBLE PRECISION,
    "targetFiber" DOUBLE PRECISION,
    "targetWater" DOUBLE PRECISION,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "successDays" INTEGER NOT NULL DEFAULT 0,
    "totalDays" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nutrition_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_challenges" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleAr" TEXT,
    "description" TEXT NOT NULL,
    "descriptionAr" TEXT,
    "challengeType" "ChallengeType" NOT NULL,
    "targetType" "TargetType" NOT NULL,
    "targetValue" DOUBLE PRECISION NOT NULL,
    "currentValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "rewardPoints" INTEGER,
    "rewardBadge" TEXT,
    "rewardDescription" TEXT,
    "status" "ChallengeStatus" NOT NULL DEFAULT 'UPCOMING',
    "isTeamChallenge" BOOLEAN NOT NULL DEFAULT true,
    "maxParticipants" INTEGER,
    "currentParticipants" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challenge_participants" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentProgress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "progressPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rank" INTEGER,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" "ParticipantStatus" NOT NULL DEFAULT 'ACTIVE',
    "pointsEarned" INTEGER NOT NULL DEFAULT 0,
    "badgeEarned" TEXT,

    CONSTRAINT "challenge_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challenge_leaderboard" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "rank" INTEGER NOT NULL,
    "achievements" TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "challenge_leaderboard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_nutrition_reports" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "weekEnd" TIMESTAMP(3) NOT NULL,
    "avgCalories" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgProtein" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgCarbs" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgFat" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgFiber" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalMeals" INTEGER NOT NULL DEFAULT 0,
    "healthyMealsCount" INTEGER NOT NULL DEFAULT 0,
    "healthyMealsPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overallScore" DOUBLE PRECISION,
    "strengths" TEXT[],
    "improvements" TEXT[],
    "recommendations" TEXT[],
    "goalsAchieved" INTEGER NOT NULL DEFAULT 0,
    "streakDays" INTEGER NOT NULL DEFAULT 0,
    "badgesEarned" TEXT[],
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weekly_nutrition_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_mood_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mood" "MoodType" NOT NULL,
    "intensity" INTEGER NOT NULL DEFAULT 5,
    "notes" TEXT,
    "context" TEXT,
    "sentimentScore" DOUBLE PRECISION,
    "suggestedAction" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_mood_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emotion_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stressTriggers" TEXT[],
    "comfortFoods" TEXT[],
    "energyFoods" TEXT[],
    "allowMoodAnalysis" BOOLEAN NOT NULL DEFAULT true,
    "allowSuggestions" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emotion_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consent_records" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ConsentType" NOT NULL,
    "status" "ConsentStatus" NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "version" TEXT NOT NULL,
    "consentedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "consent_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_restaurants" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "isEmergencyReady" BOOLEAN NOT NULL DEFAULT true,
    "emergencyLevel" "EmergencyLevel" NOT NULL DEFAULT 'STANDARD',
    "maxEmergencyOrders" INTEGER NOT NULL DEFAULT 10,
    "currentEmergencyOrders" INTEGER NOT NULL DEFAULT 0,
    "avgPreparationTime" INTEGER NOT NULL DEFAULT 15,
    "emergencyHoursStart" TEXT,
    "emergencyHoursEnd" TEXT,
    "is24HourAvailable" BOOLEAN NOT NULL DEFAULT false,
    "emergencyPhone" TEXT,
    "emergencyEmail" TEXT,
    "emergencyContact" TEXT,
    "servicesAvailable" TEXT[],
    "paymentMethods" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastVerified" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emergency_restaurants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_orders" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "emergencyType" "EmergencyType" NOT NULL,
    "emergencyReason" TEXT,
    "priorityLevel" "PriorityLevel" NOT NULL DEFAULT 'HIGH',
    "preApprovedItems" JSONB,
    "estimatedTime" INTEGER NOT NULL,
    "actualTime" INTEGER,
    "fastTrackDelivery" BOOLEAN NOT NULL DEFAULT true,
    "deliveryPriority" INTEGER NOT NULL DEFAULT 1,
    "status" "EmergencyOrderStatus" NOT NULL DEFAULT 'PENDING',
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "emergencyFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emergency_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pre_prepared_meals" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL,
    "expirationDate" TIMESTAMP(3) NOT NULL,
    "storageLocation" TEXT,
    "storageTemperature" TEXT,
    "nutritionalInfo" JSONB,
    "allergens" TEXT[],
    "dietaryLabels" TEXT[],
    "cost" DOUBLE PRECISION NOT NULL,
    "emergencyPrice" DOUBLE PRECISION NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "isReserved" BOOLEAN NOT NULL DEFAULT false,
    "reservedBy" TEXT,
    "reservedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pre_prepared_meals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_protocols" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "emergencyType" "EmergencyType" NOT NULL,
    "triggerConditions" JSONB NOT NULL,
    "requiredActions" TEXT[],
    "notificationSteps" JSONB,
    "escalationRules" JSONB,
    "notifyUsers" BOOLEAN NOT NULL DEFAULT true,
    "notifyRestaurants" BOOLEAN NOT NULL DEFAULT true,
    "notifyAdmins" BOOLEAN NOT NULL DEFAULT true,
    "emergencyContacts" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastExecuted" TIMESTAMP(3),
    "executionCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emergency_protocols_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bloodType" TEXT,
    "emergencyContact" TEXT,
    "emergencyPhone" TEXT,
    "medicalNotes" TEXT,
    "chronicConditions" TEXT[],
    "medications" TEXT[],
    "foodAllergies" JSONB,
    "dietaryRestrictions" TEXT[],
    "alertLevel" "AlertLevel" NOT NULL DEFAULT 'MEDIUM',
    "enableNotifications" BOOLEAN NOT NULL DEFAULT true,
    "enableSoundAlert" BOOLEAN NOT NULL DEFAULT true,
    "dataSharingConsent" BOOLEAN NOT NULL DEFAULT false,
    "consentDate" TIMESTAMP(3),
    "consentVersion" TEXT NOT NULL DEFAULT '1.0',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medical_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "allergy_alerts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "allergen" TEXT NOT NULL,
    "severity" "AllergySeverity" NOT NULL,
    "alertType" "MedicalAlertType" NOT NULL DEFAULT 'WARNING',
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'HIGH',
    "crossContamination" BOOLEAN NOT NULL DEFAULT false,
    "hiddenIngredient" BOOLEAN NOT NULL DEFAULT false,
    "isAcknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedBy" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "actionRequired" TEXT[],
    "alternativeItems" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "allergy_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_emergency_hotlines" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "serviceType" TEXT[],
    "coverageArea" TEXT,
    "languages" TEXT[],
    "isFree" BOOLEAN NOT NULL DEFAULT true,
    "costInfo" TEXT,
    "availability" TEXT NOT NULL,
    "is24Hour" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medical_emergency_hotlines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredient_cross_checks" (
    "id" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "safeIngredients" TEXT[],
    "unsafeIngredients" TEXT[],
    "unknownIngredients" TEXT[],
    "riskAssessment" TEXT,
    "safetyScore" DOUBLE PRECISION,
    "recommendations" TEXT[],
    "alternativeItems" TEXT[],
    "isSafe" BOOLEAN NOT NULL DEFAULT false,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ingredient_cross_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_alert_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "triggerCondition" TEXT NOT NULL,
    "alertMessage" TEXT NOT NULL,
    "severity" "MedicalAlertSeverity" NOT NULL,
    "userAction" TEXT,
    "systemAction" TEXT,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medical_alert_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_userId_key" ON "user_preferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "dietary_profiles_userPreferencesId_key" ON "dietary_profiles"("userPreferencesId");

-- CreateIndex
CREATE UNIQUE INDEX "allergy_profiles_dietaryProfileId_key" ON "allergy_profiles"("dietaryProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "food_labels_menuItemId_key" ON "food_labels"("menuItemId");

-- CreateIndex
CREATE UNIQUE INDEX "nutritional_info_menuItemId_key" ON "nutritional_info"("menuItemId");

-- CreateIndex
CREATE INDEX "order_tracking_orderId_recordedAt_idx" ON "order_tracking"("orderId", "recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "exceptions_orderId_key" ON "exceptions"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "projects_qrCode_key" ON "projects"("qrCode");

-- CreateIndex
CREATE INDEX "project_members_userId_idx" ON "project_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "project_members_projectId_userId_key" ON "project_members"("projectId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_behaviors_userId_dayOfWeek_timeSlot_key" ON "user_behaviors"("userId", "dayOfWeek", "timeSlot");

-- CreateIndex
CREATE UNIQUE INDEX "quantity_forecasts_restaurantId_menuItemId_forecastDate_key" ON "quantity_forecasts"("restaurantId", "menuItemId", "forecastDate");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_schedules_date_timeSlot_key" ON "delivery_schedules"("date", "timeSlot");

-- CreateIndex
CREATE UNIQUE INDEX "user_nutrition_logs_userId_date_key" ON "user_nutrition_logs"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "challenge_participants_challengeId_userId_key" ON "challenge_participants"("challengeId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "challenge_leaderboard_challengeId_userId_key" ON "challenge_leaderboard"("challengeId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "weekly_nutrition_reports_userId_weekStart_key" ON "weekly_nutrition_reports"("userId", "weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "emotion_profiles_userId_key" ON "emotion_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "emergency_restaurants_restaurantId_key" ON "emergency_restaurants"("restaurantId");

-- CreateIndex
CREATE UNIQUE INDEX "medical_profiles_userId_key" ON "medical_profiles"("userId");

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dietary_profiles" ADD CONSTRAINT "dietary_profiles_userPreferencesId_fkey" FOREIGN KEY ("userPreferencesId") REFERENCES "user_preferences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allergy_profiles" ADD CONSTRAINT "allergy_profiles_dietaryProfileId_fkey" FOREIGN KEY ("dietaryProfileId") REFERENCES "dietary_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nutritional_info" ADD CONSTRAINT "nutritional_info_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_tracking" ADD CONSTRAINT "order_tracking_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exceptions" ADD CONSTRAINT "exceptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_budgets" ADD CONSTRAINT "cost_budgets_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_alerts" ADD CONSTRAINT "cost_alerts_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "cost_budgets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_alerts" ADD CONSTRAINT "cost_alerts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_behaviors" ADD CONSTRAINT "user_behaviors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_patterns" ADD CONSTRAINT "order_patterns_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_patterns" ADD CONSTRAINT "order_patterns_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quantity_forecasts" ADD CONSTRAINT "quantity_forecasts_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quantity_forecasts" ADD CONSTRAINT "quantity_forecasts_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auto_order_suggestions" ADD CONSTRAINT "auto_order_suggestions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demand_forecast_reports" ADD CONSTRAINT "demand_forecast_reports_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_nutrition_logs" ADD CONSTRAINT "user_nutrition_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nutrition_goals" ADD CONSTRAINT "nutrition_goals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_participants" ADD CONSTRAINT "challenge_participants_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "team_challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_leaderboard" ADD CONSTRAINT "challenge_leaderboard_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "team_challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_mood_logs" ADD CONSTRAINT "user_mood_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emotion_profiles" ADD CONSTRAINT "emotion_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


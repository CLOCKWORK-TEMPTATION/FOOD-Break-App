/**
 * Production Seed File - BreakApp
 * ملف البذر للإنتاج - بريك آب
 *
 * This file seeds the database with essential production data
 * هذا الملف يملأ قاعدة البيانات بالبيانات الأساسية للإنتاج
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

/**
 * Seed Admin Users
 * إنشاء المستخدمين الإداريين
 */
async function seedAdminUsers() {
  console.log('📝 Creating admin users... / إنشاء المستخدمين الإداريين...');

  const adminPassword = await bcrypt.hash(
    process.env.ADMIN_DEFAULT_PASSWORD || 'ChangeMe@2024',
    12
  );

  const admin = await prisma.user.upsert({
    where: { email: 'admin@breakapp.com' },
    update: {},
    create: {
      email: 'admin@breakapp.com',
      passwordHash: adminPassword,
      firstName: 'مدير',
      lastName: 'النظام',
      phoneNumber: '+201000000001',
      role: 'ADMIN',
      isActive: true,
    },
  });

  const producer = await prisma.user.upsert({
    where: { email: 'producer@breakapp.com' },
    update: {},
    create: {
      email: 'producer@breakapp.com',
      passwordHash: adminPassword,
      firstName: 'مدير',
      lastName: 'الإنتاج',
      phoneNumber: '+201000000002',
      role: 'PRODUCER',
      isActive: true,
    },
  });

  console.log(`✅ Admin users created: ${admin.email}, ${producer.email}`);
  return { admin, producer };
}

/**
 * Seed Emergency Restaurants Network
 * إنشاء شبكة مطاعم الطوارئ
 */
async function seedEmergencyRestaurants() {
  console.log('🏪 Creating emergency restaurants... / إنشاء مطاعم الطوارئ...');

  const restaurants = [
    {
      id: 'emergency-rest-1',
      name: 'مطعم الطوارئ السريع',
      description: 'خدمة طوارئ على مدار الساعة',
      cuisineType: 'مختلط',
      address: 'القاهرة - وسط البلد',
      latitude: 30.0444,
      longitude: 31.2357,
      phoneNumber: '+201111111111',
      email: 'emergency1@breakapp.com',
      isPartner: true,
      isActive: true,
      rating: 4.5,
    },
    {
      id: 'emergency-rest-2',
      name: 'مطعم الخدمة الفورية',
      description: 'توصيل سريع للمواقع الإنتاجية',
      cuisineType: 'سريع',
      address: 'الجيزة - الهرم',
      latitude: 30.0131,
      longitude: 31.2089,
      phoneNumber: '+201222222222',
      email: 'emergency2@breakapp.com',
      isPartner: true,
      isActive: true,
      rating: 4.7,
    },
  ];

  for (const restaurant of restaurants) {
    const created = await prisma.restaurant.upsert({
      where: { id: restaurant.id },
      update: {},
      create: restaurant,
    });

    // Create Emergency Restaurant record
    await prisma.emergencyRestaurant.upsert({
      where: { restaurantId: created.id },
      update: {},
      create: {
        restaurantId: created.id,
        isEmergencyReady: true,
        emergencyLevel: 'PRIORITY',
        maxEmergencyOrders: 20,
        currentEmergencyOrders: 0,
        avgPreparationTime: 10,
        is24HourAvailable: true,
        emergencyPhone: restaurant.phoneNumber,
        servicesAvailable: ['delivery', 'pickup'],
        paymentMethods: ['cash', 'card', 'instapay'],
        isActive: true,
      },
    });

    console.log(`✅ Emergency restaurant created: ${created.name}`);
  }
}

/**
 * Seed Emergency Protocols
 * إنشاء بروتوكولات الطوارئ
 */
async function seedEmergencyProtocols() {
  console.log('⚠️ Creating emergency protocols... / إنشاء بروتوكولات الطوارئ...');

  const protocols = [
    {
      name: 'بروتوكول الطوارئ الطبية',
      description: 'بروتوكول للتعامل مع حالات الطوارئ الطبية',
      emergencyType: 'MEDICAL_EMERGENCY',
      triggerConditions: {
        allergyAlert: true,
        severity: 'CRITICAL',
      },
      requiredActions: [
        'إشعار فوري للمستخدم',
        'إشعار الطوارئ الطبية',
        'منع الطلب',
        'عرض بدائل آمنة',
      ],
      notifyUsers: true,
      notifyRestaurants: true,
      notifyAdmins: true,
      emergencyContacts: ['+201000000999'],
      isActive: true,
    },
    {
      name: 'بروتوكول عطل النظام',
      description: 'بروتوكول للتعامل مع أعطال النظام',
      emergencyType: 'SYSTEM_FAILURE',
      triggerConditions: {
        systemDown: true,
        duration: '5 minutes',
      },
      requiredActions: [
        'تفعيل النظام البديل',
        'إشعار جميع المستخدمين',
        'التحويل للمطاعم المتاحة',
      ],
      notifyUsers: true,
      notifyRestaurants: true,
      notifyAdmins: true,
      isActive: true,
    },
  ];

  for (const protocol of protocols) {
    await prisma.emergencyProtocol.create({
      data: protocol,
    });
    console.log(`✅ Emergency protocol created: ${protocol.name}`);
  }
}

/**
 * Seed Medical Emergency Hotlines
 * إنشاء خطوط الطوارئ الطبية
 */
async function seedMedicalHotlines() {
  console.log('🚑 Creating medical hotlines... / إنشاء خطوط الطوارئ الطبية...');

  const hotlines = [
    {
      name: 'الإسعاف المصري',
      phoneNumber: '123',
      serviceType: ['طوارئ عامة', 'إسعاف'],
      coverageArea: 'جمهورية مصر العربية',
      languages: ['العربية', 'الإنجليزية'],
      isFree: true,
      availability: '24 ساعة',
      is24Hour: true,
      isActive: true,
      priority: 1,
    },
    {
      name: 'خط الحساسية الطبي',
      phoneNumber: '0800-ALLERGY',
      serviceType: ['استشارات حساسية', 'طوارئ حساسية'],
      coverageArea: 'القاهرة الكبرى',
      languages: ['العربية', 'الإنجليزية'],
      isFree: true,
      availability: '24 ساعة',
      is24Hour: true,
      isActive: true,
      priority: 2,
    },
  ];

  for (const hotline of hotlines) {
    await prisma.medicalEmergencyHotline.create({
      data: hotline,
    });
    console.log(`✅ Medical hotline created: ${hotline.name}`);
  }
}

/**
 * Seed Default Team Challenges
 * إنشاء التحديات الجماعية الافتراضية
 */
async function seedTeamChallenges() {
  console.log('🏆 Creating team challenges... / إنشاء التحديات الجماعية...');

  const challenges = [
    {
      title: 'Healthy Week Challenge',
      titleAr: 'تحدي الأسبوع الصحي',
      description: 'Eat healthy meals for a full week',
      descriptionAr: 'تناول وجبات صحية لمدة أسبوع كامل',
      challengeType: 'HEALTHY_CHOICES',
      targetType: 'HEALTHY_MEALS',
      targetValue: 21, // 3 meals x 7 days
      currentValue: 0,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      rewardPoints: 100,
      rewardBadge: '🥗 شارة الأكل الصحي',
      rewardDescription: '100 نقطة مكافأة + شارة الأكل الصحي',
      status: 'ACTIVE',
      isTeamChallenge: true,
    },
    {
      title: 'Water Intake Challenge',
      titleAr: 'تحدي شرب الماء',
      description: 'Drink 2 liters of water daily',
      descriptionAr: 'شرب 2 لتر من الماء يومياً',
      challengeType: 'WATER_INTAKE',
      targetType: 'WATER_LITERS',
      targetValue: 14, // 2L x 7 days
      currentValue: 0,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      rewardPoints: 50,
      rewardBadge: '💧 شارة الترطيب',
      rewardDescription: '50 نقطة مكافأة + شارة الترطيب',
      status: 'ACTIVE',
      isTeamChallenge: true,
    },
  ];

  for (const challenge of challenges) {
    await prisma.teamChallenge.create({
      data: challenge,
    });
    console.log(`✅ Team challenge created: ${challenge.titleAr}`);
  }
}

/**
 * Main seeding function
 * الدالة الرئيسية للبذر
 */
async function main() {
  console.log('🌱 Starting production database seeding...');
  console.log('🌱 بدء ملء قاعدة البيانات للإنتاج...\n');

  try {
    // Seed in order of dependencies
    await seedAdminUsers();
    await seedEmergencyRestaurants();
    await seedEmergencyProtocols();
    await seedMedicalHotlines();
    await seedTeamChallenges();

    console.log('\n✅ ✅ Production database seeded successfully!');
    console.log('✅ ✅ تم ملء قاعدة البيانات للإنتاج بنجاح!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Execute main function
main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

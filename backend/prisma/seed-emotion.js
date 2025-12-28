/**
 * 🌱 Emotion AI - Seed Data
 * بيانات تجريبية لاختبار نظام الذكاء العاطفي
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * بيانات المزاج التجريبية (Sample Mood Data)
 */
const sampleMoodEntries = [
  // Week 1 - Happy productive week
  {
    moodType: 'HAPPY',
    intensity: 8,
    energy: 8,
    stress: 3,
    workType: 'LIGHT_SHOOT',
    shootingHours: 6,
    context: 'يوم تصوير ممتع مع الفريق',
    notes: 'كل شيء سار بسلاسة',
    triggers: ['تعاون الفريق', 'نجاح التصوير'],
  },
  {
    moodType: 'MOTIVATED',
    intensity: 9,
    energy: 9,
    stress: 2,
    workType: 'PREP',
    shootingHours: 4,
    context: 'التحضير لمشهد مهم',
    triggers: ['تحدي جديد', 'طاقة عالية'],
  },
  {
    moodType: 'CONTENT',
    intensity: 7,
    energy: 7,
    stress: 4,
    workType: 'MEETING',
    shootingHours: 0,
    isRestDay: false,
    context: 'اجتماعات تخطيطية',
  },
  
  // Week 2 - Stressful heavy shooting week
  {
    moodType: 'STRESSED',
    intensity: 8,
    energy: 4,
    stress: 9,
    workType: 'HEAVY_SHOOT',
    shootingHours: 14,
    context: 'يوم تصوير طويل ومكثف',
    notes: 'مشاهد صعبة، ضغط عالٍ',
    triggers: ['ساعات طويلة', 'جدول ضيق'],
  },
  {
    moodType: 'TIRED',
    intensity: 7,
    energy: 3,
    stress: 7,
    workType: 'HEAVY_SHOOT',
    shootingHours: 12,
    context: 'اليوم الثاني من التصوير المكثف',
    triggers: ['قلة النوم', 'إجهاد بدني'],
  },
  {
    moodType: 'OVERWHELMED',
    intensity: 8,
    energy: 2,
    stress: 9,
    workType: 'HEAVY_SHOOT',
    shootingHours: 13,
    context: 'ضغط شديد، مشاكل تقنية',
    triggers: ['تأخير الجدول', 'مشاكل معدات'],
  },
  
  // Week 3 - Recovery and balance
  {
    moodType: 'RELAXED',
    intensity: 6,
    energy: 6,
    stress: 3,
    workType: 'REST',
    shootingHours: 0,
    isRestDay: true,
    context: 'يوم راحة بعد أسبوع شاق',
    triggers: ['راحة', 'استشفاء'],
  },
  {
    moodType: 'CALM',
    intensity: 7,
    energy: 7,
    stress: 3,
    workType: 'LIGHT_SHOOT',
    shootingHours: 5,
    context: 'يوم هادئ ومنتج',
  },
  {
    moodType: 'EXCITED',
    intensity: 9,
    energy: 8,
    stress: 4,
    workType: 'WRAP',
    shootingHours: 6,
    context: 'انتهينا من التصوير بنجاح!',
    triggers: ['إنجاز', 'احتفال'],
  },
];

/**
 * أهداف رفاهية تجريبية (Sample Wellness Goals)
 */
const sampleWellnessGoals = [
  {
    goalType: 'STRESS_REDUCTION',
    title: 'تقليل الضغط اليومي',
    description: 'خفض مستوى الضغط إلى أقل من 5 يومياً',
    targetMetric: 'avgStress',
    targetValue: 5,
    currentValue: 0,
    unit: 'points',
    duration: 30,
    milestones: ['أسبوع واحد', 'أسبوعين', 'شهر كامل'],
    rewards: ['شارة البرونز', 'شارة الفضة', 'شارة الذهب'],
  },
  {
    goalType: 'ENERGY_IMPROVEMENT',
    title: 'تحسين مستوى الطاقة',
    description: 'الحفاظ على طاقة عالية (>7) لمدة أسبوعين',
    targetMetric: 'avgEnergy',
    targetValue: 7,
    unit: 'points',
    duration: 14,
    milestones: ['3 أيام', 'أسبوع', 'أسبوعين'],
  },
  {
    goalType: 'MOOD_STABILITY',
    title: 'استقرار المزاج',
    description: 'تحقيق استقرار عاطفي (variance < 2)',
    targetMetric: 'moodStability',
    targetValue: 0.8,
    unit: 'stability',
    duration: 30,
  },
  {
    goalType: 'MINDFUL_EATING',
    title: 'أكل واعٍ',
    description: 'تسجيل ملاحظات عن كل وجبة لمدة أسبوع',
    targetMetric: 'mindfulMeals',
    targetValue: 21,
    unit: 'meals',
    duration: 7,
  },
];

/**
 * إعدادات خصوصية افتراضية (Default Privacy Settings)
 */
const defaultPrivacySettings = {
  consentToAnalysis: true,
  allowSentimentAnalysis: true,
  shareAnonymousData: false,
  dataRetention: 90, // 90 days
  privacyLevel: 'PRIVATE',
  anonymizeData: false,
  encryptSensitiveData: true,
  canExportData: true,
  canDeleteData: true,
  agreedToTerms: true,
  termsVersion: '1.0',
};

/**
 * سجلات تفاعل تجريبية (Sample Interaction Logs)
 */
const sampleInteractions = [
  {
    interactionType: 'ORDER',
    content: 'طلبت سلطة خضراء، أشعر بالحيوية',
    detectedSentiment: 'POSITIVE',
    sentimentScore: 0.7,
    emotions: ['حيوية', 'طاقة'],
  },
  {
    interactionType: 'REVIEW',
    content: 'الوجبة كانت لذيذة جداً ورفعت معنوياتي',
    detectedSentiment: 'POSITIVE',
    sentimentScore: 0.8,
    emotions: ['سعادة', 'رضا'],
  },
  {
    interactionType: 'SURVEY',
    content: 'أشعر بالتعب قليلاً لكن بشكل عام يوم جيد',
    detectedSentiment: 'NEUTRAL',
    sentimentScore: 0.2,
    emotions: ['تعب', 'رضا'],
  },
  {
    interactionType: 'FEEDBACK',
    content: 'كنت مضغوطاً جداً، لكن الوجبة المريحة ساعدتني',
    detectedSentiment: 'MIXED',
    sentimentScore: 0.3,
    emotions: ['ضغط', 'راحة'],
  },
];

/**
 * Main Seed Function
 */
async function seedEmotionAI() {
  console.log('🌱 Starting Emotion AI Seed...');

  try {
    // 1. Find or create test user
    let testUser = await prisma.user.findFirst({
      where: { email: 'test@breakapp.com' },
    });

    if (!testUser) {
      console.log('Creating test user...');
      testUser = await prisma.user.create({
        data: {
          email: 'test@breakapp.com',
          name: 'Test User',
          phone: '+966500000000',
          // Add other required fields based on your User model
        },
      });
      console.log('✅ Test user created:', testUser.id);
    } else {
      console.log('✅ Test user found:', testUser.id);
    }

    // 2. Create privacy settings
    console.log('Creating privacy settings...');
    const privacySettings = await prisma.emotionPrivacySettings.upsert({
      where: { userId: testUser.id },
      update: defaultPrivacySettings,
      create: {
        userId: testUser.id,
        ...defaultPrivacySettings,
      },
    });
    console.log('✅ Privacy settings created');

    // 3. Create psychological profile
    console.log('Creating psychological profile...');
    const profile = await prisma.psychologicalProfile.upsert({
      where: { userId: testUser.id },
      update: {},
      create: {
        userId: testUser.id,
        enabledCare: true,
        privacyLevel: 'PRIVATE',
      },
    });
    console.log('✅ Psychological profile created:', profile.id);

    // 4. Create mood entries (spread over last 21 days)
    console.log('Creating mood entries...');
    const today = new Date();
    const moodEntries = [];

    for (let i = 0; i < sampleMoodEntries.length; i++) {
      const entryDate = new Date(today);
      entryDate.setDate(today.getDate() - (sampleMoodEntries.length - i - 1));

      const entry = await prisma.moodEntry.create({
        data: {
          userId: testUser.id,
          date: entryDate,
          ...sampleMoodEntries[i],
        },
      });
      moodEntries.push(entry);
      console.log(`  ✅ Mood entry ${i + 1}/${sampleMoodEntries.length}: ${entry.moodType}`);
    }

    // 5. Update psychological profile with calculated data
    console.log('Updating psychological profile...');
    const avgStress = moodEntries.reduce((sum, e) => sum + e.stress, 0) / moodEntries.length;
    const avgEnergy = moodEntries.reduce((sum, e) => sum + e.energy, 0) / moodEntries.length;
    
    // Calculate dominant mood (most frequent)
    const moodCounts = {};
    moodEntries.forEach(e => {
      moodCounts[e.moodType] = (moodCounts[e.moodType] || 0) + 1;
    });
    const dominantMood = Object.keys(moodCounts).reduce((a, b) => 
      moodCounts[a] > moodCounts[b] ? a : b
    );

    await prisma.psychologicalProfile.update({
      where: { id: profile.id },
      data: {
        dominantMood,
        avgStressLevel: avgStress,
        avgEnergyLevel: avgEnergy,
        totalMoodEntries: moodEntries.length,
        consecutiveDays: moodEntries.length,
        longestStreak: moodEntries.length,
        moodStability: 0.7, // Sample value
      },
    });
    console.log('✅ Profile updated with stats');

    // 6. Create wellness goals
    console.log('Creating wellness goals...');
    for (const goalData of sampleWellnessGoals) {
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + goalData.duration);

      await prisma.wellnessGoal.create({
        data: {
          profileId: profile.id,
          ...goalData,
          startDate,
          endDate,
          progress: Math.random() * 50, // Random progress 0-50%
          checkIns: Math.floor(Math.random() * 5),
        },
      });
      console.log(`  ✅ Goal: ${goalData.title}`);
    }

    // 7. Create interaction logs
    console.log('Creating interaction logs...');
    for (const interaction of sampleInteractions) {
      await prisma.interactionLog.create({
        data: {
          userId: testUser.id,
          ...interaction,
          timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in last 7 days
          isAnalyzed: true,
          isAnonymized: false,
        },
      });
    }
    console.log(`✅ Created ${sampleInteractions.length} interaction logs`);

    // 8. Generate weekly insight
    console.log('Generating weekly insight...');
    const insight = await prisma.emotionalInsight.create({
      data: {
        profileId: profile.id,
        periodStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        periodEnd: new Date(),
        periodType: 'WEEKLY',
        dominantEmotions: ['HAPPY', 'MOTIVATED', 'STRESSED'],
        moodTrends: {
          improving: ['ENERGY'],
          stable: ['MOOD'],
          declining: ['STRESS'],
        },
        stressPatterns: {
          peakDays: ['الاثنين', 'الثلاثاء'],
          lowDays: ['الخميس', 'الجمعة'],
          avgStress: avgStress,
        },
        energyPatterns: {
          peakDays: ['الأحد', 'الأربعاء'],
          lowDays: ['الثلاثاء'],
          avgEnergy: avgEnergy,
        },
        overallScore: 72,
        strengths: [
          'مستوى طاقة عالٍ في بداية الأسبوع',
          'قدرة جيدة على التعامل مع الضغط',
          'التزام منتظم بتتبع المزاج',
        ],
        concerns: [
          'ضغط عالٍ في منتصف الأسبوع',
          'انخفاض الطاقة بعد أيام التصوير الطويلة',
        ],
        recommendations: [
          'حاول أخذ فترات راحة قصيرة خلال أيام التصوير الطويلة',
          'زد من تناول الأطعمة الغنية بالبروتين للحفاظ على الطاقة',
          'مارس تمارين الاسترخاء في نهاية الأيام المجهدة',
        ],
      },
    });
    console.log('✅ Weekly insight generated');

    // 9. Create emotion recommendations (for latest mood)
    console.log('Creating emotion recommendations...');
    const latestMood = moodEntries[moodEntries.length - 1];
    
    // Get some menu items (if they exist)
    const menuItems = await prisma.menuItem.findMany({
      take: 5,
    });

    if (menuItems.length > 0) {
      for (const item of menuItems) {
        await prisma.emotionRecommendation.create({
          data: {
            moodEntryId: latestMood.id,
            menuItemId: item.id,
            recommendationType: latestMood.moodType === 'STRESSED' ? 'STRESS_RELIEF' :
                               latestMood.moodType === 'TIRED' ? 'ENERGY_BOOST' :
                               latestMood.moodType === 'HAPPY' ? 'CELEBRATION' : 'MOOD_BALANCE',
            confidence: 0.7 + Math.random() * 0.25,
            reason: `مناسب لحالتك العاطفية الحالية: ${latestMood.moodType}`,
            emotionalBenefit: ['تحسين المزاج', 'راحة نفسية'],
            nutritionalBenefit: ['متوازن', 'صحي'],
            comfortLevel: 7 + Math.floor(Math.random() * 3),
            energyBoost: 6 + Math.floor(Math.random() * 4),
            isActive: true,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expires in 24 hours
          },
        });
      }
      console.log(`✅ Created ${menuItems.length} recommendations`);
    } else {
      console.log('⚠️  No menu items found. Skipping recommendations.');
    }

    console.log('\n🎉 Emotion AI Seed Completed Successfully!');
    console.log('\n📊 Summary:');
    console.log(`   User: ${testUser.email}`);
    console.log(`   Mood Entries: ${moodEntries.length}`);
    console.log(`   Wellness Goals: ${sampleWellnessGoals.length}`);
    console.log(`   Interaction Logs: ${sampleInteractions.length}`);
    console.log(`   Insights: 1`);
    console.log(`   Recommendations: ${menuItems.length}`);
    console.log('\n✅ You can now test the Emotion AI features!');

  } catch (error) {
    console.error('❌ Error seeding Emotion AI:', error);
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  await seedEmotionAI();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

module.exports = { seedEmotionAI };

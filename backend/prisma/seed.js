const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('بدء البذر...');

  // إنشاء مستخدم تجريبي
  const hashedPassword = await bcrypt.hash('password123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      passwordHash: hashedPassword,
      firstName: 'أحمد',
      lastName: 'محمد',
      phoneNumber: '+20123456789',
      role: 'REGULAR',
    },
  });

  // إنشاء مطعم تجريبي
  const restaurant = await prisma.restaurant.upsert({
    where: { id: 'restaurant-1' },
    update: {},
    create: {
      id: 'restaurant-1',
      name: 'مطعم الأصالة',
      description: 'مطبخ عربي أصيل',
      cuisineType: 'عربي',
      address: 'شارع الهرم، الجيزة',
      latitude: 30.0131,
      longitude: 31.2089,
      phoneNumber: '+20212345678',
      isPartner: true,
    },
  });

  // إنشاء عناصر قائمة
  const menuItems = [
    {
      id: 'item-1',
      name: 'شاورما دجاج',
      nameAr: 'شاورما دجاج',
      description: 'شاورما دجاج طازجة مع الخضار والتوابل',
      descriptionAr: 'شاورما دجاج طازجة مع الخضار والتوابل',
      price: 25,
      category: 'مشاوي',
      imageUrl: 'https://example.com/shawarma.jpg',
    },
    {
      id: 'item-2',
      name: 'كشري',
      nameAr: 'كشري',
      description: 'كشري مصري أصلي مع عدس وأرز ومكرونة',
      descriptionAr: 'كشري مصري أصلي مع عدس وأرز ومكرونة',
      price: 15,
      category: 'أطباق رئيسية',
      imageUrl: 'https://example.com/koshari.jpg',
    },
    {
      id: 'item-3',
      name: 'سلطة خضراء',
      nameAr: 'سلطة خضراء',
      description: 'سلطة طازجة من الخضروات الموسمية',
      descriptionAr: 'سلطة طازجة من الخضروات الموسمية',
      price: 12,
      category: 'سلطات',
      imageUrl: 'https://example.com/salad.jpg',
    },
    {
      id: 'item-4',
      name: 'عصير برتقال ط��زج',
      nameAr: 'عصير برتقال طازج',
      description: 'عصير برتقال طبيعي 100%',
      descriptionAr: 'عصير برتقال طبيعي 100%',
      price: 8,
      category: 'مشروبات',
      imageUrl: 'https://example.com/juice.jpg',
    },
  ];

  for (const item of menuItems) {
    await prisma.menuItem.upsert({
      where: { id: item.id },
      update: {},
      create: {
        ...item,
        restaurantId: restaurant.id,
      },
    });
  }

  // إضافة معلومات غذائية
  const nutritionalData = [
    {
      menuItemId: 'item-1',
      calories: 350,
      protein: 25,
      carbs: 30,
      fat: 15,
      fiber: 3,
      sodium: 800,
      allergens: ['دجاج'],
    },
    {
      menuItemId: 'item-2',
      calories: 400,
      protein: 12,
      carbs: 65,
      fat: 8,
      fiber: 8,
      sodium: 600,
      allergens: [],
    },
    {
      menuItemId: 'item-3',
      calories: 80,
      protein: 2,
      carbs: 12,
      fat: 1,
      fiber: 4,
      sodium: 150,
      allergens: [],
    },
    {
      menuItemId: 'item-4',
      calories: 120,
      protein: 1,
      carbs: 28,
      fat: 0,
      fiber: 1,
      sodium: 5,
      allergens: [],
    },
  ];

  for (const nutrition of nutritionalData) {
    await prisma.nutritionalInfo.upsert({
      where: { menuItemId: nutrition.menuItemId },
      update: {},
      create: nutrition,
    });
  }

  // إضافة تفضيلات المستخدم
  await prisma.userPreferences.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      dietaryRestrictions: ['vegetarian'],
      favoriteCuisines: ['عربي', 'مصري'],
      spiceLevel: 3,
      allergies: [],
      healthGoals: ['weight-loss'],
    },
  });

  // إضافة طلبات تجريبية للتدريب
  const orders = [
    {
      userId: user.id,
      restaurantId: restaurant.id,
      status: 'DELIVERED',
      totalAmount: 40,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // من أسبوع
    },
    {
      userId: user.id,
      restaurantId: restaurant.id,
      status: 'DELIVERED',
      totalAmount: 25,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // من 3 أيام
    },
  ];

  for (const order of orders) {
    const createdOrder = await prisma.order.create({
      data: order,
    });

    // إضافة عناصر الطلب
    if (createdOrder.id.includes('1')) {
      await prisma.orderItem.create({
        data: {
          orderId: createdOrder.id,
          menuItemId: 'item-1',
          quantity: 1,
          price: 25,
        },
      });
      await prisma.orderItem.create({
        data: {
          orderId: createdOrder.id,
          menuItemId: 'item-3',
          quantity: 1,
          price: 12,
        },
      });
    } else {
      await prisma.orderItem.create({
        data: {
          orderId: createdOrder.id,
          menuItemId: 'item-2',
          quantity: 1,
          price: 15,
        },
      });
    }
  }

  console.log('تم البذر بنجاح!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
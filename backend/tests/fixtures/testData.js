/**
 * Test Fixtures - بيانات الاختبار
 * بيانات ثابتة للاستخدام في الاختبارات
 */

// ==========================================
// User Fixtures
// ==========================================
const users = {
  validUser: {
    id: 'user-123-uuid',
    email: 'test@example.com',
    firstName: 'أحمد',
    lastName: 'محمد',
    phoneNumber: '+966501234567',
    role: 'REGULAR',
    isActive: true,
    passwordHash: '$2a$10$test-hash',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  
  adminUser: {
    id: 'admin-123-uuid',
    email: 'admin@example.com',
    firstName: 'مدير',
    lastName: 'النظام',
    phoneNumber: '+966509876543',
    role: 'ADMIN',
    isActive: true,
    passwordHash: '$2a$10$admin-hash',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  
  producerUser: {
    id: 'producer-123-uuid',
    email: 'producer@example.com',
    firstName: 'منتج',
    lastName: 'الإنتاج',
    phoneNumber: '+966507654321',
    role: 'PRODUCER',
    isActive: true,
    passwordHash: '$2a$10$producer-hash',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  
  vipUser: {
    id: 'vip-123-uuid',
    email: 'vip@example.com',
    firstName: 'عميل',
    lastName: 'مميز',
    phoneNumber: '+966505555555',
    role: 'VIP',
    isActive: true,
    passwordHash: '$2a$10$vip-hash',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  
  inactiveUser: {
    id: 'inactive-123-uuid',
    email: 'inactive@example.com',
    firstName: 'معطل',
    lastName: 'الحساب',
    phoneNumber: '+966500000000',
    role: 'REGULAR',
    isActive: false,
    passwordHash: '$2a$10$inactive-hash',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
};

// ==========================================
// Restaurant Fixtures
// ==========================================
const restaurants = {
  activeRestaurant: {
    id: 'rest-123-uuid',
    name: 'مطعم البيت الشامي',
    description: 'أشهى المأكولات الشامية',
    cuisineType: 'شامي',
    address: 'شارع الملك فهد، الرياض',
    latitude: 24.7136,
    longitude: 46.6753,
    phoneNumber: '+966112345678',
    email: 'contact@shami.com',
    isPartner: true,
    isActive: true,
    rating: 4.5,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  
  inactiveRestaurant: {
    id: 'rest-inactive-uuid',
    name: 'مطعم مغلق',
    description: 'مطعم معطل',
    cuisineType: 'متنوع',
    address: 'عنوان المطعم',
    latitude: 24.7000,
    longitude: 46.6500,
    isPartner: false,
    isActive: false,
    rating: 3.0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
};

// ==========================================
// Menu Item Fixtures
// ==========================================
const menuItems = {
  availableItem: {
    id: 'menu-123-uuid',
    restaurantId: 'rest-123-uuid',
    name: 'شاورما دجاج',
    nameAr: 'شاورما دجاج',
    description: 'شاورما دجاج طازجة',
    descriptionAr: 'شاورما دجاج طازجة مع الخضار',
    price: 25.00,
    category: 'وجبات رئيسية',
    imageUrl: 'https://example.com/shawarma.jpg',
    isAvailable: true,
    menuType: 'CORE',
    qualityScore: 4.8,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  
  unavailableItem: {
    id: 'menu-unavailable-uuid',
    restaurantId: 'rest-123-uuid',
    name: 'طبق نفد',
    price: 30.00,
    category: 'وجبات رئيسية',
    isAvailable: false,
    menuType: 'CORE',
    qualityScore: 4.0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
};

// ==========================================
// Order Fixtures
// ==========================================
const orders = {
  pendingOrder: {
    id: 'order-pending-uuid',
    userId: 'user-123-uuid',
    restaurantId: 'rest-123-uuid',
    status: 'PENDING',
    orderType: 'REGULAR',
    totalAmount: 75.00,
    deliveryAddress: 'شارع التخصصي، الرياض',
    deliveryLat: 24.7136,
    deliveryLng: 46.6753,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  
  confirmedOrder: {
    id: 'order-confirmed-uuid',
    userId: 'user-123-uuid',
    restaurantId: 'rest-123-uuid',
    status: 'CONFIRMED',
    orderType: 'REGULAR',
    totalAmount: 120.00,
    deliveryAddress: 'شارع العليا، الرياض',
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-14'),
  },
  
  deliveredOrder: {
    id: 'order-delivered-uuid',
    userId: 'user-123-uuid',
    restaurantId: 'rest-123-uuid',
    status: 'DELIVERED',
    orderType: 'REGULAR',
    totalAmount: 95.00,
    deliveryAddress: 'حي النخيل، الرياض',
    deliveredAt: new Date('2024-01-13'),
    createdAt: new Date('2024-01-13'),
    updatedAt: new Date('2024-01-13'),
  },
};

// ==========================================
// Order Item Fixtures
// ==========================================
const orderItems = {
  item1: {
    id: 'order-item-1-uuid',
    orderId: 'order-pending-uuid',
    menuItemId: 'menu-123-uuid',
    quantity: 2,
    price: 25.00,
    specialInstructions: 'بدون بصل',
    createdAt: new Date('2024-01-15'),
  },
  
  item2: {
    id: 'order-item-2-uuid',
    orderId: 'order-pending-uuid',
    menuItemId: 'menu-123-uuid',
    quantity: 1,
    price: 25.00,
    specialInstructions: null,
    createdAt: new Date('2024-01-15'),
  },
};

// ==========================================
// Project Fixtures
// ==========================================
const projects = {
  activeProject: {
    id: 'project-123-uuid',
    name: 'مشروع الإنتاج الصيفي',
    qrCode: 'QR-PROJECT-123',
    location: 'استوديو الإنتاج - الرياض',
    latitude: 24.7136,
    longitude: 46.6753,
    startDate: new Date('2024-06-01'),
    endDate: new Date('2024-08-31'),
    isActive: true,
    orderWindow: 60,
    createdAt: new Date('2024-05-01'),
    updatedAt: new Date('2024-05-01'),
  },
  
  inactiveProject: {
    id: 'project-inactive-uuid',
    name: 'مشروع منتهي',
    qrCode: 'QR-PROJECT-INACTIVE',
    isActive: false,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-03-31'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-03-31'),
  },
};

// ==========================================
// Payment Fixtures
// ==========================================
const payments = {
  completedPayment: {
    id: 'payment-123-uuid',
    userId: 'user-123-uuid',
    orderId: 'order-delivered-uuid',
    paymentIntentId: 'pi_test_123',
    amount: 95.00,
    currency: 'SAR',
    status: 'COMPLETED',
    provider: 'STRIPE',
    completedAt: new Date('2024-01-13'),
    createdAt: new Date('2024-01-13'),
    updatedAt: new Date('2024-01-13'),
  },
  
  pendingPayment: {
    id: 'payment-pending-uuid',
    userId: 'user-123-uuid',
    orderId: 'order-pending-uuid',
    paymentIntentId: 'pi_test_pending',
    amount: 75.00,
    currency: 'SAR',
    status: 'PENDING',
    provider: 'STRIPE',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
};

// ==========================================
// Request Body Fixtures
// ==========================================
const requestBodies = {
  validRegistration: {
    email: 'newuser@example.com',
    password: 'SecurePass123!',
    firstName: 'مستخدم',
    lastName: 'جديد',
    phoneNumber: '+966501112222',
  },
  
  validLogin: {
    email: 'test@example.com',
    password: 'TestPass123!',
  },
  
  invalidLogin: {
    email: 'wrong@example.com',
    password: 'wrongpassword',
  },
  
  validOrder: {
    restaurantId: 'rest-123-uuid',
    items: [
      { menuItemId: 'menu-123-uuid', quantity: 2 },
    ],
    deliveryAddress: 'عنوان التوصيل',
    deliveryLat: 24.7136,
    deliveryLng: 46.6753,
  },
};

// ==========================================
// Exports
// ==========================================
module.exports = {
  users,
  restaurants,
  menuItems,
  orders,
  orderItems,
  projects,
  payments,
  requestBodies,
};

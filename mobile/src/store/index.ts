import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../services/apiService';

// أنواع البيانات
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'USER' | 'VIP' | 'ADMIN' | 'PROJECT_MANAGER';
  avatar?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Restaurant {
  id: string;
  name: string;
  description?: string;
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
  cuisine?: string;
  rating?: number;
  distance?: number;
  isActive: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  image?: string;
  isAvailable: boolean;
  allergens?: string[];
}

export interface Order {
  id: string;
  userId: string;
  projectId: string;
  restaurantId: string;
  restaurant?: Restaurant;
  items: OrderItem[];
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  deliveryAddress: string;
  notes?: string;
  createdAt: string;
  estimatedDelivery?: string;
}

export interface OrderItem {
  menuItemId: string;
  menuItem?: MenuItem;
  quantity: number;
  price: number;
  notes?: string;
}

export interface CartItem extends OrderItem {
  id: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: any;
}

// حالة المصادقة
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: Omit<User, 'id'> & { password: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

// حالة المشروع
interface ProjectState {
  currentProject: Project | null;
  projects: Project[];
  isLoading: boolean;
  setCurrentProject: (project: Project) => void;
  loadProjects: () => Promise<void>;
  accessProjectByQR: (qrToken: string) => Promise<boolean>;
}

// حالة المطاعم والقوائم
interface RestaurantState {
  restaurants: Restaurant[];
  currentRestaurant: Restaurant | null;
  menu: MenuItem[];
  isLoading: boolean;
  loadNearbyRestaurants: (latitude: number, longitude: number) => Promise<void>;
  setCurrentRestaurant: (restaurant: Restaurant) => void;
  loadRestaurantMenu: (restaurantId: string) => Promise<void>;
}

// حالة السلة والطلبات
interface OrderState {
  cart: CartItem[];
  orders: Order[];
  currentOrder: Order | null;
  isLoading: boolean;
  addToCart: (item: Omit<CartItem, 'id'>) => void;
  removeFromCart: (itemId: string) => void;
  updateCartItem: (itemId: string, updates: Partial<CartItem>) => void;
  clearCart: () => void;
  createOrder: (orderData: Omit<Order, 'id' | 'userId' | 'createdAt' | 'status'>) => Promise<boolean>;
  loadOrders: () => Promise<void>;
  cancelOrder: (orderId: string, reason: string) => Promise<boolean>;
  trackOrder: (orderId: string) => Promise<void>;
}

// حالة الإشعارات
interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  loadNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

// حالة التطبيق العامة
interface AppState {
  isOnline: boolean;
  currentLocation: { latitude: number; longitude: number } | null;
  theme: 'light' | 'dark';
  language: 'ar' | 'en';
  setOnlineStatus: (status: boolean) => void;
  setCurrentLocation: (location: { latitude: number; longitude: number }) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (language: 'ar' | 'en') => void;
}

// إنشاء stores منفصلة
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await apiService.login(email, password);
          if (response.success) {
            set({
              user: response.data.user,
              isAuthenticated: true,
              isLoading: false
            });
            return true;
          }
          return false;
        } catch (error) {
          console.error('خطأ في تسجيل الدخول:', error);
          set({ isLoading: false });
          return false;
        }
      },

      register: async (userData) => {
        set({ isLoading: true });
        try {
          const response = await apiService.register(userData);
          if (response.success) {
            set({ isLoading: false });
            return true;
          }
          return false;
        } catch (error) {
          console.error('خطأ في التسجيل:', error);
          set({ isLoading: false });
          return false;
        }
      },

      logout: async () => {
        try {
          await apiService.logout();
          set({
            user: null,
            isAuthenticated: false
          });
        } catch (error) {
          console.error('خطأ في تسجيل الخروج:', error);
        }
      },

      updateUser: (userData) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...userData }
          });
        }
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

export const useProjectStore = create<ProjectState>((set, get) => ({
  currentProject: null,
  projects: [],
  isLoading: false,

  setCurrentProject: (project) => {
    set({ currentProject: project });
  },

  loadProjects: async () => {
    set({ isLoading: true });
    try {
      // هنا يمكن إضافة استدعاء API لجلب المشاريع
      set({ isLoading: false });
    } catch (error) {
      console.error('خطأ في جلب المشاريع:', error);
      set({ isLoading: false });
    }
  },

  accessProjectByQR: async (qrToken) => {
    set({ isLoading: true });
    try {
      const response = await apiService.accessProjectByQR(qrToken);
      if (response.success) {
        set({
          currentProject: response.data.projectAccess,
          isLoading: false
        });
        return true;
      }
      set({ isLoading: false });
      return false;
    } catch (error) {
      console.error('خطأ في الوصول للمشروع:', error);
      set({ isLoading: false });
      return false;
    }
  }
}));

export const useRestaurantStore = create<RestaurantState>((set, get) => ({
  restaurants: [],
  currentRestaurant: null,
  menu: [],
  isLoading: false,

  loadNearbyRestaurants: async (latitude, longitude) => {
    set({ isLoading: true });
    try {
      const response = await apiService.getNearbyRestaurants(latitude, longitude);
      if (response.success) {
        set({
          restaurants: response.data,
          isLoading: false
        });
      }
    } catch (error) {
      console.error('خطأ في جلب المطاعم:', error);
      set({ isLoading: false });
    }
  },

  setCurrentRestaurant: (restaurant) => {
    set({ currentRestaurant: restaurant });
  },

  loadRestaurantMenu: async (restaurantId) => {
    set({ isLoading: true });
    try {
      const response = await apiService.getRestaurantMenu(restaurantId);
      if (response.success) {
        set({
          menu: response.data,
          isLoading: false
        });
      }
    } catch (error) {
      console.error('خطأ في جلب القائمة:', error);
      set({ isLoading: false });
    }
  }
}));

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      cart: [],
      orders: [],
      currentOrder: null,
      isLoading: false,

      addToCart: (item) => {
        const cart = get().cart;
        const existingItem = cart.find(cartItem => 
          cartItem.menuItemId === item.menuItemId
        );

        if (existingItem) {
          set({
            cart: cart.map(cartItem =>
              cartItem.id === existingItem.id
                ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
                : cartItem
            )
          });
        } else {
          const newItem: CartItem = {
            ...item,
            id: Date.now().toString()
          };
          set({ cart: [...cart, newItem] });
        }
      },

      removeFromCart: (itemId) => {
        const cart = get().cart;
        set({ cart: cart.filter(item => item.id !== itemId) });
      },

      updateCartItem: (itemId, updates) => {
        const cart = get().cart;
        set({
          cart: cart.map(item =>
            item.id === itemId ? { ...item, ...updates } : item
          )
        });
      },

      clearCart: () => {
        set({ cart: [] });
      },

      createOrder: async (orderData) => {
        set({ isLoading: true });
        try {
          const response = await apiService.createOrder(orderData);
          if (response.success) {
            set({
              currentOrder: response.data.order,
              cart: [], // مسح السلة بعد إنشاء الطلب
              isLoading: false
            });
            return true;
          }
          set({ isLoading: false });
          return false;
        } catch (error) {
          console.error('خطأ في إنشاء الطلب:', error);
          set({ isLoading: false });
          return false;
        }
      },

      loadOrders: async () => {
        set({ isLoading: true });
        try {
          const response = await apiService.getUserOrders();
          if (response.success) {
            set({
              orders: response.data,
              isLoading: false
            });
          }
        } catch (error) {
          console.error('خطأ في جلب الطلبات:', error);
          set({ isLoading: false });
        }
      },

      cancelOrder: async (orderId, reason) => {
        set({ isLoading: true });
        try {
          const response = await apiService.cancelOrder(orderId, reason);
          if (response.success) {
            // تحديث الطلب في القائمة
            const orders = get().orders;
            set({
              orders: orders.map(order =>
                order.id === orderId
                  ? { ...order, status: 'CANCELLED' }
                  : order
              ),
              isLoading: false
            });
            return true;
          }
          set({ isLoading: false });
          return false;
        } catch (error) {
          console.error('خطأ في إلغاء الطلب:', error);
          set({ isLoading: false });
          return false;
        }
      },

      trackOrder: async (orderId) => {
        try {
          const response = await apiService.getOrder(orderId);
          if (response.success) {
            set({ currentOrder: response.data });
          }
        } catch (error) {
          console.error('خطأ في تتبع الطلب:', error);
        }
      }
    }),
    {
      name: 'order-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        cart: state.cart
      })
    }
  )
);

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  loadNotifications: async () => {
    set({ isLoading: true });
    try {
      const response = await apiService.getNotifications();
      if (response.success) {
        const notifications = response.data;
        const unreadCount = notifications.filter((n: Notification) => !n.isRead).length;
        set({
          notifications,
          unreadCount,
          isLoading: false
        });
      }
    } catch (error) {
      console.error('خطأ في جلب الإشعارات:', error);
      set({ isLoading: false });
    }
  },

  markAsRead: async (notificationId) => {
    try {
      const response = await apiService.markNotificationAsRead(notificationId);
      if (response.success) {
        const notifications = get().notifications;
        const updatedNotifications = notifications.map(n =>
          n.id === notificationId ? { ...n, isRead: true } : n
        );
        const unreadCount = updatedNotifications.filter(n => !n.isRead).length;
        set({
          notifications: updatedNotifications,
          unreadCount
        });
      }
    } catch (error) {
      console.error('خطأ في تحديد الإشعار كمقروء:', error);
    }
  },

  markAllAsRead: async () => {
    try {
      const notifications = get().notifications;
      // هنا يمكن إضافة API call لتحديد جميع الإشعارات كمقروءة
      set({
        notifications: notifications.map(n => ({ ...n, isRead: true })),
        unreadCount: 0
      });
    } catch (error) {
      console.error('خطأ في تحديد جميع الإشعارات كمقروءة:', error);
    }
  }
}));

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isOnline: true,
      currentLocation: null,
      theme: 'light',
      language: 'ar',

      setOnlineStatus: (status) => {
        set({ isOnline: status });
      },

      setCurrentLocation: (location) => {
        set({ currentLocation: location });
      },

      setTheme: (theme) => {
        set({ theme });
      },

      setLanguage: (language) => {
        set({ language });
      }
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => AsyncStorage)
    }
  )
);
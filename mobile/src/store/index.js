/**
 * Redux Store
 * إدارة حالة التطبيق المركزية
 */

import { configureStore, createSlice } from '@reduxjs/toolkit';

// Auth Slice
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false,
    error: null
  },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    setToken: (state, action) => {
      state.token = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    }
  }
});

// Workflow Slice
const workflowSlice = createSlice({
  name: 'workflow',
  initialState: {
    currentProject: null,
    currentOrder: null,
    orders: [],
    orderWindow: null,
    isOrderWindowOpen: false,
    loading: false,
    error: null
  },
  reducers: {
    setCurrentProject: (state, action) => {
      state.currentProject = action.payload;
    },
    setOrderWindow: (state, action) => {
      state.orderWindow = action.payload;
      state.isOrderWindowOpen = action.payload?.isOpen || false;
    },
    setCurrentOrder: (state, action) => {
      state.currentOrder = action.payload;
    },
    setOrders: (state, action) => {
      state.orders = action.payload;
    },
    addOrder: (state, action) => {
      state.orders.push(action.payload);
    },
    updateOrder: (state, action) => {
      const index = state.orders.findIndex(o => o.id === action.payload.id);
      if (index !== -1) {
        state.orders[index] = action.payload;
      }
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    }
  }
});

// Menu Slice
const menuSlice = createSlice({
  name: 'menu',
  initialState: {
    restaurants: [],
    selectedRestaurant: null,
    menuItems: [],
    selectedMenuItems: [], // العناصر المختارة في السلة
    cartTotal: 0,
    loading: false,
    error: null
  },
  reducers: {
    setRestaurants: (state, action) => {
      state.restaurants = action.payload;
    },
    setSelectedRestaurant: (state, action) => {
      state.selectedRestaurant = action.payload;
    },
    setMenuItems: (state, action) => {
      state.menuItems = action.payload;
    },
    addToCart: (state, action) => {
      const { menuItem, quantity } = action.payload;
      const existingItem = state.selectedMenuItems.find(item => item.menuItemId === menuItem.id);

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        state.selectedMenuItems.push({
          menuItemId: menuItem.id,
          name: menuItem.name,
          quantity,
          price: menuItem.price,
          totalPrice: menuItem.price * quantity
        });
      }

      // حساب المجموع
      state.cartTotal = state.selectedMenuItems.reduce((sum, item) => sum + item.totalPrice, 0);
    },
    removeFromCart: (state, action) => {
      state.selectedMenuItems = state.selectedMenuItems.filter(
        item => item.menuItemId !== action.payload
      );
      state.cartTotal = state.selectedMenuItems.reduce((sum, item) => sum + item.totalPrice, 0);
    },
    updateCartItem: (state, action) => {
      const { menuItemId, quantity } = action.payload;
      const item = state.selectedMenuItems.find(i => i.menuItemId === menuItemId);
      if (item) {
        item.quantity = quantity;
        item.totalPrice = item.price * quantity;
        state.cartTotal = state.selectedMenuItems.reduce((sum, i) => sum + i.totalPrice, 0);
      }
    },
    clearCart: (state) => {
      state.selectedMenuItems = [];
      state.cartTotal = 0;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    }
  }
});

// Location Slice
const locationSlice = createSlice({
  name: 'location',
  initialState: {
    currentLocation: null,
    deliveryLocation: null,
    userLocations: [],
    nearbyRestaurants: [],
    isTracking: false,
    tracking: null, // بيانات التتبع الحالية
    loading: false,
    error: null
  },
  reducers: {
    setCurrentLocation: (state, action) => {
      state.currentLocation = action.payload;
    },
    setDeliveryLocation: (state, action) => {
      state.deliveryLocation = action.payload;
    },
    setNearbyRestaurants: (state, action) => {
      state.nearbyRestaurants = action.payload;
    },
    setTracking: (state, action) => {
      state.tracking = action.payload;
      state.isTracking = !!action.payload;
    },
    setUserLocations: (state, action) => {
      state.userLocations = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    }
  }
});

// Notification Slice
const notificationSlice = createSlice({
  name: 'notification',
  initialState: {
    notifications: [],
    unreadCount: 0,
    toastMessage: null,
    loading: false
  },
  reducers: {
    setNotifications: (state, action) => {
      state.notifications = action.payload;
      state.unreadCount = action.payload.filter(n => !n.isRead).length;
    },
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.isRead) {
        state.unreadCount++;
      }
    },
    markAsRead: (state, action) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification && !notification.isRead) {
        notification.isRead = true;
        state.unreadCount--;
      }
    },
    showToast: (state, action) => {
      state.toastMessage = action.payload;
    },
    clearToast: (state) => {
      state.toastMessage = null;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    }
  }
});

// Configure Store
const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    workflow: workflowSlice.reducer,
    menu: menuSlice.reducer,
    location: locationSlice.reducer,
    notification: notificationSlice.reducer
  }
});

// Export actions
export const authActions = authSlice.actions;
export const workflowActions = workflowSlice.actions;
export const menuActions = menuSlice.actions;
export const locationActions = locationSlice.actions;
export const notificationActions = notificationSlice.actions;

export default store;
export { store };

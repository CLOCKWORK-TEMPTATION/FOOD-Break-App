import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp } from '@react-navigation/native';

// Screens
import HomeScreen from '../screens/HomeScreen';
import RestaurantListScreen from '../screens/RestaurantListScreen';
import RestaurantDetailScreen from '../screens/RestaurantDetailScreen';
import MenuScreen from '../screens/MenuScreen';
import CartScreen from '../screens/CartScreen';
import OrderConfirmationScreen from '../screens/OrderConfirmationScreen';
import OrderTrackingScreen from '../screens/OrderTrackingScreen';
import OrderHistoryScreen from '../screens/OrderHistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import QRScannerScreen from '../screens/QRScannerScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import DietaryPreferencesScreen from '../screens/DietaryPreferencesScreen';
import AllergyManagementScreen from '../screens/AllergyManagementScreen';

// Types
export type RootStackParamList = {
  Welcome: undefined;
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  Main: undefined;
  QRScanner: undefined;
  RestaurantDetail: { restaurantId: string };
  Menu: { restaurantId: string; restaurantName: string };
  Cart: undefined;
  OrderConfirmation: { orderData: any };
  OrderTracking: { orderId: string };
  OrderHistory: undefined;
  DietaryPreferences: undefined;
  AllergyManagement: undefined;
};

export type TabParamList = {
  Home: undefined;
  Restaurants: undefined;
  Orders: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

// Bottom Tab Navigator
const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }: { route: RouteProp<TabParamList, keyof TabParamList> }) => ({
        tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Restaurants':
              iconName = focused ? 'restaurant' : 'restaurant-outline';
              break;
            case 'Orders':
              iconName = focused ? 'list' : 'list-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'home';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Restaurants" component={RestaurantListScreen} />
      <Tab.Screen name="Orders" component={OrderHistoryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

// Main App Navigator
const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Welcome">
        {/* Auth Flow */}
        <Stack.Screen 
          name="Welcome" 
          component={WelcomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Onboarding" 
          component={OnboardingScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen}
          options={{ headerShown: false }}
        />
        
        {/* Main App */}
        <Stack.Screen 
          name="Main" 
          component={TabNavigator}
          options={{ headerShown: false }}
        />
        
        {/* Feature Screens */}
        <Stack.Screen 
          name="QRScanner" 
          component={QRScannerScreen}
          options={{ 
            headerShown: true,
            title: 'مسح QR Code',
            headerStyle: {
              backgroundColor: '#007AFF',
            },
            headerTintColor: '#fff',
          }}
        />
        <Stack.Screen 
          name="RestaurantDetail" 
          component={RestaurantDetailScreen}
          options={{ 
            headerShown: true,
            title: 'تفاصيل المطعم',
            headerStyle: {
              backgroundColor: '#fff',
            },
            headerTintColor: '#007AFF',
          }}
        />
        <Stack.Screen 
          name="Menu" 
          component={MenuScreen}
          options={{ 
            headerShown: true,
            title: 'قائمة الطعام',
            headerStyle: {
              backgroundColor: '#fff',
            },
            headerTintColor: '#007AFF',
          }}
        />
        <Stack.Screen 
          name="Cart" 
          component={CartScreen}
          options={{ 
            headerShown: true,
            title: 'سلة الطلبات',
            headerStyle: {
              backgroundColor: '#fff',
            },
            headerTintColor: '#007AFF',
          }}
        />
        <Stack.Screen 
          name="OrderConfirmation" 
          component={OrderConfirmationScreen}
          options={{ 
            headerShown: true,
            title: 'تأكيد الطلب',
            headerStyle: {
              backgroundColor: '#fff',
            },
            headerTintColor: '#007AFF',
          }}
        />
        <Stack.Screen 
          name="OrderTracking" 
          component={OrderTrackingScreen}
          options={{ 
            headerShown: true,
            title: 'تتبع الطلب',
            headerStyle: {
              backgroundColor: '#fff',
            },
            headerTintColor: '#007AFF',
          }}
        />
        <Stack.Screen
          name="OrderHistory"
          component={OrderHistoryScreen}
          options={{
            headerShown: true,
            title: 'سجل الطلبات',
            headerStyle: {
              backgroundColor: '#fff',
            },
            headerTintColor: '#007AFF',
          }}
        />
        <Stack.Screen
          name="DietaryPreferences"
          component={DietaryPreferencesScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="AllergyManagement"
          component={AllergyManagementScreen}
          options={{
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
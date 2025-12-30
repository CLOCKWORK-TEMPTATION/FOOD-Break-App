/**
 * BreakApp Driver App
 * تطبيق السائق - BreakApp
 *
 * Main entry point for driver application
 */

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import * as Location from 'expo-location';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import ActiveDeliveriesScreen from './src/screens/ActiveDeliveriesScreen';
import DeliveryDetailScreen from './src/screens/DeliveryDetailScreen';
import NavigationScreen from './src/screens/NavigationScreen';
import EarningsScreen from './src/screens/EarningsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import DeliveryHistoryScreen from './src/screens/DeliveryHistoryScreen';

// Services
import { initializeWebSocket } from './src/services/websocketService';
import { startLocationTracking } from './src/services/locationService';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'ActiveDeliveries') {
            iconName = focused ? 'list-circle' : 'list-circle-outline';
          } else if (route.name === 'Navigation') {
            iconName = focused : 'navigate' : 'navigate-outline';
          } else if (route.name === 'Earnings') {
            iconName = focused ? 'wallet' : 'wallet-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#667eea',
        tabBarInactiveTintColor: 'gray',
        headerStyle: {
          backgroundColor: '#667eea',
        },
        headerTintColor: '#fff',
        tabBarStyle: {
          paddingBottom: 5,
          height: 60,
        },
      })}
    >
      <Tab.Screen
        name="ActiveDeliveries"
        component={ActiveDeliveriesScreen}
        options={{ title: 'التوصيلات النشطة' }}
      />
      <Tab.Screen
        name="Navigation"
        component={NavigationScreen}
        options={{ title: 'الملاحة' }}
      />
      <Tab.Screen
        name="Earnings"
        component={EarningsScreen}
        options={{ title: 'الأرباح' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'الملف الشخصي' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [driverId, setDriverId] = useState(null);

  useEffect(() => {
    // Request location permissions
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();

        if (backgroundStatus === 'granted') {
          console.log('Location permissions granted');
        }
      }
    })();
  }, []);

  useEffect(() => {
    if (isAuthenticated && driverId) {
      // Initialize WebSocket connection
      initializeWebSocket(driverId);

      // Start location tracking
      startLocationTracking(driverId);
    }
  }, [isAuthenticated, driverId]);

  return (
    <PaperProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!isAuthenticated ? (
            <Stack.Screen name="Login">
              {(props) => (
                <LoginScreen
                  {...props}
                  onLogin={(id) => {
                    setDriverId(id);
                    setIsAuthenticated(true);
                  }}
                />
              )}
            </Stack.Screen>
          ) : (
            <>
              <Stack.Screen name="Main" component={MainTabs} />
              <Stack.Screen
                name="DeliveryDetail"
                component={DeliveryDetailScreen}
                options={{ headerShown: true, title: 'تفاصيل التوصيل' }}
              />
              <Stack.Screen
                name="DeliveryHistory"
                component={DeliveryHistoryScreen}
                options={{ headerShown: true, title: 'سجل التوصيلات' }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}

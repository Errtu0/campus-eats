import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, QrCode, LayoutGrid, RotateCcw, User } from 'lucide-react-native';
import { COLORS } from '../src/styles/theme';

import CustomerHomeScreen from './CustomerHomeScreen';
import CustomerDashboard from './CustomerScan';
import TableMapScreen from './TableMapScreen';
import ReorderScreen from './ReorderScreen';
import ProfileScreen from './ProfileScreen';
import CustomerScan from './CustomerScan';

const Tab = createBottomTabNavigator();

export default function CustomerTabs({ route }) {
  const { user, restaurantId, restaurantName } = route.params;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#000000', // Solid black for active
        tabBarInactiveTintColor: '#8E8B7E',
        tabBarStyle: { 
          height: 85, 
          paddingBottom: 25, 
          backgroundColor: '#F4F1DE', // Your specific cream color
          borderTopWidth: 1,
          borderTopColor: '#E0DCC5', // Slightly darker cream for the top border
          elevation: 0, 
          shadowOpacity: 0, 
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        }
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={CustomerHomeScreen} 
        initialParams={{ user, restaurantId, restaurantName }} 
        options={{ 
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} strokeWidth={2} /> 
        }}
      />
      <Tab.Screen 
        name="Scan" 
        component={CustomerScan} 
        initialParams={{ user, restaurantId }} 
        options={{ 
          tabBarIcon: ({ color, size }) => <QrCode color={color} size={size} strokeWidth={2} /> 
        }}
      />
      <Tab.Screen 
        name="Tables" 
        component={TableMapScreen} 
        initialParams={{ restaurantId }} 
        options={{ 
          tabBarIcon: ({ color, size }) => <LayoutGrid color={color} size={size} strokeWidth={2} /> 
        }}
      />
      <Tab.Screen 
        name="Reorder" 
        component={ReorderScreen} 
        initialParams={{ user, restaurantId }} 
        options={{ 
          tabBarIcon: ({ color, size }) => <RotateCcw color={color} size={size} strokeWidth={2} /> 
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        initialParams={{ user }} 
        options={{ 
          tabBarIcon: ({ color, size }) => <User color={color} size={size} strokeWidth={2} /> 
        }}
      />
    </Tab.Navigator>
  );
}


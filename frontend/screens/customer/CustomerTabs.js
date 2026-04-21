import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, QrCode, LayoutGrid, RotateCcw, User } from 'lucide-react-native';
import { COLORS } from '../../src/styles/theme';
import { TABLE_URL } from '../../src/config';

// Tab Imports
import HomeTab from './tabs/HomeTab';
import CustomerScan from './tabs/CustomerScan';
import TableMapTab from './tabs/TableMapTab';
import ReorderTab from './tabs/ReorderTab';
import ProfileTab from './tabs/ProfileTab';

const Tab = createBottomTabNavigator();

export default function CustomerTabs({ route, navigation }) {
  const { user, restaurantId, restaurantName } = route.params;
  const [activeSession, setActiveSession] = useState(null);

  useEffect(() => {
    checkSession();
    const interval = setInterval(checkSession, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const checkSession = async () => {
    try {
      const storedData = await AsyncStorage.getItem('active_session');
      if (!storedData) {
        setActiveSession(null);
        return;
      }

      const parsed = JSON.parse(storedData);
      
      // 1. Check if the session belongs to THIS restaurant branch
      // We use 'restaurantId' which is destructured from route.params at the top
      const isCorrectBranch = parsed.restaurant_id === restaurantId;

      if (!isCorrectBranch) {
        // We don't remove it from storage because it might be valid 
        // for the other branch, we just don't show it here.
        setActiveSession(null);
        return;
      }

      // 2. Verify with backend if it's still active
      const response = await fetch(`${TABLE_URL}/session-status/${parsed.id}`);
      const result = await response.json();

      if (response.ok && result.is_active) {
        setActiveSession(parsed);
      } else {
        // Session was closed by staff, clean up storage
        await AsyncStorage.removeItem('active_session');
        setActiveSession(null);
        console.log("Session expired. Sticky bar removed.");
      }

    } catch (e) {
      console.error("Session Check Error:", e);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FDFBEB' }}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: '#666',
          tabBarStyle: {
            height: 90,
            paddingBottom: 30,
            backgroundColor: '#FDFBEB',
            borderTopWidth: 4,
            borderTopColor: '#000',
            elevation: 0,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '900',
            textTransform: 'uppercase',
          },
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeTab}
          initialParams={{ user, restaurantId, restaurantName }}
          options={{
            tabBarIcon: ({ color }) => <Home color={color} size={24} strokeWidth={2.5} />,
          }}
        />
        <Tab.Screen
          name="Scan"
          component={CustomerScan}
          initialParams={{ user, restaurantId }}
          options={{
            tabBarIcon: ({ color }) => <QrCode color={color} size={24} strokeWidth={2.5} />,
          }}
        />
        <Tab.Screen
          name="Tables"
          component={TableMapTab}
          initialParams={{ restaurantId: restaurantId }}
          options={{
            tabBarIcon: ({ color }) => <LayoutGrid color={color} size={24} strokeWidth={2.5} />,
          }}
        />
        <Tab.Screen
          name="Reorder"
          component={ReorderTab}
          initialParams={{ user, restaurantId }}
          options={{
            tabBarIcon: ({ color }) => <RotateCcw color={color} size={24} strokeWidth={2.5} />,
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileTab}
          initialParams={{ user }}
          options={{
            tabBarIcon: ({ color }) => <User color={color} size={24} strokeWidth={2.5} />,
          }}
        />
      </Tab.Navigator>

      {/* STICKY SESSION BAR - Now outside the Navigator but inside the main View */}
      {activeSession && (
        <TouchableOpacity
          style={styles.stickyBar}
          activeOpacity={0.9}
          onPress={() =>
            navigation.navigate('OrderScreen', {
              session: activeSession,
              user,
              restaurantName: activeSession.restaurantName,
            })
          }
        >
          <View style={styles.sessionInfo}>
            <View style={styles.pulseDot} />
            <Text style={styles.stickyText}>
              TABLE {activeSession.table_id} • {activeSession.restaurantName?.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.viewOrderText}>RESUME ORDER {'>'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stickyBar: {
    position: 'absolute',
    bottom: 100, // Slightly higher than the 90px Tab Bar
    left: 15,
    right: 15,
    backgroundColor: '#000',
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    // Shadow for Neobrutalist "floating" effect
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 10,
  },
  sessionInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#7befb1',
    borderWidth: 1,
    borderColor: '#000',
  },
  stickyText: { color: '#fff', fontWeight: '900', fontSize: 11, letterSpacing: 0.5 },
  viewOrderText: { color: '#fff', fontWeight: '900', fontSize: 10, textDecorationLine: 'underline' },
});
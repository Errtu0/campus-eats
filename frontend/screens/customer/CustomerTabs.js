import React, { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, QrCode, LayoutGrid, RotateCcw, User } from 'lucide-react-native';
import { COLORS } from '../../src/styles/theme';
import { TABLE_URL, ORDER_URL, RESTAURANT_URL, AUTH_URL } from '../../src/config';

// Tab Imports
import HomeTab from './tabs/HomeTab';
import CustomerScan from './tabs/CustomerScan';
import TableMapTab from './tabs/TableMapTab';
import ReorderTab from './tabs/ReorderTab';
import ProfileTab from './tabs/ProfileTab';

const Tab = createBottomTabNavigator();

export default function CustomerTabs({ route, navigation }) {
  // FIX 1: Extracted 'menu' from the incoming route params array cleanly!
  const { user, restaurantId, restaurantName, menu } = route.params;
  
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAppData = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' 
      };

      console.log(`📡 sync loop started for branch ID: ${restaurantId}`);

      // 1. ISOLATED MENU FETCH
      try {
        const menuRes = await fetch(`${ORDER_URL}/menu-items?restaurantId=${restaurantId}`, { headers });
        const menuData = await menuRes.json();
        if (menuRes.ok && Array.isArray(menuData)) {
          await AsyncStorage.setItem(`menu_${restaurantId}`, JSON.stringify(menuData));
        }
      } catch (err) { console.error("❌ Isolated Menu Err:", err.message); }

      // 2. ISOLATED TABLES FETCH
      try {
        const tableRes = await fetch(`${RESTAURANT_URL}/${restaurantId}/tables`, { headers });
        const tableData = await tableRes.json();
        if (tableRes.ok && Array.isArray(tableData)) {
          await AsyncStorage.setItem(`tables_${restaurantId}`, JSON.stringify(tableData));
        }
      } catch (err) { console.error("❌ Isolated Tables Err:", err.message); }

      // 3. BACKGROUND HOOK TO SYNC LIVE BROADCASTS
      try {
        const newsRes = await fetch(`${RESTAURANT_URL}/news-feed/${restaurantId}`, { headers });
        if (newsRes.ok) {
          const newsData = await newsRes.json();
          if (Array.isArray(newsData)) {
            await AsyncStorage.setItem(`news_${restaurantId}`, JSON.stringify(newsData));
          }
        } else {
          console.log(`⚠️ News syncer returned status indicator: ${newsRes.status}`);
        }
      } catch (err) { 
        console.error("❌ Background Bulletin Cache Syncer Err:", err.message); 
      }

      // 4. ISOLATED PROFILE ME FETCH
      if (AUTH_URL) {
        try {
          const authRes = await fetch(`${AUTH_URL}/me`, { headers });
          const userData = await authRes.json();
          if (authRes.ok && userData && !userData.error) {
            await AsyncStorage.setItem('userData', JSON.stringify(userData));
          }
        } catch (err) { console.error("❌ Isolated Profile Err:", err.message); }
      }
      
      await checkSession();
      
    } catch (e) {
      console.error("Global Central Fetch Link Error:", e);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchAppData();
    const interval = setInterval(fetchAppData, 8000); 
    return () => clearInterval(interval);
  }, [fetchAppData]);

  const checkSession = async () => {
    try {
      const storedData = await AsyncStorage.getItem('active_session');
      if (!storedData) {
        setActiveSession(null);
        return;
      }

      const parsed = JSON.parse(storedData);
      if (parseInt(parsed.restaurant_id) !== parseInt(restaurantId)) {
        setActiveSession(null);
        return;
      }

      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${TABLE_URL}/session-status/${parsed.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json();

      if (response.ok && result.is_active) {
        setActiveSession({ ...parsed, restaurantName });
      } else {
        await AsyncStorage.removeItem('active_session');
        setActiveSession(null);
      }
    } catch (e) {
      console.error("Session Check Error:", e);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loaderText}>SETTING YOUR TABLE...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#FDFBEB' }}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: '#666',
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabBarLabel,
        }}
      >
        <Tab.Screen 
          name="Home" 
          component={HomeTab} 
          initialParams={{ 
            user, 
            restaurantId, 
            restaurantName,
            menu 
          }}
          options={{
            tabBarIcon: ({ color }) => <Home color={color} size={24} strokeWidth={2.5} />,
          }}
          // FIX 2: Safely removed the undefined ghost function reference to prevent runtime crashes
          listeners={({ navigation }) => ({
            tabPress: () => {
              // Automatically triggers a state refresh context hook cleanly via HomeTab's navigation listeners instead!
            },
          })}
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
          initialParams={{ restaurantId }}
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

      {activeSession && (
        <TouchableOpacity
          style={styles.stickyBar}
          activeOpacity={0.9}
          onPress={async () => {
            const rawMenu = await AsyncStorage.getItem(`menu_${restaurantId}`);
            const cachedMenu = rawMenu ? JSON.parse(rawMenu) : [];
            
            navigation.navigate('OrderScreen', {
              session: activeSession,
              user: user,
              restaurantName: restaurantName,
              menu: cachedMenu,
            });
          }}
        >
          <View style={styles.sessionInfo}>
            <View style={styles.pulseDot} />
            <Text style={styles.stickyText}>
              TABLE {activeSession.table_id} • {restaurantName?.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.viewOrderText}>RESUME ORDER {'>'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: { height: 90, paddingBottom: 30, backgroundColor: '#FDFBEB', borderTopWidth: 4, borderTopColor: '#000', elevation: 0 },
  tabBarLabel: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FDFBEB' },
  loaderText: { marginTop: 15, fontWeight: '900', fontSize: 12, letterSpacing: 2 },
  stickyBar: { position: 'absolute', bottom: 100, left: 15, right: 15, backgroundColor: '#000', padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 2, borderColor: '#fff', shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, elevation: 10 },
  sessionInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pulseDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#7befb1', borderWidth: 1, borderColor: '#000' },
  stickyText: { color: '#fff', fontWeight: '900', fontSize: 11, letterSpacing: 0.5 },
  viewOrderText: { color: '#fff', fontWeight: '900', fontSize: 10, textDecorationLine: 'underline' },
});
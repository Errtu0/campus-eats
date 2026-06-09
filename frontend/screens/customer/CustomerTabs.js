import 'react-native-gesture-handler';
import React, { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, Alert } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, QrCode, LayoutGrid, RotateCcw, User } from 'lucide-react-native';
import { COLORS } from '../../src/styles/theme';
import { TABLE_URL, ORDER_URL, RESTAURANT_URL, AUTH_URL } from '../../src/config';
import * as Notifications from 'expo-notifications'; 
import io from 'socket.io-client'; 

// Tab Imports
import HomeTab from './tabs/HomeTab';
import CustomerScan from './tabs/CustomerScan';
import TableMapTab from './tabs/TableMapTab';
import HistoryTab from './tabs/HistoryTab'; // 🚀 RENAME CONTEXT TRACKED FOR COMPLIANCE
import ProfileTab from './tabs/ProfileTab';

const Tab = createBottomTabNavigator();

export default function CustomerTabs({ route, navigation }) {
  const { user, restaurantId, restaurantName, menu } = route.params;
  
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🚀 LIVE WEBSOCKET SUBSCRIBER ENGINE (NGROK TUNNEL OPTIMIZED)
  useEffect(() => {
    if (!user?.id) return;

    // Grab the clean base tunnel string from your configuration exports
    const socketUrl = ORDER_URL.replace('/api/orders', '').replace('/api/admin', '');
    console.log(`📡 Connecting socket notification path over tunnel: ${socketUrl}`);
    
    const socket = io(socketUrl, {
      transports: ['websocket'],
      secure: true,              // 🔥 Force TLS/SSL configuration for public ngrok tunnels
      rejectUnauthorized: false,  // Prevents self-signed certificate handshake drop-offs
      forceNew: true
    });

    const userChannelKey = `NOTIFY_USER_${user.id}`;
    console.log(`🔔 Registering local listener channel mapping: ${userChannelKey}`);

    // Listen for real-time notification pulses from the kitchen staff route
    socket.on(userChannelKey, async (remotePayload) => {
      console.log("🎯 Inbound real-time socket packet caught:", remotePayload);

      // 1. Native scheduler command for background runtime context execution
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: remotePayload.title || "ORDER COMPLIANCE SYSTEM",
            body: remotePayload.body || "Your item is ready at the kitchen!",
            data: { orderItemId: remotePayload.orderItemId },
            sound: Platform.OS === 'android' ? true : undefined,
          },
          trigger: null, 
        });
      } catch (err) {
        console.log("Native Notification engine suppressed by OS:", err.message);
      }

      // 2. 🚀 PRESENTATION ALERT FALLBACK: Triggers an instant native dialog box interface override
      // This completely bypasses Expo Go's iOS background banner restrictions
      Alert.alert(
        "☕ CAMPUS EATS ALERT",
        `${remotePayload.body || 'Your order is hot and ready at the counter!'}\n\nPlease head to the pick-up station.`,
        [{ text: "OK, UNDERSTOOD", style: "default" }]
      );
    });

    socket.on('connect', () => console.log('✅ Notification socket pipeline connected to tunnel.'));
    socket.on('connect_error', (err) => console.log('❌ Tunnel socket error context:', err.message));

    return () => {
      socket.off(userChannelKey);
      socket.disconnect();
    };
  }, [user?.id]);

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
          initialParams={{ user, restaurantId, restaurantName, menu }}
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
          initialParams={{ restaurantId }}
          options={{
            tabBarIcon: ({ color }) => <LayoutGrid color={color} size={24} strokeWidth={2.5} />,
          }}
        />
        <Tab.Screen 
          name="History" // 🚀 Updated label and structural mapping properties
          component={HistoryTab} 
          initialParams={{ user, restaurantId }}
          options={{
            tabBarLabel: 'HISTORY',
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
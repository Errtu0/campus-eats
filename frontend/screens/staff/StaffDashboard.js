import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { COLORS } from '../../src/styles/theme';
import { LayoutDashboard, ClipboardList, LogOut, RefreshCcw } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STAFF_URL } from '../../src/config'; // We'll use/create a staff endpoint here

import TableMapTab from './tabs/TableMapTab';
import OrderQueueTab from './tabs/OrderQueueTab';

export default function StaffDashboard({ navigation, route }) {
  const { user } = route.params;
  const [view, setView] = useState('TABLES');
  const [loading, setLoading] = useState(true);
  
  // CENTRAL STATE
  const [staffData, setStaffData] = useState({
    tables: [],
    activeOrders: []
  });

  const restaurantId = user.restaurant_id;

  // FETCH LOGIC
    const fetchStaffData = useCallback(async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const response = await fetch(`${STAFF_URL}/dashboard-data`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        // --- DEBUG START ---
        const text = await response.text(); // Get raw text instead of JSON
        try {
          const json = JSON.parse(text);
          setStaffData({
            tables: json.tables || [],
            activeOrders: json.pendingOrders || [] // Matches backend key
          });
        } catch (err) {
          console.log("BACKEND SENT HTML INSTEAD OF JSON. RAW DATA:", text);
        }
        // --- DEBUG END ---

      } catch (e) {
        console.error("Staff Data Fetch Error", e);
      } finally {
        setLoading(false);
      }
    }, [restaurantId]);

  // AUTO-POLLING: Refresh every 15 seconds for real-time orders
  useEffect(() => {
    fetchStaffData();
    const interval = setInterval(fetchStaffData, 15000); 
    return () => clearInterval(interval);
  }, [fetchStaffData]);

  const handleStaffLogout = async () => {
    try {
      await AsyncStorage.multiRemove(['userToken', 'userData']);
      navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
    } catch (e) {
      console.error("Logout Error", e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.portalName}>STAFF PORTAL</Text>
          <Text style={styles.userLabel}>{user.username} @ Branch #{restaurantId}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 15, alignItems: 'center' }}>
          {loading && <ActivityIndicator color={COLORS.primary} size="small" />}
          <TouchableOpacity onPress={handleStaffLogout}>
            <LogOut color={COLORS.secondary} size={28} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>

      {/* CONTENT */}
      <View style={styles.content}>
        {view === 'TABLES' && (
          <TableMapTab tables={staffData.tables} refresh={fetchStaffData} />
              )}
              {view === 'QUEUE' && (
                <OrderQueueTab orders={staffData.activeOrders} refresh={fetchStaffData} />
              )}
      </View>

      {/* BOTTOM NAV */}
      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={() => setView('TABLES')} style={styles.navTab}>
          <LayoutDashboard size={24} color={view === 'TABLES' ? COLORS.primary : '#666'} strokeWidth={3} />
          <Text style={[styles.navText, view === 'TABLES' && { color: COLORS.primary }]}>TABLES</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setView('QUEUE')} style={styles.navTab}>
          <View>
            <ClipboardList size={24} color={view === 'QUEUE' ? COLORS.primary : '#666'} strokeWidth={3} />
            {staffData.activeOrders.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{staffData.activeOrders.length}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.navText, view === 'QUEUE' && { color: COLORS.primary }]}>QUEUE</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBEB' },
  header: { 
    paddingTop: 50, paddingHorizontal: 20, paddingBottom: 20, 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    borderBottomWidth: 4, borderColor: '#000', backgroundColor: '#FDFBEB' 
  },
  portalName: { fontSize: 22, fontWeight: '900', letterSpacing: -1 },
  userLabel: { fontSize: 11, fontWeight: '700', color: '#666', textTransform: 'uppercase' },
  content: { flex: 1, marginBottom: 90 },
  bottomNav: { 
    position: 'absolute', bottom: 0, width: '100%',
    flexDirection: 'row', height: 90, backgroundColor: '#FDFBEB', 
    borderTopWidth: 4, borderColor: '#000', justifyContent: 'space-around', alignItems: 'center', paddingBottom: 20 
  },
  navTab: { alignItems: 'center' },
  navText: { fontSize: 10, fontWeight: '900', marginTop: 4 },
  badge: {
    position: 'absolute', top: -5, right: -10,
    backgroundColor: COLORS.secondary, borderRadius: 10,
    width: 18, height: 18, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#000'
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '900' }
}); 
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ADMIN_URL } from '../../src/config';
import { COLORS, GLOBAL_STYLES } from '../../src/styles/theme';
import { Utensils, Users, Package, MonitorDot, History, LogOut, Ticket } from 'lucide-react-native';

// Import your CustomAlert
import CustomAlert from '../../components/CustomAlert'; 

// Tab Imports
import MenuTab from './tabs/MenuTab';
import StaffTab from './tabs/StaffTab';
import InventoryTab from './tabs/InventoryTab';
import LiveSessionsTab from './tabs/LiveSessionsTab';
import LogsTab from './tabs/LogsTab';
import PromotionTab from './tabs/PromotionTab';

export default function AdminDashboard({ navigation, route }) {
  const { restaurant, user } = route.params;
  const [view, setView] = useState('MENU');
  const [loading, setLoading] = useState(true);

  // --- CENTRAL STATE ---
  const [dashboardData, setDashboardData] = useState({
    menu: [],
    staff: [],
    inventory: [],
    activeSessions: [],
    coupons: [],
    history: [],
    totalRevenue: 0,
    densityLogs: []
  });

  // --- CUSTOM ALERT STATE ---
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'error' });

  const showAlert = (title, message, type = 'error') => {
    setAlertConfig({ title, message, type });
    setAlertVisible(true);
  };

  const handleAdminLogout = async () => {
    try {
      await AsyncStorage.multiRemove(['userToken', 'userData']);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Welcome' }],
      });
    } catch (e) {
      console.error("Logout Error", e);
    }
  };

const fetchAllData = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${ADMIN_URL}/dashboard-data?restaurantId=${restaurant.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        setDashboardData({
          menu: data.menu || [],
          staff: data.staff || [],
          inventory: data.inventory || [],
          activeSessions: data.activeSessions || [],
          coupons: data.coupons || [],
          history: data.history || [],
          totalRevenue: data.totalRevenue || 0,
          densityLogs: data.densityLogs || [],
          newsFeed: data.newsFeed || [],
          // 🚀 FIX: Map the tables array through to your state engine explicitly!
          tables: data.tables || []
        });
      } else {
        showAlert("Security Error", data.error || "Session expired");
      }
    } catch (e) {
      console.error("Dashboard Fetch Error:", e);
      showAlert("System Error", "Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }, [restaurant.id]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  if (loading) {
    return (
      <View style={[GLOBAL_STYLES.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ textAlign: 'center', marginTop: 10, fontWeight: '700' }}>Loading Control Panel...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* CUSTOM ALERT COMPONENT */}
      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => {
          setAlertVisible(false);
          if (alertConfig.title === "Security Error") navigation.replace('SignIn');
        }}
        primaryColor={COLORS.primary}
        secondaryColor={COLORS.secondary}
        backgroundColor={COLORS.background}
      />

      <View style={styles.header}>
        <View>
          <Text style={styles.resName}>{restaurant.name}</Text>
          <Text style={styles.adminLabel}>Managing as {user.username}</Text>
        </View>
        <TouchableOpacity onPress={handleAdminLogout} style={styles.logoutBtn}> 
          <LogOut color={COLORS.secondary} size={24} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {view === 'MENU' && (
            <MenuTab 
              restaurantId={restaurant.id} 
              data={dashboardData.menu} 
              inventory={dashboardData.inventory} // 🚀 FIX: Pass the structural pantry stock down to your recipe selectors!
              refresh={fetchAllData} 
            />
          )}
        {view === 'STAFF' && <StaffTab restaurantId={restaurant.id} data={dashboardData.staff} refresh={fetchAllData} />}
        {view === 'INVENTORY' && <InventoryTab restaurantId={restaurant.id} data={dashboardData.inventory} refresh={fetchAllData} />}
        {view === 'SESSIONS' && <LiveSessionsTab restaurantId={restaurant.id} 
            sessions={dashboardData.activeSessions} 
            tables={dashboardData.tables} 
            refresh={fetchAllData} />}
          
          {view === 'PROMO' && (
            <PromotionTab 
              restaurantId={restaurant.id} 
              data={dashboardData.coupons} 
              newsFeed={dashboardData.newsFeed} // FIX: Updated to match state dictionary key name
              refresh={fetchAllData} 
            />
          )}
        {view === 'HISTORY' && <LogsTab data={dashboardData.history} revenue={dashboardData.totalRevenue} densityLogs={dashboardData.densityLogs} />}
      </View>

      <View style={styles.bottomNav}>
        <NavButton id="MENU" icon={Utensils} label="Menu" active={view} setter={setView} />
        <NavButton id="STAFF" icon={Users} label="Staff" active={view} setter={setView} />
        <NavButton id="INVENTORY" icon={Package} label="Stock" active={view} setter={setView} />
        <NavButton id="SESSIONS" icon={MonitorDot} label="Live" active={view} setter={setView} />
        <NavButton id="PROMO" icon={Ticket} label="Promos" active={view} setter={setView} />
        <NavButton id="HISTORY" icon={History} label="Logs" active={view} setter={setView} />
      </View>
    </SafeAreaView>
  );
}

const NavButton = ({ id, icon: Icon, label, active, setter }) => {
  const isActive = active === id;
  return (
    <TouchableOpacity onPress={() => setter(id)} style={styles.navTab}>
      <Icon size={22} color={isActive ? COLORS.primary : '#666'} strokeWidth={isActive ? 3 : 2} />
      <Text style={[styles.navText, isActive && { color: COLORS.primary }]}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBEB' },
  header: { 
    padding: 20, flexDirection: 'row', justifyContent: 'space-between', 
    alignItems: 'center', borderBottomWidth: 4, borderColor: '#000', backgroundColor: '#FDFBEB' 
  },
  resName: { fontSize: 20, fontWeight: '900', textTransform: 'uppercase' },
  adminLabel: { fontSize: 11, fontWeight: '700', color: '#666' },
  content: { flex: 1 },
  logoutBtn: { padding: 5 },
  bottomNav: { 
    position: 'absolute',
    bottom: 0,
    flexDirection: 'row', 
    height: 90, 
    backgroundColor: '#FDFBEB',
    borderTopWidth: 4, 
    borderColor: '#000', 
    justifyContent: 'space-around', 
    alignItems: 'center', 
    paddingBottom: 20,
    width: '100%'
  },
  navTab: { alignItems: 'center' },
  navText: { fontSize: 10, fontWeight: '900', marginTop: 4, textTransform: 'uppercase' }
});
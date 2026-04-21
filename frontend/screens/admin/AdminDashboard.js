import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import { ADMIN_URL } from '../../src/config';
import { COLORS, GLOBAL_STYLES } from '../../src/styles/theme';
import { Utensils, Users, Package, MonitorDot, History, LayoutDashboard, LogOut , Ticket} from 'lucide-react-native';

// Tab Imports
import MenuTab from './tabs/MenuTab';
import StaffTab from './tabs/StaffTab';
import InventoryTab from './tabs/InventoryTab';
import LiveSessionsTab from './tabs/LiveSessionsTab';
import LogsTab from './tabs/LogsTab';
import PromotionTab from './tabs/PromotionTab';

export default function AdminDashboard({ navigation, route }) {
  const { restaurant, user } = route.params;
  const [view, setView] = useState('MENU'); // Default tab

  return (
    <SafeAreaView style={styles.container}>
      {/* COMMAND HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.resName}>{restaurant.name}</Text>
          <Text style={styles.adminLabel}>Managing as {user.username}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.replace('WelcomeScreen')}> 
          <LogOut color={COLORS.secondary} size={24} />
        </TouchableOpacity>
      </View>

      {/* DYNAMIC CONTENT AREA */}
      <View style={styles.content}>
        {view === 'MENU' && <MenuTab restaurantId={restaurant.id} />}
        {view === 'STAFF' && <StaffTab restaurantId={restaurant.id} />}
        {view === 'INVENTORY' && <InventoryTab restaurantId={restaurant.id} />}
        {view === 'SESSIONS' && <LiveSessionsTab restaurantId={restaurant.id} />}
        {view === 'PROMO' && <PromotionTab restaurantId={restaurant.id} />}
        {view === 'HISTORY' && <LogsTab restaurantId={restaurant.id} />}
      </View>

      {/* NEOBRUTALIST BOTTOM NAV */}
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
  bottomNav: { 
    position: 'absolute', // Fix to bottom
    bottom: 0,
    flexDirection: 'row', 
    height: 90, 
    backgroundColor: '#FDFBEB', // Match Nav to Creme
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
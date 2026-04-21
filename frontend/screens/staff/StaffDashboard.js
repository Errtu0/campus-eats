import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { COLORS } from '../../src/styles/theme';
import { LayoutDashboard, ClipboardList, LogOut } from 'lucide-react-native';

import TableMapTab from './tabs/TableMapTab';
import OrderQueueTab from './tabs/OrderQueueTab';

export default function StaffDashboard({ navigation, route }) {
  const { user } = route.params;
  const [view, setView] = useState('TABLES');

  // Ensure we use the correct restaurantId from the logged-in staff
  const restaurantId = user.restaurant_id;

  return (
    <SafeAreaView style={styles.container}>
      {/* FIXED HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.portalName}>STAFF PORTAL</Text>
          <Text style={styles.userLabel}>{user.username} @ Branch #{restaurantId}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.replace('Welcome')}>
          <LogOut color={COLORS.secondary} size={28} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* DYNAMIC CONTENT AREA */}
      <View style={styles.content}>
        {view === 'TABLES' && <TableMapTab restaurantId={restaurantId} />}
        {view === 'QUEUE' && <OrderQueueTab restaurantId={restaurantId} />}
      </View>

      {/* FIXED NEOBRUTALIST BOTTOM NAV */}
      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={() => setView('TABLES')} style={styles.navTab}>
          <LayoutDashboard size={24} color={view === 'TABLES' ? COLORS.primary : '#666'} strokeWidth={3} />
          <Text style={[styles.navText, view === 'TABLES' && { color: COLORS.primary }]}>TABLES</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setView('QUEUE')} style={styles.navTab}>
          <ClipboardList size={24} color={view === 'QUEUE' ? COLORS.primary : '#666'} strokeWidth={3} />
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
  content: { flex: 1, marginBottom: 90 }, // Space for fixed nav
  bottomNav: { 
    position: 'absolute', bottom: 0, width: '100%',
    flexDirection: 'row', height: 90, backgroundColor: '#FDFBEB', 
    borderTopWidth: 4, borderColor: '#000', justifyContent: 'space-around', alignItems: 'center', paddingBottom: 20 
  },
  navTab: { alignItems: 'center' },
  navText: { fontSize: 10, fontWeight: '900', marginTop: 4 }
});
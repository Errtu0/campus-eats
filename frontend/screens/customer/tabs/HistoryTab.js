import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { ORDER_URL } from '../../../src/config';
import { COLORS } from '../../../src/styles/theme';
import { RotateCcw, ShoppingBag, Lock, Activity, Clock, CheckSquare } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

export default function HistoryTab({ route, navigation }) {
  const user = route.params?.user;
  const restaurantId = route.params?.restaurantId;

  const [history, setHistory] = useState([]);
  const [liveOrders, setLiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Core Orchestration Data Sync Pipeline
  const syncDashboardData = async () => {
    if (user?.is_guest) {
      setLoading(false);
      return;
    }
    try {
      const token = await AsyncStorage.getItem('userToken');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // 1. FETCH HISTORICAL COMPLETED ITEMS
      const historyRes = await fetch(`${ORDER_URL}/user-history?restaurantId=${restaurantId}`, {
        method: 'GET',
        headers
      });
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setHistory(Array.isArray(historyData) ? historyData : []);
      }

      // 2. FETCH ACTIVE KITCHEN STATUS TRACKERS
      const rawSession = await AsyncStorage.getItem('active_session');
      if (rawSession) {
        const parsedSession = JSON.parse(rawSession);
        const liveRes = await fetch(`${ORDER_URL}/session-cart/${parsedSession.id}`, {
          method: 'GET',
          headers
        });
        if (liveRes.ok) {
          const liveData = await liveRes.json();
          // Keep only active preparation components (exclude already served lines)
          if (Array.isArray(liveData)) {
            const activePreparations = liveData.filter(item => item.status !== 'SERVED');
            setLiveOrders(activePreparations);
          }
        }
      } else {
        setLiveOrders([]); // Clear trackers if no active session resides on disk
      }

    } catch (e) {
      console.error("Dual Sync Error Frame context:", e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Re-sync seamlessly every single time the student tabs directly into this panel
  useFocusEffect(
    useCallback(() => {
      syncDashboardData();
    }, [restaurantId])
  );

  const onRefresh = () => {
    setRefreshing(true);
    syncDashboardData();
  };

  const handleReorder = (item) => {
    navigation.navigate('Scan', { autoSelect: item });
  };

  // 🚀 GUEST GUARD PROTECTION INTERCEPTOR OVERLAY
  if (user?.is_guest) {
    return (
      <View style={styles.lockOverlayContainer}>
        <View style={styles.lockCardWrapper}>
          <View style={styles.lockCardInner}>
            <View style={styles.lockIconCircle}>
              <Lock size={40} color="#000" strokeWidth={2.5} />
            </View>
            <Text style={styles.lockTitle}>HISTORY LOCKED</Text>
            <Text style={styles.lockSubtitle}>
              ORDER MONITORING AND HISTORICAL TALLIES ARE RESERVED EXCLUSIVELY FOR REGISTERED CAMPUS MEMBERS.
            </Text>
            
            <TouchableOpacity 
              style={styles.signInButton}
              activeOpacity={0.9}
              onPress={async () => {
                await AsyncStorage.multiRemove(['userToken', 'userData', 'active_session']);
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Welcome' }],
                });
              }}
            >
              <Text style={styles.signInButtonText}>SIGN IN TO UNLOCK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>LIVE STATUS & HISTORY</Text>
        <Text style={styles.subtitle}>Track active trays or reorder your favorites.</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#000" style={{ marginTop: 50 }} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 140 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000" />}
        >
          {/* SECTION 1: LIVE KITCHEN QUEUE TRACKING */}
          <Text style={styles.sectionHeader}>LIVE PREPARATION STATUS</Text>
          {liveOrders.length === 0 ? (
            <View style={styles.emptyLiveCard}>
              <Clock size={20} color="#999" />
              <Text style={styles.emptyLiveText}>NO ITEMS IN PREPARATION PIPELINES</Text>
            </View>
          ) : (
            liveOrders.map((item) => (
              <View key={`live-${item.id}`} style={styles.liveCardWrapper}>
                <View style={styles.liveCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.liveItemName}>{item.item?.name?.toUpperCase()}</Text>
                    <Text style={styles.liveItemQuantity}>QTY: {item.quantity || 1}</Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: item.status === 'READY' ? '#7befb1' : '#FDFD96' }
                  ]}>
                    <Activity size={10} color="#000" style={{ marginRight: 4 }} />
                    <Text style={styles.statusBadgeText}>{item.status}</Text>
                  </View>
                </View>
              </View>
            ))
          )}

          {/* SECTION 2: PAST REORDERABLE HISTORY RECORDS */}
          <Text style={[styles.sectionHeader, { marginTop: 30 }]}>PAST CAMPUS TRANSACTIONS</Text>
          {history.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIconCircle}>
                <ShoppingBag size={32} color="#000" strokeWidth={2} />
              </View>
              <Text style={styles.emptyText}>NO TRANSACTION HISTORY FOUND</Text>
            </View>
          ) : (
            history.map((item, index) => (
              <View key={`hist-${item.id || index}`} style={styles.cardWrapper}>
                <View style={styles.reorderCard}>
                  <View style={styles.info}>
                    <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.lastOrdered}>
                      ORDERED: {item.lastDate ? new Date(item.lastDate).toLocaleDateString() : 'RECENT'}
                    </Text>
                    <Text style={styles.price}>${item.price ? item.price.toFixed(2) : '0.00'}</Text>
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.repeatBtn}
                    onPress={() => handleReorder(item)}
                  >
                    <RotateCcw color="#fff" size={14} strokeWidth={3} />
                    <Text style={styles.btnText}>REORDER</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBEB', paddingHorizontal: 20 },
  header: { marginTop: 60, marginBottom: 25 },
  title: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5, color: '#000' },
  subtitle: { fontSize: 12, fontWeight: '700', color: '#666', marginTop: 2, textTransform: 'uppercase' },
  sectionHeader: { fontSize: 12, fontWeight: '900', color: '#000', letterSpacing: 0.5, marginBottom: 15, textTransform: 'uppercase' },
  
  // LIVE KITCHEN CARDS (NEOBRUTALIST STYLE)
  liveCardWrapper: { backgroundColor: '#000', borderWidth: 2.5, borderColor: '#000', marginBottom: 12 },
  liveCard: { backgroundColor: '#fff', padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', transform: [{ translateX: -3 }, { translateY: -3 }] },
  liveItemName: { fontSize: 15, fontWeight: '900', color: '#000' },
  liveItemQuantity: { fontSize: 11, fontWeight: '800', color: '#666', marginTop: 3 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderWidth: 2, borderColor: '#000' },
  statusBadgeText: { fontSize: 10, fontWeight: '900', color: '#000' },
  emptyLiveCard: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 20, backgroundColor: '#fff', borderWidth: 3, borderColor: '#000', borderStyle: 'dashed', justifyContent: 'center' },
  emptyLiveText: { fontSize: 11, fontWeight: '800', color: '#888' },

  // HISTORICAL ARCHITECTURE CARDS
  cardWrapper: { backgroundColor: '#000', borderWidth: 3, borderColor: '#000', marginBottom: 15 },
  reorderCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#000', padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', transform: [{ translateX: -4 }, { translateY: -4 }] },
  info: { flex: 1, paddingRight: 10 },
  itemName: { fontSize: 16, fontWeight: '900', textTransform: 'uppercase', color: '#000' },
  lastOrdered: { fontSize: 9, fontWeight: '800', color: '#888', marginTop: 4, letterSpacing: 0.2 },
  price: { fontSize: 16, fontWeight: '900', color: COLORS.secondary, marginTop: 6 },
  repeatBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 3, borderColor: '#000', shadowColor: '#000', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, elevation: 2 },
  btnText: { color: '#fff', fontWeight: '900', fontSize: 11, letterSpacing: 0.5 },
  empty: { alignItems: 'center', marginTop: 40, paddingHorizontal: 20 },
  emptyIconCircle: { backgroundColor: '#fff', padding: 20, borderWidth: 3, borderColor: '#000', marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1 },
  emptyText: { fontWeight: '900', color: '#999', fontSize: 12, letterSpacing: 0.5, textAlign: 'center' },

  // GUEST INTERCEPT OVERLAY CONTROL SPECIFICATIONS
  lockOverlayContainer: { flex: 1, backgroundColor: '#FDFBEB', justifyContent: 'center', alignItems: 'center', padding: 25 },
  lockCardWrapper: { backgroundColor: '#000', borderWidth: 4, borderColor: '#000', width: '100%', shadowColor: '#000', shadowOffset: { width: 6, height: 6 }, shadowOpacity: 1, elevation: 8 },
  lockCardInner: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#000', padding: 30, alignItems: 'center', transform: [{ translateX: -6 }, { translateY: -6 }] },
  lockIconCircle: { padding: 18, backgroundColor: COLORS.primary, borderWidth: 3, borderColor: '#000', marginBottom: 20 },
  lockTitle: { fontSize: 22, fontWeight: '900', color: '#000', letterSpacing: -0.5, marginBottom: 10, textAlign: 'center' },
  lockSubtitle: { fontSize: 11, fontWeight: '700', color: '#666', lineHeight: 16, textAlign: 'center', marginBottom: 25, textTransform: 'uppercase' },
  signInButton: { width: '100%', backgroundColor: COLORS.secondary, padding: 16, alignItems: 'center', borderWidth: 3, borderColor: '#000', shadowColor: '#000', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, elevation: 2 },
  signInButtonText: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 0.5 }
});
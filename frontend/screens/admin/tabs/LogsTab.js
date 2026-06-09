import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'; // 🚀 FIX: Injected ScrollView here!
import { COLORS, GLOBAL_STYLES } from '../../../src/styles/theme';
import { TrendingUp, DollarSign, Users, Receipt, Calendar } from 'lucide-react-native';

export default function LogsTab({ data = [], revenue, densityLogs = [] }) {
  // --- LOCAL FILTER SEGMENT STATE CONTROLS ---
  const [activeFilter, setActiveFilter] = useState('ALL'); // Presets: 'ALL', 'REVENUE', 'DENSITY'
  const [dateRange, setDateRange] = useState('ALL_TIME');  // Presets: 'ALL_TIME', 'TODAY', 'WEEK', 'MONTH'

  // Helper calculation for individual order pricing metrics matrix row contexts
  const calculateOrderTotal = (order) => {
    if (order.total_amount > 0) return Number(order.total_amount);
    const subtotal = (order.items || []).reduce(
      (iSum, i) => iSum + (Number(i.item?.price || 0) * (i.quantity || 1)), 
      0
    );
    if (order.coupon && order.coupon.discount_value) {
      return subtotal * (1 - (Number(order.coupon.discount_value) / 100));
    }
    return subtotal;
  };

  // --- LOCAL DATE VERIFICATION CHECKPOINT ---
  const checkDateMatch = (createdAtString) => {
    if (dateRange === 'ALL_TIME' || !createdAtString) return true;
    
    const itemDate = new Date(createdAtString);
    const now = new Date();
    
    if (dateRange === 'TODAY') {
      return itemDate.toDateString() === now.toDateString();
    }
    
    if (dateRange === 'WEEK') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      return itemDate >= oneWeekAgo;
    }
    
    if (dateRange === 'MONTH') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(now.getMonth() - 1);
      return itemDate >= oneMonthAgo;
    }
    
    return true;
  };

  // --- DYNAMIC IN-MEMORY ARRAY SCREENINGS (0MS NETWORK COST) ---
  const filteredOrders = data.filter(order => {
    const matchesCategory = activeFilter === 'REVENUE' ? calculateOrderTotal(order) > 0 : true;
    const matchesDate = checkDateMatch(order.created_at);
    return matchesCategory && matchesDate;
  });

  const filteredDensityLogs = densityLogs.filter(log => checkDateMatch(log.recorded_at));

  // Recalculate Period metrics instantly based on selected timeframe boundaries
  const displayRevenue = filteredOrders.reduce((sum, order) => sum + calculateOrderTotal(order), 0);

  const peakOccupancy = filteredDensityLogs.length > 0 
    ? Math.max(...filteredDensityLogs.map(log => log.peak_occupancy || 0)) 
    : 0;

  // Render function for transactional billing items data vectors
  const renderLogItem = ({ item }) => {
    const finalPrice = calculateOrderTotal(item);

    return (
      <View style={[GLOBAL_STYLES.card, { marginBottom: 15 }]}>
        <View style={styles.logHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Receipt size={16} color="#000" />
            <Text style={styles.orderId}>ORDER #{item.id}</Text>
          </View>
          <Text style={styles.orderPrice}>
            ${finalPrice.toFixed(2)}
          </Text>
        </View>

        {item.coupon && (
          <View style={styles.promoBadge}>
            <Text style={styles.promoText}>
              PROMO: {item.coupon.code} (-{item.coupon.discount_value}%)
            </Text>
          </View>
        )}

        <View style={styles.detailsContainer}>
          <Text style={styles.logSubtext}>
            <Text style={{fontWeight: '900'}}>Customer:</Text> {item.customer?.username || 'Guest'}
          </Text>

          <Text style={styles.logSubtext}>
            <Text style={{fontWeight: '900'}}>Items:</Text> {item.items?.map(i => `${i.item?.name} (x${i.quantity || 1})`).join(', ')}
          </Text>
        </View>

        <Text style={styles.dateText}>
          {item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A'}
        </Text>
      </View>
    );
  };

  // Render function for topological environment tracking nodes
  const renderDensityItem = ({ item }) => {
    return (
      <View style={[GLOBAL_STYLES.card, styles.densityCardRow, { marginBottom: 12 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={styles.densityIconBox}>
            <Users size={16} color="#000" />
          </View>
          <View>
            <Text style={styles.densityTitleText}>PEAK OCCUPANCY LOG RECORDED</Text>
            <Text style={styles.densityDateText}>
              {item.recorded_at ? new Date(item.recorded_at).toLocaleString() : 'N/A'}
            </Text>
          </View>
        </View>
        <View style={styles.densityCountBadge}>
          <Text style={styles.densityCountText}>{item.peak_occupancy || 0} PPL</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.tabContainer}>
      {/* --- ANALYTICS SUMMARY BOXES --- */}
      <View style={styles.statsRow}>
        <View style={[styles.statBox, { backgroundColor: COLORS.secondary }]}>
          <View style={styles.statHeader}>
            <DollarSign size={14} color="#fff" />
            <Text style={styles.statLabel}>PERIOD REVENUE</Text>
          </View>
          <Text style={styles.statVal}>${displayRevenue.toFixed(2)}</Text>
        </View>
        
        <View style={[styles.statBox, { backgroundColor: '#000' }]}>
          <View style={styles.statHeader}>
            <TrendingUp size={14} color={COLORS.primary} />
            <Text style={styles.statLabel}>PERIOD PEAK</Text>
          </View>
          <Text style={styles.statVal}>{peakOccupancy} <Text style={{fontSize: 12}}>PPL</Text></Text>
        </View>
      </View>

      {/* --- CATEGORY SELECTOR MATRIX SEGMENTS BAR --- */}
      <View style={styles.filterBarContainer}>
        <TouchableOpacity 
          style={[styles.filterBtn, activeFilter === 'ALL' && styles.activeFilterBtn]} 
          onPress={() => setActiveFilter('ALL')}
        >
          <Text style={[styles.filterBtnText, activeFilter === 'ALL' && styles.activeFilterBtnText]}>ALL LOGS</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.filterBtn, activeFilter === 'REVENUE' && styles.activeFilterBtn]} 
          onPress={() => setActiveFilter('REVENUE')}
        >
          <Text style={[styles.filterBtnText, activeFilter === 'REVENUE' && styles.activeFilterBtnText]}>REVENUE ONLY</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.filterBtn, activeFilter === 'DENSITY' && styles.activeFilterBtn]} 
          onPress={() => setActiveFilter('DENSITY')}
        >
          <Text style={[styles.filterBtnText, activeFilter === 'DENSITY' && styles.activeFilterBtnText]}>DENSITY LOGS</Text>
        </TouchableOpacity>
      </View>

      {/* --- CHRONOLOGICAL DATE TIMEFRAME SELECTOR --- */}
      <View style={styles.dateFilterBarContainer}>
        <View style={styles.calendarIconBox}>
          <Calendar size={14} color="#000" />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center', paddingRight: 10 }}>
          <TouchableOpacity style={[styles.dateChip, dateRange === 'ALL_TIME' && styles.activeDateChip]} onPress={() => setDateRange('ALL_TIME')}>
            <Text style={[styles.dateChipText, dateRange === 'ALL_TIME' && styles.activeDateChipText]}>ALL TIME</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.dateChip, dateRange === 'TODAY' && styles.activeDateChip]} onPress={() => setDateRange('TODAY')}>
            <Text style={[styles.dateChipText, dateRange === 'TODAY' && styles.activeDateChipText]}>TODAY</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.dateChip, dateRange === 'WEEK' && styles.activeDateChip]} onPress={() => setDateRange('WEEK')}>
            <Text style={[styles.dateChipText, dateRange === 'WEEK' && styles.activeDateChipText]}>1 WEEK</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.dateChip, dateRange === 'MONTH' && styles.activeDateChip]} onPress={() => setDateRange('MONTH')}>
            <Text style={[styles.dateChipText, dateRange === 'MONTH' && styles.activeDateChipText]}>1 MONTH</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <View style={{ flex: 1, marginTop: 5 }}>
        {activeFilter === 'DENSITY' ? (
          <FlatList
            data={filteredDensityLogs}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderDensityItem}
            contentContainerStyle={{ paddingBottom: 140 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No density occupancy records logged for this criteria selection.</Text>
            }
          />
        ) : (
          <FlatList
            data={filteredOrders}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderLogItem}
            contentContainerStyle={{ paddingBottom: 140 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No transaction items match selected filter configurations.</Text>
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabContainer: { flex: 1, padding: 15, backgroundColor: '#FDFBEB' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 15 },
  statBox: { 
    flex: 1, 
    padding: 15, 
    borderWidth: 3, 
    borderColor: '#000', 
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    elevation: 5
  },
  statHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 5 },
  statLabel: { color: '#fff', fontWeight: '900', fontSize: 10, letterSpacing: 0.5 },
  statVal: { color: '#fff', fontSize: 24, fontWeight: '900' },
  
  filterBarContainer: { 
    flexDirection: 'row', 
    borderWidth: 3, 
    borderColor: '#000', 
    backgroundColor: '#fff',
    marginBottom: 10,
    height: 44
  },
  filterBtn: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#fff' 
  },
  activeFilterBtn: { 
    backgroundColor: '#000' 
  },
  filterBtnText: { 
    fontSize: 9, 
    fontWeight: '900', 
    color: '#000', 
    letterSpacing: 0.3 
  },
  activeFilterBtnText: { 
    color: '#fff' 
  },

  // CHRONOLOGICAL DATE ROW UI STYLES
  dateFilterBarContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 },
  calendarIconBox: { padding: 8, borderWidth: 3, borderColor: '#000', backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  dateChip: { paddingHorizontal: 12, paddingVertical: 6, borderWidth: 2, borderColor: '#000', backgroundColor: '#fff', marginRight: 6 },
  activeDateChip: { backgroundColor: '#000' },
  dateChipText: { fontSize: 8, fontWeight: '900', color: '#000' },
  activeDateChipText: { color: '#fff' },

  logHeader: { flexDirection: 'row', gap: 4, justifyContent: 'space-between', alignItems: 'center' },
  orderId: { fontWeight: '900', fontSize: 15 },
  orderPrice: { fontWeight: '900', color: COLORS.secondary, fontSize: 15 },
  detailsContainer: { marginTop: 8 },
  promoBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginTop: 8,
    borderWidth: 2,
    borderColor: '#000'
  },
  promoText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  logSubtext: { fontWeight: '500', color: '#444', marginTop: 4, fontSize: 12 },
  dateText: { fontSize: 10, color: '#999', marginTop: 10, fontWeight: '700' },
  emptyText: { textAlign: 'center', marginTop: 50, fontWeight: '900', color: '#ccc' },

  densityCardRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 14, 
    backgroundColor: '#fff' 
  },
  densityIconBox: { 
    padding: 6, 
    backgroundColor: '#fff', 
    borderWidth: 2, 
    borderColor: '#000' 
  },
  densityTitleText: { fontSize: 11, fontWeight: '900', color: '#000' },
  densityDateText: { fontSize: 10, color: '#666', fontWeight: '700', marginTop: 2 },
  densityCountBadge: { 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    backgroundColor: COLORS.primary, 
    borderWidth: 2, 
    borderColor: '#000' 
  },
  densityCountText: { fontSize: 11, fontWeight: '900', color: '#fff' }
});
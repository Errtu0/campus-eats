import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { COLORS, GLOBAL_STYLES } from '../../../src/styles/theme';
import { TrendingUp, DollarSign } from 'lucide-react-native';

export default function LogsTab({ data, revenue, densityLogs }) {
  // --- LOGIC: Find highest peak occupancy from the logs ---
  const peakOccupancy = densityLogs && densityLogs.length > 0 
    ? Math.max(...densityLogs.map(log => log.peak_occupancy || 0)) 
    : 0;

  // Ensure revenue is a valid number
  const displayRevenue = Number(revenue) || 0;

  const calculateOrderTotal = (order) => {
    // If backend provides a pre-calculated total, use it
    if (order.total_amount > 0) return Number(order.total_amount);
    
    // Fallback: Manual calculation from items
    const subtotal = (order.items || []).reduce(
      (iSum, i) => iSum + (Number(i.item?.price || 0) * (i.quantity || 1)), 
      0
    );

    // Apply coupon discount if it exists
    if (order.coupon && order.coupon.discount_value) {
      return subtotal * (1 - (Number(order.coupon.discount_value) / 100));
    }
    return subtotal;
  };

  const renderLogItem = ({ item }) => {
    const finalPrice = calculateOrderTotal(item);

    return (
      <View style={GLOBAL_STYLES.card}>
        <View style={styles.logHeader}>
          <Text style={styles.orderId}>ORDER #{item.id}</Text>
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

  return (
    <View style={styles.tabContainer}>
      {/* --- ANALYTICS HEADER ROW --- */}
      <View style={styles.statsRow}>
        <View style={[styles.statBox, { backgroundColor: COLORS.secondary }]}>
          <View style={styles.statHeader}>
            <DollarSign size={14} color="#fff" />
            <Text style={styles.statLabel}>DAILY REVENUE</Text>
          </View>
          <Text style={styles.statVal}>${displayRevenue.toFixed(2)}</Text>
        </View>
        
        <View style={[styles.statBox, { backgroundColor: '#000' }]}>
          <View style={styles.statHeader}>
            <TrendingUp size={14} color={COLORS.primary} />
            <Text style={styles.statLabel}>PEAK LOAD</Text>
          </View>
          <Text style={styles.statVal}>{peakOccupancy} <Text style={{fontSize: 12}}>PPL</Text></Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Recent Activity</Text>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderLogItem}
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No recent orders recorded.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tabContainer: { flex: 1, padding: 15, backgroundColor: '#FDFBEB' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
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
  sectionTitle: { fontSize: 18, fontWeight: '900', marginBottom: 15, textTransform: 'uppercase' },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { fontWeight: '900', fontSize: 16 },
  orderPrice: { fontWeight: '900', color: COLORS.secondary, fontSize: 16 },
  detailsContainer: { marginTop: 10 },
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
  logSubtext: { fontWeight: '500', color: '#444', marginTop: 4, fontSize: 13 },
  dateText: { fontSize: 11, color: '#999', marginTop: 12, fontWeight: '600' },
  emptyText: { textAlign: 'center', marginTop: 50, fontWeight: '700', color: '#999' }
});
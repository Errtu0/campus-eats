import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { ADMIN_URL } from '../../../src/config';
import { COLORS, GLOBAL_STYLES } from '../../../src/styles/theme';

export default function LogsTab({ restaurantId }) {
  const [data, setData] = useState({ history: [], totalRevenue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch(`${ADMIN_URL}/dashboard-data?restaurantId=${restaurantId}`);
        const json = await res.json();
        const history = json.history || [];

        // Calculate total revenue across all history
        const rev = history.reduce((sum, order) => {
          const orderTotal = calculateOrderTotal(order);
          return sum + orderTotal;
        }, 0);

        setData({ history, totalRevenue: rev });
      } catch (e) {
        console.error("Logs Fetch Error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [restaurantId]);

  const calculateOrderTotal = (order) => {
    if (order.total_amount > 0) return order.total_amount;
    
    // Manual calculation if total_amount is 0
    const subtotal = (order.items || []).reduce(
      (iSum, i) => iSum + (i.item.price * (i.quantity || 1)), 
      0
    );

    // Apply coupon discount if exists
    if (order.coupon) {
      return subtotal * (1 - (order.coupon.discount_value / 100));
    }
    return subtotal;
  };

  const renderLogItem = ({ item }) => {
    const finalPrice = calculateOrderTotal(item);

    return (
      <View style={GLOBAL_STYLES.card}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontWeight: '900', fontSize: 16 }}>Order #{item.id}</Text>
          <Text style={{ fontWeight: '900', color: COLORS.secondary }}>
            ${finalPrice.toFixed(2)}
          </Text>
        </View>

        {/* COUPON BADGE */}
        {item.coupon && (
          <View style={styles.promoBadge}>
            <Text style={styles.promoText}>
              PROMO: {item.coupon.code} (-{item.coupon.discount_value}%)
            </Text>
          </View>
        )}

        <Text style={styles.logSubtext}>
          Customer: {item.customer?.username || 'Guest'}
        </Text>

        <Text style={styles.logSubtext}>
          Items: {item.items.map(i => `${i.item.name} (x${i.quantity || 1})`).join(', ')}
        </Text>

        <Text style={styles.dateText}>
          {item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A'}
        </Text>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: '#FDFBEB' }}>
      <View style={styles.revCard}>
        <Text style={styles.revLabel}>TOTAL REVENUE</Text>
        <Text style={styles.revVal}>${data.totalRevenue.toFixed(2)}</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} size="large" />
      ) : (
        <FlatList
          data={data.history}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderLogItem}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  revCard: {
    backgroundColor: COLORS.secondary,
    padding: 20,
    borderWidth: 3,
    borderColor: '#000',
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    elevation: 5
  },
  revLabel: { color: '#fff', fontWeight: '900', fontSize: 12, letterSpacing: 1 },
  revVal: { color: '#fff', fontSize: 36, fontWeight: '900', marginTop: 5 },
  promoBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#000'
  },
  promoText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  logSubtext: { fontWeight: '600', color: '#444', marginTop: 5 },
  dateText: { fontSize: 10, color: '#999', marginTop: 10 }
});
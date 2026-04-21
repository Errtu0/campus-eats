import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SOCKET_URL, STAFF_URL } from '../../../src/config';
import { COLORS } from '../../../src/styles/theme';
import { CheckCircle } from 'lucide-react-native';
import { io } from 'socket.io-client';

export default function OrderQueueTab({ restaurantId }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socket.on('NEW_PAID_ORDER', () => fetchOrders());
    return () => socket.disconnect();
  }, [restaurantId]);

  const fetchOrders = async () => {
    try {
      // Logic Fix: Filter by restaurantId
      const res = await fetch(`${STAFF_URL}/dashboard-data?restaurantId=${restaurantId}`);
      const data = await res.json();
      setOrders(data.pendingOrders || []);
    } finally { setLoading(false); }
  };

  const updateStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'READY' ? 'SERVED' : 'READY';
    const endpoint = nextStatus === 'READY' ? 'order-ready' : 'order-served';
    
    await fetch(`${STAFF_URL}/${endpoint}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderItemId: id }),
    });
    fetchOrders();
  };

  return (
    <View style={styles.container}>
      {loading ? <ActivityIndicator size="large" color="#000" /> : (
        <FlatList
          data={orders}
          contentContainerStyle={{ paddingBottom: 120 }}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.orderCard}>
              <View style={styles.row}>
                {/* SAFETY: Optional chaining prevents crashes if session/table is missing */}
                <Text style={styles.tableLabel}>TABLE {item.order?.session?.table?.table_number || '??'}</Text>
                <View style={[styles.badge, {backgroundColor: item.status === 'READY' ? '#C1E1C1' : '#FDFD96'}]}>
                  <Text style={styles.badgeText}>{item.status}</Text>
                </View>
              </View>
              <Text style={styles.itemName}>{item.item?.name} <Text style={{color: COLORS.primary}}>x{item.quantity}</Text></Text>
              
              <TouchableOpacity 
                style={[styles.actionBtn, {backgroundColor: item.status === 'READY' ? '#fff' : COLORS.primary}]}
                onPress={() => updateStatus(item.id, item.status)}
              >
                <Text style={styles.btnText}>{item.status === 'READY' ? 'MARK AS SERVED' : 'MARK AS READY'}</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <CheckCircle size={50} color="#ccc" />
              <Text style={styles.emptyText}>Queue is empty</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  orderCard: { 
    backgroundColor: '#fff', borderWidth: 3, borderColor: '#000', 
    padding: 15, marginBottom: 15, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, elevation: 5 
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  tableLabel: { fontWeight: '900', fontSize: 16 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1 },
  badgeText: { fontWeight: '900', fontSize: 10 },
  itemName: { fontSize: 20, fontWeight: '900', marginBottom: 15 },
  actionBtn: { padding: 15, borderWidth: 2, alignItems: 'center' },
  btnText: { fontWeight: '900' },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontWeight: '800', color: '#ccc', marginTop: 10 }
});
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { RESTAURANT_URL } from '../src/config';

export default function TableMapScreen({ route }) {
  const { restaurantId } = route.params;
  const [tables, setTables] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTables = async () => {
    try {
      const res = await fetch(`${RESTAURANT_URL}/${restaurantId}/tables`);
      const data = await res.json();
      setTables(data);
    } catch (e) { console.error(e); }
    finally { setRefreshing(false); }
  };

  useEffect(() => { fetchTables(); }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>LIVE TABLE MAP</Text>
      <FlatList
        data={tables}
        numColumns={2}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchTables();}} />}
        renderItem={({ item }) => (
          <View style={[styles.tableCard, { borderColor: item.status === 'EMPTY' ? '#00C851' : '#FF4444' }]}>
            <Text style={styles.tableNum}>{item.table_number}</Text>
            <Text style={[styles.statusLabel, { color: item.status === 'EMPTY' ? '#00C851' : '#FF4444' }]}>
              {item.status}
            </Text>
          </View>
        )}
        keyExtractor={item => item.id.toString()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBEB', padding: 20 },
  header: { fontSize: 24, fontWeight: '900', marginTop: 50, marginBottom: 20, textAlign: 'center' },
  tableCard: { flex: 1, margin: 10, height: 120, backgroundColor: '#FFF', borderWidth: 3, justifyContent: 'center', alignItems: 'center' },
  tableNum: { fontSize: 22, fontWeight: '900' },
  statusLabel: { fontWeight: 'bold', fontSize: 12, marginTop: 5 }
});
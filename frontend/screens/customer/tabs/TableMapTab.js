import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { TABLE_URL } from '../../../src/config';
import { COLORS } from '../../../src/styles/theme';
import { Info } from 'lucide-react-native';

export default function TableMapTab({ route }) {
  // Use optional chaining to safely get the ID
  // If you passed it via initialParams, it lives in route.params
  const restaurantId = route.params?.restaurantId;

  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (restaurantId) {
      fetchTables();
    } else {
      console.error("❌ TableMapTab Error: No restaurantId found in route.params");
      setLoading(false);
    }
  }, [restaurantId]);

  const fetchTables = async () => {
    try {
      // DEBUG: Verify the URL before sending
      const url = `${TABLE_URL}?restaurantId=${restaurantId}`;
      console.log("🔗 Fetching tables from:", url);

      const res = await fetch(url);
      const data = await res.json();
      
      if (res.ok) {
        setTables(data || []);
      } else {
        console.error("❌ Backend Error:", data.error);
      }
    } catch (e) {
      console.error("❌ Table Map Network Error:", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>LIVE TABLE MAP</Text>
        <Text style={styles.subtitle}>Find your favorite spot before you scan.</Text>
      </View>

      {/* LEGEND */}
      <View style={styles.legend}>
        <View style={styles.legendItem}><View style={[styles.dot, {backgroundColor: '#C1E1C1'}]}/><Text style={styles.dotText}>Available</Text></View>
        <View style={styles.legendItem}><View style={[styles.dot, {backgroundColor: '#FF6961'}]}/><Text style={styles.dotText}>Occupied</Text></View>
        <View style={styles.legendItem}><View style={[styles.dot, {backgroundColor: '#FDFD96'}]}/><Text style={styles.dotText}>Cleaning</Text></View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#000" style={{marginTop: 50}} />
      ) : (
        <ScrollView 
          contentContainerStyle={styles.grid}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchTables} tintColor="#000" />}
        >
          {tables.map(table => (
            <View 
              key={table.id} 
              style={[
                styles.tableBox, 
                table.status === 'EMPTY' && styles.empty,
                table.status === 'OCCUPIED' && styles.occupied,
                table.status === 'CLEANING' && styles.cleaning
              ]}
            >
              <Text style={styles.tableNum}>{table.table_number}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      <View style={styles.footerNote}>
        <Info size={16} color="#666" />
        <Text style={styles.noteText}>Sit at any green table and scan the QR code to start.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBEB', padding: 20 },
  header: { marginTop: 40, marginBottom: 20 },
  title: { fontSize: 26, fontWeight: '900' },
  subtitle: { fontSize: 13, fontWeight: '700', color: '#666' },
  legend: { flexDirection: 'row', gap: 15, marginBottom: 20 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 1, borderColor: '#000' },
  dotText: { fontSize: 10, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingBottom: 100 },
  tableBox: { 
    width: '30%', height: 80, borderWidth: 3, borderColor: '#000', 
    justifyContent: 'center', alignItems: 'center', marginBottom: 15,
    shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, elevation: 3
  },
  empty: { backgroundColor: '#C1E1C1' },
  occupied: { backgroundColor: '#FF6961' },
  cleaning: { backgroundColor: '#FDFD96' },
  tableNum: { fontSize: 22, fontWeight: '900' },
  footerNote: { 
    flexDirection: 'row', alignItems: 'center', gap: 10, 
    backgroundColor: '#fff', padding: 15, borderWidth: 2, borderColor: '#000',
    position: 'absolute', bottom: 20, left: 20, right: 20
  },
  noteText: { fontSize: 11, fontWeight: '700', flex: 1 }
});
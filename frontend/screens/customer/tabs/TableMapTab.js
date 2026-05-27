import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { TABLE_URL } from '../../../src/config';
import { COLORS } from '../../../src/styles/theme';
import { Info, Armchair, HelpCircle } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TableMapTab({ route }) {
  const restaurantId = route.params?.restaurantId;
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sync effect hook that runs every time the screen renders or storage caches cycle
  useEffect(() => {
    if (restaurantId) {
      loadCachedTables();
    }
  }, [restaurantId]);

  const loadCachedTables = async () => {
    try {
      // READ STRAIGHT FROM CENTRAL DATA ENGINE DISK CACHE
      const rawCache = await AsyncStorage.getItem(`tables_${restaurantId}`);
      if (rawCache) {
        setTables(JSON.parse(rawCache));
      } else {
        // Absolute fallback fetching logic if the disk cache drops
        const token = await AsyncStorage.getItem('userToken');
        const res = await fetch(`${TABLE_URL}?restaurantId=${restaurantId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && Array.isArray(data)) setTables(data);
      }
    } catch (e) {
      console.error("❌ Table Map Sync Error:", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>LIVE FLOOR PLAN</Text>
        <Text style={styles.subtitle}>Find your spot before scanning your table code.</Text>
      </View>

      <View style={styles.legendContainer}>
        <View style={[styles.legendPill, { backgroundColor: '#7BEFB1' }]}><Text style={styles.legendText}>FREE</Text></View>
        <View style={[styles.legendPill, { backgroundColor: '#FF6B6B' }]}><Text style={styles.legendText}>BUSY</Text></View>
        <View style={[styles.legendPill, { backgroundColor: '#FFD166' }]}><Text style={styles.legendText}>WIPE</Text></View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#000" style={{ marginTop: 50 }} />
      ) : (
        <ScrollView 
          contentContainerStyle={styles.gridContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={loadCachedTables} tintColor="#000" />
          }
        >
          {tables.length > 0 ? (
            tables.map(table => {
              const isEmpty = table.status === 'EMPTY';
              const isOccupied = table.status === 'OCCUPIED';
              const activeColor = isEmpty ? '#7BEFB1' : isOccupied ? '#FF6B6B' : '#FFD166';

              return (
                <View key={table.id} style={styles.tableWrapper}>
                  <View style={[styles.tableInnerCard, { backgroundColor: activeColor }]}>
                    <View style={styles.tableHeaderRow}>
                      <Armchair size={12} color="#000" />
                      <Text style={styles.capacityBadgeText}>{table.capacity || 4}P</Text>
                    </View>
                    <Text style={styles.tableNumText}>{table.table_number}</Text>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyGridSpace}>
              <HelpCircle size={40} color="#000" strokeWidth={1.5} />
              <Text style={styles.emptyGridText}>NO ACTIVE TABLES REGISTERED</Text>
            </View>
          )}
        </ScrollView>
      )}

      <View style={styles.footerNote}>
        <Info size={18} color="#000" strokeWidth={2.5} />
        <Text style={styles.noteText}>
          Claim any open green seat layout inside the hall, and use the lens scanner to open an active group session.
        </Text>
      </View>
    </View>
  );
}

// Keep the exact same beautiful centered style object block we created earlier
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBEB', paddingHorizontal: 20 },
  header: { marginTop: 60, marginBottom: 15 },
  title: { fontSize: 28, fontWeight: '900', color: '#000' },
  subtitle: { fontSize: 11, fontWeight: '700', color: '#666', marginTop: 2, textTransform: 'uppercase' },
  legendContainer: { flexDirection: 'row', gap: 10, marginBottom: 25, borderBottomWidth: 3, borderColor: '#000', paddingBottom: 15 },
  legendPill: { paddingHorizontal: 12, paddingVertical: 4, borderWidth: 2, borderColor: '#000' },
  legendText: { fontSize: 10, fontWeight: '900', color: '#000' },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingBottom: 140 },
  tableWrapper: { width: '31%', height: 95, marginBottom: 20, backgroundColor: '#000', borderWidth: 3, borderColor: '#000' },
  tableInnerCard: { flex: 1, padding: 8, justifyContent: 'center', alignItems: 'center', transform: [{ translateX: -4 }, { translateY: -4 }], borderWidth: 3, borderColor: '#000', position: 'absolute', width: '107%', height: '107%' },
  tableHeaderRow: { position: 'absolute', top: 6, left: 8, right: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', opacity: 0.85 },
  capacityBadgeText: { fontSize: 9, fontWeight: '900', color: '#000' },
  tableNumText: { fontSize: 26, fontWeight: '900', textAlign: 'center', color: '#000', marginTop: 8 },
  emptyGridSpace: { flex: 1, paddingVertical: 60, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyGridText: { fontWeight: '900', fontSize: 11, color: '#000' },
  footerNote: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', padding: 15, borderWidth: 3, borderColor: '#000', position: 'absolute', bottom: 25, left: 20, right: 20, shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, elevation: 4 },
  noteText: { fontSize: 10, fontWeight: '700', flex: 1, color: '#000', lineHeight: 14 }
});
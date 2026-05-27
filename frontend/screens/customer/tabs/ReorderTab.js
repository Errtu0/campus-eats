import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { ORDER_URL } from '../../../src/config';
import { COLORS } from '../../../src/styles/theme';
import { RotateCcw, ShoppingBag } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ReorderTab({ route, navigation }) {
  const restaurantId = route.params?.restaurantId;

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (restaurantId) {
      fetchHistory();
    } else {
      setLoading(false);
      console.log("Missing restaurantId in parameters framework");
    }
  }, [restaurantId]);

  const fetchHistory = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const url = `${ORDER_URL}/user-history?restaurantId=${restaurantId}`;
      console.log("🔗 Fetching History from:", url);

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      
      if (res.ok) {
        console.log("Successfully fetched history length:", data?.length);
        setHistory(Array.isArray(data) ? data : []);
      } else {
        console.error("Backend History Fetch Error:", data.error);
      }
    } catch (e) {
      console.error("Network Error:", e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = (item) => {
    navigation.navigate('Scan', { autoSelect: item });
  };

  return (
    <View style={styles.container}>
      {/* BRAND HEADERS */}
      <View style={styles.header}>
        <Text style={styles.title}>QUICK REORDER</Text>
        <Text style={styles.subtitle}>Your campus favorites are just one tap away.</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#000" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={history}
          // FIX 2: Safe fallback key extractor so it never throws an iteration crash
          keyExtractor={(item, index) => (item.id ? item.id.toString() : index.toString())}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            /* FIX 1: Stable 3D container using relative heights instead of collapsing wrappers */
            <View style={styles.cardWrapper}>
              <View style={styles.reorderCard}>
                <View style={styles.info}>
                  <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.lastOrdered}>
                    LAST ORDERED: {item.lastDate ? new Date(item.lastDate).toLocaleDateString() : 'RECENT'}
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
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconCircle}>
                <ShoppingBag size={32} color="#000" strokeWidth={2} />
              </View>
              <Text style={styles.emptyText}>NO TRANSACTION HISTORY FOUND</Text>
              <Text style={styles.emptySubtext}>Order history updates live after menu payments.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBEB', paddingHorizontal: 20 },
  header: { marginTop: 60, marginBottom: 25 },
  title: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5, color: '#000' },
  subtitle: { fontSize: 12, fontWeight: '700', color: '#666', marginTop: 2, textTransform: 'uppercase' },
  
  // FIXED STRUCTURE: Removed absolute positioning conflicts that collapsed heights
  cardWrapper: {
    backgroundColor: '#000',
    borderWidth: 3,
    borderColor: '#000',
    marginBottom: 15,
  },
  reorderCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#000',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // Shifts the element neatly to create the Neobrutalist shadow depth effect cleanly
    transform: [{ translateX: -4 }, { translateY: -4 }],
  },
  info: { flex: 1, paddingRight: 10 },
  itemName: { fontSize: 16, fontWeight: '900', textTransform: 'uppercase', color: '#000' },
  lastOrdered: { fontSize: 9, fontWeight: '800', color: '#888', marginTop: 4, letterSpacing: 0.2 },
  price: { fontSize: 16, fontWeight: '900', color: COLORS.secondary, marginTop: 6 },
  
  repeatBtn: { 
    backgroundColor: COLORS.primary, 
    paddingHorizontal: 14, 
    paddingVertical: 10,
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6,
    borderWidth: 3,
    borderColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    elevation: 2
  },
  btnText: { color: '#fff', fontWeight: '900', fontSize: 11, letterSpacing: 0.5 },
  
  // Empty State Layouts
  empty: { alignItems: 'center', marginTop: 100, paddingHorizontal: 20 },
  emptyIconCircle: {
    backgroundColor: '#fff',
    padding: 20,
    borderWidth: 3,
    borderColor: '#000',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
  },
  emptyText: { fontWeight: '900', color: '#000', fontSize: 13, letterSpacing: 0.5, textAlign: 'center' },
  emptySubtext: { fontWeight: '700', color: '#777', fontSize: 11, textAlign: 'center', marginTop: 5, textTransform: 'uppercase' }
});
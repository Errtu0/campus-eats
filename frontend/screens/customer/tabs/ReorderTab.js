import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { ORDER_URL } from '../../../src/config';
import { COLORS, GLOBAL_STYLES } from '../../../src/styles/theme';
import { RotateCcw, Plus, ShoppingBag } from 'lucide-react-native';

export default function ReorderTab({ route, navigation }) {
  // Use fallback naming just in case
  const restaurantId = route.params?.restaurantId;
  const { user } = route.params;

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (restaurantId && user?.id) {
      fetchHistory();
    } else {
      setLoading(false);
      console.log("Missing Params:", { restaurantId, userId: user?.id });
    }
  }, [restaurantId]);

  const fetchHistory = async () => {
    try {
      const url = `${ORDER_URL}/user-history/${user.id}?restaurantId=${restaurantId}`;
      console.log("🔗 Fetching History from:", url);

      const res = await fetch(url);
      const data = await res.json();
      
      if (res.ok) {
        setHistory(data);
      } else {
        console.error("Backend Error:", data.error);
      }
    } catch (e) {
      console.error("Network Error:", e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = (item) => {
    // This navigates back to the OrderScreen with the item pre-selected
    // or triggers a "Scan Required" alert if they aren't at a table yet.
    navigation.navigate('Scan', { autoSelect: item });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>QUICK REORDER</Text>
        <Text style={styles.subtitle}>Your favorites are just one tap away.</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#000" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => (
            <View style={styles.reorderCard}>
              <View style={styles.info}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.lastOrdered}>Last ordered: {new Date(item.lastDate).toLocaleDateString()}</Text>
                <Text style={styles.price}>${item.price.toFixed(2)}</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.repeatBtn}
                onPress={() => handleReorder(item)}
              >
                <RotateCcw color="#fff" size={20} strokeWidth={3} />
                <Text style={styles.btnText}>REORDER</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <ShoppingBag size={50} color="#ccc" />
              <Text style={styles.emptyText}>No order history yet.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBEB', padding: 20 },
  header: { marginTop: 40, marginBottom: 20 },
  title: { fontSize: 26, fontWeight: '900' },
  subtitle: { fontSize: 13, fontWeight: '700', color: '#666' },
  reorderCard: {
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#000',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    elevation: 5
  },
  info: { flex: 1 },
  itemName: { fontSize: 18, fontWeight: '900', textTransform: 'uppercase' },
  lastOrdered: { fontSize: 10, fontWeight: '700', color: '#999', marginVertical: 4 },
  price: { fontSize: 16, fontWeight: '900', color: COLORS.secondary },
  repeatBtn: { 
    backgroundColor: COLORS.primary, 
    padding: 12, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8,
    borderWidth: 2,
    borderColor: '#000'
  },
  btnText: { color: '#fff', fontWeight: '900', fontSize: 12 },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontWeight: '800', color: '#ccc', marginTop: 10 }
});
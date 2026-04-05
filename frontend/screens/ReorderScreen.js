import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { COLORS } from '../src/styles/theme';
import { ORDER_URL } from '../src/config'; // Ensure this points to your orders route

export default function ReorderScreen({ route }) {
  const { user, restaurantId } = route.params;
  const [pastItems, setPastItems] = useState([]);

  useEffect(() => {
    // Fetch unique past items the user has ordered at this restaurant
    fetch(`${ORDER_URL}/history/${user.id}/${restaurantId}`)
      .then(res => res.json())
      .then(data => setPastItems(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>REORDER</Text>
      <Text style={styles.subHeader}>Your favorites at this location</Text>

      <FlatList
        data={pastItems}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.reorderCard}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.price}>{item.price} RSD</Text>
            </View>
            <TouchableOpacity style={styles.reorderBtn}>
              <Text style={styles.btnText}>ADD TO CART</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No past orders yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBEB', padding: 20 },
  header: { fontSize: 26, fontWeight: '900', marginTop: 50, textAlign: 'center' },
  subHeader: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 30 },
  reorderCard: { 
    backgroundColor: '#FFF', 
    borderWidth: 2, 
    borderColor: '#000', 
    padding: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 15 
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 18, fontWeight: '800', textTransform: 'uppercase' },
  price: { fontSize: 14, color: '#444', marginTop: 5 },
  reorderBtn: { backgroundColor: '#000', paddingHorizontal: 15, paddingVertical: 10 },
  btnText: { color: '#FFF', fontWeight: '900', fontSize: 12 },
  empty: { textAlign: 'center', marginTop: 50, color: '#999' }
});
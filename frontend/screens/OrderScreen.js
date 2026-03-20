import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { ORDER_URL } from '../src/config';
import CustomAlert from '../components/CustomAlert';

export default function OrderScreen({ route, navigation }) {
  const { session, user } = route.params;
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingItem, setAddingItem] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '' });

  const showAlert = (title, message) => {
    setAlertConfig({ title, message });
    setAlertVisible(true);
  };

  // FETCH REAL DATA FROM DATABASE
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await fetch(`${ORDER_URL}/menu-items`);
        const data = await response.json();
        setMenu(data);
      } catch (e) {
        showAlert("Error", "Could not load menu items from database.");
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  const addToCart = async (itemId, itemName) => {
    if (addingItem) return;
    setAddingItem(true);
    
    try {
      const response = await fetch(`${ORDER_URL}/add-item`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          menuItemId: itemId,
          userId: user.id,
          quantity: 1
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showAlert("Added!", `${itemName} added to table cart.`);
      } else {
        showAlert("Error", data.error || "Foreign key violation: Check item ID.");
      }
    } catch (e) {
      showAlert("Offline", "Server is unreachable.");
    } finally {
      setAddingItem(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View>
        <Text style={styles.itemName}>{item.name}</Text>
        {/* Render simple text for price since it's just a number */}
        <Text style={styles.itemPrice}>${item.price}</Text>
      </View>
      <TouchableOpacity 
        style={styles.addBtn} 
        onPress={() => addToCart(item.id, item.name)}
        disabled={addingItem}
      >
        <Text style={styles.addBtnText}>+</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <CustomAlert 
        visible={alertVisible} 
        title={alertConfig.title} 
        message={alertConfig.message} 
        onClose={() => setAlertVisible(false)} 
      />

      <View style={styles.header}>
        <View>
          <Text style={styles.tableLabel}>TABLE {session.table_id}</Text>
          <Text style={styles.userGreet}>Ordering as {user.username}</Text>
        </View>
        <View style={styles.codeBadge}>
          <Text style={styles.codeText}>{session.join_code}</Text>
        </View>
      </View>

      <Text style={styles.menuTitle}>Menu</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#000" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={menu}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity 
        style={styles.cartBtn}
        onPress={() => navigation.navigate('TableCartScreen', { session, user })}
      >
        <Text style={styles.cartBtnText}>VIEW TABLE CART & PAY</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBEB', padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 30 },
  tableLabel: { fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  userGreet: { fontSize: 14, color: '#555', fontWeight: '500' },
  codeBadge: { backgroundColor: '#000', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 },
  codeText: { color: '#fff', fontWeight: 'bold', fontSize: 18, letterSpacing: 1 },
  menuTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textTransform: 'uppercase', color: '#333' },
  list: { paddingBottom: 120 },
  card: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#000', padding: 20, marginBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.1, shadowRadius: 0 },
  itemName: { fontSize: 18, fontWeight: 'bold' },
  itemPrice: { fontSize: 16, color: '#000', marginTop: 4 },
  addBtn: { backgroundColor: '#F1D1E5', width: 45, height: 45, borderWidth: 2, borderColor: '#000', justifyContent: 'center', alignItems: 'center' },
  addBtnText: { fontSize: 28, fontWeight: 'bold', marginTop: -2 },
  cartBtn: { position: 'absolute', bottom: 30, left: 20, right: 20, backgroundColor: '#FFFFFF', borderWidth: 3, borderColor: '#000', padding: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 6, height: 6 }, shadowOpacity: 1, shadowRadius: 0 },
  cartBtnText: { fontWeight: '900', fontSize: 16, textTransform: 'uppercase' }
});
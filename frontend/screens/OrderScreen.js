import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { ORDER_URL } from '../src/config';
import { COLORS, GLOBAL_STYLES } from '../src/styles/theme'; 
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

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await fetch(`${ORDER_URL}/menu-items`);
        const data = await response.json();
        setMenu(data);
      } catch (e) {
        showAlert("Error", "Could not load menu items.");
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
      if (response.ok) {
        showAlert("Added!", `${itemName} added to table cart.`);
      } else {
        showAlert("Error", "Check item ID.");
      }
    } catch (e) {
      showAlert("Offline", "Server is unreachable.");
    } finally {
      setAddingItem(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.textContainer}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
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

      {/* HEADER: Pinned Left and Right */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.tableLabel}>TABLE {session.table_id}</Text>
          <Text style={styles.userGreet}>Ordering as {user.username}</Text>
        </View>
        <View style={styles.codeBadge}>
          <Text style={styles.codeText}>{session.join_code}</Text>
        </View>
      </View>

      <Text style={styles.menuTitle}>Menu</Text>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.secondary} style={{ marginTop: 50 }} />
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
  container: { 
    flex: 1, 
    backgroundColor: '#F4F1DE', // Using your theme cream directly for reliability
    paddingTop: 60
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', // Pushes Left and Right apart
    alignItems: 'center', 
    paddingHorizontal: 20, // Only padding on the sides
    marginBottom: 30 
  },
  headerLeft: {
    flex: 1, // Takes up remaining space on the left
  },
  tableLabel: { 
    fontSize: 28, 
    fontWeight: '900', 
    color: COLORS.black 
  },
  userGreet: { 
    fontSize: 14, 
    color: COLORS.gray, 
    fontWeight: '600' 
  },
  codeBadge: { 
    backgroundColor: COLORS.secondary, 
    paddingHorizontal: 15, 
    paddingVertical: 8, 
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.black
  },
  codeText: { 
    color: COLORS.white, 
    fontWeight: '900', 
    fontSize: 20 
  },
  menuTitle: { 
    fontSize: 18, 
    fontWeight: '900', 
    marginHorizontal: 20,
    marginBottom: 15, 
    textTransform: 'uppercase' 
  },
  list: { 
    paddingHorizontal: 20, // Cards will breathe but stay large
    paddingBottom: 120 
  },
  card: { 
    backgroundColor: COLORS.white, 
    borderWidth: 2, 
    borderColor: COLORS.black, 
    padding: 20, 
    marginBottom: 15, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    // Strong Neobrutalist Shadow
    shadowColor: COLORS.black,
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5
  },
  textContainer: {
    flex: 1
  },
  itemName: { fontSize: 18, fontWeight: '900' },
  itemPrice: { fontSize: 16, color: COLORS.black, fontWeight: '700' },
  addBtn: { 
    backgroundColor: COLORS.secondary,
    width: 50, 
    height: 50, 
    borderWidth: 2, 
    borderColor: COLORS.black, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  addBtnText: { 
    fontSize: 32, 
    fontWeight: '900', 
    marginTop: -2 
  },
  cartBtn: { 
    position: 'absolute', 
    bottom: 30, 
    alignSelf: 'center',
    width: '90%', 
    backgroundColor: COLORS.white, 
    borderWidth: 3, 
    borderColor: COLORS.black, 
    padding: 20, 
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8
  },
  cartBtnText: { 
    fontWeight: '900', 
    fontSize: 16, 
    textTransform: 'uppercase' 
  }
});
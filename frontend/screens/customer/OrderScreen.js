import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Image, 
  Dimensions, 
  ScrollView 
} from 'react-native';
import { ORDER_URL } from '../../src/config';
import { COLORS } from '../../src/styles/theme'; 
import { Plus, MapPin, Leaf, Wheat, Flame, Candy, Citrus } from 'lucide-react-native';
import CustomAlert from '../../components/CustomAlert';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 60) / 2; 

// LOCAL IMAGE MAPPING
const itemImages = {
  'Signature Latte': require('../../assets/latte.png'),
  'Classic Burger': require('../../assets/burger.png'),
  'Mocha': require('../../assets/mocha.png'),
  'Matcha Latte': require('../../assets/matcha.png'),
  'BBQ Burger': require('../../assets/bbq.png'),
  'Rodeo Burger': require('../../assets/rodeo_burger.png'),
  'Loaded Fries': require('../../assets/fries.png'),
  'Lemonade': require('../../assets/lemonade.png'),
  'Coca Cola': require('../../assets/cola.png'),
  'Smash Burger': require('../../assets/smash_burger.png'),
  'Water': require('../../assets/water.png'),
  'default': require('../../assets/latte.png'),
};

// BADGE COMPONENT - Placed outside to keep renderItem clean
const ItemBadges = ({ item }) => (
  <View style={styles.badgeContainer}>
    {item.is_vegan && <Leaf size={14} color="#2D5A27" strokeWidth={3} style={styles.badgeIcon} />}
    {item.is_gluten_free && <Wheat size={14} color="#D4A017" strokeWidth={3} style={styles.badgeIcon} />}
    {item.is_hot && <Flame size={14} color="#FF4500" strokeWidth={3} style={styles.badgeIcon} />}
    {item.is_sweet && <Candy size={14} color="#FF69B4" strokeWidth={3} style={styles.badgeIcon} />}
    {item.is_sour && <Citrus size={14} color="#CCFF00" strokeWidth={3} style={styles.badgeIcon} />} 
  </View>
);

export default function OrderScreen({ route, navigation }) {
  const { session, user, restaurantName, restaurantId } = route.params;
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingItem, setAddingItem] = useState(false);
  
  // NEW STATE: CATEGORY FILTERING
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const categories = ['ALL', 'COFFEE', 'BURGERS', 'SNACKS', 'DRINKS'];

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '' });

  console.log("DEBUG - Received Name:", restaurantName);

  // FILTER LOGIC - Run every render
  const filteredMenu = (Array.isArray(menu) && menu.length > 0)
    ? (selectedCategory === 'ALL' 
        ? menu 
        : menu.filter(item => item.category?.toUpperCase() === selectedCategory.toUpperCase()))
    : [];

  const showAlert = (title, message) => {
    setAlertConfig({ title, message });
    setAlertVisible(true);
  };

  useEffect(() => {
    const fetchMenu = async () => {
      // Use the restaurantId from params if session.restaurant_id is missing
      const targetId = session?.restaurant_id || restaurantId;
      
      console.log("FETCHING MENU FOR ID:", targetId);

      if (!targetId) {
        console.log("ERROR: No Restaurant ID found in session or params");
        setLoading(false); // Stop the spinner so we can see the error
        return;
      }

      try {
        const response = await fetch(`${ORDER_URL}/menu-items?restaurantId=${targetId}`);
        const data = await response.json();
        
        if (Array.isArray(data)) {
          setMenu(data);
        } else {
          setMenu([]);
          console.log("DATA ERROR: Backend did not return an array", data);
        }
      } catch (e) {
        console.log("FETCH ERROR:", e);
        showAlert("Error", "Could not load menu items.");
        setMenu([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, [session?.restaurant_id, restaurantId]); // Watch both sources

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

  const renderItem = ({ item }) => {
    const imageSource = itemImages[item.name] || itemImages['default'];
    const isFood = item.name.toLowerCase().includes('burger') || item.category === 'SNACKS';
    const dynamicBg = isFood ? '#7befb1' : '#618C82';

    return (
      <View style={styles.menuItemCard}>
        <View style={[styles.imageContainer, { backgroundColor: dynamicBg }]}>
          <Image source={imageSource} style={styles.itemImage} />
          <TouchableOpacity 
            style={styles.gridAddBtn} 
            onPress={() => addToCart(item.id, item.name)}
            disabled={addingItem}
          >
            <Plus color="#618C82" size={24} strokeWidth={4} />
          </TouchableOpacity>
        </View>

        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
            {/* INJECTED BADGES HERE */}
            <ItemBadges item={item} />
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <CustomAlert 
        visible={alertVisible} 
        title={alertConfig.title} 
        message={alertConfig.message} 
        onClose={() => setAlertVisible(false)} 
      />

      {/* TOP LOCATION BAR */}
      <View style={styles.locationBar}>
        <View style={styles.locationInner}>
          <View style={styles.campusBadge}>
            <Text style={styles.badgeText}>CE</Text>
          </View>
          <Text style={styles.locationText}>
            {restaurantName} - Table {session.table_id}
          </Text>
          <MapPin size={18} color="#000" />
        </View>
      </View>

      {/* CATEGORY FILTERS */}
      <View style={{ maxHeight: 50, marginBottom: 10 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 20 }}>
          {categories.map((cat) => (
            <TouchableOpacity 
              key={cat} 
              style={[styles.filterBtn, selectedCategory === cat && styles.activeFilter]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.filterText, selectedCategory === cat && styles.activeFilterText]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#618C82" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredMenu}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.gridList}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={styles.columnWrapper}
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
    backgroundColor: '#FDFBEB', 
    paddingTop: 60
  },
  locationBar: { 
    paddingHorizontal: 20, 
    marginBottom: 15 
  },
  locationInner: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    padding: 10, 
    borderWidth: 2, 
    borderColor: '#000', 
    borderRadius: 5 
  },
  campusBadge: { 
    backgroundColor: '#618C82', 
    width: 30, 
    height: 30, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderRadius: 4, 
    marginRight: 10 
  },
  badgeText: { 
    color: '#fff', 
    fontWeight: '900', 
    fontSize: 12 
  },
  locationText: { 
    flex: 1, 
    fontWeight: '700', 
    fontSize: 14 
  },
  filterBtn: { 
    paddingHorizontal: 15, 
    marginRight: 10, 
    borderWidth: 2, 
    borderColor: '#000', 
    backgroundColor: '#fff',
    height: 35,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
  },
  activeFilter: { 
    backgroundColor: '#000' 
  },
  filterText: { 
    fontWeight: '800', 
    fontSize: 13,
    color: '#000'
  },
  activeFilterText: { 
    color: '#fff' 
  },
  gridList: { 
    paddingHorizontal: 20, 
    paddingBottom: 150 
  },
  columnWrapper: { 
    justifyContent: 'space-between' 
  },
  menuItemCard: { 
    width: COLUMN_WIDTH, 
    marginBottom: 20, 
    backgroundColor: '#fff', 
    borderWidth: 2, 
    borderColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    elevation: 6 
  },
  imageContainer: { 
    width: '100%', 
    height: COLUMN_WIDTH * 1.1, 
    justifyContent: 'center', 
    alignItems: 'center',
    position: 'relative',
    borderBottomWidth: 2,
    borderColor: '#000',
    overflow: 'hidden' 
  },
  itemImage: { 
    width: '110%', 
    height: '110%', 
    resizeMode: 'contain',
    transform: [{ scale: 1.05 }] 
  },
  gridAddBtn: { 
    position: 'absolute', 
    bottom: 8, 
    right: 8, 
    backgroundColor: '#fff', 
    width: 35, 
    height: 35, 
    borderWidth: 2, 
    borderColor: '#000',
    justifyContent: 'center', 
    alignItems: 'center'
  },
  itemInfo: { 
    padding: 10 
  },
  itemName: { 
    fontSize: 15, 
    fontWeight: '900', 
    color: '#000' 
  },
  itemPrice: { 
    fontSize: 14, 
    fontWeight: '700', 
    color: '#666', 
    marginTop: 2 
  },
  cartBtn: { 
    position: 'absolute', 
    bottom: 30, 
    alignSelf: 'center',
    width: '90%', 
    backgroundColor: '#fff', 
    borderWidth: 3, 
    borderColor: '#000', 
    padding: 18, 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    elevation: 8
  },
  cartBtnText: { 
    fontWeight: '900', 
    fontSize: 16, 
    textTransform: 'uppercase' 
  },
  priceRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: 5 
  },
  badgeContainer: { 
    flexDirection: 'row', 
    gap: 4 
  },
  badgeIcon: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 2,
  },
});
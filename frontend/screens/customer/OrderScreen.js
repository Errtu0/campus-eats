import React, { useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  Dimensions, 
  ScrollView,
  Modal,
  TextInput
} from 'react-native';
import { ORDER_URL } from '../../src/config';
import { COLORS } from '../../src/styles/theme'; 
import { 
  Plus, 
  Minus,
  MapPin, 
  Leaf, 
  Wheat, 
  Flame, 
  Cookie, 
  Citrus,
  MessageSquare
} from 'lucide-react-native';
import CustomAlert from '../../components/CustomAlert';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 60) / 2; 

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

const ItemBadges = ({ item }) => (
  <View style={styles.badgeContainer}>
    {!!item.is_vegan && (
      <View style={[styles.badgeIconWrapper, { backgroundColor: '#E2F0D9' }]}>
        <Leaf size={11} color="#2D5A27" strokeWidth={3} />
      </View>
    )}
    {!!item.is_gluten_free && (
      <View style={[styles.badgeIconWrapper, { backgroundColor: '#FFF2CC' }]}>
        <Wheat size={11} color="#D4A017" strokeWidth={3} />
      </View>
    )}
    {!!item.is_hot && (
      <View style={[styles.badgeIconWrapper, { backgroundColor: '#FCE4D6' }]}>
        <Flame size={11} color="#FF4500" strokeWidth={3} />
      </View>
    )}
    {!!item.is_sweet && (
      <View style={[styles.badgeIconWrapper, { backgroundColor: '#FCE4F2' }]}>
        <Cookie size={11} color="#FF69B4" strokeWidth={3} />
      </View>
    )}
    {!!item.is_sour && (
      <View style={[styles.badgeIconWrapper, { backgroundColor: '#F5FFCC' }]}>
        <Citrus size={11} color="#99CC00" strokeWidth={3} />
      </View>
    )} 
  </View>
);

export default function OrderScreen({ route, navigation }) {
  const { session, user, restaurantName, menu = [] } = route.params;
  const [addingItem, setAddingItem] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const categories = ['ALL', 'COFFEE', 'BURGERS', 'SNACKS', 'DRINKS'];

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '' });

  // --- INTERACTIVE CUSTOMIZATION STATES ---
  const [customizerModal, setCustomizerModal] = useState(false);
  const [activeTargetItem, setActiveTargetItem] = useState(null);
  const [selectedMilk, setSelectedMilk] = useState('Whole Milk');
  const [specialNotes, setSpecialNotes] = useState('');
  
  // FIX 1: ADDED QUANTITY MULTIPLIER COUNTER STATE
  const [quantity, setQuantity] = useState(1);

  const filteredMenu = Array.isArray(menu)
    ? (selectedCategory === 'ALL' 
        ? menu 
        : menu.filter(item => {
            const itemCategory = item.category ? item.category.trim().toUpperCase() : '';
            const selectedTarget = selectedCategory.trim().toUpperCase();
            return itemCategory === selectedTarget;
          }))
    : [];

  const showAlert = (title, message) => {
    setAlertConfig({ title, message });
    setAlertVisible(true);
  };

  const openCustomizerTray = (item) => {
    setActiveTargetItem(item);
    setSelectedMilk('Whole Milk');
    setSpecialNotes('');
    setQuantity(1); // Reset counter safely to 1 on initial load
    setCustomizerModal(true);
  };

  // COUNTER MODIFIER FUNCTIONS
  const incrementQuantity = () => setQuantity(prev => prev + 1);
  const decrementQuantity = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

  const handleCommitToCart = async () => {
    if (!activeTargetItem) return;
    setCustomizerModal(false);
    setAddingItem(true);

    const isCoffee = activeTargetItem.category?.toUpperCase() === 'COFFEE' || activeTargetItem.name.toLowerCase().includes('latte');
    let dynamicCustomizationString = "";

    if (isCoffee) {
      dynamicCustomizationString = `[${selectedMilk.toUpperCase()}] ${specialNotes.trim()}`;
    } else {
      dynamicCustomizationString = specialNotes.trim();
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${ORDER_URL}/add-item`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionId: session.id,
          menuItemId: activeTargetItem.id,
          quantity: parseInt(quantity), // FIX 2: Passes the true dynamic counter metric through payloads
          customization: dynamicCustomizationString || null 
        }),
      });
      
      const result = await response.json();
      if (response.ok) {
        showAlert("ADDED!", `${quantity}x ${activeTargetItem.name.toUpperCase()} RUNNING CONFIGS DEPLOYED TO CART.`);
      } else {
        showAlert("ERROR", result.error || "Check item alignment properties.");
      }
    } catch (e) {
      showAlert("OFFLINE", "Gateway connection timed out.");
    } finally {
      setAddingItem(false);
      setActiveTargetItem(null);
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
            onPress={() => openCustomizerTray(item)}
            disabled={addingItem}
          >
            <Plus color="#000" size={20} strokeWidth={4} />
          </TouchableOpacity>
        </View>

        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={1}>{item.name.toUpperCase()}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
            <ItemBadges item={item} />
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <CustomAlert visible={alertVisible} title={alertConfig.title} message={alertConfig.message} onClose={() => setAlertVisible(false)} />

      {/* LOCATION MODULE */}
      <View style={styles.locationBar}>
        <View style={styles.locationInner}>
          <View style={styles.campusBadge}>
            <Text style={styles.badgeText}>CE</Text>
          </View>
          <Text style={styles.locationText}>
            {restaurantName?.toUpperCase()} • TABLE {session.table_id}
          </Text>
          <MapPin size={18} color="#000" strokeWidth={2.5} />
        </View>
      </View>

      {/* FILTER BUTTONS */}
      <View style={{ maxHeight: 50, marginBottom: 15 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 20 }}>
          {categories.map((cat) => (
            <TouchableOpacity key={cat} style={[styles.filterBtn, selectedCategory === cat && styles.activeFilter]} onPress={() => setSelectedCategory(cat)}>
              <Text style={[styles.filterText, selectedCategory === cat && styles.activeFilterText]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredMenu}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.gridList}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={styles.columnWrapper}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>NO ITEMS IN THIS SECTOR</Text>
          </View>
        }
      />

      {/* NEOBRUTALIST CUSTOMIZER DRAWER MODAL */}
      <Modal visible={customizerModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>CUSTOMIZE YOUR ORDER</Text>
              <Text style={styles.itemNameSubtitle}>{activeTargetItem?.name?.toUpperCase()}</Text>
              
              {/* COFFEE CONDITION EXTRA OPTION BLOCKS */}
              {(activeTargetItem?.category?.toUpperCase() === 'COFFEE' || activeTargetItem?.name?.toLowerCase().includes('latte')) && (
                <View style={{ marginTop: 10 }}>
                  <Text style={styles.label}>SELECT MILK</Text>
                  <View style={styles.milkGrid}>
                    {['Whole Milk', 'Lactose Free', 'Oat Milk', 'Almond Milk'].map((milkOption) => (
                      <TouchableOpacity 
                        key={milkOption}
                        style={[styles.milkChip, selectedMilk === milkOption && styles.activeMilkChip]}
                        onPress={() => setSelectedMilk(milkOption)}
                      >
                        <Text style={[styles.milkChipText, selectedMilk === milkOption && styles.activeMilkChipText]}>
                          {milkOption.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* UNIVERSAL KITCHEN STAFF LOG NOTATION AREA */}
              <View style={{ marginTop: 15 }}>
                <Text style={styles.label}>NOTES FOR KITCHEN</Text>
                <View style={styles.inputContainer}>
                  <MessageSquare size={16} color="#777" style={styles.inputIcon} />
                  <TextInput 
                    placeholder="e.g. No lettuce / Extra hot / Medium sweet preference"
                    placeholderTextColor="#777"
                    style={styles.textInput}
                    value={specialNotes}
                    onChangeText={setSpecialNotes}
                    maxLength={140}
                  />
                </View>
              </View>

              {/* FIX 3: INJECT QUANTITY STEPPER ROW SELECTORS BUTTONS */}
              <View style={{ marginTop: 20 }}>
                <Text style={styles.label}>QUANTITY</Text>
                <View style={styles.stepperWrapperRow}>
                  <TouchableOpacity style={styles.stepperBtn} onPress={decrementQuantity}>
                    <Minus size={18} color="#000" strokeWidth={3} />
                  </TouchableOpacity>
                  
                  <View style={styles.stepperValueBox}>
                    <Text style={styles.stepperValueText}>{quantity}</Text>
                  </View>
                  
                  <TouchableOpacity style={styles.stepperBtn} onPress={incrementQuantity}>
                    <Plus size={18} color="#000" strokeWidth={3} />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={[styles.actionConfirmBtn, { backgroundColor: COLORS.secondary }]} onPress={handleCommitToCart}>
                <Text style={styles.actionConfirmBtnText}>ADD ({quantity}) TO TABLE CART</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setCustomizerModal(false)} style={{ marginTop: 15 }}>
                <Text style={styles.cancelText}>CANCEL</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* FIXED POSITION CONTROL FOOTER */}
      <View style={styles.cartBtnWrapper}>
        <TouchableOpacity style={styles.cartBtn} onPress={() => navigation.navigate('TableCartScreen', { session, user })}>
          <Text style={styles.cartBtnText}>VIEW TABLE CART & PAY</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBEB', paddingTop: 60 },
  locationBar: { paddingHorizontal: 20, marginBottom: 15 },
  locationInner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderWidth: 3, borderColor: '#000', shadowColor: '#000', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, elevation: 3 },
  campusBadge: { backgroundColor: '#000', width: 28, height: 28, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  badgeText: { color: '#fff', fontWeight: '900', fontSize: 11 },
  locationText: { flex: 1, fontWeight: '900', fontSize: 12, color: '#000', letterSpacing: 0.5 },
  filterBtn: { paddingHorizontal: 16, marginRight: 10, borderWidth: 3, borderColor: '#000', backgroundColor: '#fff', height: 40, justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1 },
  activeFilter: { backgroundColor: '#000' },
  filterText: { fontWeight: '900', fontSize: 11, color: '#000', letterSpacing: 0.5 },
  activeFilterText: { color: '#fff' },
  gridList: { paddingHorizontal: 20, paddingBottom: 160 },
  columnWrapper: { justifyContent: 'space-between' },
  menuItemCard: { width: COLUMN_WIDTH, marginBottom: 20, backgroundColor: '#fff', borderWidth: 3, borderColor: '#000', shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, elevation: 4 },
  imageContainer: { width: '100%', height: COLUMN_WIDTH * 1.05, justifyContent: 'center', alignItems: 'center', position: 'relative', borderBottomWidth: 3, borderColor: '#000', overflow: 'hidden' },
  itemImage: { width: '95%', height: '95%', resizeMode: 'contain' },
  gridAddBtn: { position: 'absolute', bottom: 8, right: 8, backgroundColor: '#fff', width: 36, height: 36, borderWidth: 3, borderColor: '#000', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1 },
  itemInfo: { padding: 12, backgroundColor: '#fff' },
  itemName: { fontSize: 13, fontWeight: '900', color: '#000', letterSpacing: -0.2 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, position: 'relative' },
  itemPrice: { fontSize: 14, fontWeight: '900', color: '#000' },
  cartBtnWrapper: { position: 'absolute', bottom: 30, left: 20, right: 20, backgroundColor: '#000', borderWidth: 3, borderColor: '#000' },
  cartBtn: { backgroundColor: '#fff', padding: 18, alignItems: 'center', borderWidth: 1, borderColor: '#000', transform: [{ translateX: -5 }, { translateY: -5 }] },
  cartBtnText: { fontWeight: '900', fontSize: 14, textTransform: 'uppercase', color: '#000', letterSpacing: 0.5 },
  badgeContainer: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  badgeIconWrapper: { padding: 3, borderWidth: 1.5, borderColor: '#000', borderRadius: 0, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 1, height: 1 }, shadowOpacity: 1, elevation: 1 },
  emptyContainer: { paddingVertical: 80, alignItems: 'center' },
  emptyText: { fontWeight: '900', color: '#888', fontSize: 12 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', backgroundColor: '#FDFBEB', borderWidth: 4, borderColor: '#000', padding: 20, shadowColor: '#000', shadowOffset: { width: 6, height: 6 }, shadowOpacity: 1 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#000', textAlign: 'center' },
  itemNameSubtitle: { fontSize: 13, fontWeight: '800', color: COLORS.primary, textAlign: 'center', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  label: { fontSize: 10, fontWeight: '900', color: '#000', marginBottom: 8, marginTop: 12, letterSpacing: 0.5 },
  milkGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  milkChip: { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 2.5, borderColor: '#000', backgroundColor: '#fff' },
  activeMilkChip: { backgroundColor: '#000' },
  milkChipText: { fontSize: 9, fontWeight: '900', color: '#000' },
  activeMilkChipText: { color: '#fff' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 3, borderColor: '#000', backgroundColor: '#fff', paddingHorizontal: 10 },
  inputIcon: { marginRight: 8 },
  textInput: { flex: 1, height: 48, fontWeight: '800', fontSize: 13, color: '#000' },
  
  // FIX 4: NEOBRUTALIST STEPPER STYLING BLOCK SPECIFICATIONS
  stepperWrapperRow: { flexDirection: 'row', alignItems: 'center', gap: 0, height: 46, maxWidth: 160 },
  stepperBtn: { width: 46, height: 46, borderWidth: 3, borderColor: '#000', backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  stepperValueBox: { flex: 1, height: 46, borderTopWidth: 3, borderBottomWidth: 3, borderColor: '#000', backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 15 },
  stepperValueText: { fontSize: 16, fontWeight: '900', color: '#000' },

  actionConfirmBtn: { padding: 16, alignItems: 'center', borderWidth: 3, borderColor: '#000', marginTop: 25, shadowColor: '#000', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1 },
  actionConfirmBtnText: { color: '#fff', fontWeight: '900', fontSize: 13, letterSpacing: 0.5 },
  cancelText: { textAlign: 'center', fontSize: 11, fontWeight: '900', textDecorationLine: 'underline', color: '#666' }
});
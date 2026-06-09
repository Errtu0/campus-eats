import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, TextInput, StyleSheet, ScrollView, Image, Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ADMIN_URL } from '../../../src/config';
import { COLORS, GLOBAL_STYLES } from '../../../src/styles/theme';
import { PlusCircle, Pencil, Trash2, Leaf, Wheat, Flame, Cookie, Smile, Layers, Minus } from 'lucide-react-native';
import CustomAlert from '../../../components/CustomAlert';

const itemImages = {
  'Signature Latte': require('../../../assets/latte.png'),
  'Classic Burger': require('../../../assets/burger.png'),
  'Mocha': require('../../../assets/mocha.png'),
  'Matcha Latte': require('../../../assets/matcha.png'),
  'BBQ Burger': require('../../../assets/burger.png'),
  'Rodeo Burger': require('../../../assets/rodeo_burger.png'),
  'Loaded Fries': require('../../../assets/fries.png'),
  'Lemonade': require('../../../assets/lemonade.png'),
  'Coca Cola': require('../../../assets/cola.png'),
  'Smash Burger': require('../../../assets/smash_burger.png'),
  'Water': require('../../../assets/water.png'),
  'default': require('../../../assets/latte.png'),
};

const CATEGORY_PRESETS = ['COFFEE', 'BURGERS', 'SNACKS', 'DRINKS'];

export default function MenuTab({ restaurantId, data, inventory = [], refresh }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem] = useState(null);
  
  const [form, setForm] = useState({ 
    name: '', 
    price: '', 
    category: 'COFFEE', 
    customCategory: '',
    image_name: 'default',
    is_vegan: false,
    is_gluten_free: false,
    is_hot: false,
    is_sweet: false,
    is_sour: false
  });
  const [isCustomCategoryActive, setIsCustomCategoryActive] = useState(false);

  const [recipeIngredients, setRecipeIngredients] = useState([]);
  const [selectedInventoryId, setSelectedInventoryId] = useState(null);
  const [amountNeeded, setAmountNeeded] = useState('');

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', onConfirm: null });

  const showTabAlert = (title, message, onConfirm = null) => {
    setAlertConfig({ title, message, onConfirm });
    setAlertVisible(true);
  };

  // FETCH INGREDIENTS WHEN EDITING AN EXISTENT MENU ITEM TOOL
  const fetchRecipeIngredients = async (menuItemId) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${ADMIN_URL}/menu/${menuItemId}/ingredients`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const resData = await response.json();
      if (response.ok && Array.isArray(resData)) {
        // Map the backend models to frontend workspace structures natively
        const mapped = resData.map(ri => ({
          inventoryId: ri.inventoryId,
          name: ri.inventory ? ri.inventory.name : 'Unknown Asset',
          unit: ri.inventory ? ri.inventory.unit : 'UNITS',
          quantityUsed: ri.quantityUsed
        }));
        setRecipeIngredients(mapped);
      }
    } catch (e) {
      console.error("Failed to sync structural ingredients mapping backlog:", e);
    }
  };

  const pushIngredientToRecipe = () => {
    if (!selectedInventoryId || !amountNeeded) {
      return showTabAlert("SELECTION ERROR", "Please select an ingredient from the asset options and enter a quantity.");
    }
    
    // FIX 1: SANITIZE REGIONAL COMMA INPUT INTO FLOATS FOR DECIMALS (0,2 -> 0.2)
    const normalizedAmount = amountNeeded.replace(',', '.');
    const parsedAmount = parseFloat(normalizedAmount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return showTabAlert("INVALID NUMBER", "Please provide a functional metric calculation format value.");
    }
    
    const matchedStock = inventory.find(i => i.id === parseInt(selectedInventoryId));
    if (recipeIngredients.some(ri => ri.inventoryId === selectedInventoryId)) {
      return showTabAlert("DUPLICATE", "This item is already attached to this recipe layout.");
    }

    setRecipeIngredients([...recipeIngredients, {
      inventoryId: selectedInventoryId,
      name: matchedStock ? matchedStock.name : `Pantry Asset #${selectedInventoryId}`,
      unit: matchedStock ? matchedStock.unit : 'units',
      quantityUsed: parsedAmount
    }]);

    setSelectedInventoryId(null);
    setAmountNeeded('');
  };

  const dropIngredientFromRecipe = (id) => {
    setRecipeIngredients(recipeIngredients.filter(ri => ri.inventoryId !== id));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.price) {
      return showTabAlert("MISSING INFO", "Please provide both an asset name and a base value.");
    }

    // SANITIZE PRICE COERCIONS AS WELL TO PREVENT LOCALIZATION RUNTIME BLOCK EXCEPTIONS
    const normalizedPrice = form.price.replace(',', '.');

    const finalCategory = isCustomCategoryActive 
      ? form.customCategory.trim().toUpperCase() 
      : form.category;

    if (!finalCategory) {
      return showTabAlert("MISSING CATEGORY", "Please provide or select a category identifier.");
    }

    const method = editItem ? 'PATCH' : 'POST';
    const url = editItem ? `${ADMIN_URL}/menu/${editItem.id}` : `${ADMIN_URL}/menu`;

    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          name: form.name.trim(), 
          price: parseFloat(normalizedPrice), 
          restaurant_id: restaurantId,
          category: finalCategory,
          image_name: form.image_name,
          is_vegan: form.is_vegan,
          is_gluten_free: form.is_gluten_free,
          is_hot: form.is_hot,
          is_sweet: form.is_sweet,
          is_sour: form.is_sour,
          ingredients: recipeIngredients 
        }),
      });

      if (response.ok) {
        setModalVisible(false);
        resetFormState();
        refresh();
        showTabAlert("SUCCESS", editItem ? "Item updates saved successfully." : "Menu asset created with active ingredients mappings.");
      } else {
        const errorData = await response.json();
        showTabAlert("ERROR", errorData.error || "Save action failed.");
      }
    } catch (e) { 
      showTabAlert("OFFLINE", "Server connection timed out."); 
    }
  };

  const resetFormState = () => {
    setEditItem(null);
    setForm({ 
      name: '', price: '', category: 'COFFEE', customCategory: '', image_name: 'default',
      is_vegan: false, is_gluten_free: false, is_hot: false, is_sweet: false, is_sour: false 
    });
    setRecipeIngredients([]);
    setSelectedInventoryId(null);
    setAmountNeeded('');
    setIsCustomCategoryActive(false);
  };

  const confirmDelete = (id) => {
    showTabAlert("DELETE ITEM", "Are you sure you want to remove this item from the menu?", () => performDelete(id));
  };

  const performDelete = async (id) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${ADMIN_URL}/menu/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setAlertVisible(false);
        refresh();
      }
    } catch (e) {
      showTabAlert("ERROR", "Deletion request failed.");
    }
  };

  return (
    <View style={styles.tabContainer}>
      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertVisible(false)}
        onConfirm={alertConfig.onConfirm}
      />

      <FlatList
        data={data}
        contentContainerStyle={{ padding: 20, paddingBottom: 110 }}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const imageSource = itemImages[item.name] || itemImages[item.image_name] || itemImages['default'];
          return (
            <View style={[GLOBAL_STYLES.card, { marginBottom: 15 }]}>
              <View style={styles.itemRow}>
                <Image source={imageSource} style={styles.thumbnailImage} />
                <View style={{ flex: 1, paddingLeft: 12, paddingRight: 10 }}> 
                  <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.itemCategoryLabel}>SECTOR: {item.category || 'COFFEE'}</Text>
                  
                  <View style={styles.previewBadgeRow}>
                    {!!item.is_vegan && (
                      <View style={[styles.previewBadgeWrapper, { backgroundColor: '#E2F0D9' }]}>
                        <Leaf size={11} color="#2D5A27" strokeWidth={3} />
                      </View>
                    )}
                    {!!item.is_gluten_free && (
                      <View style={[styles.previewBadgeWrapper, { backgroundColor: '#FFF2CC' }]}>
                        <Wheat size={11} color="#D4A017" strokeWidth={3} />
                      </View>
                    )}
                    {!!item.is_hot && (
                      <View style={[styles.previewBadgeWrapper, { backgroundColor: '#FCE4D6' }]}>
                        <Flame size={11} color="#FF4500" strokeWidth={3} />
                      </View>
                    )}
                    {!!item.is_sweet && (
                      <View style={[styles.previewBadgeWrapper, { backgroundColor: '#FCE4F2' }]}>
                        <Cookie size={11} color="#FF69B4" strokeWidth={3} />
                      </View>
                    )}
                    {!!item.is_sour && (
                      <View style={[styles.previewBadgeWrapper, { backgroundColor: '#F5FFCC' }]}>
                        <Smile size={11} color="#99CC00" strokeWidth={3} />
                      </View>
                    )}
                  </View>
                  <Text style={styles.itemPriceLabel}>${item.price.toFixed(2)}</Text>
                </View>

                <View style={styles.actionGroup}>
                  <TouchableOpacity 
                    style={styles.iconBox} 
                    onPress={() => { 
                      setEditItem(item); 
                      const isPreset = CATEGORY_PRESETS.includes(item.category?.toUpperCase());
                      setForm({ 
                        name: item.name, 
                        price: item.price.toString(), 
                        category: isPreset ? item.category.toUpperCase() : 'COFFEE',
                        customCategory: !isPreset ? item.category : '',
                        image_name: item.image_name || 'default',
                        is_vegan: !!item.is_vegan,
                        is_gluten_free: !!item.is_gluten_free,
                        is_hot: !!item.is_hot,
                        is_sweet: !!item.is_sweet,
                        is_sour: !!item.is_sour
                      }); 
                      setIsCustomCategoryActive(!isPreset);
                      // FIX 2: TRIGGER AUTOMATED RE-FETCH OF CORRESPONDING RECIPES DURING MODAL LAUNCH
                      fetchRecipeIngredients(item.id);
                      setModalVisible(true); 
                    }}
                  >
                    <Pencil size={16} color={COLORS.secondary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconBox} onPress={() => confirmDelete(item.id)}>
                    <Trash2 size={16} color="red" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.emptyText}>No registered product entities found.</Text>}
      />

      <View style={styles.fixedBtnContainer}>
        <TouchableOpacity style={styles.fixedAddBtn} onPress={() => { resetFormState(); setModalVisible(true); }} activeOpacity={0.9}>
          <PlusCircle color="#fff" size={20} />
          <Text style={styles.addBtnText}>ADD MENU ITEM</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>{editItem ? 'EDIT MENU ITEM' : 'CREATE MENU ITEM'}</Text>
              
              <Text style={styles.label}>ITEM NAME</Text>
              <TextInput placeholder="e.g. Signature Latte" placeholderTextColor="#777" style={styles.input} value={form.name} onChangeText={t => setForm({ ...form, name: t })} />
              
              <Text style={styles.label}>BASE PRICE ($)</Text>
              <TextInput placeholder="e.g. 4.75" placeholderTextColor="#777" keyboardType="numeric" style={styles.input} value={form.price} onChangeText={t => setForm({ ...form, price: t })} />

              <Text style={styles.label}>CATEGORY SELECTION</Text>
              <View style={styles.selectorGrid}>
                {CATEGORY_PRESETS.map((cat) => (
                  <TouchableOpacity key={cat} style={[styles.selectorChip, !isCustomCategoryActive && form.category === cat && styles.activeChip]} onPress={() => { setIsCustomCategoryActive(false); setForm({ ...form, category: cat }); }}>
                    <Text style={[styles.chipText, !isCustomCategoryActive && form.category === cat && styles.activeChipText]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={[styles.selectorChip, isCustomCategoryActive && styles.activeChip]} onPress={() => setIsCustomCategoryActive(true)}>
                  <Text style={[styles.chipText, isCustomCategoryActive && styles.activeChipText]}>+ CUSTOM VALUE</Text>
                </TouchableOpacity>
              </View>

              {isCustomCategoryActive && (
                <View>
                  <Text style={styles.label}>ENTER CUSTOM CATEGORY NAME</Text>
                  <TextInput placeholder="e.g. DESSERTS" placeholderTextColor="#777" style={styles.input} autoCapitalize="characters" value={form.customCategory} onChangeText={t => setForm({ ...form, customCategory: t })} />
                </View>
              )}

              {/* DYNAMIC RECIPE SCHEMAS FROM INVENTORY PROPS - RUNS CONTINUOUSLY IN CREATION AND EDIT MODE */}
              <View style={styles.recipeBorderContainer}>
                <Text style={[styles.label, { color: COLORS.secondary }]}>🛠 LINK INGREDIENT RECIPE SCHEMAS</Text>
                
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginVertical: 6 }}>
                  {inventory.length === 0 ? (
                    <Text style={styles.noPantryWarningText}>Create pantry stock first under Inventory Tab.</Text>
                  ) : (
                    inventory.map((inv) => (
                      <TouchableOpacity 
                        key={inv.id} 
                        style={[styles.miniIngredientChip, selectedInventoryId === inv.id && { backgroundColor: '#000' }]}
                        onPress={() => setSelectedInventoryId(inv.id)}
                      >
                        <Text style={[styles.miniChipText, selectedInventoryId === inv.id && { color: '#fff' }]}>
                          {inv.name.toUpperCase()} ({inv.unit.toLowerCase()})
                        </Text>
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>

                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 4 }}>
                  <TextInput 
                    placeholder="Qty used per item (e.g. 0.25)" 
                    placeholderTextColor="#777" 
                    keyboardType="numeric" 
                    style={[styles.input, { flex: 1, marginBottom: 0 }]} 
                    value={amountNeeded} 
                    onChangeText={setAmountNeeded} 
                  />
                  <TouchableOpacity style={styles.bindIngredientBtn} onPress={pushIngredientToRecipe}>
                    <Layers size={14} color="#fff" />
                    <Text style={styles.bindBtnText}>LINK</Text>
                  </TouchableOpacity>
                </View>

                {/* ACTIVE COMPILATION ITERATOR ROWS */}
                {recipeIngredients.map((item) => (
                  <View key={item.inventoryId} style={styles.activeRecipeRow}>
                    <Text style={styles.recipeRowText}>• {item.name.toUpperCase()} — {item.quantityUsed} {item.unit.toUpperCase()}</Text>
                    <TouchableOpacity onPress={() => dropIngredientFromRecipe(item.inventoryId)}>
                      <Minus size={14} color="red" strokeWidth={3} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              <Text style={styles.label}>DIETARY & FLAVOR FLAGS</Text>
              <View style={styles.toggleRowContainer}>
                <View style={styles.toggleItem}>
                  <Text style={styles.toggleLabel}>VEGAN</Text>
                  <Switch value={form.is_vegan} onValueChange={(v) => setForm({ ...form, is_vegan: v })} trackColor={{ false: "#ccc", true: COLORS.primary }} />
                </View>
                <View style={styles.toggleItem}>
                  <Text style={styles.toggleLabel}>GLUTEN FREE</Text>
                  <Switch value={form.is_gluten_free} onValueChange={(v) => setForm({ ...form, is_gluten_free: v })} trackColor={{ false: "#ccc", true: COLORS.primary }} />
                </View>
                <View style={styles.toggleItem}>
                  <Text style={styles.toggleLabel}>HOT / SPICY</Text>
                  <Switch value={form.is_hot} onValueChange={(v) => setForm({ ...form, is_hot: v })} trackColor={{ false: "#ccc", true: COLORS.primary }} />
                </View>
                <View style={styles.toggleItem}>
                  <Text style={styles.toggleLabel}>SWEET</Text>
                  <Switch value={form.is_sweet} onValueChange={(v) => setForm({ ...form, is_sweet: v })} trackColor={{ false: "#ccc", true: COLORS.primary }} />
                </View>
                <View style={styles.toggleItem}>
                  <Text style={styles.toggleLabel}>SOUR</Text>
                  <Switch value={form.is_sour} onValueChange={(v) => setForm({ ...form, is_sour: v })} trackColor={{ false: "#ccc", true: COLORS.primary }} />
                </View>
              </View>

              <Text style={styles.label}>IMAGE SELECTION </Text>
              <View style={styles.selectorGrid}>
                {Object.keys(itemImages).filter(k => k !== 'default').map((imgKey) => (
                  <TouchableOpacity key={imgKey} style={[styles.selectorChip, form.image_name === imgKey && styles.activeChip]} onPress={() => setForm({ ...form, image_name: imgKey })} >
                    <Text style={[styles.chipText, form.image_name === imgKey && styles.activeChipText]}>{imgKey.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>SAVE TO MENU</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginVertical: 10 }}>
                <Text style={styles.cancelText}>CANCEL</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  tabContainer: { flex: 1, backgroundColor: '#FDFBEB' },
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  thumbnailImage: { width: 55, height: 55, borderWidth: 2, borderColor: '#000', backgroundColor: '#fff', resizeMode: 'contain' },
  itemName: { fontWeight: '900', fontSize: 15, textTransform: 'uppercase', color: '#000' },
  itemCategoryLabel: { fontSize: 10, fontWeight: '800', color: '#666', marginTop: 1, textTransform: 'uppercase' },
  itemPriceLabel: { color: COLORS.primary, fontWeight: '900', fontSize: 13, marginTop: 3 },
  previewBadgeRow: { flexDirection: 'row', gap: 4, marginVertical: 3, alignItems: 'center' },
  previewBadgeWrapper: { padding: 3, borderWidth: 1.5, borderColor: '#000' },
  actionGroup: { flexDirection: 'row', gap: 8 },
  iconBox: { padding: 8, borderWidth: 2, borderColor: '#000', backgroundColor: '#fff' },
  fixedBtnContainer: { position: 'absolute', bottom: 75, left: 20, right: 20, backgroundColor: '#000', borderWidth: 1, borderColor: '#000' },
  fixedAddBtn: { height: 55, backgroundColor: COLORS.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#000', transform: [{ translateX: -4 }, { translateY: -4 }] },
  addBtnText: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 0.5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', maxHeight: '85%', backgroundColor: '#FDFBEB', borderWidth: 4, borderColor: '#000', padding: 20, shadowColor: '#000', shadowOffset: { width: 6, height: 6 }, shadowOpacity: 1 },
  modalTitle: { fontSize: 21, fontWeight: '900', marginBottom: 20, textAlign: 'center', letterSpacing: -0.5 },
  label: { fontSize: 10, fontWeight: '900', color: '#000', marginBottom: 6, letterSpacing: 0.5, marginTop: 5 },
  input: { borderWidth: 3, borderColor: '#000', padding: 12, marginBottom: 15, backgroundColor: '#fff', fontWeight: '800', fontSize: 14, color: '#000' },
  toggleRowContainer: { borderWidth: 3, borderColor: '#000', backgroundColor: '#fff', padding: 10, marginBottom: 15 },
  toggleItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#eee' },
  toggleLabel: { fontSize: 10, fontWeight: '900', color: '#000' },
  selectorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 15 },
  selectorChip: { paddingHorizontal: 12, paddingVertical: 6, borderWidth: 2, borderColor: '#000', backgroundColor: '#fff' },
  activeChip: { backgroundColor: '#000' },
  chipText: { fontSize: 9, fontWeight: '900', color: '#000' },
  activeChipText: { color: '#fff' },
  saveBtn: { backgroundColor: COLORS.secondary, padding: 16, alignItems: 'center', borderWidth: 3, borderColor: '#000', marginTop: 10 },
  saveBtnText: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 0.5 },
  cancelText: { textAlign: 'center', fontSize: 11, fontWeight: '900', textDecorationLine: 'underline', color: '#666', marginTop: 5 },
  emptyText: { textAlign: 'center', marginTop: 50, fontWeight: '900', color: '#ccc', letterSpacing: 0.5 },
  recipeBorderContainer: { borderWidth: 3, borderColor: '#000', padding: 12, borderStyle: 'dashed', backgroundColor: '#fff', marginBottom: 15 },
  miniIngredientChip: { paddingHorizontal: 12, paddingVertical: 6, borderWidth: 2, borderColor: '#000', backgroundColor: '#F8F8F8', marginRight: 4, marginBottom: 4 },
  miniChipText: { fontSize: 9, fontWeight: '900', color: '#000' },
  bindIngredientBtn: { backgroundColor: '#000', flexDirection: 'row', gap: 4, height: 48, paddingHorizontal: 16, alignItems: 'center', borderWidth: 1, borderColor: '#fff' },
  bindBtnText: { color: '#fff', fontWeight: '900', fontSize: 11 },
  activeRecipeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#ddd' },
  recipeRowText: { fontSize: 10, fontWeight: '800', color: '#000' },
  noPantryWarningText: { fontSize: 10, fontWeight: '900', color: 'red', marginVertical: 4 }
});
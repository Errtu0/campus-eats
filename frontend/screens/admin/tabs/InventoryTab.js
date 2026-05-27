import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, TextInput, StyleSheet, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ADMIN_URL } from '../../../src/config';
import { COLORS, GLOBAL_STYLES } from '../../../src/styles/theme';
import { 
  PlusCircle, 
  Milk, 
  Bean, 
  Pencil, 
  Trash2, 
  CupSoda, 
  Beef, 
  Package, 
  Layers 
} from 'lucide-react-native';
import CustomAlert from '../../../components/CustomAlert';

// --- TASK 3.3: INTELLIGENT ICON MAPPING HELPER UTILITY ---
const getStockIcon = (name) => {
  const text = name ? name.toLowerCase().trim() : '';
  
  if (text.includes('milk') || text.includes('cream') || text.includes('dairy')) {
    return <Milk size={20} color="#000" strokeWidth={2.5} />;
  }
  if (text.includes('bean') || text.includes('coffee') || text.includes('espresso')) {
    return <Bean size={20} color="#000" strokeWidth={2.5} />;
  }
  if (text.includes('cola') || text.includes('soda') || text.includes('drink') || text.includes('lemonade') || text.includes('juice')) {
    return <CupSoda size={20} color="#000" strokeWidth={2.5} />;
  }
  if (text.includes('burger') || text.includes('meat') || text.includes('beef') || text.includes('patty') || text.includes('patties') || text.includes('bacon')) {
    return <Beef size={20} color="#000" strokeWidth={2.5} />;
  }
  if (text.includes('cheese') || text.includes('bun') || text.includes('bread') || text.includes('fries') || text.includes('sauce')) {
    return <Layers size={20} color="#000" strokeWidth={2.5} />;
  }
  
  // Default system fallback icon container context if string doesn't match presets
  return <Package size={20} color="#000" strokeWidth={2.5} />;
};

export default function InventoryTab({ restaurantId, data, refresh }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', amount: '', unit: '', min_limit: '' });
  const HIGH_CONTRAST_PLACEHOLDER = "#777";

  // --- CUSTOM ALERT STATE ---
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', onConfirm: null });

  const showTabAlert = (title, message, onConfirm = null) => {
    setModalVisible(false); // Clear structural overlays so alert mounting layer takes priority
    setAlertConfig({ title, message, onConfirm });
    setAlertVisible(true);
  };

  const openModal = (item = null) => {
    setEditItem(item);
    setForm(item ? {
      name: item.name,
      amount: item.amount.toString(),
      unit: item.unit,
      min_limit: item.min_limit.toString()
    } : {
      name: '',
      amount: '',
      unit: '',
      min_limit: ''
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.amount || !form.unit.trim() || !form.min_limit) {
      return showTabAlert("MISSING DATA", "Please populate all fields inside the stock specification card.");
    }

    const method = editItem ? 'PATCH' : 'POST';
    const url = `${ADMIN_URL}/inventory${editItem ? '/' + editItem.id : ''}`;
    
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
          amount: parseFloat(form.amount), 
          unit: form.unit.trim().toUpperCase(),
          min_limit: parseFloat(form.min_limit), 
          restaurant_id: restaurantId 
        }),
      });

      if (response.ok) {
        setModalVisible(false);
        refresh();
        showTabAlert("SUCCESS", editItem ? "Stock item modifications committed." : "Ingredient added to central inventory list.");
      } else {
        const errorData = await response.json();
        showTabAlert("ERROR", errorData.error || "Failed to submit transaction.");
      }
    } catch (e) { 
      showTabAlert("OFFLINE", "Campus gateway cluster server unreachable."); 
    }
  };

  const confirmDelete = (id) => {
    showTabAlert("DELETE STOCK", "Remove this raw ingredient element from logs forever?", () => performDelete(id));
  };

  const performDelete = async (id) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await fetch(`${ADMIN_URL}/inventory/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setAlertVisible(false);
        refresh();
      }
    } catch (e) {
      showTabAlert("ERROR", "Failed to dispatch delete row parameters.");
    }
  };

  return (
    <View style={styles.tabContainer}>
      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => {
          setAlertVisible(false);
          // Reinstate form panel window if user simply clears a missing parameter alert block
          if (alertConfig.title !== "SUCCESS" && alertConfig.title !== "DELETE STOCK" && alertConfig.title !== "ERROR") {
            setModalVisible(true);
          }
        }}
        onConfirm={alertConfig.onConfirm}
      />

      <FlatList
        data={data}
        contentContainerStyle={{ padding: 20, paddingBottom: 110 }}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isLow = parseFloat(item.amount) <= parseFloat(item.min_limit);
          return (
            <View style={[GLOBAL_STYLES.card, isLow && styles.lowStockCard, { marginBottom: 15 }]}>
              <View style={styles.itemRow}>
                <View style={styles.infoContainer}>
                  {/* FIX TASK 3.3: CALL DYNAMIC VECTOR PARSER HOOK HOOK */}
                  <View style={styles.iconCircleWrapper}>
                    {getStockIcon(item.name)}
                  </View>
                  <Text style={styles.itemName} numberOfLines={1} ellipsizeMode="tail">
                    {item.name}
                  </Text>
                </View>
                <View style={styles.actionGroup}>
                  <TouchableOpacity style={styles.iconBox} onPress={() => openModal(item)}>
                    <Pencil size={16} color={COLORS.secondary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconBox} onPress={() => confirmDelete(item.id)}>
                    <Trash2 size={16} color="red" />
                  </TouchableOpacity>
                </View>
              </View>
              
              <Text style={[styles.stockText, isLow && { color: '#FF3B30' }]}>
                CURRENT LEVEL: {item.amount} {item.unit?.toUpperCase()}
              </Text>
              {isLow && (
                <Text style={styles.alertText}>⚠️ CRITICAL RISK LEVEL: BELOW ALERT THRESHOLD</Text>
              )}
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.emptyText}>No tracking items registered in storage files.</Text>}
      />

      {/* ANCHOR CONTROL ACTION CONTAINER BUTTON FOR FIXED POSITIONING */}
      <View style={styles.fixedBtnContainer}>
        <TouchableOpacity style={styles.fixedAddBtn} onPress={() => openModal()} activeOpacity={0.9}>
          <PlusCircle color="#fff" size={20} />
          <Text style={styles.addBtnText}>ADD NEW INGREDIENT</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>{editItem ? 'EDIT INGREDIENT' : 'ADD NEW INGREDIENT'}</Text>
              
              <Text style={styles.label}>INGREDIENT NAME</Text>
              <TextInput 
                placeholder="e.g. Fresh Whole Milk" 
                placeholderTextColor={HIGH_CONTRAST_PLACEHOLDER}
                style={styles.input} 
                value={form.name} 
                onChangeText={t => setForm({...form, name: t})} 
              />
              
              <Text style={styles.label}>CURRENT VOLUME</Text>
              <TextInput 
                placeholder="e.g. 45" 
                placeholderTextColor={HIGH_CONTRAST_PLACEHOLDER}
                keyboardType="numeric" 
                style={styles.input} 
                value={form.amount} 
                onChangeText={t => setForm({...form, amount: t})} 
              />
              
              <Text style={styles.label}>MEASUREMENT UNIT SYMBOL</Text>
              <TextInput 
                placeholder="e.g. L, KG, PCS, BOX" 
                placeholderTextColor={HIGH_CONTRAST_PLACEHOLDER}
                style={styles.input} 
                autoCapitalize="characters"
                value={form.unit} 
                onChangeText={t => setForm({...form, unit: t})} 
              />
              
              <Text style={styles.label}>CRITICAL ALERT THRESHOLD (MIN LIMIT)</Text>
              <TextInput 
                placeholder="e.g. 10 (Triggers warning if stock falls below)" 
                placeholderTextColor={HIGH_CONTRAST_PLACEHOLDER}
                keyboardType="numeric" 
                style={styles.input} 
                value={form.min_limit} 
                onChangeText={t => setForm({...form, min_limit: t})} 
              />
              
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>SAVE INVENTORY ITEM</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => setModalVisible(false)} style={{遭遇: 10, marginTop: 15}}>
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
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoContainer: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconCircleWrapper: { width: 38, height: 38, backgroundColor: '#fff', borderWidth: 2, borderColor: '#000', justifyContent: 'center', alignItems: 'center' },
  itemName: { fontWeight: '900', fontSize: 16, textTransform: 'uppercase', flexShrink: 1, color: '#000' },
  actionGroup: { flexDirection: 'row', gap: 8, marginLeft: 10 },
  iconBox: { padding: 8, borderWidth: 2, borderColor: '#000', backgroundColor: '#fff' },
  stockText: { marginTop: 8, fontWeight: '900', color: '#444', fontSize: 13, letterSpacing: -0.2 },
  lowStockCard: { borderLeftWidth: 10, borderLeftColor: '#FF3B30' },
  alertText: { fontSize: 9, fontWeight: '900', color: '#FF3B30', marginTop: 4, letterSpacing: 0.5 },
  
  fixedBtnContainer: { position: 'absolute', bottom: 75, left: 20, right: 20, backgroundColor: '#000', borderWidth: 1, borderColor: '#000' },
  fixedAddBtn: { height: 55, backgroundColor: COLORS.secondary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#000', transform: [{ translateX: -4 }, { translateY: -4 }] },
  addBtnText: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 0.5 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', maxHeight: '85%', backgroundColor: '#FDFBEB', borderWidth: 4, borderColor: '#000', padding: 20, shadowColor: '#000', shadowOffset: { width: 6, height: 6 }, shadowOpacity: 1 },
  modalTitle: { fontSize: 21, fontWeight: '900', marginBottom: 20, textAlign: 'center', letterSpacing: -0.5 },
  
  label: { fontSize: 10, fontWeight: '900', color: '#000', marginBottom: 6, letterSpacing: 0.5, marginTop: 5 },
  input: { borderWidth: 3, borderColor: '#000', padding: 12, marginBottom: 15, backgroundColor: '#fff', fontWeight: '800', fontSize: 14, color: '#000' },
  saveBtn: { backgroundColor: COLORS.primary, padding: 16, alignItems: 'center', borderWidth: 3, borderColor: '#000', marginTop: 10 },
  saveBtnText: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 0.5 },
  cancelText: { textAlign: 'center', fontSize: 11, fontWeight: '900', textDecorationLine: 'underline', color: '#666', marginTop: 5 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#ccc', fontWeight: '900', letterSpacing: 0.5 }
});
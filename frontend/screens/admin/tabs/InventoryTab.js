import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, TextInput, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ADMIN_URL } from '../../../src/config';
import { COLORS, GLOBAL_STYLES } from '../../../src/styles/theme';
import { PlusCircle, Milk, Bean, Pencil, Trash2 } from 'lucide-react-native';
import CustomAlert from '../../../components/CustomAlert';

export default function InventoryTab({ restaurantId, data, refresh }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', amount: '', unit: '', min_limit: '' });
  const PLACEHOLDER_COLOR = "#999";

  // --- CUSTOM ALERT STATE ---
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'info', onConfirm: null });

  const showTabAlert = (title, message, type = 'info', onConfirm = null) => {
    setAlertConfig({ title, message, type, onConfirm });
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
    if (!form.name || !form.amount || !form.unit || !form.min_limit) {
      return showTabAlert("Missing Info", "Please fill out all stock details.");
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
          name: form.name,
          amount: parseFloat(form.amount), 
          unit: form.unit,
          min_limit: parseFloat(form.min_limit), 
          restaurant_id: restaurantId 
        }),
      });

      if (response.ok) {
        setModalVisible(false);
        refresh();
        showTabAlert("Success", editItem ? "Inventory updated." : "Stock item created.", "success");
      } else {
        const errorData = await response.json();
        showTabAlert("Error", errorData.error || "Save failed");
      }
    } catch (e) { 
      showTabAlert("Error", "Server unreachable"); 
    }
  };

  const confirmDelete = (id) => {
    showTabAlert(
      "Delete Stock", 
      "Remove this item from inventory forever?", 
      "warning", 
      () => {
        setAlertVisible(false);
        performDelete(id);
      }
    );
  };

  const performDelete = async (id) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await fetch(`${ADMIN_URL}/inventory/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) refresh();
    } catch (e) {
      showTabAlert("Error", "Failed to delete item.");
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
        primaryColor={COLORS.primary}
        secondaryColor={COLORS.secondary}
        backgroundColor={COLORS.background}
      />

      <FlatList
        data={data}
        contentContainerStyle={{ paddingBottom: 160 }}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const isLow = item.amount <= item.min_limit;
          return (
            <View style={[GLOBAL_STYLES.card, isLow && styles.lowStockCard]}>
              <View style={styles.itemRow}>
                <View style={styles.infoContainer}>
                  {item.name.toLowerCase().includes('milk') ? 
                    <Milk size={20} color="#000" /> : 
                    <Bean size={20} color="#000" />
                  }
                  <Text 
                    style={styles.itemName} 
                    numberOfLines={1} 
                    ellipsizeMode="tail"
                  >
                    {item.name}
                  </Text>
                </View>
                <View style={styles.actionGroup}>
                  <TouchableOpacity style={styles.iconBox} onPress={() => openModal(item)}>
                    <Pencil size={18} color={COLORS.secondary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconBox} onPress={() => confirmDelete(item.id)}>
                    <Trash2 size={18} color="red" />
                  </TouchableOpacity>
                </View>
              </View>
              
              <Text style={[styles.stockText, isLow && { color: '#FF3B30' }]}>
                Stock: {item.amount} {item.unit}
              </Text>
              {isLow && <Text style={styles.alertText}>LOW STOCK WARNING</Text>}
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.emptyText}>No inventory items found.</Text>}
      />

      <TouchableOpacity 
        style={[styles.fixedAddBtn, { backgroundColor: COLORS.secondary }]} 
        onPress={() => openModal()} // <--- Make sure this matches the function name above
      >
        <PlusCircle color="#fff" size={24} />
        <Text style={styles.addBtnText}>ADD NEW STOCK</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editItem ? 'EDIT STOCK' : 'NEW STOCK'}</Text>
            
            <TextInput 
              placeholder="Ingredient Name" 
              placeholderTextColor={PLACEHOLDER_COLOR}
              style={styles.input} 
              value={form.name} 
              onChangeText={t => setForm({...form, name: t})} 
            />
            <TextInput 
              placeholder="Current Amount" 
              placeholderTextColor={PLACEHOLDER_COLOR}
              keyboardType="numeric" 
              style={styles.input} 
              value={form.amount} 
              onChangeText={t => setForm({...form, amount: t})} 
            />
            <TextInput 
              placeholder="Unit (e.g. L, KG, PCS)" 
              placeholderTextColor={PLACEHOLDER_COLOR}
              style={styles.input} 
              value={form.unit} 
              onChangeText={t => setForm({...form, unit: t})} 
            />
            <TextInput 
              placeholder="Alert Threshold (Min Limit)" 
              placeholderTextColor={PLACEHOLDER_COLOR}
              keyboardType="numeric" 
              style={styles.input} 
              value={form.min_limit} 
              onChangeText={t => setForm({...form, min_limit: t})} 
            />
            
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>SAVE TO INVENTORY</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  tabContainer: { flex: 1, backgroundColor: '#FDFBEB' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  itemName: { fontWeight: '900', fontSize: 18, textTransform: 'uppercase', flexShrink: 1 },
  actionGroup: { flexDirection: 'row', gap: 8, marginLeft: 10 },
  iconBox: { padding: 8, borderWidth: 2, borderColor: '#000', backgroundColor: '#fff' },
  stockText: { marginTop: 8, fontWeight: '900', color: '#666', fontSize: 14 },
  lowStockCard: { borderLeftWidth: 10, borderLeftColor: '#FF3B30' },
  alertText: { fontSize: 11, fontWeight: '900', color: '#FF3B30', marginTop: 4, letterSpacing: 1 },
  fixedAddBtn: {
    position: 'absolute', bottom: 100, right: 20, left: 20, height: 60,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: '#000', elevation: 5, shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1,
  },
  addBtnText: { color: '#fff', fontWeight: '900', fontSize: 16, marginLeft: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', backgroundColor: '#FDFBEB', borderWidth: 4, borderColor: '#000', padding: 25 },
  modalTitle: { fontSize: 24, fontWeight: '900', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 2, borderColor: '#000', padding: 12, marginBottom: 15, backgroundColor: '#fff', fontWeight: '700', color: '#000' },
  saveBtn: { backgroundColor: COLORS.secondary, padding: 15, alignItems: 'center', borderWidth: 3, borderColor: '#000' },
  saveBtnText: { color: '#fff', fontWeight: '900' },
  cancelText: { textAlign: 'center', marginTop: 15, fontWeight: '900', textDecorationLine: 'underline' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999', fontWeight: '700' }
});
import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, TextInput, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ADMIN_URL } from '../../../src/config';
import { COLORS, GLOBAL_STYLES } from '../../../src/styles/theme';
import { PlusCircle, Pencil, Trash2 } from 'lucide-react-native';
import CustomAlert from '../../../components/CustomAlert';

export default function MenuTab({ restaurantId, data, refresh }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', price: '' });
  const PLACEHOLDER_COLOR = "#999";

  // --- CUSTOM ALERT STATE ---
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'info', onConfirm: null });

  const showTabAlert = (title, message, type = 'info', onConfirm = null) => {
    setAlertConfig({ title, message, type, onConfirm });
    setAlertVisible(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price) {
      return showTabAlert("Missing Info", "Please provide both a name and a price.");
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
          name: form.name, 
          price: parseFloat(form.price), 
          restaurant_id: restaurantId 
        }),
      });

      if (response.ok) {
        setModalVisible(false);
        refresh();
        showTabAlert("Success", editItem ? "Item updated!" : "New item added to menu!", "success");
      } else {
        const errorData = await response.json();
        showTabAlert("Error", errorData.error || "Failed to save");
      }
    } catch (e) { 
      showTabAlert("Error", "Server unreachable"); 
    }
  };

  const confirmDelete = (id) => {
    setAlertConfig({
      title: "Delete Item",
      message: "Are you sure you want to remove this item from the menu?",
      type: "warning",
      onConfirm: () => {
        setAlertVisible(false);
        performDelete(id);
      }
    });
    setAlertVisible(true);
  };

  const performDelete = async (id) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${ADMIN_URL}/menu/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        refresh();
      } else {
        showTabAlert("Error", "Could not delete item");
      }
    } catch (e) {
      showTabAlert("Error", "Server error during deletion");
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
        renderItem={({ item }) => (
          <View style={GLOBAL_STYLES.card}>
            <View style={styles.itemRow}>
              {/* 1. Wrap the text info in a View with flex: 1 */}
              <View style={{ flex: 1, paddingRight: 10 }}> 
                <Text 
                  style={styles.itemName} 
                  numberOfLines={2} // Allows wrap if name is long, prevents cutoff
                  ellipsizeMode="tail"
                >
                  {item.name}
                </Text>
                <Text style={{ color: COLORS.secondary, fontWeight: '900', marginTop: 4 }}>
                  ${item.price.toFixed(2)}
                </Text>
              </View>

              {/* 2. Action buttons stay on the right */}
              <View style={styles.actionGroup}>
                <TouchableOpacity 
                  style={styles.iconBox} 
                  onPress={() => { 
                    setEditItem(item); 
                    setForm({ name: item.name, price: item.price.toString() }); 
                    setModalVisible(true); 
                  }}
                >
                  <Pencil size={18} color={COLORS.secondary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBox} onPress={() => confirmDelete(item.id)}>
                  <Trash2 size={18} color="red" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />

      <TouchableOpacity 
        style={styles.fixedAddBtn} 
        onPress={() => { 
          setEditItem(null); 
          setForm({ name: '', price: '' }); 
          setModalVisible(true); 
        }}
      >
        <PlusCircle color="#fff" size={24} />
        <Text style={styles.addBtnText}>ADD MENU ITEM</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editItem ? 'EDIT ITEM' : 'NEW ITEM'}</Text>
            
            <TextInput 
              placeholder="Item Name (e.g. Espresso)" 
              placeholderTextColor={PLACEHOLDER_COLOR}
              style={styles.input} 
              value={form.name} 
              onChangeText={t => setForm({ ...form, name: t })} 
            />
            
            <TextInput 
              placeholder="Price (0.00)" 
              placeholderTextColor={PLACEHOLDER_COLOR}
              keyboardType="numeric" 
              style={styles.input} 
              value={form.price} 
              onChangeText={t => setForm({ ...form, price: t })} 
            />
            
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>SAVE TO MENU</Text>
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
  itemName: { fontWeight: '900', fontSize: 18, textTransform: 'uppercase' },
  itemSub: { color: '#666', fontWeight: '700', fontSize: 12 },
  actionGroup: { flexDirection: 'row', gap: 10 },
  iconBox: { padding: 8, borderWidth: 2, borderColor: '#000', backgroundColor: '#fff' },
  fixedAddBtn: {
    position: 'absolute', bottom: 100, right: 20, left: 20,
    backgroundColor: COLORS.primary, height: 60, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#000',
    elevation: 5, shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1,
  },
  addBtnText: { color: '#fff', fontWeight: '900', fontSize: 16, marginLeft: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', backgroundColor: '#FDFBEB', borderWidth: 4, borderColor: '#000', padding: 20 },
  modalTitle: { fontSize: 24, fontWeight: '900', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 2, borderColor: '#000', padding: 12, marginBottom: 15, backgroundColor: '#fff', fontWeight: '700', color: '#000' },
  saveBtn: { backgroundColor: COLORS.secondary, padding: 15, alignItems: 'center', borderWidth: 3, borderColor: '#000' },
  saveBtnText: { color: '#fff', fontWeight: '900' },
  cancelText: { textAlign: 'center', marginTop: 15, fontWeight: '900', textDecorationLine: 'underline' }
});
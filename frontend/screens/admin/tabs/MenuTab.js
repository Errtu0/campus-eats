import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput, StyleSheet } from 'react-native';
import { ADMIN_URL } from '../../../src/config';
import { COLORS, GLOBAL_STYLES } from '../../../src/styles/theme';
import { PlusCircle, Pencil, Trash2 } from 'lucide-react-native';

export default function MenuTab({ restaurantId }) {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', price: '' });

  useEffect(() => { fetchMenu(); }, [restaurantId]);

  const fetchMenu = async () => {
    try {
      const res = await fetch(`${ADMIN_URL}/dashboard-data?restaurantId=${restaurantId}`);
      const json = await res.json();
      setMenu(json.menu || []);
    } finally { setLoading(false); }
  };

  const handleSave = async () => {
    const method = editItem ? 'PATCH' : 'POST';
    const url = editItem ? `${ADMIN_URL}/menu/${editItem.id}` : `${ADMIN_URL}/menu`;
    try {
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, price: parseFloat(form.price), restaurant_id: restaurantId }),
      });
      setModalVisible(false);
      fetchMenu();
    } catch (e) { Alert.alert("Error", "Failed to save"); }
  };

  const handleDelete = (id) => {
    Alert.alert("Delete Item", "Remove this from menu?", [
      { text: "Cancel" },
      { text: "Delete", style: 'destructive', onPress: async () => {
          await fetch(`${ADMIN_URL}/menu/${id}`, { method: 'DELETE' });
          fetchMenu();
      }}
    ]);
  };

  return (
    <View style={styles.tabContainer}>
      <FlatList
        data={menu}
        contentContainerStyle={{ paddingBottom: 100 }}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={GLOBAL_STYLES.card}>
            <View style={styles.itemRow}>
              <View>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={{ color: COLORS.secondary, fontWeight: '900' }}>${item.price.toFixed(2)}</Text>
              </View>
              <View style={styles.actionGroup}>
                <TouchableOpacity style={styles.iconBox} onPress={() => { setEditItem(item); setForm({name: item.name, price: item.price.toString()}); setModalVisible(true); }}><Pencil size={18} color={COLORS.secondary} /></TouchableOpacity>
                <TouchableOpacity style={styles.iconBox} onPress={() => handleDelete(item.id)}><Trash2 size={18} color="red" /></TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />

      <TouchableOpacity style={styles.fixedAddBtn} onPress={() => { setEditItem(null); setForm({name:'', price:''}); setModalVisible(true); }}>
        <PlusCircle color="#fff" size={24} />
        <Text style={styles.addBtnText}>ADD ITEM</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>MENU ITEM</Text>
            <TextInput placeholder="Item Name" style={styles.input} value={form.name} onChangeText={t => setForm({...form, name: t})} />
            <TextInput placeholder="Price" keyboardType="numeric" style={styles.input} value={form.price} onChangeText={t => setForm({...form, price: t})} />
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}><Text style={styles.saveBtnText}>SAVE</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  tabContainer: { flex: 1, backgroundColor: '#FDFBEB' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { fontWeight: '900', fontSize: 18 },
  itemSub: { color: '#666', fontWeight: '700' },
  actionGroup: { flexDirection: 'row', gap: 10 },
  iconBox: { padding: 8, borderWidth: 2, borderColor: '#000', backgroundColor: '#fff' },
  fixedAddBtn: {
    position: 'absolute',
    bottom: 100, // Just above the 90px Nav Bar
    right: 20,
    left: 20,
    backgroundColor: COLORS.primary,
    height: 60,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#000',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
  },
  addBtnText: { color: '#fff', fontWeight: '900', fontSize: 16, marginLeft: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', backgroundColor: '#FDFBEB', borderWidth: 4, borderColor: '#000', padding: 20 },
  modalTitle: { fontSize: 24, fontWeight: '900', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 2, borderColor: '#000', padding: 12, marginBottom: 15, backgroundColor: '#fff', fontWeight: '700' },
  saveBtn: { backgroundColor: COLORS.secondary, padding: 15, alignItems: 'center', borderWidth: 3, borderColor: '#000' },
  saveBtnText: { color: '#fff', fontWeight: '900' },
  cancelText: { textAlign: 'center', marginTop: 15, fontWeight: '900', textDecorationLine: 'underline' }
});
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Modal, TextInput, StyleSheet, Alert } from 'react-native';
import { ADMIN_URL } from '../../../src/config';
import { COLORS, GLOBAL_STYLES } from '../../../src/styles/theme';
import { PlusCircle, Package, Milk, Bean, AlertTriangle, Pencil } from 'lucide-react-native';

export default function InventoryTab({ restaurantId }) {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', amount: '', unit: '', min_limit: '' });

  useEffect(() => { fetchInv(); }, [restaurantId]);

  const fetchInv = async () => {
    try {
      const res = await fetch(`${ADMIN_URL}/dashboard-data?restaurantId=${restaurantId}`);
      const json = await res.json();
      setInventory(json.inventory || []);
    } finally { setLoading(false); }
  };

  const handleSave = async () => {
    const method = editItem ? 'PATCH' : 'POST';
    try {
      await fetch(`${ADMIN_URL}/inventory${editItem ? '/' + editItem.id : ''}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount), min_limit: parseFloat(form.min_limit), restaurant_id: restaurantId }),
      });
      setModalVisible(false);
      fetchInv();
    } catch (e) { Alert.alert("Error", "Failed"); }
  };

  return (
    <View style={styles.tabContainer}>
      <FlatList
        data={inventory}
        contentContainerStyle={{ paddingBottom: 100 }}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const isLow = item.amount <= item.min_limit;
          return (
            <View style={[GLOBAL_STYLES.card, isLow && { borderLeftWidth: 10, borderLeftColor: '#FF3B30' }]}>
              <View style={styles.itemRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  {item.name.toLowerCase().includes('milk') ? <Milk size={20} color="#000" /> : <Bean size={20} color="#000" />}
                  <Text style={styles.itemName}>{item.name}</Text>
                </View>
                <TouchableOpacity onPress={() => { setEditItem(item); setForm({name: item.name, amount: item.amount.toString(), unit: item.unit, min_limit: item.min_limit.toString()}); setModalVisible(true); }}>
                  <Pencil size={18} color={COLORS.secondary} />
                </TouchableOpacity>
              </View>
              <Text style={{ marginTop: 5, fontWeight: '700', color: isLow ? '#FF3B30' : '#666' }}>
                Stock: {item.amount} {item.unit}
              </Text>
            </View>
          );
        }}
      />

      <TouchableOpacity style={[styles.fixedAddBtn, {backgroundColor: COLORS.secondary}]} onPress={() => { setEditItem(null); setForm({name:'', amount:'', unit:'', min_limit:''}); setModalVisible(true); }}>
        <PlusCircle color="#fff" size={24} />
        <Text style={styles.addBtnText}>ADD STOCK</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>INVENTORY</Text>
            <TextInput placeholder="Ingredient Name" style={styles.input} value={form.name} onChangeText={t => setForm({...form, name: t})} />
            <TextInput placeholder="Amount" keyboardType="numeric" style={styles.input} value={form.amount} onChangeText={t => setForm({...form, amount: t})} />
            <TextInput placeholder="Unit (L, KG)" style={styles.input} value={form.unit} onChangeText={t => setForm({...form, unit: t})} />
            <TextInput placeholder="Min Limit" keyboardType="numeric" style={styles.input} value={form.min_limit} onChangeText={t => setForm({...form, min_limit: t})} />
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
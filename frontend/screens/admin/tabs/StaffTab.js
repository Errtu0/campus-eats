import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator, StyleSheet, Modal, TextInput, ScrollView } from 'react-native';
import { ADMIN_URL } from '../../../src/config';
import { COLORS, GLOBAL_STYLES } from '../../../src/styles/theme';
import { PlusCircle, Pencil, Trash2, Users } from 'lucide-react-native';

export default function StaffTab({ restaurantId }) {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ username: '', phone: '', password: '' });

  useEffect(() => { fetchStaff(); }, [restaurantId]);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${ADMIN_URL}/dashboard-data?restaurantId=${restaurantId}`);
      const data = await res.json();
      setStaff((data.staff || []).filter(s => s.restaurant_id === restaurantId));
    } catch (e) { Alert.alert("Error", "Could not load staff."); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    const method = editItem ? 'PATCH' : 'POST';
    const url = editItem ? `${ADMIN_URL}/staff/${editItem.id}` : `${ADMIN_URL}/staff`;
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, restaurant_id: restaurantId }),
      });
      if (res.ok) {
        setModalVisible(false);
        fetchStaff();
      }
    } catch (e) { Alert.alert("Error", "Save failed"); }
  };

  const openModal = (item = null) => {
    setEditItem(item);
    setForm(item ? { username: item.username, phone: item.phone_number, password: '' } : { username: '', phone: '', password: '' });
    setModalVisible(true);
  };

  const handleDelete = (id) => {
    Alert.alert("Delete Staff", "Are you sure?", [
      { text: "Cancel" },
      { text: "Delete", style: 'destructive', onPress: async () => {
          await fetch(`${ADMIN_URL}/staff/${id}`, { method: 'DELETE' });
          fetchStaff();
      }}
    ]);
  };

  return (
    <View style={styles.tabContainer}>
      {loading ? <ActivityIndicator color={COLORS.primary} style={{marginTop: 50}} /> : (
        <FlatList
          data={staff}
          contentContainerStyle={{ paddingBottom: 100 }}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={GLOBAL_STYLES.card}>
              <View style={styles.itemRow}>
                <View>
                  <Text style={styles.itemName}>{item.username}</Text>
                  <Text style={styles.itemSub}>{item.phone_number || 'No Phone'}</Text>
                </View>
                <View style={styles.actionGroup}>
                  <TouchableOpacity style={styles.iconBox} onPress={() => openModal(item)}><Pencil size={18} color={COLORS.secondary} /></TouchableOpacity>
                  <TouchableOpacity style={styles.iconBox} onPress={() => handleDelete(item.id)}><Trash2 size={18} color="red" /></TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        />
      )}

      {/* FIXED ADD BUTTON */}
      <TouchableOpacity style={styles.fixedAddBtn} onPress={() => openModal()}>
        <PlusCircle color="#fff" size={24} />
        <Text style={styles.addBtnText}>ADD STAFF</Text>
      </TouchableOpacity>

      {/* MODAL */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editItem ? 'EDIT STAFF' : 'ADD STAFF'}</Text>
            <TextInput placeholder="Username" style={styles.input} value={form.username} onChangeText={t => setForm({...form, username: t})} />
            <TextInput placeholder="Phone Number" style={styles.input} value={form.phone} onChangeText={t => setForm({...form, phone: t})} />
            {!editItem && <TextInput placeholder="Password" style={styles.input} secureTextEntry value={form.password} onChangeText={t => setForm({...form, password: t})} />}
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
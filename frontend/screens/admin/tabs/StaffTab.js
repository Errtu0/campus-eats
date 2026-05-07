import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ADMIN_URL } from '../../../src/config';
import { COLORS, GLOBAL_STYLES } from '../../../src/styles/theme';
import { PlusCircle, Pencil, Trash2 } from 'lucide-react-native';
import CustomAlert from '../../../components/CustomAlert'; 

export default function StaffTab({ restaurantId, data, refresh }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem] = useState(null);
  
  // Added 'email' to the form state
  const [form, setForm] = useState({ username: '', email: '', phone: '', password: '' });
  const PLACEHOLDER_COLOR = "#999";

  // --- CUSTOM ALERT STATE ---
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'info', onConfirm: null });

  const showTabAlert = (title, message, type = 'info', onConfirm = null) => {
    setAlertConfig({ title, message, type, onConfirm });
    setAlertVisible(true);
  };

  const handleSave = async () => {
    const method = editItem ? 'PATCH' : 'POST';
    const url = editItem ? `${ADMIN_URL}/staff/${editItem.id}` : `${ADMIN_URL}/staff`;
    
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          username: form.username,
          email: form.email, // Sent to backend
          phone_number: form.phone,
          password: form.password, 
          restaurant_id: restaurantId 
        }),
      });

      const resData = await res.json();

      if (res.ok) {
        setModalVisible(false);
        refresh();
        showTabAlert("Success", editItem ? "Staff updated!" : "Staff member added!", "success");
      } else {
        showTabAlert("Error", resData.error || "Save failed");
      }
    } catch (e) { 
      showTabAlert("Error", "Server unreachable"); 
    }
  };

  const openModal = (item = null) => {
    setEditItem(item);
    setForm(item ? 
      { username: item.username, email: item.email || '', phone: item.phone_number, password: '' } : 
      { username: '', email: '', phone: '', password: '' }
    );
    setModalVisible(true);
  };

  const confirmDelete = (id) => {
      // Explicitly set all keys to ensure the state update is "fresh"
      setAlertConfig({
        title: "Delete Staff",
        message: "Are you sure you want to remove this staff member?",
        type: "warning",
        onConfirm: async () => {
          setAlertVisible(false); 
          await performDelete(id);
        }
      });
      // Use a slight timeout if the modal is flickering, 
      // but usually setting true here is enough.
      setAlertVisible(true);
    };

  const performDelete = async (id) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await fetch(`${ADMIN_URL}/staff/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        refresh();
      } else {
        showTabAlert("Error", "Could not remove staff member.");
      }
    } catch (e) {
      showTabAlert("Error", "Server error during deletion.");
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
              <View>
                <Text style={styles.itemName}>{item.username}</Text>
                <Text style={styles.itemSub}>{item.email || 'No Email'}</Text>
                <Text style={[styles.itemSub, { fontSize: 10 }]}>{item.phone_number || 'No Phone'}</Text>
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
          </View>
        )}
      />

      <TouchableOpacity style={styles.fixedAddBtn} onPress={() => openModal()}>
        <PlusCircle color="#fff" size={24} />
        <Text style={styles.addBtnText}>ADD STAFF</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editItem ? 'EDIT STAFF' : 'ADD STAFF'}</Text>
            
            <TextInput 
              placeholder="Username" 
              placeholderTextColor={PLACEHOLDER_COLOR}
              style={styles.input} 
              value={form.username} 
              onChangeText={t => setForm({...form, username: t})} 
            />
            
            {/* Added Email Input Field */}
            <TextInput 
              placeholder="Email Address" 
              placeholderTextColor={PLACEHOLDER_COLOR}
              style={styles.input} 
              keyboardType="email-address"
              autoCapitalize="none"
              value={form.email} 
              onChangeText={t => setForm({...form, email: t})} 
            />
            
            <TextInput 
              placeholder="Phone Number" 
              placeholderTextColor={PLACEHOLDER_COLOR}
              style={styles.input} 
              value={form.phone} 
              onChangeText={t => setForm({...form, phone: t})} 
            />
            
            {!editItem && (
              <TextInput 
                placeholder="Password" 
                placeholderTextColor={PLACEHOLDER_COLOR}
                style={styles.input} 
                secureTextEntry 
                value={form.password} 
                onChangeText={t => setForm({...form, password: t})} 
              />
            )}
            
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>SAVE STAFF</Text>
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
  input: { borderWidth: 2, borderColor: '#000', padding: 12, marginBottom: 15, backgroundColor: '#fff', fontWeight: '700' },
  saveBtn: { backgroundColor: COLORS.secondary, padding: 15, alignItems: 'center', borderWidth: 3, borderColor: '#000' },
  saveBtnText: { color: '#fff', fontWeight: '900' },
  cancelText: { textAlign: 'center', marginTop: 15, fontWeight: '900', textDecorationLine: 'underline' }
});
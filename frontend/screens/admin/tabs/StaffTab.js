import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, TextInput, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ADMIN_URL } from '../../../src/config';
import { COLORS, GLOBAL_STYLES } from '../../../src/styles/theme';
import { PlusCircle, Pencil, Trash2, Users } from 'lucide-react-native';
import CustomAlert from '../../../components/CustomAlert'; 

export default function StaffTab({ restaurantId, data, refresh }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem] = useState(null);
  
  const [form, setForm] = useState({ username: '', email: '', phone: '', password: '' });
  const HIGH_CONTRAST_PLACEHOLDER = "#777";

  // --- CUSTOM ALERT STATE ---
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', onConfirm: null });

  // RE-ROUTED ALIGNMENT UTILITY FOR VISUAL CLARITY
  const showTabAlert = (title, message, onConfirm = null) => {
    setModalVisible(false); // FIX 1: Safely drop form panels so alerts can mount on top layer visible space
    setAlertConfig({ title, message, onConfirm });
    setAlertVisible(true);
  };

  const handleSave = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!form.username.trim() || !form.email.trim() || !form.phone.trim()) {
      return showTabAlert("MISSING FIELDS", "Please populate username, email, and mobile data slots.");
    }

    if (!emailRegex.test(form.email.trim())) {
      return showTabAlert("INVALID EMAIL", "Please check your email formatting structure.");
    }

    if (!editItem && (!form.password || form.password.length < 8)) {
      return showTabAlert("WEAK PASSWORD", "Security policy verification failed. Password must contain at least 8 characters.");
    }

    if (editItem && form.password && form.password.length < 8) {
      return showTabAlert("WEAK PASSWORD", "Security policy verification failed. Updated password must contain at least 8 characters.");
    }

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
          username: form.username.trim(),
          email: form.email.trim().toLowerCase(),
          phone_number: form.phone.trim(),
          password: form.password ? form.password : undefined, 
          restaurant_id: restaurantId 
        }),
      });

      const resData = await res.json();

      if (res.ok) {
        setModalVisible(false);
        refresh();
        showTabAlert("SUCCESS", editItem ? "Staff credentials updated!" : "New staff member deployed!");
      } else {
        showTabAlert("REGISTRATION DENIED", resData.error || "Failed to process staff credentials.");
      }
    } catch (e) { 
      showTabAlert("OFFLINE", "System network bridge timed out."); 
    }
  };

  const openModal = (item = null) => {
    setEditItem(item);
    setForm(item ? 
      { username: item.username, email: item.email || '', phone: item.phone_number || '', password: '' } : 
      { username: '', email: '', phone: '', password: '' }
    );
    setModalVisible(true);
  };

  const confirmDelete = (id) => {
    showTabAlert("REMOVE STAFF", "This will delete this staff member. Proceed?", () => performDelete(id));
  };

  const performDelete = async (id) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await fetch(`${ADMIN_URL}/staff/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setAlertVisible(false);
        refresh();
      } else {
        showTabAlert("ERROR", "Could not remove staff account from system directory.");
      }
    } catch (e) {
      showTabAlert("ERROR", "Server communications aborted execution paths.");
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
          // FIX 2: If it was a validation error (not success/delete actions), bring form back into view
          if (alertConfig.title !== "SUCCESS" && alertConfig.title !== "REMOVE STAFF" && alertConfig.title !== "ERROR") {
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
        renderItem={({ item }) => (
          <View style={[GLOBAL_STYLES.card, { marginBottom: 15 }]}>
            <View style={styles.itemRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                <View style={styles.iconCircle}>
                  <Users size={20} color={COLORS.secondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName} numberOfLines={1}>{item.username}</Text>
                  <Text style={styles.itemSub} numberOfLines={1}>{item.email || 'NO EMAIL SAVED'}</Text>
                  <Text style={[styles.itemSub, { fontSize: 10, marginTop: 1 }]}>{item.phone_number || 'NO MOBILE VALUE'}</Text>
                </View>
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
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No registered staff members found at this branch.</Text>}
      />

      <View style={styles.fixedBtnContainer}>
        <TouchableOpacity style={styles.fixedAddBtn} onPress={() => openModal()} activeOpacity={0.9}>
          <PlusCircle color="#fff" size={20} />
          <Text style={styles.addBtnText}>ADD NEW STAFF</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>{editItem ? 'EDIT STAFF MEMBER' : 'ADD NEW STAFF'}</Text>
              
              <Text style={styles.label}>STAFF USERNAME</Text>
              <TextInput 
                placeholder="Username (e.g. janesmith)" 
                placeholderTextColor={HIGH_CONTRAST_PLACEHOLDER}
                style={styles.input} 
                autoCapitalize="none"
                value={form.username} 
                onChangeText={t => setForm({...form, username: t})} 
              />
              
              <Text style={styles.label}>EMAIL ADDRESS</Text>
              <TextInput 
                placeholder="Email (e.g. jane@campuseats.edu)" 
                placeholderTextColor={HIGH_CONTRAST_PLACEHOLDER}
                style={styles.input} 
                keyboardType="email-address"
                autoCapitalize="none"
                value={form.email} 
                onChangeText={t => setForm({...form, email: t})} 
              />
              
              <Text style={styles.label}>PHONE NUMBER</Text>
              <TextInput 
                placeholder="Mobile (e.g. +90533...)" 
                placeholderTextColor={HIGH_CONTRAST_PLACEHOLDER}
                style={styles.input} 
                keyboardType="phone-pad"
                value={form.phone} 
                onChangeText={t => setForm({...form, phone: t})} 
              />
              
              <Text style={styles.label}>
                {editItem ? 'PASSWORD (LEAVE BLANK TO KEEP UNCHANGED)' : 'PASSWORD'}
              </Text>
              <TextInput 
                placeholder={editItem ? "•••••••• (Optional update)" : "Minimum 8 characters"} 
                placeholderTextColor={HIGH_CONTRAST_PLACEHOLDER}
                style={styles.input} 
                secureTextEntry 
                autoCapitalize="none"
                value={form.password} 
                onChangeText={t => setForm({...form, password: t})} 
              />
              
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>SAVE STAFF</Text>
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
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconCircle: { width: 44, height: 44, backgroundColor: '#fff', borderWidth: 3, borderColor: '#000', justifyContent: 'center', alignItems: 'center' },
  itemName: { fontWeight: '900', fontSize: 16, textTransform: 'uppercase', color: '#000' },
  itemSub: { color: '#555', fontWeight: '800', fontSize: 11, marginTop: 1 },
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
  saveBtn: { backgroundColor: COLORS.secondary, padding: 16, alignItems: 'center', borderWidth: 3, borderColor: '#000', marginTop: 10 },
  saveBtnText: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 0.5 },
  cancelText: { textAlign: 'center', fontSize: 11, fontWeight: '900', textDecorationLine: 'underline', color: '#666', marginTop: 5 },
  emptyText: { textAlign: 'center', marginTop: 50, fontWeight: '900', color: '#ccc', letterSpacing: 0.5 }
});
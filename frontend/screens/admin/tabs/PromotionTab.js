import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, TextInput, StyleSheet, Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ADMIN_URL } from '../../../src/config';
import { COLORS, GLOBAL_STYLES } from '../../../src/styles/theme';
import { PlusCircle, Ticket, Trash2 } from 'lucide-react-native';
import CustomAlert from '../../../components/CustomAlert';

export default function PromotionTab({ restaurantId, data, refresh }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ code: '', discount_value: '' });

  // --- CUSTOM ALERT STATE ---
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ 
    title: '', 
    message: '', 
    type: 'info', 
    onConfirm: null 
  });

  const showTabAlert = (title, message, type = 'info', onConfirm = null) => {
    setAlertConfig({ title, message, type, onConfirm });
    setAlertVisible(true);
  };

  const handleSave = async () => {
    if (!form.code || !form.discount_value) {
      return showTabAlert("Missing Info", "Please provide both a code and a discount percentage.");
    }
    
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await fetch(`${ADMIN_URL}/coupons`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          code: form.code.trim().toUpperCase(), 
          discount_value: parseFloat(form.discount_value), 
          restaurant_id: restaurantId 
        }),
      });

      const responseData = await res.json();

      if (res.ok) {
        setModalVisible(false);
        setForm({ code: '', discount_value: '' });
        refresh();
        showTabAlert("Success", "Promo code is now active!", "success");
      } else {
        showTabAlert("Error", responseData.error || "Failed to create coupon");
      }
    } catch (e) { 
      showTabAlert("Error", "Server unreachable"); 
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await fetch(`${ADMIN_URL}/coupons/${id}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_active: !currentStatus }),
      });
      if (res.ok) refresh();
    } catch (e) { 
      showTabAlert("Error", "Could not update status");
    }
  };

const confirmDelete = (id) => {
    setAlertConfig({
      title: "Delete Promo",
      message: "This will remove the coupon forever. Are you sure?",
      type: "warning",
      onConfirm: () => {
        setAlertVisible(false); // Close alert
        performDelete(id);      // Run the actual delete fetch
      }
    });
    setAlertVisible(true);
  };

  const performDelete = async (id) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await fetch(`${ADMIN_URL}/coupons/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        refresh(); // This tells AdminDashboard to fetch fresh data
      } else {
        const errData = await res.json();
        showTabAlert("Error", errData.error || "Failed to delete");
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
          <View style={[GLOBAL_STYLES.card, !item.is_active && { opacity: 0.6 }]}>
            <View style={styles.itemRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={[styles.iconCircle, !item.is_active && { borderColor: '#ccc' }]}>
                  <Ticket size={24} color={item.is_active ? COLORS.secondary : "#ccc"} />
                </View>
                <View>
                  <Text style={[styles.itemName, !item.is_active && { color: '#666' }]}>{item.code}</Text>
                  <Text style={[styles.discountText, !item.is_active && { color: '#999' }]}>{item.discount_value}% OFF</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                <Switch 
                  value={item.is_active} 
                  onValueChange={() => toggleStatus(item.id, item.is_active)}
                  trackColor={{ false: "#ccc", true: COLORS.primary }}
                  thumbColor={item.is_active ? "#fff" : "#f4f3f4"}
                />
                <TouchableOpacity onPress={() => confirmDelete(item.id)}>
                  <Trash2 size={20} color={item.is_active ? "red" : "#ccc"} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No active promotions yet.</Text>
        }
      />

      <TouchableOpacity style={styles.fixedAddBtn} onPress={() => setModalVisible(true)}>
        <PlusCircle color="#fff" size={24} />
        <Text style={styles.addBtnText}>NEW PROMO CODE</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>CREATE PROMO</Text>
            <TextInput 
              placeholder="CODE (e.g. CAMPUS20)" 
              style={styles.input} 
              autoCapitalize="characters"
              value={form.code}
              onChangeText={t => setForm({...form, code: t.toUpperCase()})} 
            />
            <TextInput 
              placeholder="Discount % (e.g. 15)" 
              keyboardType="numeric" 
              style={styles.input} 
              value={form.discount_value}
              onChangeText={t => setForm({...form, discount_value: t})} 
            />
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>ACTIVATE PROMO</Text>
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
  iconCircle: { width: 45, height: 45, backgroundColor: '#fff', borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#000' },
  itemName: { fontWeight: '900', fontSize: 18, textTransform: 'uppercase' },
  discountText: { fontWeight: '800', color: COLORS.primary, fontSize: 14 },
  fixedAddBtn: {
    position: 'absolute', bottom: 100, left: 20, right: 20,
    backgroundColor: COLORS.secondary, height: 60, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', gap: 10, borderWidth: 3,
    borderColor: '#000',
    shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, elevation: 5
  },
  addBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', backgroundColor: '#FDFBEB', borderWidth: 4, borderColor: '#000', padding: 25 },
  modalTitle: { fontSize: 24, fontWeight: '900', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 2, borderColor: '#000', padding: 12, marginBottom: 15, backgroundColor: '#fff', fontWeight: '700' },
  saveBtn: { backgroundColor: COLORS.primary, padding: 15, alignItems: 'center', borderWidth: 3, borderColor: '#000' },
  saveBtnText: { color: '#fff', fontWeight: '900' },
  cancelText: { textAlign: 'center', marginTop: 15, fontWeight: '900', textDecorationLine: 'underline' },
  emptyText: { textAlign: 'center', marginTop: 50, fontWeight: '700', color: '#999' }
});
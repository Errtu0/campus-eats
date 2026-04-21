import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Modal, TextInput, StyleSheet, Alert, Switch } from 'react-native';
import { ADMIN_URL } from '../../../src/config';
import { COLORS, GLOBAL_STYLES } from '../../../src/styles/theme';
import { PlusCircle, Ticket, Trash2, Percent } from 'lucide-react-native';

export default function PromotionTab({ restaurantId }) {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ code: '', discount_value: '' });

  useEffect(() => { fetchCoupons(); }, [restaurantId]);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${ADMIN_URL}/dashboard-data?restaurantId=${restaurantId}`);
      const json = await res.json();
      setCoupons(json.coupons || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.code || !form.discount_value) return Alert.alert("Error", "Fill all fields");
    
    try {
      const res = await fetch(`${ADMIN_URL}/coupons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: form.code.trim(), 
          discount_value: parseFloat(form.discount_value), 
          restaurant_id: restaurantId 
        }),
      });

      const data = await res.json(); // Get the response body

      if (res.ok) {
        setModalVisible(false);
        setForm({ code: '', discount_value: '' });
        fetchCoupons();
      } else {
        // If the server says no, tell the user why
        Alert.alert("Error", data.error || "Failed to create coupon");
      }
    } catch (e) { 
      console.error(e);
      Alert.alert("Error", "Server unreachable"); 
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      await fetch(`${ADMIN_URL}/coupons/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus }),
      });
      fetchCoupons();
    } catch (e) { console.error(e); }
  };

  const handleDelete = (id) => {
    Alert.alert("Delete Promo", "This will remove the coupon forever.", [
      { text: "Cancel" },
      { text: "Delete", style: 'destructive', onPress: async () => {
          await fetch(`${ADMIN_URL}/coupons/${id}`, { method: 'DELETE' });
          fetchCoupons();
      }}
    ]);
  };

  return (
    <View style={styles.tabContainer}>
      {loading ? <ActivityIndicator color={COLORS.primary} style={{marginTop: 50}} /> : (
        <FlatList
          data={coupons}
          contentContainerStyle={{ paddingBottom: 120 }}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={[GLOBAL_STYLES.card, !item.is_active && { opacity: 0.5 }]}>
              <View style={styles.itemRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={styles.iconCircle}>
                    <Ticket size={24} color={COLORS.secondary} />
                  </View>
                  <View>
                    <Text style={styles.itemName}>{item.code}</Text>
                    <Text style={styles.discountText}>{item.discount_value}% OFF</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                  <Switch 
                    value={item.is_active} 
                    onValueChange={() => toggleStatus(item.id, item.is_active)}
                    trackColor={{ false: "#ccc", true: COLORS.primary }}
                    thumbColor={item.is_active ? "#fff" : "#f4f3f4"}
                  />
                  <TouchableOpacity onPress={() => handleDelete(item.id)}>
                    <Trash2 size={20} color="red" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No active promotions yet.</Text>
          }
        />
      )}

      {/* FIXED ADD BUTTON (Above Nav) */}
      <TouchableOpacity style={styles.fixedAddBtn} onPress={() => setModalVisible(true)}>
        <PlusCircle color="#fff" size={24} />
        <Text style={styles.addBtnText}>NEW PROMO CODE</Text>
      </TouchableOpacity>

      {/* MODAL */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>CREATE PROMO</Text>
            <TextInput 
              placeholder="CODE (e.g. CAMPUS20)" 
              style={styles.input} 
              autoCapitalize="characters"
              onChangeText={t => setForm({...form, code: t.toUpperCase()})} 
            />
            <TextInput 
              placeholder="Discount % (e.g. 15)" 
              keyboardType="numeric" 
              style={styles.input} 
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
  iconCircle: { width: 45, height: 45, backgroundColor: '#eee', borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  itemName: { fontWeight: '900', fontSize: 18, textTransform: 'uppercase' },
  discountText: { fontWeight: '800', color: COLORS.primary, fontSize: 14 },
  fixedAddBtn: {
    position: 'absolute', bottom: 100, left: 20, right: 20,
    backgroundColor: COLORS.secondary, height: 60, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', gap: 10, borderWidth: 3,
    shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, elevation: 5
  },
  addBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', backgroundColor: '#FDFBEB', borderWidth: 4, padding: 25 },
  modalTitle: { fontSize: 24, fontWeight: '900', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 2, borderColor: '#000', padding: 12, marginBottom: 15, backgroundColor: '#fff', fontWeight: '700' },
  saveBtn: { backgroundColor: COLORS.primary, padding: 15, alignItems: 'center', borderWidth: 3 },
  saveBtnText: { color: '#fff', fontWeight: '900' },
  cancelText: { textAlign: 'center', marginTop: 15, fontWeight: '900', textDecorationLine: 'underline' },
  emptyText: { textAlign: 'center', marginTop: 50, fontWeight: '700', color: '#999' }
});
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ScrollView, Modal, Alert, ActivityIndicator } from 'react-native';
import { ADMIN_URL } from '../src/config';

export default function AdminDashboard({ navigation }) {
  const [view, setView] = useState('MENU');
  const [data, setData] = useState({ menu: [], staff: [], history: [], activeSessions: [] });
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  
  // State to track if we are Editing or Adding
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  // Unified Form States
  const [menuForm, setMenuForm] = useState({ name: '', price: '', stock: '' });
  const [staffForm, setStaffForm] = useState({ username: '', password: '', phone: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${ADMIN_URL}/dashboard-data`);
      const json = await res.json();
      setData(json);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // Open Modal for Adding
  const openAddModal = () => {
    setIsEditMode(false);
    setSelectedId(null);
    setMenuForm({ name: '', price: '', stock: '' });
    setStaffForm({ username: '', password: '', phone: '' });
    setModalVisible(true);
  };

  // Open Modal for Editing
  const openEditModal = (item, type) => {
    setIsEditMode(true);
    setSelectedId(item.id);
    if (type === 'MENU') {
      setMenuForm({ 
        name: item.name, 
        price: item.price.toString(), 
        stock: item.stock_quantity.toString() 
      });
    } else {
      setStaffForm({ 
        username: item.username, 
        password: '', // Leave password empty for security during edit
        phone: item.phone_number 
      });
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    const isMenu = view === 'MENU';
    const endpoint = isMenu ? 'menu' : 'staff';
    const method = isEditMode ? 'PATCH' : 'POST';
    const url = isEditMode ? `${ADMIN_URL}/${endpoint}/${selectedId}` : `${ADMIN_URL}/${endpoint}`;

    const body = isMenu 
      ? { 
          name: menuForm.name, 
          price: parseFloat(menuForm.price), 
          stock_quantity: parseInt(menuForm.stock),
          restaurant_id: 1 
        }
      : { 
          username: staffForm.username, 
          phone_number: staffForm.phone,
          ...(staffForm.password ? { password_hash: staffForm.password } : {}) 
        };

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setModalVisible(false);
        fetchData();
      } else {
        const err = await response.json();
        Alert.alert("Error", err.error || "Failed to save changes");
      }
    } catch (e) {
      Alert.alert("Error", "Server connection failed");
    }
  };

  const handleDelete = (type, id) => {
    Alert.alert("Confirm Delete", `Are you sure you want to remove this ${type}?`, [
      { text: "Cancel" },
      { text: "Delete", style: 'destructive', onPress: async () => {
        await fetch(`${ADMIN_URL}/${type === 'MENU' ? 'menu' : 'staff'}/${id}`, { method: 'DELETE' });
        fetchData();
      }}
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Panel</Text>
        <TouchableOpacity onPress={() => navigation.replace('Welcome')}><Text style={styles.logout}>Logout</Text></TouchableOpacity>
      </View>

      <View style={styles.navScroll}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['MENU', 'STAFF', 'HISTORY', 'SESSIONS'].map(v => (
            <TouchableOpacity key={v} onPress={() => setView(v)} style={[styles.navBtn, view === v && styles.activeNav]}>
              <Text style={styles.navText}>{v}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? <ActivityIndicator size="large" color="#000" /> : (
        <View style={{flex:1}}>
          
          {/* MENU VIEW */}
          {view === 'MENU' && (
            <>
              <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
                <Text style={styles.addBtnText}>+ ADD NEW ITEM</Text>
              </TouchableOpacity>
              <FlatList data={data.menu} renderItem={({ item }) => (
                <View style={[styles.card, item.stock_quantity < 5 && styles.lowStock]}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <View style={styles.actionRow}>
                        <TouchableOpacity onPress={() => openEditModal(item, 'MENU')}><Text style={styles.editText}>Edit</Text></TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete('MENU', item.id)}><Text style={styles.delText}>Delete</Text></TouchableOpacity>
                    </View>
                  </View>
                  <Text>Price: ${item.price.toFixed(2)} | Stock: {item.stock_quantity}</Text>
                </View>
              )} />
            </>
          )}

          {/* STAFF VIEW */}
          {view === 'STAFF' && (
            <>
              <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
                <Text style={styles.addBtnText}>+ ADD NEW STAFF</Text>
              </TouchableOpacity>
              <FlatList data={data.staff} renderItem={({ item }) => (
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{item.username}</Text>
                    <View style={styles.actionRow}>
                        <TouchableOpacity onPress={() => openEditModal(item, 'STAFF')}><Text style={styles.editText}>Edit</Text></TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete('STAFF', item.id)}><Text style={styles.delText}>Remove</Text></TouchableOpacity>
                    </View>
                  </View>
                  <Text>Phone: {item.phone_number}</Text>
                </View>
              )} />
            </>
          )}

          {/* HISTORY VIEW */}
          {view === 'HISTORY' && (
            <FlatList data={data.history} renderItem={({ item }) => {
                const displayTotal = item.total_amount > 0 ? item.total_amount : item.items.reduce((sum, i) => sum + (i.item.price * i.quantity), 0);
                return (
                <View style={styles.card}>
                    <View style={styles.cardHeader}><Text style={styles.cardTitle}>Order #{item.id}</Text><Text style={styles.boldText}>${displayTotal.toFixed(2)}</Text></View>
                    <Text style={styles.miniText}>Customer: {item.customer?.username}</Text>
                    <Text style={{marginTop: 5}}>{item.items.map(i => `${i.item.name} x${i.quantity}`).join(', ')}</Text>
                </View>
                );
            }} />
          )}

          {/* --- REVENUE BANNER (Add this inside the Content Area, above the FlatLists) --- */}
            <View style={styles.revenueBanner}>
            <Text style={styles.revenueLabel}>TODAY'S REVENUE</Text>
            <Text style={styles.revenueAmount}>${data.totalRevenue?.toFixed(2) || '0.00'}</Text>
            </View>

            {/* --- UPDATED SESSIONS VIEW --- */}
            {view === 'SESSIONS' && (
            <FlatList 
                data={data.activeSessions} 
                renderItem={({ item }) => {
                const allItems = item.orders.flatMap(o => o.items);
                
                return (
                    <View style={styles.sessionCard}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>TABLE {item.table?.table_number}</Text>
                        <Text style={styles.joinCode}>Code: {item.join_code}</Text>
                    </View>

                    <View style={styles.divider} />

                    {allItems.length > 0 ? allItems.map((si, idx) => (
                        <View key={idx} style={styles.orderDetailRow}>
                        <View style={{flex: 2}}>
                            <Text style={styles.itemNameText}>{si.item.name} (x{si.quantity})</Text>
                            <Text style={[styles.statusBadge, 
                            si.status === 'SERVED' ? {color: 'gray'} : {color: '#D4AF37'}
                            ]}>
                            ● {si.status || 'PENDING'}
                            </Text>
                        </View>
                        
                        <View style={{flex: 1, alignItems: 'flex-end'}}>
                            <Text style={[styles.payBadge, { color: si.paid_by_user_id ? 'green' : 'red' }]}>
                            {si.paid_by_user_id ? 'PAID' : 'UNPAID'}
                            </Text>
                            {si.paid_by && <Text style={styles.miniText}>by {si.paid_by.username}</Text>}
                        </View>
                        </View>
                    )) : <Text style={styles.emptyText}>No items ordered yet.</Text>}
                    </View>
                );
                }} 
            />
            )}
        </View>
      )}

      {/* --- ADD/EDIT MODAL --- */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>{isEditMode ? 'Edit' : 'Add New'} {view === 'MENU' ? 'Inventory Item' : 'Staff Account'}</Text>
            
            {view === 'MENU' ? (
              <View style={{width: '100%'}}>
                <Text style={styles.inputLabel}>Item Name</Text>
                <TextInput value={menuForm.name} style={styles.input} onChangeText={t => setMenuForm({...menuForm, name: t})}/>
                <Text style={styles.inputLabel}>Price ($)</Text>
                <TextInput value={menuForm.price} style={styles.input} keyboardType="numeric" onChangeText={t => setMenuForm({...menuForm, price: t})}/>
                <Text style={styles.inputLabel}>Stock Quantity</Text>
                <TextInput value={menuForm.stock} style={styles.input} keyboardType="numeric" onChangeText={t => setMenuForm({...menuForm, stock: t})}/>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}><Text style={styles.saveBtnText}>{isEditMode ? 'UPDATE ITEM' : 'SAVE TO MENU'}</Text></TouchableOpacity>
              </View>
            ) : (
              <View style={{width: '100%'}}>
                <Text style={styles.inputLabel}>Username</Text>
                <TextInput value={staffForm.username} style={styles.input} onChangeText={t => setStaffForm({...staffForm, username: t})}/>
                <Text style={styles.inputLabel}>Password {isEditMode && '(Leave blank to keep current)'}</Text>
                <TextInput placeholder="••••••" style={styles.input} secureTextEntry onChangeText={t => setStaffForm({...staffForm, password: t})}/>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput value={staffForm.phone} style={styles.input} onChangeText={t => setStaffForm({...staffForm, phone: t})}/>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}><Text style={styles.saveBtnText}>{isEditMode ? 'UPDATE STAFF' : 'CREATE STAFF'}</Text></TouchableOpacity>
              </View>
            )}
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelLink}><Text>Cancel / Close</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBEB', padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  title: { fontSize: 26, fontWeight: '900' },
  logout: { color: 'red', fontWeight: 'bold' },
  navScroll: { marginBottom: 20 },
  navBtn: { paddingHorizontal: 20, paddingVertical: 10, marginRight: 10, borderWidth: 2, borderColor: '#000', backgroundColor: '#fff' },
  activeNav: { backgroundColor: '#F1D1E5' },
  navText: { fontWeight: '900', fontSize: 12 },
  addBtn: { backgroundColor: '#000', padding: 15, alignItems: 'center', marginBottom: 20 },
  addBtnText: { color: '#fff', fontWeight: 'bold' },
  card: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#000', padding: 15, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontWeight: '900', fontSize: 18 },
  actionRow: { flexDirection: 'row' },
  editText: { color: 'blue', fontWeight: 'bold', marginRight: 15 },
  delText: { color: 'red', fontWeight: 'bold' },
  boldText: { fontWeight: 'bold' },
  miniText: { fontSize: 10, color: '#666', marginTop: 5 },
  lowStock: { borderLeftWidth: 10, borderLeftColor: 'red' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', backgroundColor: '#FDFBEB', borderWidth: 4, borderColor: '#000', padding: 20 },
  modalHeader: { fontSize: 20, fontWeight: '900', marginBottom: 20, textAlign: 'center' },
  inputLabel: { fontWeight: 'bold', marginBottom: 5, fontSize: 12 },
  input: { width: '100%', borderWidth: 2, borderColor: '#000', padding: 12, marginBottom: 15, backgroundColor: '#fff' },
  saveBtn: { backgroundColor: '#F1D1E5', width: '100%', padding: 18, alignItems: 'center', borderWidth: 2, borderColor: '#000' },
  saveBtnText: { fontWeight: '900' },
  cancelLink: { marginTop: 15, alignSelf: 'center' },
    revenueBanner: {
    backgroundColor: '#000',
    padding: 20,
    borderRadius: 0,
    marginBottom: 20,
    alignItems: 'center',
  },
  revenueLabel: { color: '#F1D1E5', fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  revenueAmount: { color: '#fff', fontSize: 32, fontWeight: '900', marginTop: 5 },
  sessionCard: {
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#000',
    padding: 15,
    marginBottom: 15,
  },
  joinCode: { fontWeight: 'bold', fontSize: 14, color: '#666' },
  divider: { height: 2, backgroundColor: '#000', marginVertical: 10 },
  orderDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemNameText: { fontWeight: 'bold', fontSize: 14 },
  statusBadge: { fontSize: 10, fontWeight: 'bold', marginTop: 2, textTransform: 'uppercase' },
  payBadge: { fontSize: 12, fontWeight: '900' },
  emptyText: { textAlign: 'center', color: '#999', marginVertical: 10, fontStyle: 'italic' },
});
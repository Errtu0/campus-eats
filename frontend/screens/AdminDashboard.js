import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, 
  Modal, Alert, ActivityIndicator, ScrollView, Image 
} from 'react-native';
import { ADMIN_URL } from '../src/config';
import { COLORS, GLOBAL_STYLES } from '../src/styles/theme'; 
import { 
  LogOut, Utensils, Users, History, MonitorDot, 
  Pencil, Trash2, PlusCircle, Package, Milk, Bean, QrCode 
} from 'lucide-react-native';

export default function AdminDashboard({ navigation }) {
  const [view, setView] = useState('MENU');
  const [data, setData] = useState({ 
    menu: [], staff: [], history: [], activeSessions: [], totalRevenue: 0, inventory: [] 
  });
  const [loading, setLoading] = useState(true);
  
  // Modals State
  const [modalVisible, setModalVisible] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedQr, setSelectedQr] = useState(null);

  // Forms
  const [menuForm, setMenuForm] = useState({ name: '', price: '' });
  const [staffForm, setStaffForm] = useState({ username: '', password: '', phone: '' });
  const [invForm, setInvForm] = useState({ name: '', amount: '', unit: '', min_limit: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${ADMIN_URL}/dashboard-data`);
      const json = await res.json();
      
      console.log("DEBUG ADMIN DATA:", json);
      
      // Calculate revenue from history
      const historyWithTotals = (json.history || []).map(order => {
        const itemTotal = (order.items || []).reduce((sum, i) => sum + (i.item.price * (i.quantity || 1)), 0);
        return { ...order, displayTotal: order.total_amount > 0 ? order.total_amount : itemTotal };
      });

      setData({ 
        menu: json.menu || [],
        staff: json.staff || [], // 👈 Ensure this matches the backend key
        history: historyWithTotals,
        activeSessions: json.activeSessions || [],
        inventory: json.inventory || [],
        totalRevenue: historyWithTotals.reduce((sum, order) => sum + order.displayTotal, 0) 
      });
    } catch (e) { 
      Alert.alert("Error", "Could not load data.");
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    const endpoint = view === 'MENU' ? 'menu' : view === 'STAFF' ? 'staff' : 'inventory';
    const method = isEditMode ? 'PATCH' : 'POST';
    const url = isEditMode ? `${ADMIN_URL}/${endpoint}/${selectedId}` : `${ADMIN_URL}/${endpoint}`;

    let body = {};
    if (view === 'MENU') body = { ...menuForm, restaurant_id: 1 };
    else if (view === 'STAFF') body = { ...staffForm };
    else if (view === 'INVENTORY') body = { ...invForm, restaurant_id: 1 };

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setModalVisible(false);
        fetchData();
      }
    } catch (e) { Alert.alert("Error", "Save failed"); }
  };

  const handleDelete = async (type, id) => {
    const endpoint = type.toLowerCase();
    Alert.alert("Delete", "Are you sure?", [
      { text: "Cancel" },
      { text: "Delete", style: 'destructive', onPress: async () => {
          await fetch(`${ADMIN_URL}/${endpoint}/${id}`, { method: 'DELETE' });
          fetchData();
      }}
    ]);
  };

  // QR Code Generation
  const fetchQrCode = async (tableId) => {
    try {
      const res = await fetch(`${ADMIN_URL}/tables/${tableId}/qrcode`);
      const json = await res.json();
      setSelectedQr(json);
      setQrModalVisible(true);
    } catch (e) {
      Alert.alert("Error", "Could not generate QR Code.");
    }
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setMenuForm({ name: '', price: '' });
    setStaffForm({ username: '', password: '', phone: '' });
    setInvForm({ name: '', amount: '', unit: '', min_limit: '' });
    setModalVisible(true);
  };

  const openEditModal = (item, type) => {
    setIsEditMode(true);
    setSelectedId(item.id);
    if (type === 'MENU') setMenuForm({ name: item.name, price: item.price.toString() });
    else if (type === 'STAFF') setStaffForm({ username: item.username, phone: item.phone_number, password: '' });
    else if (type === 'INVENTORY') setInvForm({ name: item.name, amount: item.amount.toString(), unit: item.unit, min_limit: item.min_limit.toString() });
    setModalVisible(true);
  };

  return (
    <View style={[GLOBAL_STYLES.container, { paddingTop: 60 }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}><Text style={[styles.title, { color: COLORS.secondary }]}>Admin Portal</Text></View>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => navigation.replace('Welcome')}>
          <LogOut color={COLORS.primary} size={28} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabContainer}>
        {[
          { id: 'MENU', icon: Utensils },
          { id: 'STAFF', icon: Users },
          { id: 'HISTORY', icon: History, label: 'LOGS' },
          { id: 'SESSIONS', icon: MonitorDot },
          { id: 'INVENTORY', icon: Package, label: 'STOCK' }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = view === tab.id;
          return (
            <TouchableOpacity key={tab.id} onPress={() => setView(tab.id)} style={[styles.tabBtn, isActive && styles.activeTab]}>
              <Icon size={18} color={isActive ? '#fff' : '#666'} strokeWidth={2.5} />
              <Text style={[styles.tabText, isActive && { color: '#fff' }]}>{tab.label || tab.id}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? <ActivityIndicator size="large" color={COLORS.primary} /> : (
        <View style={{ flex: 1 }}>
          
          {/* MENU VIEW */}
          {view === 'MENU' && (
            <>
              <TouchableOpacity style={[GLOBAL_STYLES.button, styles.addBtn]} onPress={openAddModal}>
                <PlusCircle color="#fff" size={20} style={{ marginRight: 10 }} /><Text style={GLOBAL_STYLES.buttonText}>ADD NEW ITEM</Text>
              </TouchableOpacity>
              <FlatList data={data.menu} renderItem={({ item }) => (
                <View style={GLOBAL_STYLES.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <View style={styles.actionRow}>
                      <TouchableOpacity onPress={() => openEditModal(item, 'MENU')} style={styles.iconBtn}><Pencil size={18} color={COLORS.secondary} /></TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete('MENU', item.id)} style={styles.iconBtn}><Trash2 size={18} color="red" /></TouchableOpacity>
                    </View>
                  </View>
                  <Text style={styles.boldPrice}>${item.price.toFixed(2)}</Text>
                </View>
              )} />
            </>
          )}

          {/* STAFF VIEW - RESTORED LIST */}
          {view === 'STAFF' && (
            <>
              <TouchableOpacity style={[GLOBAL_STYLES.button, styles.addBtn]} onPress={openAddModal}>
                <PlusCircle color="#fff" size={20} style={{ marginRight: 10 }} /><Text style={GLOBAL_STYLES.buttonText}>ADD NEW STAFF</Text>
              </TouchableOpacity>
              <FlatList data={data.staff} renderItem={({ item }) => (
                <View style={GLOBAL_STYLES.card}>
                  <View style={styles.cardHeader}>
                    <View>
                        <Text style={styles.cardTitle}>{item.username}</Text>
                        <Text style={styles.cardSubText}>{item.phone_number || 'No Phone'}</Text>
                    </View>
                    <View style={styles.actionRow}>
                      <TouchableOpacity onPress={() => openEditModal(item, 'STAFF')} style={styles.iconBtn}><Pencil size={18} color={COLORS.secondary} /></TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete('STAFF', item.id)} style={styles.iconBtn}><Trash2 size={18} color="red" /></TouchableOpacity>
                    </View>
                  </View>
                </View>
              )} />
            </>
          )}

          {/* INVENTORY VIEW */}
          {view === 'INVENTORY' && (
            <>
              <TouchableOpacity style={[GLOBAL_STYLES.button, styles.addBtn]} onPress={openAddModal}>
                <PlusCircle color="#fff" size={20} style={{ marginRight: 10 }} /><Text style={GLOBAL_STYLES.buttonText}>ADD INGREDIENT</Text>
              </TouchableOpacity>
              <FlatList data={data.inventory} renderItem={({ item }) => (
                <View style={[GLOBAL_STYLES.card, item.amount <= item.min_limit && styles.lowStock]}>
                  <View style={styles.cardHeader}>
                    <View style={{flexDirection:'row', alignItems:'center'}}>
                      {item.name.toLowerCase().includes('milk') ? <Milk size={18} color="#000"/> : <Bean size={18} color="#000"/>}
                      <Text style={[styles.cardTitle, {marginLeft: 8}]}>{item.name}</Text>
                    </View>
                    <TouchableOpacity onPress={() => openEditModal(item, 'INVENTORY')} style={styles.iconBtn}><Pencil size={18} color={COLORS.secondary} /></TouchableOpacity>
                  </View>
                  <Text style={styles.cardSubText}>Amount: {item.amount} {item.unit} | Alert at: {item.min_limit}</Text>
                </View>
              )} />
            </>
          )}

          {/* SESSIONS & QR VIEW */}
          {view === 'SESSIONS' && (
            <FlatList data={data.activeSessions} renderItem={({ item }) => (
              <View style={styles.sessionCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Table {item.table.table_number}</Text>
                  <TouchableOpacity onPress={() => fetchQrCode(item.table.id)} style={styles.qrTrigger}>
                    <QrCode size={24} color={COLORS.secondary} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.joinCode}>Code: {item.join_code}</Text>
                <View style={styles.divider} />
                {item.orders.map((order, idx) => (
                  <Text key={idx} style={styles.miniText}>Order #{order.id} - ${order.total_amount}</Text>
                ))}
              </View>
            )} />
          )}

          {/* HISTORY VIEW */}
          {view === 'HISTORY' && (
            <View style={{flex:1}}>
                <View style={[styles.revenueBanner, {backgroundColor: COLORS.secondary}]}>
                    <Text style={styles.revenueLabel}>TOTAL REVENUE</Text>
                    <Text style={styles.revenueAmount}>${data.totalRevenue.toFixed(2)}</Text>
                </View>
                <FlatList data={data.history} renderItem={({ item }) => (
                    <View style={GLOBAL_STYLES.card}>
                        <Text style={styles.cardTitle}>Order #{item.id} - {item.customer.username}</Text>
                        <Text style={styles.historyItems}>
                            {item.items.map(i => `${i.item.name} (x${i.quantity})`).join(', ')}
                        </Text>
                        <Text style={[styles.boldPrice, {marginTop: 5}]}>${item.displayTotal.toFixed(2)}</Text>
                    </View>
                )} />
            </View>
          )}
        </View>
      )}

      {/* QR CODE MODAL */}
      <Modal visible={qrModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { alignItems: 'center', backgroundColor: '#fff' }]}>
            <Text style={styles.modalHeader}>TABLE {selectedQr?.tableNumber} QR CODE</Text>
            {selectedQr && (
              <Image 
                source={{ uri: selectedQr.qrCodeImage }} 
                style={styles.qrImage} 
                resizeMode="contain"
              />
            )}
            <Text style={styles.qrSubtext}>Print this code for the table.</Text>
            <TouchableOpacity style={[GLOBAL_STYLES.button, {width: '100%'}]} onPress={() => setQrModalVisible(false)}>
              <Text style={GLOBAL_STYLES.buttonText}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ADD/EDIT MODAL */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: COLORS.background, borderColor: COLORS.secondary }]}>
            <Text style={[styles.modalHeader, { color: COLORS.secondary }]}>
              {isEditMode ? 'Edit' : 'Add'} {view}
            </Text>
            <ScrollView style={{width:'100%'}}>
              {view === 'MENU' && (
                <>
                  <Text style={styles.inputLabel}>Name</Text>
                  <TextInput value={menuForm.name} style={styles.input} onChangeText={t => setMenuForm({...menuForm, name: t})} />
                  <Text style={styles.inputLabel}>Price</Text>
                  <TextInput value={menuForm.price} style={styles.input} keyboardType="numeric" onChangeText={t => setMenuForm({...menuForm, price: t})} />
                </>
              )}
              {view === 'INVENTORY' && (
                <>
                  <Text style={styles.inputLabel}>Ingredient Name</Text>
                  <TextInput value={invForm.name} style={styles.input} onChangeText={t => setInvForm({...invForm, name: t})} />
                  <Text style={styles.inputLabel}>Current Amount</Text>
                  <TextInput value={invForm.amount} style={styles.input} keyboardType="numeric" onChangeText={t => setInvForm({...invForm, amount: t})} />
                  <Text style={styles.inputLabel}>Unit (L, KG, pcs)</Text>
                  <TextInput value={invForm.unit} style={styles.input} onChangeText={t => setInvForm({...invForm, unit: t})} />
                  <Text style={styles.inputLabel}>Low Stock Alert Level</Text>
                  <TextInput value={invForm.min_limit} style={styles.input} keyboardType="numeric" onChangeText={t => setInvForm({...invForm, min_limit: t})} />
                </>
              )}
              {/* STAFF VIEW */}
              {view === 'STAFF' && (
                <>
                  <Text style={styles.inputLabel}>Username</Text>
                  <TextInput value={staffForm.username} style={styles.input} onChangeText={t => setStaffForm({...staffForm, username: t})} />
                  <Text style={styles.inputLabel}>Phone Number</Text>
                  <TextInput value={staffForm.phone} style={styles.input} onChangeText={t => setStaffForm({...staffForm, phone: t})} />
                  {!isEditMode && (
                    <>
                      <Text style={styles.inputLabel}>Initial Password</Text>
                      <TextInput value={staffForm.password} style={styles.input} secureTextEntry onChangeText={t => setStaffForm({...staffForm, password: t})} />
                    </>
                  )}
                </>
              )}
            </ScrollView>
            <TouchableOpacity style={GLOBAL_STYLES.button} onPress={handleSave}>
              <Text style={GLOBAL_STYLES.buttonText}>SAVE CHANGES</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelLink}>
              <Text style={{ color: COLORS.secondary, fontWeight: '900' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, paddingHorizontal: 5 },
  headerLeft: { flex: 1 },
  title: { fontSize: 30, fontWeight: '900' },
  logoutBtn: { padding: 5 },
  tabContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, backgroundColor: '#eee', padding: 4, borderRadius: 12, borderWidth: 1, borderColor: '#ddd' },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', borderRadius: 10, gap: 5 },
  activeTab: { backgroundColor: COLORS.secondary, borderColor: COLORS.black, borderWidth: 1.5 },
  tabText: { fontWeight: '900', fontSize: 10, color: '#666' },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 15, paddingVertical: 15 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontWeight: '900', fontSize: 18 },
  cardSubText: { fontSize: 13, color: '#444', marginTop: 5, fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: 12 },
  iconBtn: { padding: 8, borderRadius: 8, backgroundColor: '#fff', borderWidth: 2, borderColor: '#000' },
  qrTrigger: { padding: 10, backgroundColor: '#f0f0f0', borderRadius: 50, borderWidth: 2 },
  qrImage: { width: 280, height: 280, marginVertical: 20 },
  qrSubtext: { fontSize: 12, color: '#666', marginBottom: 20, fontWeight: '700' },
  boldPrice: { fontWeight: '900', fontSize: 18, color: COLORS.secondary },
  historyItems: { marginTop: 8, fontWeight: '700', color: '#333' },
  miniText: { fontSize: 11, color: '#666', marginTop: 4 },
  lowStock: { borderLeftWidth: 10, borderLeftColor: 'red' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', borderWidth: 4, padding: 25, borderRadius: 2 },
  modalHeader: { fontSize: 22, fontWeight: '900', marginBottom: 20, textAlign: 'center', textTransform: 'uppercase' },
  inputLabel: { fontWeight: '900', marginBottom: 5, fontSize: 12 },
  input: { width: '100%', borderWidth: 2, borderColor: '#000', padding: 12, marginBottom: 15, backgroundColor: '#fff' },
  cancelLink: { marginTop: 15, alignSelf: 'center' },
  revenueBanner: { padding: 25, marginBottom: 20, alignItems: 'center', borderWidth: 3, borderColor: '#000' },
  revenueLabel: { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  revenueAmount: { color: '#fff', fontSize: 38, fontWeight: '900', marginTop: 5 },
  sessionCard: { backgroundColor: '#fff', borderWidth: 3, padding: 15, marginBottom: 15, borderColor: '#000' },
  joinCode: { fontWeight: '900', fontSize: 14, color: '#666', marginTop: 5 },
  divider: { height: 2, backgroundColor: '#000', marginVertical: 12 }
});
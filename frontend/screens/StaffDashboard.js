import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SOCKET_URL, STAFF_URL } from '../src/config';
import { COLORS, GLOBAL_STYLES } from '../src/styles/theme';
import { LogOut, CheckCircle } from 'lucide-react-native';
import { io } from 'socket.io-client'; // 1. Import Socket Client

export default function StaffDashboard({ navigation }) {
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedTable, setSelectedTable] = useState(null);
  const [tableDetails, setTableDetails] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchData = async () => {
    try {
      const response = await fetch(`${STAFF_URL}/dashboard-data`);
      const data = await response.json();
      setTables(data.tables || []);
      setOrders(data.pendingOrders || []);
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(false); 
      setRefreshing(false); 
    }
  };

  const openTableModal = async (table) => {
    setSelectedTable(table);
    setModalVisible(true);
    setModalLoading(true);
    try {
      const res = await fetch(`${STAFF_URL}/table-details/${table.id}`);
      const data = await res.json();
      setTableDetails(data);
    } catch (e) { 
      console.error(e); 
    } finally { 
      setModalLoading(false); 
    }
  };

  const updateOrderStatus = async (id, type) => {
    const endpoint = type === 'READY' ? 'order-ready' : 'order-served';
    await fetch(`${STAFF_URL}/${endpoint}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderItemId: id }),
    });
    fetchData();
  };

  const changeTableStatus = async (tableId, newStatus) => {
    await fetch(`${STAFF_URL}/table-status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableId, status: newStatus }),
    });
    setModalVisible(false);
    fetchData();
  };

  useEffect(() => {
    fetchData();

    // 1. Connect using ONLY the BASE_URL and websocket transport
    // Make sure BASE_URL in config.js is exactly "http://YOUR_IP:3000" (NO trailing slash)
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log("🟢 Connected to Socket! ID:", socket.id);
    });

    socket.on('connect_error', (err) => {
      console.log("🔴 Socket Connection Error:", err.message);
      // If you still see 'Invalid Namespace', it's likely a version mismatch
    });

    socket.on('NEW_PAID_ORDER', (data) => {
      alert("📢 " + data.message);
      fetchData();
    });

    return () => {
      socket.off('connect');
      socket.off('connect_error');
      socket.off('NEW_PAID_ORDER');
      socket.disconnect();
    };
  }, []);

  return (
    <View style={[GLOBAL_STYLES.container, { paddingTop: 60 }]}>
      {/* HEADER: PINNED LEFT AND RIGHT */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: COLORS.secondary }]}>Staff Portal</Text>
        </View>
        <TouchableOpacity 
          style={styles.logoutBtn} 
          onPress={() => navigation.replace('Welcome')}
        >
          <LogOut color={COLORS.primary} size={30} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={() => {setRefreshing(true); fetchData();}}
            tintColor={COLORS.black}
          />
        }
      >
        <Text style={styles.sectionTitle}>Live Table Map</Text>
        
        <View style={styles.tableGrid}>
          {tables.map(table => (
            <TouchableOpacity 
              key={table.id} 
              style={[
                styles.tableBox, 
                table.status === 'EMPTY' && { backgroundColor: '#C1E1C1' },
                table.status === 'OCCUPIED' && { backgroundColor: '#FF6961' },
                table.status === 'CLEANING' && { backgroundColor: '#FDFD96' }
              ]} 
              onPress={() => openTableModal(table)}
            >
              <Text style={styles.tableId}>{table.id}</Text>
              <Text style={styles.statusLabel}>{table.status}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <Text style={styles.sectionTitle}>Paid Items Queue</Text>
        {orders.length > 0 ? orders.map(item => (
          <View key={item.id} style={styles.orderCard}>
            <View style={styles.orderHeader}>
                <Text style={styles.orderTableText}>TABLE {item.order.session.table_id}</Text>
                <View style={[styles.statusBadge, {backgroundColor: item.status === 'READY' ? '#C1E1C1' : '#FDFD96'}]}>
                  <Text style={styles.statusTag}>{item.status}</Text>
                </View>
            </View>
            <Text style={styles.orderItemName}>{item.item.name} <Text style={{color: COLORS.secondary}}>x{item.quantity}</Text></Text>
            <TouchableOpacity 
                style={[styles.actionBtn, {backgroundColor: item.status === 'READY' ? COLORS.white : COLORS.secondary}]}
                onPress={() => updateOrderStatus(item.id, item.status === 'READY' ? 'SERVED' : 'READY')}
            >
                <Text style={styles.btnText}>{item.status === 'READY' ? 'MARK AS SERVED' : 'MARK AS READY'}</Text>
            </TouchableOpacity>
          </View>
        )) : (
          <View style={styles.emptyContainer}>
             <CheckCircle size={40} color={COLORS.gray} />
             <Text style={styles.emptyText}>Queue is empty</Text>
          </View>
        )}
      </ScrollView>

      {/* MODAL */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { borderColor: COLORS.black }]}>
            <Text style={styles.modalTitle}>TABLE {selectedTable?.id}</Text>
            
            {modalLoading ? <ActivityIndicator color={COLORS.secondary} size="large" /> : (
                <View style={{width: '100%'}}>
                {tableDetails?.active ? (
                    <>
                    <View style={styles.sessionBadge}>
                       <Text style={styles.modalSub}>CODE: {tableDetails.sessionCode}</Text>
                    </View>
                    
                    <Text style={styles.listHeader}>Current Orders:</Text>
                    <ScrollView style={{ maxHeight: 250, width: '100%', marginVertical: 10 }}>
                        {tableDetails?.items?.map((item, idx) => (
                        <View key={idx} style={[styles.modalItemRow, item.status === 'SERVED' && { opacity: 0.4 }]}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.modalItemNameText}>{item.item.name}</Text>
                                <Text style={styles.itemStatusMini}>{item.status || 'ORDERED'}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={[styles.paymentStatus, { color: item.paid_by_user_id ? '#2E7D32' : '#C62828' }]}>
                                    {item.paid_by_user_id ? 'PAID' : 'UNPAID'}
                                </Text>
                            </View>
                        </View>
                        ))}
                    </ScrollView>

                    {tableDetails.canClear ? (
                        <TouchableOpacity 
                        style={styles.modalActionBtn} 
                        onPress={() => changeTableStatus(selectedTable.id, 'CLEANING')}
                        >
                        <Text style={styles.modalBtnText}>MARK CLEANING</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.disabledContainer}>
                        <Text style={styles.warnText}>
                            {tableDetails.items.length === 0 
                            ? "Waiting for orders..." 
                            : `${tableDetails.unpaidCount} items remain unpaid.`}
                        </Text>
                        </View>
                    )}
                    </>
                ) : (
                    <View style={{alignItems: 'center', paddingVertical: 20}}>
                        <Text style={styles.emptyText}>Status: {selectedTable?.status}</Text>
                        {selectedTable?.status === 'CLEANING' && (
                            <TouchableOpacity 
                            style={styles.modalActionBtn} 
                            onPress={() => changeTableStatus(selectedTable.id, 'EMPTY')}
                            >
                            <Text style={styles.modalBtnText}>SET AS EMPTY</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
                </View>
            )}
            
            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.closeBtnText}>BACK</Text>
            </TouchableOpacity>
            </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20,
    marginBottom: 20 
  },
  headerLeft: {
    flex: 1,
  },
  title: { fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  logoutBtn: { 
    padding: 10,
    marginRight: -10, // Pulls the icon closer to the far right edge
  },
  sectionTitle: { fontSize: 14, fontWeight: '900', marginVertical: 15, textTransform: 'uppercase', color: COLORS.secondary, paddingHorizontal: 20 },
  tableGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 20 },
  tableBox: { 
    width: '31%', 
    height: 85, 
    borderWidth: 3, 
    borderColor: COLORS.black, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5
  },
  tableId: { fontSize: 24, fontWeight: '900' }, 
  statusLabel: { fontSize: 8, fontWeight: '900', textTransform: 'uppercase' },
  orderCard: { 
    backgroundColor: COLORS.white, 
    borderWidth: 3, 
    borderColor: COLORS.black, 
    padding: 15, 
    marginHorizontal: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderTableText: { fontWeight: '900', fontSize: 16 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: COLORS.black },
  statusTag: { fontWeight: '900', fontSize: 10 },
  orderItemName: { fontSize: 22, fontWeight: '900', marginVertical: 10 },
  actionBtn: { 
    padding: 15, 
    borderWidth: 2, 
    borderColor: COLORS.black, 
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    elevation: 2
  },
  btnText: { fontWeight: '900', letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { 
    width: '90%', 
    backgroundColor: '#FDFBEB', 
    borderWidth: 4, 
    padding: 20, 
    alignItems: 'center',
    borderRadius: 2
  },
  modalTitle: { fontSize: 24, fontWeight: '900', marginBottom: 15 },
  sessionBadge: { backgroundColor: COLORS.black, padding: 5, marginBottom: 15 },
  modalSub: { color: COLORS.white, fontWeight: '900', fontSize: 14 },
  listHeader: { alignSelf: 'flex-start', fontWeight: '900', fontSize: 14, marginTop: 10 },
  modalItemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: COLORS.black },
  modalItemNameText: { fontWeight: '900', fontSize: 16 },
  itemStatusMini: { fontSize: 10, fontWeight: '700', color: COLORS.gray },
  paymentStatus: { fontWeight: '900', fontSize: 12 },
  modalActionBtn: { 
    backgroundColor: COLORS.primary, 
    borderWidth: 3, 
    borderColor: COLORS.black, 
    padding: 18, 
    width: '100%', 
    alignItems: 'center',
    marginTop: 15,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1
  },
  modalBtnText: { fontWeight: '900', fontSize: 16 },
  closeBtn: { marginTop: 20 },
  closeBtnText: { fontWeight: '900', textDecorationLine: 'underline', color: COLORS.secondary },
  emptyContainer: { alignItems: 'center', padding: 40 },
  emptyText: { fontWeight: '900', color: COLORS.gray, marginTop: 10 },
  warnText: { color: '#C62828', fontWeight: '900', textAlign: 'center', padding: 10 },
  disabledContainer: { backgroundColor: '#eee', width: '100%', padding: 15, marginTop: 15, borderWidth: 2, borderColor: '#ccc' }
});
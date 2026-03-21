import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { STAFF_URL } from '../src/config';

export default function StaffDashboard({ navigation }) {
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal State
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
    } catch (e) { console.error(e); } finally { setLoading(false); setRefreshing(false); }
  };

  const openTableModal = async (table) => {
    setSelectedTable(table);
    setModalVisible(true);
    setModalLoading(true);
    try {
      const res = await fetch(`${STAFF_URL}/table-details/${table.id}`);
      const data = await res.json();
      setTableDetails(data);
    } catch (e) { console.error(e); } finally { setModalLoading(false); }
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

  useEffect(() => { fetchData(); }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Staff Portal</Text>
        <TouchableOpacity onPress={() => navigation.replace('Welcome')}><Text style={styles.logout}>Logout</Text></TouchableOpacity>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchData();}}/>}>
        <Text style={styles.sectionTitle}>Live Table Map</Text>
        <View style={styles.tableGrid}>
          {tables.map(table => (
            <TouchableOpacity key={table.id} style={[styles.tableBox, styles[table.status]]} onPress={() => openTableModal(table)}>
              <Text style={styles.tableId}>{table.id}</Text>
              <Text style={styles.statusLabel}>{table.status}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <Text style={styles.sectionTitle}>Paid Items Queue</Text>
        {orders.map(item => (
          <View key={item.id} style={styles.orderCard}>
            <View style={styles.orderHeader}>
                <Text style={styles.orderTable}>TABLE {item.order.session.table_id}</Text>
                <Text style={[styles.statusTag, {color: item.status === 'READY' ? 'green' : 'orange'}]}>{item.status}</Text>
            </View>
            <Text style={styles.orderItemName}>{item.item.name} x{item.quantity}</Text>
            <TouchableOpacity 
                style={[styles.actionBtn, {backgroundColor: item.status === 'READY' ? '#FFF' : '#F1D1E5'}]}
                onPress={() => updateOrderStatus(item.id, item.status === 'READY' ? 'SERVED' : 'READY')}
            >
                <Text style={styles.btnText}>{item.status === 'READY' ? 'MARK SERVED' : 'MARK READY'}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>TABLE {selectedTable?.id} STATUS</Text>
            
            {modalLoading ? <ActivityIndicator color="#000" /> : (
                <View style={{width: '100%'}}>
                {tableDetails?.active ? (
                    <>
                    <Text style={styles.modalSub}>Session Code: {tableDetails.sessionCode}</Text>
                    
                    <Text style={styles.listHeader}>Bill Details:</Text>
                        <ScrollView style={{ maxHeight: 250, width: '100%', marginVertical: 10 }}>
                            {tableDetails?.items && tableDetails.items.length > 0 ? (
                                tableDetails.items.map((item, idx) => (
                                <View key={idx} style={[
                                    styles.modalItemRow, 
                                    item.status === 'SERVED' && { opacity: 0.6 } // Dim served items
                                ]}>
                                    <View style={{ flex: 1 }}>
                                    <Text style={styles.modalItemName}>
                                        {item.item.name} {item.status === 'SERVED' ? '✅' : ''}
                                    </Text>
                                    <Text style={{ fontSize: 10, color: '#666' }}>
                                        Status: {item.status || 'ORDERED'}
                                    </Text>
                                    </View>
                                    
                                    <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={{
                                        fontWeight: '900',
                                        fontSize: 12,
                                        color: item.paid_by_user_id ? '#2E7D32' : '#C62828'
                                    }}>
                                        {item.paid_by_user_id ? `PAID` : 'UNPAID'}
                                    </Text>
                                    {item.paid_by?.username && (
                                        <Text style={{ fontSize: 9 }}>by {item.paid_by.username}</Text>
                                    )}
                                    </View>
                                </View>
                                ))
                            ) : (
                                <View style={{ padding: 20, alignItems: 'center' }}>
                                <Text style={styles.emptyText}>No items ordered in this session yet.</Text>
                                </View>
                            )}
                            </ScrollView>

                    {/* ACTION BUTTONS */}
                    {tableDetails.canClear ? (
                        <TouchableOpacity 
                        style={styles.modalBtn} 
                        onPress={() => changeTableStatus(selectedTable.id, 'CLEANING')}
                        >
                        <Text style={styles.modalBtnText}>GUESTS LEFT - MARK CLEANING</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.disabledContainer}>
                        <Text style={styles.warnText}>
                            {tableDetails.items.length === 0 
                            ? "Waiting for first order..." 
                            : `Cannot close: ${tableDetails.unpaidCount} items unpaid.`}
                        </Text>
                        {/* Emergency Force Close for Staff */}
                        <TouchableOpacity 
                            onLongPress={() => changeTableStatus(selectedTable.id, 'CLEANING')}
                            style={{marginTop: 10}}
                        >
                            <Text style={{fontSize: 10, color: '#ccc'}}>Hold to Force Close (Admin Only)</Text>
                        </TouchableOpacity>
                        </View>
                    )}
                    </>
                ) : (
                    <View style={{alignItems: 'center', paddingVertical: 20}}>
                    <Text style={styles.emptyText}>Table is currently {selectedTable?.status}</Text>
                    {selectedTable?.status === 'CLEANING' && (
                        <TouchableOpacity 
                        style={styles.modalBtn} 
                        onPress={() => changeTableStatus(selectedTable.id, 'EMPTY')}
                        >
                        <Text style={styles.modalBtnText}>DONE CLEANING - SET EMPTY</Text>
                        </TouchableOpacity>
                    )}
                    {selectedTable?.status === 'EMPTY' && (
                        <Text style={styles.miniStatus}>Waiting for a customer to scan QR.</Text>
                    )}
                    </View>
                )}
                </View>
            )}
            
            <TouchableOpacity style={styles.closeLink} onPress={() => setModalVisible(false)}>
                <Text style={styles.closeLinkText}>CLOSE</Text>
            </TouchableOpacity>
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
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginVertical: 15, textTransform: 'uppercase' },
  tableGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  tableBox: { width: '31%', height: 80, borderWidth: 3, borderColor: '#000', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  EMPTY: { backgroundColor: '#C1E1C1' }, OCCUPIED: { backgroundColor: '#FF6961' }, CLEANING: { backgroundColor: '#FDFD96' },
  tableId: { fontSize: 20, fontWeight: '900' }, statusLabel: { fontSize: 9, fontWeight: 'bold' },
  orderCard: { backgroundColor: '#fff', borderWidth: 3, borderColor: '#000', padding: 15, marginBottom: 15 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  orderTable: { fontWeight: '900' }, statusTag: { fontWeight: 'bold', fontSize: 12 },
  orderItemName: { fontSize: 20, fontWeight: 'bold', marginVertical: 10 },
  actionBtn: { padding: 12, borderWidth: 2, borderColor: '#000', alignItems: 'center' },
  btnText: { fontWeight: '900' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#FDFBEB', borderWidth: 4, borderColor: '#000', padding: 20, alignItems: 'center' },
  modalTitle: { fontSize: 22, fontWeight: '900', marginBottom: 10 },
  modalItemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#000' },
  modalBtn: { backgroundColor: '#F1D1E5', borderWidth: 2, borderColor: '#000', padding: 15, width: '100%', alignItems: 'center' },
  disabledBtn: { backgroundColor: '#ccc' }, modalBtnText: { fontWeight: '900' }
});
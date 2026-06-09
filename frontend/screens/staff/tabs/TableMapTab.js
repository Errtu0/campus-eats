import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, ActivityIndicator, RefreshControl } from 'react-native';
import { STAFF_URL } from '../../../src/config';
import { COLORS } from '../../../src/styles/theme';
import AsyncStorage from '@react-native-async-storage/async-storage'; 

export default function TableMapTab({ tables, refresh }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableDetails, setTableDetails] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const openTableDetails = async (table) => {
    setSelectedTable(table);
    setModalVisible(true);
    setTableDetails(null); 
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await fetch(`${STAFF_URL}/table-details/${table.id}`, {
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      const data = await res.json();
      setTableDetails(data);
    } catch (e) { 
      console.error("Details Fetch Error:", e); 
    }
  };

  const updateTableStatus = async (status) => {
    setActionLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await fetch(`${STAFF_URL}/table-status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ tableId: selectedTable.id, status }),
      });

      if (res.ok) {
        setModalVisible(false);
        refresh(); 
      }
    } catch (e) { 
      console.error("Status Update Error:", e); 
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.grid} 
        refreshControl={
          <RefreshControl onRefresh={refresh} refreshing={false} tintColor="#000"/>
        }
      >
        {tables.map(table => (
          <TouchableOpacity 
            key={table.id} 
            style={[styles.tableBox, styles[table.status]]} 
            onPress={() => openTableDetails(table)}
          >
            <Text style={styles.tableNum}>{table.table_number}</Text>
            <Text style={styles.tableStatusText}>{table.status}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>TABLE {selectedTable?.table_number}</Text>
            
            {!tableDetails ? (
              <ActivityIndicator color="#000" size="large" />
            ) : (
              <View style={{ width: '100%' }}>
                <ScrollView style={styles.orderListScroll}>
                  {tableDetails.items?.map((item, idx) => (
                    <View key={idx} style={styles.orderDetailRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.orderNameText}>{item.item?.name} (x{item.quantity})</Text>
                        <View style={styles.badgeRow}>
                          <Text style={[styles.miniBadge, item.paid_by_user_id ? styles.paid : styles.unpaid]}>
                            {item.paid_by_user_id ? 'PAID' : 'UNPAID'}
                          </Text>
                          <Text style={[styles.miniBadge, styles.statusInfo]}>
                            {item.status}
                          </Text>
                          {/* 🚀 FIX: Display identity tracking tag inside map details */}
                          {item.created_by?.username && (
                            <Text style={[styles.miniBadge, styles.ownerInfo]}>
                              BY: {item.created_by.username.toUpperCase()}
                            </Text>
                          )}
                        </View>
                      </View>
                    </View>
                  ))}
                  {tableDetails.items?.length === 0 && (
                    <Text style={styles.noOrders}>No active orders for this session.</Text>
                  )}
                </ScrollView>

                {actionLoading ? (
                  <ActivityIndicator color={COLORS.primary} style={{ margin: 20 }} />
                ) : (
                  <>
                    {selectedTable?.status === 'CLEANING' ? (
                        <TouchableOpacity style={styles.actionBtn} onPress={() => updateTableStatus('EMPTY')}>
                          <Text style={styles.actionBtnText}>MARK AS CLEAN & READY</Text>
                        </TouchableOpacity>
                      ) : (tableDetails.items?.length === 0 || tableDetails.canClear) ? (
                        <TouchableOpacity 
                          style={[styles.actionBtn, { backgroundColor: COLORS.secondary }]} 
                          onPress={() => updateTableStatus('CLEANING')}
                        >
                          <Text style={styles.actionBtnText}>START CLEANING</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.warningBox}>
                          <Text style={styles.warningTitle}>CANNOT CLOSE TABLE</Text>
                          {tableDetails.unpaidCount > 0 && <Text style={styles.warningText}>• {tableDetails.unpaidCount} items are UNPAID</Text>}
                          {tableDetails.unservedCount > 0 && <Text style={styles.warningText}>• {tableDetails.unservedCount} items are NOT SERVED</Text>}
                        </View>
                      )}
                  </>
                )}
              </View>
            )}

            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
              <Text style={styles.closeText}>BACK TO MAP</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingBottom: 100 },
  tableBox: { 
    width: '47%', height: 100, borderWidth: 3, borderColor: '#000', 
    justifyContent: 'center', alignItems: 'center', marginBottom: 15,
    backgroundColor: '#fff', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, elevation: 5
  },
  EMPTY: { backgroundColor: '#C1E1C1' },
  OCCUPIED: { backgroundColor: '#FF6961' },
  CLEANING: { backgroundColor: '#FDFD96' },
  tableNum: { fontSize: 28, fontWeight: '900' },
  tableStatusText: { fontSize: 10, fontWeight: '900' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', backgroundColor: '#FDFBEB', borderWidth: 4, padding: 25, borderColor: '#000' },
  modalTitle: { fontSize: 26, fontWeight: '900', textAlign: 'center', marginBottom: 20 },
  noOrders: { textAlign: 'center', marginVertical: 20, fontWeight: '700', color: '#999' },
  closeBtn: { marginTop: 20, alignItems: 'center' },
  closeText: { fontWeight: '900', textDecorationLine: 'underline', color: COLORS.secondary },
  orderListScroll: { maxHeight: 200, marginVertical: 15, borderWidth: 1, borderColor: '#ccc', padding: 5 },
  orderDetailRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  orderNameText: { fontWeight: '900', fontSize: 14 },
  badgeRow: { flexDirection: 'row', gap: 5, marginTop: 4, flexWrap: 'wrap' },
  miniBadge: { fontSize: 9, fontWeight: '900', paddingHorizontal: 4, paddingVertical: 2, borderWidth: 1 },
  paid: { backgroundColor: '#C1E1C1', borderColor: 'green' },
  unpaid: { backgroundColor: '#FFD1D1', borderColor: 'red' },
  warningBox: { backgroundColor: '#fff', borderWidth: 3, borderColor: '#000', padding: 15, marginTop: 10 },
  warningTitle: { fontWeight: '900', fontSize: 12, color: 'red', marginBottom: 5 },
  warningText: { fontWeight: '700', fontSize: 11, color: '#333' },
  actionBtn: { backgroundColor: '#000', padding: 18, alignItems: 'center', marginTop: 10, borderWidth: 3, borderColor: '#000' },
  actionBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  statusInfo: { backgroundColor: '#eee', borderColor: '#000', color: '#000' },
  
  // INJECTED CREATOR CHIP STYLING
  ownerInfo: { backgroundColor: '#fff', borderColor: '#000', color: '#000' }
});
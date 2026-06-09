import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, Image, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ADMIN_URL } from '../../../src/config';
import { COLORS, GLOBAL_STYLES } from '../../../src/styles/theme';
import { QrCode, MonitorDot, X, Info, User, ShoppingCart } from 'lucide-react-native';

export default function LiveSessionsTab({ restaurantId, sessions, tables }) {
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [selectedQr, setSelectedQr] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);

  // 🚀 NEW STATE: Handles interactive table inspection modulations
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [inspectedSession, setInspectedSession] = useState(null);

  const safeSessions = sessions || [];
  const safeTables = tables || [];

  // 🚀 FIX: Density math calculates perfectly now that safeTables populates correctly
  const densityPercent = safeTables.length > 0 
    ? Math.round((safeSessions.length / safeTables.length) * 100) 
    : 0;

  const handleShowQr = async (tableId) => {
    setQrLoading(true);
    setQrModalVisible(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await fetch(`${ADMIN_URL}/tables/${tableId}/qrcode`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setSelectedQr(data);
    } catch (e) {
      alert("QR Error: Check console");
    } finally {
      setQrLoading(false);
    }
  };

  const openDetailsInspector = (session) => {
    setInspectedSession(session);
    setDetailsModalVisible(true);
  };

  // Helper calculation to pull all order item payloads out of dynamic nested blocks
  const extractSessionItems = (session) => {
    if (!session?.orders) return [];
    return session.orders.flatMap(order => order.items || []);
  };

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: '#FDFBEB' }}>
      
      {/* METRIC DENSITY BOX */}
      <View style={styles.densityCard}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MonitorDot color="#fff" size={18} />
            <Text style={styles.densityTitle}>LIVE DENSITY</Text>
          </View>
          <Text style={styles.densitySubtext}>
            {safeSessions.length} of {safeTables.length} tables active
          </Text>
        </View>
        <View style={styles.percentageCircle}>
          <Text style={styles.percentageText}>{densityPercent}%</Text>
        </View>
      </View>

      {/* SESSIONS FLATLIST */}
      <FlatList
        data={safeSessions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const sessionItems = extractSessionItems(item);
          return (
            <View style={[GLOBAL_STYLES.card, { backgroundColor: '#fff', marginBottom: 15 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <TouchableOpacity 
                  style={{ flex: 1 }} 
                  onPress={() => openDetailsInspector(item)}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontWeight: '900', fontSize: 18 }}>Table {item.table?.table_number || '?'}</Text>
                  <Text style={{ fontWeight: '700', color: COLORS.secondary, marginTop: 2, fontSize: 12 }}>
                    Code: {item.join_code} • {sessionItems.length} Items Ordered
                  </Text>
                  <Text style={styles.inspectLinkText}>TAP TO INSPECT CART {'➔'}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.qrBtn} onPress={() => handleShowQr(item.table_id)}>
                  <QrCode size={22} color="#000" />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', marginTop: 40, fontWeight: '700', color: '#999' }}>
            No active sessions.
          </Text>
        }
      />

      {/* MODAL 1: QR CODE GENERATOR */}
      <Modal visible={qrModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity onPress={() => setQrModalVisible(false)} style={styles.closeBtn}>
              <X color="#000" size={24} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>TABLE {selectedQr?.tableNumber}</Text>
            {qrLoading ? <ActivityIndicator size="large" /> : <Image source={{ uri: selectedQr?.qrCodeImage }} style={styles.qrImage} />}
            <TouchableOpacity style={styles.doneBtn} onPress={() => setQrModalVisible(false)}>
              <Text style={styles.doneBtnText}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: LIVE ORDERS DETAILS INSPECTOR PANEL */}
      <Modal visible={detailsModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: '75%', width: '90%' }]}>
            <TouchableOpacity onPress={() => setDetailsModalVisible(false)} style={styles.closeBtn}>
              <X color="#000" size={24} />
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>TABLE {inspectedSession?.table?.table_number} DETAILS</Text>
            <Text style={styles.sessionSubHeader}>JOIN CODE: {inspectedSession?.join_code}</Text>

            <ScrollView style={styles.detailsScrollView} showsVerticalScrollIndicator={false}>
              {extractSessionItems(inspectedSession).map((orderItem, idx) => (
                <View key={idx} style={styles.inspectorDetailItemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inspectorItemName}>
                      {orderItem.item?.name?.toUpperCase()} <Text style={{color: COLORS.primary}}>X{orderItem.quantity}</Text>
                    </Text>
                    
                    {orderItem.customization && (
                      <Text style={styles.inspectorCustomNotes}>PREF: {orderItem.customization.toUpperCase()}</Text>
                    )}

                    <View style={styles.inspectorMetaBadgeRow}>
                      <View style={styles.metaChip}>
                        <User size={8} color="#666" />
                        <Text style={styles.metaChipText}>BY: {orderItem.created_by?.username?.toUpperCase() || 'GUEST'}</Text>
                      </View>
                      <View style={[styles.metaChip, {backgroundColor: orderItem.paid_by_user_id ? '#C1E1C1' : '#FFD1D1'}]}>
                        <Text style={styles.metaChipText}>{orderItem.paid_by_user_id ? 'PAID' : 'UNPAID'}</Text>
                      </View>
                      <View style={styles.metaChip}>
                        <Text style={styles.metaChipText}>STATUS: {orderItem.status}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}

              {extractSessionItems(inspectedSession).length === 0 && (
                <Text style={styles.noItemsTextText}>Cart session contains no items yet.</Text>
              )}
            </ScrollView>

            <TouchableOpacity style={styles.doneBtn} onPress={() => setDetailsModalVisible(false)}>
              <Text style={styles.doneBtnText}>DISMISS INSPECTOR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  densityCard: { backgroundColor: '#000', padding: 20, marginBottom: 20, flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: '#000', shadowColor: "#000", shadowOffset: { width: 5, height: 5 }, shadowOpacity: 1, elevation: 5 },
  densityTitle: { color: '#fff', fontWeight: '900', fontSize: 14 },
  densitySubtext: { color: '#aaa', fontWeight: '700', fontSize: 12 },
  percentageCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.primary, borderWidth: 3, borderColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  percentageText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  qrBtn: { padding: 12, backgroundColor: '#FDFBEB', borderWidth: 3, borderColor: '#000' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#FDFBEB', padding: 25, borderWidth: 4, borderColor: '#000', alignItems: 'center' },
  modalTitle: { fontSize: 24, fontWeight: '900', marginBottom: 5, textAlign: 'center' },
  qrImage: { width: 250, height: 250, backgroundColor: '#fff', borderWidth: 2, borderColor: '#000', marginTop: 15 },
  closeBtn: { position: 'absolute', top: 15, right: 15, zIndex: 10 },
  doneBtn: { backgroundColor: '#000', paddingVertical: 15, paddingHorizontal: 40, marginTop: 20, width: '100%', alignItems: 'center' },
  doneBtnText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  
  // NEW DETAILS INSPECTOR SPECIFIC STYLES
  inspectLinkText: { fontSize: 10, fontWeight: '900', color: COLORS.secondary, marginTop: 8, textDecorationLine: 'underline' },
  sessionSubHeader: { fontSize: 12, fontWeight: '800', color: '#666', marginBottom: 15, letterSpacing: 0.5 },
  detailsScrollView: { width: '100%', maxHeight: '70%', marginVertical: 10 },
  inspectorDetailItemRow: { paddingVertical: 12, borderBottomWidth: 2, borderColor: '#eee' },
  inspectorItemName: { fontSize: 15, fontWeight: '900', color: '#000' },
  inspectorCustomNotes: { fontSize: 10, fontWeight: '800', color: 'red', marginTop: 2 },
  inspectorMetaBadgeRow: { flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#eee', paddingHorizontal: 6, paddingVertical: 3, borderWidth: 1, borderColor: '#000' },
  metaChipText: { fontSize: 8, fontWeight: '900', color: '#000' },
  noItemsTextText: { textAlign: 'center', marginVertical: 40, fontWeight: '800', color: '#ccc', fontSize: 13 }
});
import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, Image, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ADMIN_URL } from '../../../src/config';
import { COLORS, GLOBAL_STYLES } from '../../../src/styles/theme';
import { QrCode, MonitorDot, X } from 'lucide-react-native';

export default function LiveSessionsTab({ restaurantId, sessions, tables }) {
  const [qrModalVisible, setQrModalVisible] = React.useState(false);
  const [selectedQr, setSelectedQr] = React.useState(null);
  const [qrLoading, setQrLoading] = React.useState(false);

  // DEBUG: This will now show you if the fix in AdminDashboard worked
  useEffect(() => {
    console.log("TAB DEBUG -> sessions prop:", sessions);
  }, [sessions]);

  // Ensure sessions is at least an empty array so .length doesn't crash
  const safeSessions = sessions || [];
  const safeTables = tables || [];

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

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: '#FDFBEB' }}>
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

      <FlatList
        data={safeSessions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={[GLOBAL_STYLES.card, { backgroundColor: '#fff', marginBottom: 15 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ fontWeight: '900', fontSize: 18 }}>Table {item.table?.table_number || '?'}</Text>
                <Text style={{ fontWeight: '700', color: COLORS.primary, marginTop: 2 }}>
                  Code: {item.join_code}
                </Text>
              </View>
              <TouchableOpacity style={styles.qrBtn} onPress={() => handleShowQr(item.table_id)}>
                <QrCode size={22} color="#000" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', marginTop: 40, fontWeight: '700', color: '#999' }}>
            No active sessions.
          </Text>
        }
      />

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
  modalTitle: { fontSize: 28, fontWeight: '900', marginBottom: 20 },
  qrImage: { width: 250, height: 250, backgroundColor: '#fff', borderWidth: 2, borderColor: '#000' },
  closeBtn: { position: 'absolute', top: 15, right: 15 },
  doneBtn: { backgroundColor: '#000', paddingVertical: 15, paddingHorizontal: 40, marginTop: 25 },
  doneBtnText: { color: '#fff', fontWeight: '900' }
});
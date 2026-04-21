import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Modal, Image, StyleSheet } from 'react-native';
import { ADMIN_URL } from '../../../src/config';
import { COLORS, GLOBAL_STYLES } from '../../../src/styles/theme';
import { QrCode, MonitorDot, X } from 'lucide-react-native';

export default function LiveSessionsTab({ restaurantId }) {
  const [sessions, setSessions] = useState([]);
  const [tables, setTables] = useState([]); // Needed for density calculation
  const [loading, setLoading] = useState(true);
  
  // QR Integration States
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [selectedQr, setSelectedQr] = useState(null);

  useEffect(() => {
    const fetchLiveData = async () => {
      try {
        const res = await fetch(`${ADMIN_URL}/dashboard-data?restaurantId=${restaurantId}`);
        const json = await res.json();
        setSessions(json.activeSessions || []);
        setTables(json.tables || []); // Expecting backend to provide tables list
      } catch (e) {
        console.error("Live Data Fetch Error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchLiveData();
  }, [restaurantId]);

  // Density Logic: (Active Sessions / Total Tables) * 100
  const densityPercent = tables.length > 0 
    ? Math.round((sessions.length / tables.length) * 100) 
    : 0;

  const handleShowQr = async (tableId) => {
    try {
      const res = await fetch(`${ADMIN_URL}/tables/${tableId}/qrcode`);
      const data = await res.json();
      setSelectedQr(data);
      setQrModalVisible(true);
    } catch (e) {
      alert("Could not generate QR code");
    }
  };

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: '#FDFBEB' }}>
      {/* DENSITY TRACKING HEADER */}
      <View style={styles.densityCard}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MonitorDot color="#fff" size={18} />
            <Text style={styles.densityTitle}>LIVE DENSITY</Text>
          </View>
          <Text style={styles.densitySubtext}>
            {sessions.length} of {tables.length} tables active
          </Text>
        </View>
        <View style={styles.percentageCircle}>
          <Text style={styles.percentageText}>{densityPercent}%</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} size="large" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 120 }}
          renderItem={({ item }) => (
            <View style={[GLOBAL_STYLES.card, { borderColor: '#000', backgroundColor: '#fff' }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={{ fontWeight: '900', fontSize: 18 }}>Table {item.table?.table_number}</Text>
                  <Text style={{ fontWeight: '700', color: COLORS.primary, marginTop: 2 }}>
                    Code: {item.join_code}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#666', fontWeight: '600' }}>
                    Active since: {item.start_time ? 
                        new Date(item.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 
                        'Just now'}
                    </Text>
                </View>
                <TouchableOpacity 
                  style={styles.qrBtn} 
                  onPress={() => handleShowQr(item.table_id)}
                >
                  <QrCode size={22} color="#000" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', marginTop: 40, fontWeight: '700', color: '#999' }}>
              No active sessions currently.
            </Text>
          }
        />
      )}

      {/* QR CODE MODAL INTEGRATION */}
      <Modal visible={qrModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.closeBtn} 
              onPress={() => setQrModalVisible(false)}
            >
              <X color="#000" size={24} />
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>TABLE {selectedQr?.tableNumber}</Text>
            <Text style={styles.modalSubtitle}>Scan to join session</Text>
            
            {selectedQr?.qrCodeImage ? (
              <Image 
                source={{ uri: selectedQr.qrCodeImage }} 
                style={styles.qrImage} 
                resizeMode="contain"
              />
            ) : (
              <ActivityIndicator color={COLORS.secondary} />
            )}

            <TouchableOpacity 
              style={styles.doneBtn} 
              onPress={() => setQrModalVisible(false)}
            >
              <Text style={styles.doneBtnText}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  densityCard: { 
    backgroundColor: '#000', 
    padding: 20, 
    borderRadius: 0, 
    marginBottom: 20, 
    flexDirection: 'row', 
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
    // Neobrutalist Shadow
    shadowColor: "#000",
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    elevation: 5
  },
  densityTitle: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  densitySubtext: { color: '#aaa', fontWeight: '700', fontSize: 12, marginTop: 4 },
  percentageCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    borderWidth: 3,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center'
  },
  percentageText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  qrBtn: { 
    padding: 12, 
    backgroundColor: '#FDFBEB', 
    borderWidth: 3, 
    borderColor: '#000',
    shadowColor: "#000",
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
  },
  // Modal Styles
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.8)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  modalContent: { 
    width: '85%', 
    backgroundColor: '#FDFBEB', 
    padding: 25, 
    borderWidth: 4, 
    borderColor: '#000',
    alignItems: 'center'
  },
  modalTitle: { fontSize: 28, fontWeight: '900', marginBottom: 5 },
  modalSubtitle: { fontWeight: '700', color: '#666', marginBottom: 20 },
  qrImage: { width: 250, height: 250, backgroundColor: '#fff', borderWidth: 2, borderColor: '#000' },
  closeBtn: { position: 'absolute', top: 15, right: 15 },
  doneBtn: { 
    backgroundColor: '#000', 
    paddingVertical: 15, 
    paddingHorizontal: 40, 
    marginTop: 25,
    borderWidth: 2,
    borderColor: '#000'
  },
  doneBtnText: { color: '#fff', fontWeight: '900' }
});
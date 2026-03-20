import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function CustomAlert({ visible, title, message, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.alertBox}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.btnText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  alertBox: { width: '85%', backgroundColor: '#FDFBEB', borderWidth: 3, borderColor: '#000', padding: 25, alignItems: 'center', elevation: 10 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  message: { fontSize: 16, textAlign: 'center', marginBottom: 25, lineHeight: 22 },
  button: { backgroundColor: '#F1D1E5', borderWidth: 2, borderColor: '#000', paddingHorizontal: 40, paddingVertical: 12 },
  btnText: { fontWeight: 'bold', fontSize: 16 }
});
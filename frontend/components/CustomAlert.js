import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../src/styles/theme'; // Adjust path if necessary

export default function CustomAlert({ visible, title, message, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.alertBox, { backgroundColor: COLORS.background }]}>
          <Text style={[styles.title, { color: COLORS.secondary }]}>{title}</Text>
          <Text style={[styles.message, { color: COLORS.text }]}>{message}</Text>
          
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: COLORS.primary }]} 
            onPress={onClose}
          >
            <Text style={styles.btnText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.7)', // Slightly darker for better focus
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  alertBox: { 
    width: '85%', 
    borderWidth: 3, 
    borderColor: '#000', 
    padding: 25, 
    alignItems: 'center', 
    borderRadius: 0, // Keeping the sharp "Kafeterija" look
    elevation: 20 
  },
  title: { 
    fontSize: 22, 
    fontWeight: '900', 
    marginBottom: 12, 
    textTransform: 'uppercase', 
    letterSpacing: 1 
  },
  message: { 
    fontSize: 16, 
    textAlign: 'center', 
    marginBottom: 25, 
    lineHeight: 22,
    fontWeight: '500'
  },
  button: { 
    borderWidth: 2, 
    borderColor: '#000', 
    paddingHorizontal: 50, 
    paddingVertical: 12 
  },
  btnText: { 
    color: '#fff', // White text on soft red button
    fontWeight: '900', 
    fontSize: 16 
  }
});
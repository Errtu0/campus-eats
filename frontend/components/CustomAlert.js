import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../src/styles/theme';

export default function CustomAlert({ visible, title, message, onClose, onConfirm }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.alertBox, { backgroundColor: COLORS.background }]}>
          <Text style={[styles.title, { color: COLORS.secondary }]}>{title}</Text>
          <Text style={[styles.message, { color: COLORS.text }]}>{message}</Text>
          
          <View style={styles.buttonContainer}>
            {/* If onConfirm exists, show a Cancel button */}
            {onConfirm && (
              <TouchableOpacity 
                style={[styles.button, { backgroundColor: '#fff', marginRight: 10 }]} 
                onPress={onClose}
              >
                <Text style={[styles.btnText, { color: '#000' }]}>CANCEL</Text>
              </TouchableOpacity>
            )}

            {/* Main Action Button */}
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: onConfirm ? COLORS.primary : COLORS.secondary }]} 
              onPress={() => {
                if (onConfirm) {
                  onConfirm(); // Trigger the delete logic
                } else {
                  onClose(); // Just close for info alerts
                }
              }}
            >
              <Text style={styles.btnText}>{onConfirm ? 'CONFIRM' : 'OK'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.8)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  alertBox: { 
    width: '85%', 
    borderWidth: 4, 
    borderColor: '#000', 
    padding: 25, 
    alignItems: 'center', 
    // Neobrutalist shadow
    shadowColor: "#000",
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 1,
    elevation: 10 
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
    fontWeight: '700'
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center'
  },
  button: { 
    flex: 1,
    borderWidth: 3, 
    borderColor: '#000', 
    paddingVertical: 12,
    alignItems: 'center'
  },
  btnText: { 
    color: '#fff', 
    fontWeight: '900', 
    fontSize: 14,
    textTransform: 'uppercase'
  }
});
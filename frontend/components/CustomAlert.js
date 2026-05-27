import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../src/styles/theme';
import { X } from 'lucide-react-native'; // INJECT ACTION ICON HOOK

export default function CustomAlert({ visible, title, message, onClose, onConfirm }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.alertBox, { backgroundColor: COLORS.background || '#FDFBEB' }]}>
          
          {/* FIX: GLOBAL CORNER CLOSURE DISMISS ACTION BUTTON */}
          <View style={styles.closeBtnWrapper}>
            <TouchableOpacity 
              style={styles.closeBtn} 
              onPress={onClose}
              activeOpacity={0.9}
            >
              <X size={16} color="#000" strokeWidth={3} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.title, { color: COLORS.secondary }]}>{title}</Text>
          <Text style={[styles.message, { color: COLORS.text }]}>{message}</Text>
          
          <View style={styles.buttonContainer}>
            {/* If onConfirm exists, show a Cancel button */}
            {onConfirm && (
              <View style={[styles.actionBtnWrapper, { marginRight: 12 }]}>
                <TouchableOpacity 
                  style={[styles.button, { backgroundColor: '#fff' }]} 
                  onPress={onClose}
                  activeOpacity={0.9}
                >
                  <Text style={[styles.btnText, { color: '#000' }]}>CANCEL</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Main Action Button */}
            <View style={styles.actionBtnWrapper}>
              <TouchableOpacity 
                style={[styles.button, { backgroundColor: onConfirm ? COLORS.primary : COLORS.secondary }]} 
                onPress={() => {
                  if (onConfirm) {
                    onConfirm();
                  } else {
                    onClose();
                  }
                }}
                activeOpacity={0.9}
              >
                <Text style={styles.btnText}>{onConfirm ? 'CONFIRM' : 'OK'}</Text>
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.85)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  alertBox: { 
    width: '85%', 
    borderWidth: 4, 
    borderColor: '#000', 
    padding: 25, 
    paddingTop: 35, // Added extra top padding so title doesn't crash into the X button
    alignItems: 'center', 
    shadowColor: "#000",
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 1,
    elevation: 10,
    position: 'relative' // Anchors our absolute close button wrapper perfectly
  },
  
  // NEOBRUTALIST CORNER ANCHOR STYLING
  closeBtnWrapper: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: '#000'
  },
  closeBtn: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#000',
    padding: 6,
    transform: [{ translateX: -2 }, { translateY: -2 }]
  },

  title: { 
    fontSize: 20, 
    fontWeight: '900', 
    marginBottom: 12, 
    textTransform: 'uppercase', 
    letterSpacing: 0.5,
    textAlign: 'center'
  },
  message: { 
    fontSize: 14, 
    textAlign: 'center', 
    marginBottom: 25, 
    lineHeight: 20,
    fontWeight: '700',
    paddingHorizontal: 5
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center'
  },
  
  // 3D Shadow Wrappers for the bottom control actions
  actionBtnWrapper: {
    flex: 1,
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: '#000'
  },
  button: { 
    width: '100%',
    borderWidth: 2, 
    borderColor: '#000', 
    paddingVertical: 12,
    alignItems: 'center',
    transform: [{ translateX: -3 }, { translateY: -3 }]
  },
  btnText: { 
    color: '#fff', 
    fontWeight: '900', 
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  }
});
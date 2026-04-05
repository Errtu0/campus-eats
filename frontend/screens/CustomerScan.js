import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { COLORS, GLOBAL_STYLES } from '../src/styles/theme';
import { TABLE_URL } from '../src/config';
import CustomAlert from '../components/CustomAlert';

export default function CustomerScan({ route, navigation }) {
  const { user } = route.params;
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '' });

  const isProcessing = useRef(false);

  const showAlert = (title, message) => {
    setAlertConfig({ title, message });
    setAlertVisible(true);
  };

  if (!permission) return <View style={styles.container}><ActivityIndicator size="large" /></View>;

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Camera access is required to scan table QRs.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.btnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ data }) => {
    if (scanned || isProcessing.current) return;
    isProcessing.current = true;
    setScanned(true);

    const tableId = parseInt(data);
    if (isNaN(tableId)) {
      showAlert("Invalid QR", "This QR code is not recognized by our system.");
      return;
    }
    await connectToTable(tableId);
  };

const connectToTable = async (id) => {
  setLoading(true);
  try {
    const response = await fetch(`${TABLE_URL}/open-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableId: id, userId: user.id }),
    });
    const result = await response.json();

    if (response.ok && result.session) {
      navigation.navigate('OrderScreen', { session: result.session, user: user });
    } else if (result.message === "TABLE_OCCUPIED") {
      showAlert("Table Occupied", "Please enter the 4-digit Join Code to order with your friends.");
      setScanned(false);
    } else {
      showAlert("Error", result.error || "Could not open session.");
      setScanned(false);
    }
  } catch (e) {
    showAlert("Error", "Server connection failed.");
    setScanned(false);
  } finally {
    setLoading(false);
    isProcessing.current = false;
  }
};

  const handleManualJoin = async () => {
    if (manualCode.length < 4) return showAlert("Error", "Please enter a 4-digit code.");
    setLoading(true);
    try {
      const response = await fetch(`${TABLE_URL}/join-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ joinCode: manualCode.toUpperCase(), userId: user.id }),
      });
      const result = await response.json();
      if (response.ok) {
        navigation.navigate('OrderScreen', { session: result.session, user: user });
      } else {
        showAlert("Denied", result.error || "Session not found.");
      }
    } catch (e) {
      showAlert("Error", "Server connection failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <CustomAlert visible={alertVisible} title={alertConfig.title} message={alertConfig.message} onClose={() => setAlertVisible(false)} />
      
      <Text style={styles.title}>Welcome, {user.username}!</Text>
      <View style={styles.scannerContainer}>
        {loading && <View style={styles.loader}><ActivityIndicator size="large" color="#000" /></View>}
        <CameraView style={StyleSheet.absoluteFillObject} barcodeScannerEnabled onBarcodeScanned={scanned ? undefined : handleBarCodeScanned} />
      </View>

      <TouchableOpacity style={styles.resetBtn} onPress={() => { setScanned(false); isProcessing.current = false; }}>
        <Text style={styles.resetBtnText}>{scanned ? "Tap to Scan Again" : "Align QR within the frame"}</Text>
      </TouchableOpacity>

      <View style={styles.manualContainer}>
        <TextInput style={styles.input} placeholder="JOIN CODE" autoCapitalize="characters" maxLength={4} onChangeText={setManualCode} />
        <TouchableOpacity style={styles.button} onPress={handleManualJoin}>
          <Text style={styles.btnText}>JOIN TABLE</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// Updated styles for CustomerDashboard.js
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background, // Use your Cream color
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 20 
  },
  title: { 
    fontSize: 24, 
    fontWeight: '900', 
    marginBottom: 20, 
    textTransform: 'uppercase',
    color: COLORS.secondary // Use your Blueish color
  },
  scannerContainer: { 
    width: 280, 
    height: 280, 
    borderWidth: 3, 
    borderColor: COLORS.black, 
    borderRadius: 20, 
    overflow: 'hidden' 
  },
  input: { 
    width: 280, // Match your standard button width
    backgroundColor: '#fff', 
    borderWidth: 2, 
    borderColor: COLORS.black, 
    padding: 12, 
    textAlign: 'center', 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 15,
    borderRadius: 8
  },
  button: { 
    backgroundColor: COLORS.primary, // Use your Soft Red
    width: 280, 
    height: 55, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 2, 
    borderColor: COLORS.black,
    borderRadius: 8
  },
  btnText: { 
    color: '#FFF', 
    fontWeight: '900', 
    fontSize: 16 
  }
});
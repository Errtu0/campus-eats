import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { COLORS, GLOBAL_STYLES } from '../../../src/styles/theme';
import { TABLE_URL } from '../../../src/config';
import CustomAlert from '../../../components/CustomAlert';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CustomerScan({ route, navigation }) {
  // restaurantId comes from the previous screen (Home/Restaurant List)
  const { user, restaurantId } = route.params; 
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

    // Some QR generators add extra text. We clean it to just get the ID number.
    const tableId = parseInt(data.replace(/[^0-9]/g, '')); 
    
    if (isNaN(tableId)) {
      setScanned(false);
      isProcessing.current = false;
      showAlert("Invalid QR", "This QR code format is not recognized.");
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
        body: JSON.stringify({ 
            tableId: parseInt(id), 
            userId: user.id, 
            restaurantId: parseInt(restaurantId) // STRICT VALIDATION
        }),
      });
      
      const result = await response.json();

      if (response.ok && result.session) {
        const currentRestId = result.session.table?.restaurant_id || result.restaurantId;
        
        const sessionData = { 
          ...result.session, 
          restaurantName: result.restaurantName,
          restaurant_id: currentRestId 
        };
        
        await AsyncStorage.setItem('active_session', JSON.stringify(sessionData));

        navigation.navigate('OrderScreen', { 
          session: sessionData, 
          user: user, 
          restaurantName: result.restaurantName,
          restaurantId: currentRestId
        });
      } else {
        setScanned(false);
        isProcessing.current = false;
        // This is where "This table belongs to another branch" comes from
        showAlert("Scan Failed", result.error || "Could not open session.");
      }
    } catch (e) {
      setScanned(false);
      isProcessing.current = false;
      showAlert("Error", "Server connection failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualJoin = async () => {
    if (manualCode.length < 4) return showAlert("Error", "Please enter a 4-digit code.");
    setLoading(true);
    try {
      const response = await fetch(`${TABLE_URL}/join-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            joinCode: manualCode.toUpperCase(), 
            userId: user.id,
            restaurantId: parseInt(restaurantId) // Ensure user is joining the right branch
        }),
      });
      const result = await response.json();

      if (response.ok) {
        const rId = result.session.table?.restaurant_id || result.restaurantId;
        const sessionData = { 
          ...result.session, 
          restaurantName: result.restaurantName, 
          restaurant_id: rId 
        };
        
        await AsyncStorage.setItem('active_session', JSON.stringify(sessionData));

        navigation.navigate('OrderScreen', { 
          session: sessionData, 
          user: user, 
          restaurantName: result.restaurantName, 
          restaurantId: rId
        });
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
        {loading && <View style={styles.loader}><ActivityIndicator size="large" color={COLORS.primary} /></View>}
        <CameraView 
            style={StyleSheet.absoluteFillObject} 
            barcodeScannerEnabled 
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned} 
        />
      </View>

      <TouchableOpacity 
        style={styles.resetBtn} 
        onPress={() => { setScanned(false); isProcessing.current = false; }}
      >
        <Text style={styles.resetBtnText}>
            {scanned ? "TAP TO SCAN AGAIN" : "ALIGN QR WITHIN THE FRAME"}
        </Text>
      </TouchableOpacity>

      <View style={styles.manualContainer}>
        <TextInput 
            style={styles.input} 
            placeholder="JOIN CODE" 
            placeholderTextColor="#999"
            autoCapitalize="characters" 
            maxLength={4} 
            onChangeText={setManualCode} 
        />
        <TouchableOpacity style={styles.button} onPress={handleManualJoin}>
          <Text style={styles.btnText}>JOIN TABLE</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: '900', marginBottom: 20, textTransform: 'uppercase', color: COLORS.secondary },
  scannerContainer: { width: 280, height: 280, borderWidth: 4, borderColor: '#000', borderRadius: 0, overflow: 'hidden' },
  loader: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  resetBtn: { marginVertical: 20, padding: 10 },
  resetBtnText: { fontWeight: '900', color: COLORS.primary, letterSpacing: 1 },
  manualContainer: { marginTop: 10, alignItems: 'center' },
  input: { width: 280, backgroundColor: '#fff', borderWidth: 3, borderColor: '#000', padding: 15, textAlign: 'center', fontSize: 18, fontWeight: '900', marginBottom: 15 },
  button: { backgroundColor: COLORS.primary, width: 280, height: 60, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#000' },
  btnText: { color: '#FFF', fontWeight: '900', fontSize: 16, letterSpacing: 1 },
  text: { textAlign: 'center', marginBottom: 20, fontWeight: '700' }
});
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { AUTH_URL } from '../src/config';
import CustomAlert from '../components/CustomAlert';

export default function SignInScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpRequired, setIsOtpRequired] = useState(false);
  const [userId, setUserId] = useState(null);

  // Custom Alert state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '' });

  const showAlert = (title, message) => {
    setAlertConfig({ title, message });
    setAlertVisible(true);
  };

  const handleSignIn = async () => {
    if (!username || !password) return showAlert("Error", "Please enter credentials.");

    try {
      const response = await fetch(`${AUTH_URL}/login-signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();

      if (data.message === "OTP_REQUIRED") {
        setUserId(data.userId);
        setIsOtpRequired(true);
        showAlert("Security Check", "OTP required for Staff/Admin access. Check console.");
      } else if (data.message === "LOGIN_SUCCESS") {
        navigation.replace('CustomerDashboard', { user: data.user });
      } else {
        showAlert("Error", "Invalid username or password.");
      }
    } catch (e) {
      showAlert("Error", "Server unreachable. check your IP.");
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) return showAlert("Error", "Enter the 6-digit code.");

    try {
      const response = await fetch(`${AUTH_URL}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, otp }),
      });
      const data = await response.json();

      if (response.ok && data.message === "LOGIN_SUCCESS") {
        // Redirect based on role
        const target = data.user.role === 'ADMIN' ? 'AdminDashboard' : 'StaffDashboard';
        navigation.replace(target, { user: data.user });
      } else {
        showAlert("Error", "Invalid or expired OTP.");
      }
    } catch (e) {
      showAlert("Error", "Verification failed.");
    }
  };

  return (
    <View style={styles.container}>
      <CustomAlert 
        visible={alertVisible} 
        title={alertConfig.title} 
        message={alertConfig.message} 
        onClose={() => setAlertVisible(false)} 
      />

      <Text style={styles.header}>CampusEats</Text>
      
      {!isOtpRequired ? (
        <View style={{ width: '100%' }}>
          <Text style={styles.subtext}>Sign in to your account</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Username" 
            onChangeText={(text) => setUsername(text.trim())} // Add .trim()
            autoCapitalize="none" 
          />
          <TextInput 
            style={styles.input} 
            placeholder="Password" 
            secureTextEntry 
            onChangeText={(text) => setPassword(text.trim())} // Add .trim()
          />
          <TouchableOpacity style={styles.primaryBtn} onPress={handleSignIn}>
            <Text style={styles.btnText}>Login / Sign Up</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ width: '100%' }}>
          <Text style={styles.subtext}>Enter the 6-digit code sent to you</Text>
          <TextInput style={styles.input} placeholder="OTP Code" keyboardType="numeric" maxLength={6} onChangeText={setOtp} />
          <TouchableOpacity style={styles.primaryBtn} onPress={handleVerifyOtp}>
            <Text style={styles.btnText}>Verify & Continue</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
        <Text style={styles.backText}>← Back to Welcome</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBEB', padding: 25, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 32, fontWeight: '900', marginBottom: 10, textTransform: 'uppercase' },
  subtext: { marginBottom: 30, textAlign: 'center', color: '#666', fontSize: 16 },
  input: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#000', padding: 18, marginBottom: 20, fontSize: 16, width: '100%' },
  primaryBtn: { backgroundColor: '#F1D1E5', borderWidth: 2, borderColor: '#000', padding: 20, alignItems: 'center', width: '100%' },
  btnText: { fontWeight: 'bold', fontSize: 18, textTransform: 'uppercase' },
  backText: { fontWeight: '600', color: '#000', textDecorationLine: 'underline' }
});
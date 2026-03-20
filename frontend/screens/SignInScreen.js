import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { AUTH_URL } from '../src/config';

export default function SignInScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpRequired, setIsOtpRequired] = useState(false);
  const [userId, setUserId] = useState(null);

  const handleSignIn = async () => {
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
      } else if (data.message === "LOGIN_SUCCESS") {
        navigation.replace('CustomerDashboard', { user: data.user });
      } else {
        Alert.alert("Error", "Invalid username or password.");
      }
    } catch (e) {
      Alert.alert("Error", "Connection failed. Check your IP in config.js.");
    }
  };

  const handleVerifyOtp = async () => {
    try {
      const response = await fetch(`${AUTH_URL}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, otp }),
      });
      const data = await response.json();

      if (data.message === "LOGIN_SUCCESS") {
        // Direct to appropriate portal based on role
        const target = data.user.role === 'ADMIN' ? 'AdminDashboard' : 'StaffDashboard';
        navigation.replace(target, { user: data.user });
      } else {
        Alert.alert("Error", "Invalid or expired OTP.");
      }
    } catch (e) {
      Alert.alert("Error", "OTP verification failed.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Sign In</Text>
      {!isOtpRequired ? (
        <View style={{ width: '100%' }}>
          <TextInput style={styles.input} placeholder="Username" onChangeText={setUsername} autoCapitalize="none" />
          <TextInput style={styles.input} placeholder="Password" secureTextEntry onChangeText={setPassword} />
          <TouchableOpacity style={styles.primaryBtn} onPress={handleSignIn}>
            <Text style={styles.btnText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ width: '100%' }}>
          <Text style={styles.subtext}>Enter the 6-digit code from your console</Text>
          <TextInput style={styles.input} placeholder="OTP Code" keyboardType="numeric" onChangeText={setOtp} />
          <TouchableOpacity style={styles.primaryBtn} onPress={handleVerifyOtp}>
            <Text style={styles.btnText}>Verify & Login</Text>
          </TouchableOpacity>
        </View>
      )}
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBEB', padding: 25, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 36, fontWeight: 'bold', marginBottom: 40, letterSpacing: 1 },
  input: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#000', padding: 18, marginBottom: 20, fontSize: 16, width: '100%' },
  primaryBtn: { backgroundColor: '#F1D1E5', borderWidth: 2, borderColor: '#000', padding: 20, alignItems: 'center', width: '100%' },
  btnText: { fontWeight: 'bold', fontSize: 18, textTransform: 'uppercase' },
  subtext: { marginBottom: 15, textAlign: 'center', color: '#555', fontSize: 14 },
  backText: { marginTop: 25, fontWeight: '600', color: '#333' }
});
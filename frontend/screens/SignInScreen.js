import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';

export default function SignInScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpRequired, setIsOtpRequired] = useState(false);
  const [userId, setUserId] = useState(null);

  const handleSignIn = async () => {
    try {
      const response = await fetch("http://YOUR_IP:3000/api/auth/login-signup", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();

      if (data.message === "OTP_REQUIRED") {
        setUserId(data.userId);
        setIsOtpRequired(true);
      } else if (data.message === "LOGIN_SUCCESS") {
        Alert.alert("Success", "Welcome!");
        // Navigate based on data.user.role
      }
    } catch (e) { Alert.alert("Error", "Server unreachable"); }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Sign In</Text>
      {!isOtpRequired ? (
        <>
          <TextInput style={styles.input} placeholder="Username" onChangeText={setUsername} />
          <TextInput style={styles.input} placeholder="Password" secureTextEntry onChangeText={setPassword} />
          <TouchableOpacity style={styles.primaryBtn} onPress={handleSignIn}>
            <Text style={styles.btnText}>Sign In</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.subtext}>Enter the 6-digit code sent to you</Text>
          <TextInput style={styles.input} placeholder="OTP Code" keyboardType="numeric" onChangeText={setOtp} />
          <TouchableOpacity style={styles.primaryBtn} onPress={() => {/* Call verify-otp API */}}>
            <Text style={styles.btnText}>Verify & Login</Text>
          </TouchableOpacity>
        </>
      )}
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBEB', padding: 20, justifyContent: 'center' },
  header: { fontSize: 32, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' },
  input: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#000', padding: 15, marginBottom: 15, fontSize: 16 },
  primaryBtn: { backgroundColor: '#F1D1E5', borderWidth: 2, borderColor: '#000', padding: 18, alignItems: 'center' },
  btnText: { fontWeight: 'bold', fontSize: 18 },
  subtext: { marginBottom: 10, textAlign: 'center', color: '#666' },
  backText: { marginTop: 20, textAlign: 'center', fontWeight: '500' }
});
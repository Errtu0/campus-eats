import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { AUTH_URL } from '../src/config';

export default function RegisterScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    if (!username || !password) return Alert.alert("Error", "All fields are required.");

    try {
      const response = await fetch(`${AUTH_URL}/login-signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role: 'CUSTOMER' }),
      });
      
      if (response.ok) {
        Alert.alert("Success", "Account created! You can now sign in.");
        navigation.navigate('SignIn');
      } else {
        const err = await response.json();
        Alert.alert("Error", err.error || "Username already taken.");
      }
    } catch (e) {
      Alert.alert("Error", "Connection failed.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Register</Text>
      <TextInput style={styles.input} placeholder="Choose Username" onChangeText={setUsername} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Choose Password" secureTextEntry onChangeText={setPassword} />
      
      <TouchableOpacity style={styles.primaryBtn} onPress={handleRegister}>
        <Text style={styles.btnText}>Create Account</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
        <Text style={styles.backText}>Have an account? Sign In</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBEB', padding: 25, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 36, fontWeight: 'bold', marginBottom: 40 },
  input: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#000', padding: 18, marginBottom: 20, width: '100%' },
  primaryBtn: { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#000', padding: 20, alignItems: 'center', width: '100%' },
  btnText: { fontWeight: 'bold', fontSize: 18, textTransform: 'uppercase' },
  backText: { marginTop: 25 }
});
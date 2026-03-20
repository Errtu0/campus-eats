import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';

export default function RegisterScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    // Logic similar to SignIn but strictly for creating new CUSTOMER role
    Alert.alert("Account Created", "You can now sign in.");
    navigation.navigate('SignIn');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Create Account</Text>
      <TextInput style={styles.input} placeholder="Choose Username" onChangeText={setUsername} />
      <TextInput style={styles.input} placeholder="Choose Password" secureTextEntry onChangeText={setPassword} />
      
      <TouchableOpacity style={styles.primaryBtn} onPress={handleRegister}>
        <Text style={styles.btnText}>Register</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
        <Text style={styles.backText}>Already have an account? Sign In</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBEB', padding: 20, justifyContent: 'center' },
  header: { fontSize: 32, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' },
  input: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#000', padding: 15, marginBottom: 15 },
  primaryBtn: { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#000', padding: 18, alignItems: 'center' },
  btnText: { fontWeight: 'bold', fontSize: 18 },
  backText: { marginTop: 20, textAlign: 'center' }
});
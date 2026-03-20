import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';

export default function WelcomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.logoText}>CampusEats</Text>
      
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: '#F1D1E5' }]} 
        onPress={() => navigation.navigate('SignIn')}
      >
        <Text style={styles.buttonText}>Sign In</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: '#FFFFFF' }]} 
        onPress={() => navigation.navigate('Register')}
      >
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.guestLink} onPress={() => {/* Call Guest API */}}>
        <Text style={styles.guestText}>☕ Continue as guest</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBEB', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 100 },
  button: { width: '90%', height: 60, borderWidth: 2, borderColor: '#000', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  buttonText: { fontSize: 18, fontWeight: '600' },
  guestLink: { marginTop: 20 },
  guestText: { fontSize: 16, color: '#333' }
});
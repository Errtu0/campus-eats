import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { AUTH_URL } from '../src/config';
import { COLORS, GLOBAL_STYLES } from '../src/styles/theme';
import CustomAlert from '../components/CustomAlert';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RegisterScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '' });

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true })
    ]).start();
  }, []);

  const showAlert = (title, message) => {
    setAlertConfig({ title, message });
    setAlertVisible(true);
  };

  const handleRegister = async () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      return showAlert("MISSING DATA", "Please populate all fields to proceed.");
    }
    
    // Client-side quick check matching our cryptographic backend rules
    if (password.length < 8) {
      return showAlert("WEAK PASSWORD", "Password must be at least 8 characters long.");
    }

    try {
      const response = await fetch(`${AUTH_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: username.trim(), 
          email: email.trim().toLowerCase(), 
          password 
        }),
      });

      const data = await response.json();

      if (response.ok && data.message === "REGISTRATION_SUCCESS") {
        await AsyncStorage.setItem('userToken', data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(data.user));
        navigation.replace('RestaurantPicker', { user: data.user });
      } else {
        // Intercepts structural schema errors seamlessly
        showAlert("REGISTRATION DENIED", data.error || "Username or email already registered.");
      }
    } catch (e) {
      showAlert("OFFLINE", "Campus gateway server unreachable.");
    }
  };

  return (
    <View style={GLOBAL_STYLES.container}>
      <CustomAlert 
        visible={alertVisible} 
        title={alertConfig.title} 
        message={alertConfig.message} 
        onClose={() => setAlertVisible(false)} 
      />

      <Animated.View style={[styles.innerContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Text style={[styles.header, { color: COLORS.secondary }]}>Register</Text>
        
        <TextInput 
          style={[GLOBAL_STYLES.input, { textAlign: 'center' }]} 
          placeholder="Username" 
          placeholderTextColor="#999"
          onChangeText={setUsername} 
          autoCapitalize="none" 
        />
        
        <TextInput 
          style={[GLOBAL_STYLES.input, { textAlign: 'center' }]} 
          placeholder="Email Address" 
          placeholderTextColor="#999"
          keyboardType="email-address"
          onChangeText={setEmail} 
          autoCapitalize="none" 
        />
        
        <TextInput 
          style={[GLOBAL_STYLES.input, { textAlign: 'center' }]} 
          placeholder="Password" 
          placeholderTextColor="#999"
          secureTextEntry 
          onChangeText={setPassword} 
        />
        
        <TouchableOpacity 
          style={[GLOBAL_STYLES.button, { backgroundColor: COLORS.primary, marginTop: 10 }]} 
          onPress={handleRegister}
        >
          <Text style={GLOBAL_STYLES.buttonText}>Create Account</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('SignIn')} style={{ marginTop: 25 }}>
          <Text style={[styles.backText, { color: COLORS.secondary }]}>Have an account? Sign In</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  innerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' },
  header: { fontSize: 36, fontWeight: '900', marginBottom: 40, textTransform: 'uppercase' },
  backText: { fontWeight: '700', textDecorationLine: 'underline' }
});
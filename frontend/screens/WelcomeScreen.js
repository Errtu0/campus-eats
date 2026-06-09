import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Animated, ActivityIndicator } from 'react-native';
import { COLORS, GLOBAL_STYLES } from '../src/styles/theme';
import { AUTH_URL } from '../src/config'; // 🚀 Import authentication server endpoint
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function WelcomeScreen({ navigation }) {
  const [loadingGuest, setLoadingGuest] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current; 
  const slideAnim = useRef(new Animated.Value(30)).current; 

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true, 
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  // 🚀 HANDLER: PROVISIONS ON-DEMAND ONE-TIME ANONYMOUS SESSIONS
  const handleGuestEntrance = async () => {
    if (loadingGuest) return;
    setLoadingGuest(true);

    try {
      const response = await fetch(`${AUTH_URL}/guest-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (response.ok && data.message === "GUEST_LOGIN_SUCCESS") {
        // Cache credentials into device memory spaces
        await AsyncStorage.setItem('userToken', data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(data.user));

        console.log(`[Guest Portal] Successfully handshaked as: ${data.user.username}`);
        
        // Push guest directly into the campus loop selector gateway
        navigation.replace('RestaurantPicker', { user: data.user });
      } else {
        console.error("Guest Auth Rejection Payload:", data.error);
      }
    } catch (error) {
      console.error("Failed to connect with registration gateways:", error.message);
    } finally {
      setLoadingGuest(false);
    }
  };

  return (
    <View style={GLOBAL_STYLES.container}>
      <View style={styles.contentContainer}>

        <Image 
          source={require('../assets/logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />

        {/* Animated Buttons Container */}
        <Animated.View style={{ 
          width: '100%', 
          alignItems: 'center', 
          opacity: fadeAnim, 
          transform: [{ translateY: slideAnim }] 
        }}>
          <TouchableOpacity 
            style={[GLOBAL_STYLES.button, { backgroundColor: COLORS.primary }]} 
            onPress={() => navigation.navigate('SignIn')}
            disabled={loadingGuest}
          >
            <Text style={GLOBAL_STYLES.buttonText}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[GLOBAL_STYLES.button, { backgroundColor: COLORS.secondary, marginTop: 15 }]} 
            onPress={() => navigation.navigate('Register')}
            disabled={loadingGuest}
          >
            <Text style={GLOBAL_STYLES.buttonText}>Register</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.guestLink} 
            onPress={handleGuestEntrance}
            disabled={loadingGuest}
          >
            {loadingGuest ? (
              <ActivityIndicator color={COLORS.secondary} size="small" />
            ) : (
              <Text style={styles.guestText}>☕ Continue as guest</Text>
            )}
          </TouchableOpacity>
        </Animated.View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 50,
  },
  logo: {
    width: 300,
    height: 300,
    marginBottom: 40,
  },
  guestLink: { marginTop: 25, height: 30, justifyContent: 'center' },
  guestText: { 
    fontSize: 16, 
    color: COLORS.text, 
    fontWeight: '600', 
    textDecorationLine: 'underline' 
  }
});
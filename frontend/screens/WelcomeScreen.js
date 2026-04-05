import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Animated } from 'react-native';
import { COLORS, GLOBAL_STYLES } from '../src/styles/theme';

export default function WelcomeScreen({ navigation }) {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current; // For logo and buttons
  const slideAnim = useRef(new Animated.Value(30)).current; // For sliding buttons up

  useEffect(() => {
    // Standard React Native Animation sequence
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true, // High performance
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

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
          >
            <Text style={GLOBAL_STYLES.buttonText}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[GLOBAL_STYLES.button, { backgroundColor: COLORS.secondary, marginTop: 15 }]} 
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={GLOBAL_STYLES.buttonText}>Register</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.guestLink} onPress={() => {}}>
            <Text style={styles.guestText}>☕ Continue as guest</Text>
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
  guestLink: { marginTop: 25 },
  guestText: { 
    fontSize: 16, 
    color: COLORS.text, 
    fontWeight: '600', 
    textDecorationLine: 'underline' 
  }
});
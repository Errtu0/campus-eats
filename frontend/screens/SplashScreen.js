import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import LottieView from 'lottie-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../src/styles/theme'; // Centralized colors

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ navigation }) {
  const animation = useRef(null);

  useEffect(() => {
    const checkAuthAndNavigate = async () => {
      try {
        // 1. Get the token and user data from storage
        const token = await AsyncStorage.getItem('userToken');
        const userData = await AsyncStorage.getItem('userData');

        // 2. We still wait for your 4000ms (4s) splash duration
        setTimeout(() => {
          if (token && userData) {
            const user = JSON.parse(userData);

            // 3. Redirection Logic based on Role
            if (user.role === 'ADMIN') {
              navigation.replace('RestaurantSelectScreen', { user });
            } else if (user.role === 'STAFF') {
              navigation.replace('StaffDashboard', { user });
            } else {
              // Customer Role
              navigation.replace('RestaurantPicker', { user });
            }
          } else {
            // No session found, go to Welcome
            navigation.replace('Welcome');
          }
        }, 4000);

      } catch (error) {
        console.error("Auth check failed:", error);
        // Fallback to Welcome on error after 4 seconds
        setTimeout(() => {
          navigation.replace('Welcome');
        }, 4000);
      }
    };

    checkAuthAndNavigate();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <LottieView
        autoPlay
        ref={animation}
        style={styles.animationStyle}
        source={require('../assets/animations/splash_anim.json')}
        loop={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background, // Fixed to Cream
    justifyContent: 'center',
    alignItems: 'center',
  },
  animationStyle: {
    width: width,
    height: height,
  },
});
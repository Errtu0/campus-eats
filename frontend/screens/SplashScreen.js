import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import LottieView from 'lottie-react-native';
import { COLORS } from '../src/styles/theme'; // Centralized colors

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ navigation }) {
  const animation = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Welcome');
    }, 4000); 
    return () => clearTimeout(timer);
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
import React, { useEffect } from 'react';
import { View, Image, StyleSheet, ActivityIndicator } from 'react-native';

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    // Simulate loading assets/data for 3 seconds
    setTimeout(() => {
      navigation.replace('Welcome');
    }, 3000);
  }, []);

  return (
    <View style={styles.container}>
      <Image 
        source={require('../assets/logo.png')} // Place your logo here
        style={styles.logo}
        resizeMode="contain"
      />
      <ActivityIndicator size="large" color="#00A86B" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBEB', justifyContent: 'center', alignItems: 'center' },
  logo: { width: 200, height: 200, marginBottom: 20 }
});
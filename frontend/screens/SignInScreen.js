import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { AUTH_URL } from '../src/config';
import { COLORS, GLOBAL_STYLES } from '../src/styles/theme';
import CustomAlert from '../components/CustomAlert';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function SignInScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpRequired, setIsOtpRequired] = useState(false);
  const [userId, setUserId] = useState(null);

  const slideX = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '' });

  const showAlert = (title, message) => {
    setAlertConfig({ title, message });
    setAlertVisible(true);
  };

  const handleSignIn = async () => {
    if (!username.trim() || !password.trim()) {
      return showAlert("ERROR", "Please enter your credentials.");
    }
    try {
      const response = await fetch(`${AUTH_URL}/login-signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      
      const data = await response.json();

      if (response.status === 404 && data.error === "USER_NOT_FOUND") {
        navigation.navigate('Register');
        return;
      }

      if (!response.ok) {
        // CATCHES SECURE BCRYPT PASSWORD REJECTIONS DIRECTLY
        return showAlert("ACCESS DENIED", data.error || "Invalid username or password configuration.");
      }

      if (data.message === "OTP_REQUIRED") {
        setUserId(data.userId);
        transitionToOtp(); 
      } else if (data.message === "LOGIN_SUCCESS") {
        await AsyncStorage.setItem('userToken', data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(data.user));

        if (data.user.role === 'ADMIN') {
          navigation.replace('RestaurantSelectScreen', { user: data.user });
        } else if (data.user.role === 'STAFF') {
          navigation.replace('StaffDashboard', { user: data.user });
        } else {
          navigation.replace('RestaurantPicker', { user: data.user });
        }
      }
    } catch (e) {
      showAlert("CONNECTION ERROR", "The network cluster appears offline.");
    }
  };

  const transitionToOtp = () => {
    setOtp('');
    Animated.parallel([
      Animated.timing(slideX, { toValue: -width, duration: 400, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true })
    ]).start(() => {
      setIsOtpRequired(true);
      slideX.setValue(width);
      
      Animated.parallel([
        Animated.timing(slideX, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true })
      ]).start();
    });
  };

  const handleVerifyOtp = async (otpCode) => {
    const codeToVerify = typeof otpCode === 'string' ? otpCode : otp;
    if (!userId || !codeToVerify) {
      return showAlert("ERROR", "Missing verification details.");
    }

    try {
      const response = await fetch(`${AUTH_URL}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId, otp: codeToVerify }),
      });

      const data = await response.json();

      if (response.ok && data.message === "LOGIN_SUCCESS") {
        await AsyncStorage.setItem('userToken', data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(data.user));
        navigation.replace(data.user.role === 'ADMIN' ? 'RestaurantSelectScreen' : 'StaffDashboard', { user: data.user });
      } else {
        showAlert("VERIFICATION FAILED", data.error || "Invalid OTP code string entries.");
      }
    } catch (e) {
      showAlert("SYSTEM ERROR", e.message); 
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

      <Animated.View style={[styles.innerContainer, { opacity: fadeAnim, transform: [{ translateX: slideX }] }]}>
        {!isOtpRequired ? (
          <View style={{ width: '100%', alignItems: 'center' }}>
            <Text style={[styles.header, { color: COLORS.secondary }]}>SIGN IN</Text>
            
            <TextInput
              style={[GLOBAL_STYLES.input, styles.inputOverride]}
              placeholder="Username"
              placeholderTextColor="#999"
              onChangeText={setUsername}
              autoCapitalize="none"
            />
            <TextInput
              style={[GLOBAL_STYLES.input, styles.inputOverride]}
              placeholder="Password"
              placeholderTextColor="#999"
              secureTextEntry
              onChangeText={setPassword}
            />
            
            <TouchableOpacity style={[GLOBAL_STYLES.button, { backgroundColor: COLORS.primary }]} onPress={handleSignIn}>
              <Text style={GLOBAL_STYLES.buttonText}>Login / Sign Up</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ width: '100%', alignItems: 'center' }}>
            <Text style={[styles.header, { color: COLORS.secondary }]}>VERIFY</Text>
            <Text style={styles.subtext}>Enter the 6-digit code sent to your phone</Text>
            
            <TextInput
              style={[GLOBAL_STYLES.input, styles.inputOverride]}
              placeholder="OTP Code"
              placeholderTextColor="#999"
              keyboardType="numeric"
              maxLength={6}
              value={otp}
              onChangeText={setOtp}
              textContentType="oneTimeCode"
              autoComplete="one-time-code"
            />
            
            <TouchableOpacity style={[GLOBAL_STYLES.button, { backgroundColor: COLORS.secondary }]} onPress={() => handleVerifyOtp(otp)}>
              <Text style={GLOBAL_STYLES.buttonText}>Verify & Continue</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
          <Text style={[styles.backText, { color: COLORS.secondary }]}>← Back to Welcome</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  innerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' },
  header: { fontSize: 32, fontWeight: '900', marginBottom: 10, textTransform: 'uppercase', textAlign: 'center' },
  subtext: { marginBottom: 30, textAlign: 'center', color: '#000', fontSize: 14, width: 280 },
  inputOverride: { textAlign: 'center' },
  backText: { fontWeight: '700', textDecorationLine: 'underline' }
});
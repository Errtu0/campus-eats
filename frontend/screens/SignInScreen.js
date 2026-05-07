import React, { useState, useEffect, useRef } from 'react';

import { View, Text, TextInput, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';

import {AUTH_URL} from '../src/config';

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



  // Animation values: slideX handles the horizontal movement, fadeAnim handles visibility

  const slideX = useRef(new Animated.Value(0)).current;

  const fadeAnim = useRef(new Animated.Value(1)).current;



  const [alertVisible, setAlertVisible] = useState(false);

  const [alertConfig, setAlertConfig] = useState({ title: '', message: '' });



  const showAlert = (title, message) => {

    setAlertConfig({ title, message });

    setAlertVisible(true);

  };



  const handleSignIn = async () => {
  if (!username || !password) return showAlert("Error", "Please enter credentials.");
  try {
    const response = await fetch(`${AUTH_URL}/login-signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    
    const data = await response.json();

    if (response.status === 404 && data.error === "USER_NOT_FOUND") {
      navigation.navigate('Register');
      return;
    }

    if (data.message === "OTP_REQUIRED") {
      setUserId(data.userId);
      transitionToOtp(); 
    } else if (data.message === "LOGIN_SUCCESS") {
      // --- NEW: SAVE TOKEN ---
      await AsyncStorage.setItem('userToken', data.token);
      await AsyncStorage.setItem('userData', JSON.stringify(data.user));

      // Navigation Logic (Keep your existing role-based checks)
      if (data.user.role === 'ADMIN') {
        navigation.replace('RestaurantSelectScreen', { user: data.user });
      } else if (data.user.role === 'STAFF') {
        navigation.replace('StaffDashboard', { user: data.user });
      } else {
        navigation.replace('RestaurantPicker', { user: data.user });
      }
    } else {
      showAlert("Error", data.error || "Invalid credentials.");
    }
  } catch (e) {
    console.log("Full Error:", e);
    // FIX: Use e.message instead of just e to avoid cyclical structure error
    showAlert("Error", e.message || "Server unreachable.");
  }
};



  const transitionToOtp = () => {

    // FIX: Clear OTP state immediately so it doesn't carry over username

    setOtp('');



    Animated.parallel([

      // Slide current Login UI out to the left

      Animated.timing(slideX, {

        toValue: -width,

        duration: 400,

        useNativeDriver: true,

      }),

      Animated.timing(fadeAnim, {

        toValue: 0,

        duration: 400,

        useNativeDriver: true,

      })

    ]).start(() => {

      // Logic switch

      setIsOtpRequired(true);

     

      // Reset position to the right for the incoming OTP UI

      slideX.setValue(width);

     

      Animated.parallel([

        // Slide the OTP UI in from the right to the center

        Animated.timing(slideX, {

          toValue: 0,

          duration: 400,

          useNativeDriver: true,

        }),

        Animated.timing(fadeAnim, {

          toValue: 1,

          duration: 400,

          useNativeDriver: true,

        })

      ]).start();

    });

  };



const handleVerifyOtp = async (otpCode) => {
  // Ensure we are getting the string value from state
  const codeToVerify = typeof otpCode === 'string' ? otpCode : otp;

  console.log("Attempting verification for User ID:", userId, "with code:", codeToVerify);
  
  if (!userId || !codeToVerify) {
    showAlert("Error", "Missing verification details.");
    return;
  }

  try {
    const response = await fetch(`${AUTH_URL}/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        userId: userId, // The backend handles parseInt(userId) now, so this is safe
        otp: codeToVerify 
      }),
    });

    const data = await response.json();

    if (response.ok && data.message === "LOGIN_SUCCESS") {
      await AsyncStorage.setItem('userToken', data.token);
      await AsyncStorage.setItem('userData', JSON.stringify(data.user));
      navigation.replace(data.user.role === 'ADMIN' ? 'RestaurantSelectScreen' : 'StaffDashboard', { user: data.user });
    } else {
      showAlert("Error", data.error || "Invalid OTP.");
    }
  } catch (e) {
    console.error("OTP SCREEN CRASH:", e.message);
    showAlert("System Error", e.message); 
  }
};

  return (

    <View style={GLOBAL_STYLES.container}>

      <CustomAlert

        visible={alertVisible}

        title={alertConfig.title}

        message={alertConfig.message}

        onClose={() => setAlertVisible(false)}

        primaryColor={COLORS.primary}

        secondaryColor={COLORS.secondary}

        backgroundColor={COLORS.background}

      />



      <Animated.View

        style={[

          styles.innerContainer,

          { opacity: fadeAnim, transform: [{ translateX: slideX }] }

        ]}

      >

        {!isOtpRequired ? (

          <View style={{ width: '100%', alignItems: 'center' }}>

            <Text style={[styles.header, { color: COLORS.secondary }]}>SIGN IN</Text>

           

           

            <TextInput

              style={[GLOBAL_STYLES.input, styles.inputOverride]}

              placeholder="Username"

              placeholderTextColor="#999"

              onChangeText={(text) => setUsername(text.trim())}

              autoCapitalize="none"

            />

            <TextInput

              style={[GLOBAL_STYLES.input, styles.inputOverride]}

              placeholder="Password"

              placeholderTextColor="#999"

              secureTextEntry

              onChangeText={(text) => setPassword(text.trim())}

            />

           

            <TouchableOpacity

              style={[GLOBAL_STYLES.button, { backgroundColor: COLORS.primary }]}

              onPress={handleSignIn}

            >

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

              value={otp} // Ensures the box is empty on load

              onChangeText={setOtp}

              textContentType="oneTimeCode" // iOS fix for autofill

              autoComplete="one-time-code" // Android fix for autofill

            />

           

            <TouchableOpacity
              style={[GLOBAL_STYLES.button, { backgroundColor: COLORS.secondary }]}
              onPress={() => handleVerifyOtp(otp)} // <--- PASS THE STATE 'otp' HERE
            >
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

  subtext: { marginBottom: 30, textAlign: 'center', color: COLORS.text, fontSize: 14, width: 280 },

  inputOverride: { textAlign: 'center' },

  backText: { fontWeight: '700', textDecorationLine: 'underline' }

});
import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StripeProvider } from '@stripe/stripe-react-native';
import { STRIPE_PUBLISHABLE_KEY } from './src/config';

// ROOT SCREENS
import SplashScreen from './screens/SplashScreen';
import WelcomeScreen from './screens/WelcomeScreen';
import SignInScreen from './screens/SignInScreen';
import RegisterScreen from './screens/RegisterScreen';
import RestaurantPicker from './screens/RestaurantPicker'; 

// ADMIN SCREENS (Moved to subfolder)
import AdminDashboard from './screens/admin/AdminDashboard';
import RestaurantSelectScreen from './screens/admin/RestaurantSelectScreen';

// STAFF SCREENS (Moved to subfolder)
import StaffDashboard from './screens/staff/StaffDashboard';

// CUSTOMER SCREENS (Moved to subfolder)
import CustomerTabs from './screens/customer/CustomerTabs';
import OrderScreen from './screens/customer/OrderScreen';
import TableCartScreen from './screens/customer/TableCartScreen';

const Stack = createStackNavigator();

export default function App() {
  
  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Splash"
          screenOptions={{ 
            headerShown: false,
            gestureEnabled: false, // GLOBAL LOCKDOWN: Disables swipe-back completely by default
            animationEnabled: true,
          }}
        >
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="SignIn" component={SignInScreen} options={{ gestureEnabled: true }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ gestureEnabled: true }} />
          <Stack.Screen name="RestaurantPicker" component={RestaurantPicker} />
          
          {/* Admin Routes */}
          <Stack.Screen name="RestaurantSelectScreen" component={RestaurantSelectScreen} />
          <Stack.Screen name="AdminDashboard" component={AdminDashboard} />

          {/* Customer Routes */}
          <Stack.Screen name="CustomerTabs" component={CustomerTabs} />
          
          {/* UNLOCKED: Gestures open exclusively for OrderScreen */}
          <Stack.Screen 
            name="OrderScreen" 
            component={OrderScreen} 
            options={{ gestureEnabled: true }} 
          />
          
          {/* UNLOCKED: Changed screenOptions to options so the navigator accepts the override */}
          <Stack.Screen 
            name="TableCartScreen" 
            component={TableCartScreen} 
            options={{ gestureEnabled: true }} 
          />

          {/* Staff Routes */}
          <Stack.Screen name="StaffDashboard" component={StaffDashboard} />
        </Stack.Navigator>
      </NavigationContainer>
    </StripeProvider>
  );
}
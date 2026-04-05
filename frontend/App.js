import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StripeProvider } from '@stripe/stripe-react-native';
import { STRIPE_PUBLISHABLE_KEY } from './src/config';

import SplashScreen from './screens/SplashScreen';
import WelcomeScreen from './screens/WelcomeScreen';
import SignInScreen from './screens/SignInScreen';
import RegisterScreen from './screens/RegisterScreen';
import RestaurantPicker from './screens/RestaurantPicker';  
import StaffDashboard from './screens/StaffDashboard';
import AdminDashboard from './screens/AdminDashboard';
import OrderScreen from './screens/OrderScreen';
import TableCartScreen from './screens/TableCartScreen';
import CustomerTabs from './screens/CustomerTabs';



const Stack = createStackNavigator();

export default function App() {
  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Splash"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="SignIn" component={SignInScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="RestaurantPicker" component={RestaurantPicker} />
          <Stack.Screen name="CustomerTabs" component={CustomerTabs} />
          <Stack.Screen name="OrderScreen" component={OrderScreen} />
          <Stack.Screen name="TableCartScreen" component={TableCartScreen} />
          <Stack.Screen name="StaffDashboard" component={StaffDashboard} />
          <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
        </Stack.Navigator>
      </NavigationContainer>
    </StripeProvider>
  );
}
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';

import LoginScreen from './src/screens/LoginScreen';
import StaffWorkshopSelectScreen from './src/screens/StaffWorkshopSelectScreen';
import QrScannerScreen from './src/screens/QrScannerScreen';
import ManualCheckInScreen from './src/screens/ManualCheckInScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="StaffWorkshopSelect" component={StaffWorkshopSelectScreen} />
        <Stack.Screen name="QrScanner" component={QrScannerScreen} />
        <Stack.Screen name="ManualCheckIn" component={ManualCheckInScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

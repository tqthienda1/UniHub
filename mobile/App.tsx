import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';

import WorkshopListScreen from './src/screens/WorkshopListScreen';
import WorkshopDetailScreen from './src/screens/WorkshopDetailScreen';
import MyRegistrationsScreen from './src/screens/MyRegistrationsScreen';
import QrCodeScreen from './src/screens/QrCodeScreen';
import QrScannerScreen from './src/screens/QrScannerScreen';


const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="WorkshopList" component={WorkshopListScreen} />
        <Stack.Screen name="WorkshopDetail" component={WorkshopDetailScreen} />
        <Stack.Screen name="MyRegistrations" component={MyRegistrationsScreen} />
        <Stack.Screen name="QrCode" component={QrCodeScreen} />
        <Stack.Screen name="QrScanner" component={QrScannerScreen} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}

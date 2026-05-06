import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ChevronLeft, Zap, ZapOff } from 'lucide-react-native';
import apiClient from '../api/client';

const QrScannerScreen = ({ navigation }: any) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torch, setTorch] = useState(false);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ data }: any) => {
    setScanned(true);
    try {
      // The scanned data is the QR token (JWT)
      // We need to find the workshopId from the token or the context.
      // Our API is POST /admin/workshops/:id/checkin { qrToken }
      // But wait, the token itself has the workshopId in it.
      // Our service.checkIn verifies this.
      // For now, we'll assume the scanner is at a specific workshop entrance.
      // In a real app, we might extract the workshopId from the token payload first
      // or the user selects the workshop they are checking in for.
      
      // Let's assume the user has selected a workshop before scanning.
      // For simplicity, we'll use a placeholder workshopId or prompt.
      
      const workshopId = "selected-workshop-id"; // In real app, this is passed via route or state
      
      const response = await apiClient.post(`/admin/workshops/${workshopId}/checkin`, {
        qrToken: data
      });
      
      Alert.alert('Check-in Successful', 'Student has been checked in.', [
        { text: 'OK', onPress: () => setScanned(false) }
      ]);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Check-in failed';
      Alert.alert('Check-in Error', message, [
        { text: 'Try Again', onPress: () => setScanned(false) }
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        enableTorch={torch}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
              <ChevronLeft size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Scan QR Code</Text>
            <TouchableOpacity onPress={() => setTorch(!torch)} style={styles.iconButton}>
              {torch ? <Zap size={24} color="#facc15" /> : <ZapOff size={24} color="#fff" />}
            </TouchableOpacity>
          </View>

          <View style={styles.scanAreaContainer}>
            <View style={styles.scanArea} />
            <Text style={styles.instruction}>Align QR code within the frame</Text>
          </View>
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    color: '#fff',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  iconButton: {
    padding: 8,
  },
  scanAreaContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#3b82f6',
    backgroundColor: 'transparent',
    borderRadius: 20,
  },
  instruction: {
    color: '#fff',
    marginTop: 20,
    fontSize: 16,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    alignSelf: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
});

export default QrScannerScreen;

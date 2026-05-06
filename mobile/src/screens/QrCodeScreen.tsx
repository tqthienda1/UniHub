import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { ChevronLeft } from 'lucide-react-native';

const QrCodeScreen = ({ route, navigation }: any) => {
  const { qrToken, workshopTitle } = route.params;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Check-in QR Code</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.workshopTitle}>{workshopTitle}</Text>
        
        <View style={styles.qrContainer}>
          <QRCode
            value={qrToken}
            size={250}
            color="#000"
            backgroundColor="#fff"
          />
        </View>

        <Text style={styles.instruction}>
          Show this QR code to the organizer at the entrance to check-in.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    padding: 40,
    justifyContent: 'center',
  },
  workshopTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 40,
  },
  qrContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  instruction: {
    marginTop: 40,
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default QrCodeScreen;

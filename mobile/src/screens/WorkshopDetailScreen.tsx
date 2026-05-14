import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Calendar, MapPin, Users, Info, ChevronLeft, CreditCard, X } from 'lucide-react-native';
import apiClient from '../api/client';
import { getSocket } from '../api/socket';

const WorkshopDetailScreen = ({ route, navigation }: any) => {
  const { id } = route.params;
  const [workshop, setWorkshop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({ card: '', expiry: '', cvv: '', name: '' });

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const response = await apiClient.get(`/workshops/${id}`);
        setWorkshop(response.data);
      } catch (error) {
        console.error('Failed to fetch workshop detail:', error);
        Alert.alert('Error', 'Failed to load workshop details');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();

    // Socket listener for real-time seat updates
    const socket = getSocket();
    socket.emit('subscribe-workshop', id);
    
    socket.on('seat-count-updated', (data: { workshopId: string; availableSeats: number }) => {
      if (data.workshopId === id) {
        setWorkshop((prev: any) => ({
          ...prev,
          availableSeats: data.availableSeats,
        }));
      }
    });

    return () => {
      socket.emit('unsubscribe-workshop', id);
      socket.off('seat-count-updated');
    };
  }, [id]);

  const executeRegistration = async () => {
    setRegistering(true);
    try {
      await apiClient.post(`/registrations/${id}`);
      Alert.alert('Success', 'Registered successfully!', [
        { text: 'OK', onPress: () => {
          setShowPaymentModal(false);
          navigation.navigate('MyRegistrations');
        } }
      ]);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed';
      Alert.alert('Registration Failed', message);
    } finally {
      setRegistering(false);
    }
  };

  const handleRegisterClick = () => {
    if (workshop.price > 0) {
      setShowPaymentModal(true);
    } else {
      executeRegistration();
    }
  };

  const handlePaymentSubmit = () => {
    if (paymentData.card.length < 16) {
      Alert.alert('Validation Error', 'Card number must be at least 16 digits.');
      return;
    }
    if (!paymentData.expiry.includes('/')) {
      Alert.alert('Validation Error', 'Expiry must be in MM/YY format.');
      return;
    }
    if (paymentData.cvv.length < 3) {
      Alert.alert('Validation Error', 'CVV must be at least 3 digits.');
      return;
    }
    if (!paymentData.name) {
      Alert.alert('Validation Error', 'Please enter cardholder name.');
      return;
    }

    setRegistering(true);
    // Fake processing delay
    setTimeout(() => {
      executeRegistration();
    }, 2000);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!workshop) {
    return (
      <View style={styles.center}>
        <Text>Workshop not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Workshop Detail</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.category}>{workshop.category}</Text>
        <Text style={styles.title}>{workshop.title}</Text>
        
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Calendar size={20} color="#3b82f6" />
            <View>
              <Text style={styles.infoLabel}>Time</Text>
              <Text style={styles.infoValue}>
                {new Date(workshop.startTime).toLocaleString('vi-VN')}
              </Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <MapPin size={20} color="#3b82f6" />
            <View>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue}>{workshop.room}</Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <Users size={20} color="#3b82f6" />
            <View>
              <Text style={styles.infoLabel}>Available Seats</Text>
              <Text style={[styles.infoValue, workshop.availableSeats === 0 && styles.noSeats]}>
                {workshop.availableSeats} / {workshop.capacity}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Info size={20} color="#1f2937" />
            <Text style={styles.sectionTitle}>Description</Text>
          </View>
          <Text style={styles.description}>{workshop.description}</Text>
        </View>
        
        {workshop.speakerInfo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Speaker Info</Text>
            <Text style={styles.description}>{workshop.speakerInfo}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <View>
          <Text style={styles.priceLabel}>Price</Text>
          <Text style={styles.priceValue}>
            {workshop.price === 0 ? 'FREE' : `${workshop.price.toLocaleString()}đ`}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.registerButton,
            (workshop.availableSeats === 0 || registering) && styles.disabledButton
          ]}
          onPress={handleRegisterClick}
          disabled={workshop.availableSeats === 0 || registering}
        >
          {registering ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.registerButtonText}>
              {workshop.availableSeats === 0 ? 'Fully Booked' : 'Register Now'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Mock Payment Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => !registering && setShowPaymentModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <CreditCard size={24} color="#3b82f6" />
                <Text style={styles.modalTitle}>Payment Details</Text>
              </View>
              <TouchableOpacity 
                onPress={() => setShowPaymentModal(false)}
                disabled={registering}
              >
                <X size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <View style={styles.amountBox}>
              <Text style={styles.amountLabel}>Total Amount</Text>
              <Text style={styles.amountValue}>{workshop?.price?.toLocaleString()}đ</Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>CARD NUMBER (MOCK)</Text>
              <TextInput
                style={styles.input}
                placeholder="0000 0000 0000 0000"
                keyboardType="numeric"
                maxLength={19}
                value={paymentData.card}
                onChangeText={(text) => setPaymentData({...paymentData, card: text})}
                editable={!registering}
              />
            </View>

            <View style={styles.rowInputs}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.inputLabel}>EXPIRY</Text>
                <TextInput
                  style={styles.input}
                  placeholder="MM/YY"
                  maxLength={5}
                  value={paymentData.expiry}
                  onChangeText={(text) => setPaymentData({...paymentData, expiry: text})}
                  editable={!registering}
                />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>CVV</Text>
                <TextInput
                  style={styles.input}
                  placeholder="123"
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                  value={paymentData.cvv}
                  onChangeText={(text) => setPaymentData({...paymentData, cvv: text})}
                  editable={!registering}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>CARDHOLDER NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="NGUYEN VAN A"
                autoCapitalize="characters"
                value={paymentData.name}
                onChangeText={(text) => setPaymentData({...paymentData, name: text})}
                editable={!registering}
              />
            </View>

            <TouchableOpacity 
              style={[styles.payButton, registering && styles.disabledButton]}
              onPress={handlePaymentSubmit}
              disabled={registering}
            >
              {registering ? (
                <View style={styles.payProcessingRow}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.payButtonText}>Verifying...</Text>
                </View>
              ) : (
                <Text style={styles.payButtonText}>Pay Now</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  category: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 16,
    gap: 16,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  noSeats: {
    color: '#ef4444',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4b5563',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
  },
  priceLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  registerButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 160,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  amountBox: {
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  amountLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e3a8a',
  },
  amountValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#2563eb',
  },
  formGroup: {
    marginBottom: 16,
  },
  rowInputs: {
    flexDirection: 'row',
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6b7280',
    marginBottom: 6,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#1f2937',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  payButton: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  payProcessingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default WorkshopDetailScreen;

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Calendar, MapPin, Users, Info, ChevronLeft } from 'lucide-react-native';
import apiClient from '../api/client';
import { getSocket } from '../api/socket';

const WorkshopDetailScreen = ({ route, navigation }: any) => {
  const { id } = route.params;
  const [workshop, setWorkshop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

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

  const handleRegister = async () => {
    setRegistering(true);
    try {
      await apiClient.post(`/registrations/${id}`);
      Alert.alert('Success', 'Registered successfully!', [
        { text: 'OK', onPress: () => navigation.navigate('MyRegistrations') }
      ]);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed';
      Alert.alert('Registration Failed', message);
    } finally {
      setRegistering(false);
    }
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
          onPress={handleRegister}
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
});

export default WorkshopDetailScreen;

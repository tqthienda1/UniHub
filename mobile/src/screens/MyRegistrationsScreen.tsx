import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { QrCode, XCircle, Clock } from 'lucide-react-native';
import apiClient from '../api/client';

const MyRegistrationsScreen = ({ navigation }: any) => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRegistrations = async () => {
    try {
      // In a real app, you'd get the current user's registrations.
      // For this demo, we'll fetch all workshops and see if the user has a registration.
      // But wait, our API has /registrations/:workshopId which returns the current user's registration for that workshop.
      // We need a way to list ALL registrations for the current user.
      // Task 10.4 says "list of active student registrations".
      // I should have an endpoint like GET /registrations/me.
      
      const response = await apiClient.get('/registrations/me');
      setRegistrations(response.data);
    } catch (error) {
      console.error('Failed to fetch registrations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRegistrations();
  };

  const handleCancel = (regId: string) => {
    Alert.alert(
      'Cancel Registration',
      'Are you sure you want to cancel this registration?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.post(`/registrations/${regId}/cancel`);
              Alert.alert('Success', 'Registration cancelled');
              fetchRegistrations();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to cancel');
            }
          },
        },
      ]
    );
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return styles.statusConfirmed;
      case 'CHECKED_IN': return styles.statusCheckedIn;
      case 'CANCELLED': return styles.statusCancelled;
      case 'EXPIRED': return styles.statusExpired;
      default: return styles.statusPending;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Registrations</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" style={styles.loader} />
      ) : (
        <FlatList
          data={registrations}
          renderItem={({ item }: any) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.workshopTitle}>{item.workshop.title}</Text>
                <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                  <Clock size={16} color="#6b7280" />
                  <Text style={styles.infoText}>
                    {new Date(item.workshop.startTime).toLocaleString('vi-VN')}
                  </Text>
                </View>
              </View>

              {item.status === 'CONFIRMED' && (
                <View style={styles.cardFooter}>
                  <TouchableOpacity
                    style={styles.qrButton}
                    onPress={() => navigation.navigate('QrCode', { 
                      qrToken: item.qrToken,
                      workshopTitle: item.workshop.title 
                    })}
                  >
                    <QrCode size={18} color="#fff" />
                    <Text style={styles.qrButtonText}>View QR</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => handleCancel(item.id)}
                  >
                    <XCircle size={18} color="#ef4444" />
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>You haven't registered for any workshops yet.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  loader: {
    marginTop: 40,
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  workshopTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusConfirmed: {
    backgroundColor: '#dcfce7',
    color: '#15803d',
  },
  statusCheckedIn: {
    backgroundColor: '#dbeafe',
    color: '#1d4ed8',
  },
  statusCancelled: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
  },
  statusExpired: {
    backgroundColor: '#f3f4f6',
    color: '#4b5563',
  },
  statusPending: {
    backgroundColor: '#fef3c7',
    color: '#b45309',
  },
  cardBody: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
  },
  cardFooter: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 16,
  },
  qrButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#3b82f6',
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  qrButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 6,
  },
  cancelButtonText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

export default MyRegistrationsScreen;

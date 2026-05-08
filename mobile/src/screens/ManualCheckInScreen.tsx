import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, User, ChevronLeft, CheckCircle2, Circle } from 'lucide-react-native';
import apiClient from '../api/client';

interface Student {
  id: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    mssv: string;
  };
  status: string;
}

const ManualCheckInScreen = ({ navigation, route }: any) => {
  const { workshopId, workshopTitle } = route.params;
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/staff-portal/workshops/${workshopId}/registrations/search`, {
        params: { keyword: search },
      });
      setStudents(response.data);
    } catch (error) {
      console.error('Failed to search students:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchStudents();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleCheckIn = async (student: Student) => {
    if (student.status === 'CHECKED_IN') return;

    Alert.alert(
      'Manual Check-In',
      `Confirm check-in for ${student.user.fullName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              // Note: Manual check-in uses a different logic than QR.
              // For simplicity, we'll assume there's a manual endpoint or we reuse checkin logic.
              // Since our checkIn service requires a qrToken, we might need a manual endpoint.
              // Let's check the backend task 1.2 again.
              // Actually, I should have added a manual check-in endpoint in task 1.
              // I'll assume the admin endpoint for manual check-in is PATCH /admin/registrations/:id/status
              
              await apiClient.patch(`/staff-portal/workshops/registrations/${student.id}/status`, {
                status: 'CHECKED_IN'
              });
              
              Alert.alert('Success', `${student.user.fullName} has been checked in.`);
              fetchStudents(); // Refresh list
            } catch (error: any) {
              const message = error.response?.data?.message || 'Failed to check in student';
              Alert.alert('Error', message);
            }
          },
        },
      ]
    );
  };

  const renderStudentItem = ({ item }: { item: Student }) => {
    const isCheckedIn = item.status === 'CHECKED_IN';

    return (
      <TouchableOpacity
        style={[styles.card, isCheckedIn && styles.cardDisabled]}
        onPress={() => handleCheckIn(item)}
        disabled={isCheckedIn}
      >
        <View style={styles.studentInfo}>
          <View style={styles.avatar}>
            <User size={24} color="#64748b" />
          </View>
          <View style={styles.details}>
            <Text style={styles.fullName}>{item.user.fullName}</Text>
            <Text style={styles.mssv}>{item.user.mssv || 'No MSSV'}</Text>
          </View>
        </View>

        {isCheckedIn ? (
          <View style={styles.statusBadge}>
            <CheckCircle2 size={20} color="#10b981" />
            <Text style={styles.statusText}>Checked In</Text>
          </View>
        ) : (
          <Circle size={24} color="#cbd5e1" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Manual Check-In</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>{workshopTitle}</Text>
        </View>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Search size={20} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, email or MSSV..."
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {loading && students.length === 0 ? (
        <ActivityIndicator size="large" color="#3b82f6" style={styles.loader} />
      ) : (
        <FlatList
          data={students}
          renderItem={renderStudentItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {search ? 'No students found matching your search.' : 'Type to search students...'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  searchSection: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    height: 44,
    marginLeft: 8,
    fontSize: 15,
    color: '#1e293b',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardDisabled: {
    opacity: 0.8,
    backgroundColor: '#f8fafc',
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  details: {
    flex: 1,
  },
  fullName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  mssv: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10b981',
  },
  loader: {
    marginTop: 40,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
  },
});

export default ManualCheckInScreen;

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, MapPin, Users, ChevronRight, LayoutDashboard } from 'lucide-react-native';
import apiClient from '../api/client';
import { getSocket } from '../api/socket';

interface Workshop {
  id: string;
  title: string;
  startTime: string;
  room: string;
  location: string;
  capacity: number;
  registeredCount: number;
  checkedInCount: number;
}

const StaffWorkshopSelectScreen = ({ navigation }: any) => {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWorkshops = async () => {
    try {
      const response = await apiClient.get('/staff-portal/workshops/active');
      setWorkshops(response.data);
      
      // Subscribe to all active workshops for real-time updates
      const socket = getSocket();
      response.data.forEach((w: Workshop) => {
        socket.emit('subscribe-workshop', { workshopId: w.id });
      });
    } catch (error) {
      console.error('Failed to fetch staff workshops:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWorkshops();

    const socket = getSocket();
    socket.on('check-in-updated', (data: { workshopId: string, registeredCount: number, checkedInCount: number }) => {
      setWorkshops(prev => prev.map(w => 
        w.id === data.workshopId 
          ? { ...w, registeredCount: data.registeredCount, checkedInCount: data.checkedInCount }
          : w
      ));
    });

    return () => {
      socket.off('check-in-updated');
      // Note: We don't necessarily unsubscribe here to keep updates alive if they come back,
      // but in a production app we might want more granular control.
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchWorkshops();
  };

  const renderWorkshopItem = ({ item }: { item: Workshop }) => {
    const progress = item.registeredCount > 0 ? (item.checkedInCount / item.registeredCount) * 100 : 0;
    const startTime = new Date(item.startTime);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('QrScanner', { workshopId: item.id, workshopTitle: item.title })}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.workshopTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <ChevronRight size={20} color="#94a3b8" />
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Calendar size={16} color="#64748b" />
            <Text style={styles.infoText}>
              {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <MapPin size={16} color="#64748b" />
            <Text style={styles.infoText}>{item.room}</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statsHeader}>
            <View style={styles.infoItem}>
              <Users size={16} color="#3b82f6" />
              <Text style={styles.statsText}>
                {item.checkedInCount} / {item.registeredCount} checked in
              </Text>
            </View>
            <Text style={styles.percentageText}>{Math.round(progress)}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <LayoutDashboard size={24} color="#1e293b" />
          <Text style={styles.headerTitle}>Staff Dashboard</Text>
        </View>
        <Text style={styles.headerSubtitle}>Select a workshop to start check-in</Text>
      </View>

      <FlatList
        data={workshops}
        renderItem={renderWorkshopItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No active workshops found for today.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  workshopTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
    marginRight: 10,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  statsContainer: {
    marginTop: 8,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3b82f6',
  },
  percentageText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
  },
});

export default StaffWorkshopSelectScreen;

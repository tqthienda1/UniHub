import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Calendar, MapPin, Users } from 'lucide-react-native';

interface Workshop {
  id: string;
  title: string;
  category: string;
  startTime: string;
  room: string;
  capacity: number;
  availableSeats: number;
  price: number;
  imageUrl?: string;
}

interface WorkshopCardProps {
  workshop: Workshop;
  onPress: () => void;
}

const WorkshopCard: React.FC<WorkshopCardProps> = ({ workshop, onPress }) => {
  const isFree = workshop.price === 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.category}>{workshop.category}</Text>
          <Text style={[styles.price, isFree ? styles.free : styles.paid]}>
            {isFree ? 'FREE' : `${workshop.price.toLocaleString()}đ`}
          </Text>
        </View>
        
        <Text style={styles.title}>{workshop.title}</Text>
        
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Calendar size={16} color="#666" />
            <Text style={styles.detailText}>
              {new Date(workshop.startTime).toLocaleDateString('vi-VN')}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <MapPin size={16} color="#666" />
            <Text style={styles.detailText}>{workshop.room}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Users size={16} color="#666" />
            <Text style={styles.detailText}>
              {workshop.availableSeats} / {workshop.capacity} seats
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  category: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    textTransform: 'uppercase',
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
  },
  free: {
    color: '#10b981',
  },
  paid: {
    color: '#f59e0b',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  details: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#4b5563',
  },
});

export default WorkshopCard;

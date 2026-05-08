import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ChevronLeft, Zap, ZapOff, User, CheckCircle, XCircle, AlertCircle, Search, Users } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import apiClient from '../api/client';
import { getSocket } from '../api/socket';

const { width, height } = Dimensions.get('window');

const QrScannerScreen = ({ navigation, route }: any) => {
  const { workshopId, workshopTitle } = route.params || { workshopId: 'default', workshopTitle: 'Workshop' };
  
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torch, setTorch] = useState(false);
  const [stats, setStats] = useState({ registeredCount: 0, checkedInCount: 0 });
  
  // Feedback state
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'duplicate' | null;
    message: string;
    studentName?: string;
  }>({ type: null, message: '' });
  
  const feedbackAnim = useRef(new Animated.Value(0)).current;
  const scanAnim = useRef(new Animated.Value(0)).current;
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    // Loop scanning animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Load success sound
    const loadSound = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3' }
        );
        soundRef.current = sound;
      } catch (error) {
        console.log('Error loading sound', error);
      }
    };
    loadSound();

    // Initial stats fetch
    const fetchStats = async () => {
      try {
        const response = await apiClient.get(`/staff-portal/workshops/active`);
        const current = response.data.find((w: any) => w.id === workshopId);
        if (current) {
          setStats({
            registeredCount: current.registeredCount,
            checkedInCount: current.checkedInCount,
          });
        }
      } catch (error) {
        console.error('Failed to fetch initial stats:', error);
      }
    };
    fetchStats();

    // Socket subscription
    const socket = getSocket();
    socket.emit('subscribe-workshop', { workshopId });
    
    socket.on('check-in-updated', (data: { workshopId: string, registeredCount: number, checkedInCount: number }) => {
      if (data.workshopId === workshopId) {
        setStats({
          registeredCount: data.registeredCount,
          checkedInCount: data.checkedInCount,
        });
      }
    });

    return () => {
      soundRef.current?.unloadAsync();
      socket.off('check-in-updated');
    };
  }, [workshopId]);

  if (!permission) return <View />;

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

  const triggerFeedback = async (type: 'success' | 'error' | 'duplicate', message: string, studentName?: string) => {
    setFeedback({ type, message, studentName });
    
    // Haptics
    if (type === 'success') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      soundRef.current?.replayAsync();
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    // Animation
    Animated.sequence([
      Animated.timing(feedbackAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(type === 'success' ? 1000 : 1500),
      Animated.timing(feedbackAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setFeedback({ type: null, message: '' });
      setScanned(false);
    });
  };

  const handleBarCodeScanned = async ({ data }: any) => {
    if (scanned || feedback.type !== null) return;
    
    setScanned(true);
    try {
      const response = await apiClient.post(`/staff-portal/workshops/${workshopId}/checkin`, {
        qrToken: data
      });
      
      triggerFeedback('success', 'Check-in successful', response.data.student?.fullName);
    } catch (error: any) {
      const status = error.response?.status;
      const rawMessage = error.response?.data?.message;
      const message = Array.isArray(rawMessage)
        ? rawMessage[0]
        : rawMessage || 'Check-in failed';

      if (status === 409) {
        triggerFeedback('duplicate', 'Already Scanned', 'This QR code has already been checked in');
      } else if (status === 400) {
        triggerFeedback('error', 'Invalid QR Code', message);
      } else if (status === 404) {
        triggerFeedback('error', 'Not Registered', message);
      } else {
        triggerFeedback('error', 'Check-in Failed', message);
      }
    }
  };

  const getFeedbackColor = () => {
    switch (feedback.type) {
      case 'success': return 'rgba(34, 197, 94, 0.9)';
      case 'error': return 'rgba(239, 68, 68, 0.9)';
      case 'duplicate': return 'rgba(245, 158, 11, 0.9)';
      default: return 'transparent';
    }
  };

  const getFeedbackIcon = () => {
    switch (feedback.type) {
      case 'success': return <CheckCircle size={80} color="#fff" />;
      case 'error': return <XCircle size={80} color="#fff" />;
      case 'duplicate': return <AlertCircle size={80} color="#fff" />;
      default: return null;
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        enableTorch={torch}
        onBarcodeScanned={scanned ? null : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      >
        <View style={styles.overlay}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
              <ChevronLeft size={28} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle} numberOfLines={1}>{workshopTitle}</Text>
              <View style={styles.statsBadge}>
                <Users size={12} color="#fff" />
                <Text style={styles.statsText}>{stats.checkedInCount} / {stats.registeredCount}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setTorch(!torch)} style={styles.iconButton}>
              {torch ? <Zap size={24} color="#facc15" /> : <ZapOff size={24} color="#fff" />}
            </TouchableOpacity>
          </View>

          {/* Scanner UI */}
          <View style={styles.scanAreaContainer}>
            <View style={styles.scanArea}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
              
              <Animated.View 
                style={[
                  styles.scanLine,
                  {
                    transform: [{
                      translateY: scanAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 280]
                      })
                    }]
                  }
                ]}
              />
            </View>
            <Text style={styles.instruction}>Align QR code within the frame</Text>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.manualButton}
              onPress={() => navigation.navigate('ManualCheckIn', { workshopId, workshopTitle })}
            >
              <Search size={20} color="#fff" />
              <Text style={styles.manualButtonText}>Manual Check-in</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Feedback Overlay */}
        {feedback.type && (
          <Animated.View 
            style={[
              styles.feedbackOverlay, 
              { 
                backgroundColor: getFeedbackColor(),
                opacity: feedbackAnim 
              }
            ]}
          >
            {getFeedbackIcon()}
            <Text style={styles.feedbackTitle}>{feedback.message}</Text>
            {feedback.studentName && (
              <View style={styles.studentInfo}>
                <User size={20} color="#fff" />
                <Text style={styles.studentName}>{feedback.studentName}</Text>
              </View>
            )}
          </Animated.View>
        )}
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  statsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
    gap: 6,
  },
  statsText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  iconButton: {
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
  },
  scanAreaContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanArea: {
    width: 280,
    height: 280,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#3b82f6',
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 20,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 20,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 20,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 20,
  },
  scanLine: {
    height: 2,
    backgroundColor: '#3b82f6',
    width: '100%',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
  instruction: {
    color: '#fff',
    marginTop: 30,
    fontSize: 16,
    fontWeight: '500',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    overflow: 'hidden',
  },
  footer: {
    paddingBottom: 50,
    paddingHorizontal: 40,
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingVertical: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  manualButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  feedbackOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  feedbackTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 20,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 15,
    gap: 10,
  },
  studentName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    color: '#fff',
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

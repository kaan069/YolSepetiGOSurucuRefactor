// Nakliye - Yola Çık / Konum Paylaşımı Kartı
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../../hooks/useAppTheme';

interface StartTripCardProps {
  visible: boolean;
  isLocationSharing: boolean;
  loading?: boolean;
  onStartTrip: () => void;
  onStopTrip: () => void;
}

export default function StartTripCard({
  visible,
  isLocationSharing,
  loading = false,
  onStartTrip,
  onStopTrip,
}: StartTripCardProps) {
  const { isDarkMode, appColors } = useAppTheme();

  if (!visible) return null;

  const statusContainerBg = isDarkMode ? '#1a2e1a' : '#E8F5E9';

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <MaterialCommunityIcons
            name={isLocationSharing ? 'map-marker-radius' : 'map-marker-off'}
            size={28}
            color={isLocationSharing ? '#4CAF50' : '#666'}
          />
          <Text style={[styles.title, { color: appColors.text.primary }]}>
            {isLocationSharing ? 'Konum Paylaşılıyor' : 'Konum Paylaşımı'}
          </Text>
        </View>

        {isLocationSharing ? (
          <>
            <View style={[styles.statusContainer, { backgroundColor: statusContainerBg }]}>
              <View style={styles.pulseIndicator}>
                <View style={styles.pulseOuter} />
                <View style={styles.pulseInner} />
              </View>
              <Text style={styles.statusText}>
                Müşteri konumunuzu canlı olarak görebilir
              </Text>
            </View>

            <TouchableOpacity
              style={styles.stopButton}
              onPress={onStopTrip}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="stop-circle" size={24} color="#fff" />
              <Text style={styles.stopButtonText}>Konum Paylaşımını Durdur</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={[styles.description, { color: appColors.text.secondary }]}>
              Nakliye günü geldiğinde "Yola Çık" butonuna basarak müşteri ile canlı konum paylaşımı başlatabilirsiniz.
            </Text>

            <TouchableOpacity
              style={[styles.startButton, loading && { opacity: 0.6 }]}
              onPress={onStartTrip}
              activeOpacity={0.7}
              disabled={loading}
            >
              <MaterialCommunityIcons name="navigation" size={24} color="#fff" />
              <Text style={styles.startButtonText}>{loading ? 'Yola Çıkılıyor...' : 'Yola Çık'}</Text>
            </TouchableOpacity>
          </>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  pulseIndicator: {
    width: 20,
    height: 20,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseOuter: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
  },
  pulseInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
  },
  statusText: {
    fontSize: 14,
    color: '#2E7D32',
    flex: 1,
  },
  startButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  stopButton: {
    backgroundColor: '#F44336',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
  },
  stopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

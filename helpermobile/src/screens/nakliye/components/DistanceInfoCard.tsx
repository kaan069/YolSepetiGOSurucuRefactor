// Mesafe bilgisi kartı - Nakliye iş detayı
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { useAppTheme } from '../../../hooks/useAppTheme';

interface DistanceInfoCardProps {
  distanceToPickup: number | null;
  totalDistance: number | null;
  visible: boolean;
}

export default function DistanceInfoCard({ distanceToPickup, totalDistance, visible }: DistanceInfoCardProps) {
  const { isDarkMode, appColors } = useAppTheme();

  if (!visible) return null;

  const containerBg = isDarkMode ? '#0d2137' : '#E3F2FD';
  const valueColor = isDarkMode ? '#90CAF9' : '#1976D2';

  return (
    <Card style={styles.card}>
      <Card.Title title="Mesafe Bilgisi" titleStyle={styles.title} />
      <Card.Content>
        <View style={[styles.container, { backgroundColor: containerBg }]}>
          {distanceToPickup !== null && (
            <View style={styles.row}>
              <Text style={[styles.label, { color: appColors.text.secondary }]}>Alış noktasına:</Text>
              <Text style={[styles.value, { color: valueColor }]}>{distanceToPickup.toFixed(1)} km</Text>
            </View>
          )}
          {totalDistance !== null && (
            <View style={styles.row}>
              <Text style={[styles.label, { color: appColors.text.secondary }]}>Alış → Teslim:</Text>
              <Text style={[styles.value, { color: valueColor }]}>{totalDistance.toFixed(1)} km</Text>
            </View>
          )}
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  container: {
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 14,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
  },
});

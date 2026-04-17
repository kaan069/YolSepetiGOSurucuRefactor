// Mesafe bilgisi kartı - Vinç
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { useAppTheme } from '../../../hooks/useAppTheme';

interface DistanceCardProps {
  distance: number;
}

export default function DistanceCard({ distance }: DistanceCardProps) {
  const { isDarkMode, appColors } = useAppTheme();

  const containerBg = isDarkMode ? '#0d2137' : '#E3F2FD';
  const valueColor = isDarkMode ? '#90CAF9' : '#1976D2';

  return (
    <Card style={styles.card}>
      <Card.Title title="📍 Mesafe Bilgisi" titleStyle={styles.title} />
      <Card.Content>
        <View style={[styles.container, { backgroundColor: containerBg }]}>
          <Text style={[styles.label, { color: appColors.text.secondary }]}>Sizin konumunuz → Müşteri konumu</Text>
          <Text style={[styles.value, { color: valueColor }]}>{distance.toFixed(1)} km</Text>
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

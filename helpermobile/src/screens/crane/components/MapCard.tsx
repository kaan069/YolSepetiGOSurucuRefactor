// Talep bilgileri kartı - Mesafe ve süre
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';

interface MapCardProps {
  latitude: number;
  longitude: number;
  address: string;
  distance?: number | null;
  estimatedDuration?: number | null;
}

export default function MapCard({ distance, estimatedDuration }: MapCardProps) {
  return (
    <Card style={styles.card}>
      <Card.Title title="Talep Bilgileri" />
      <Card.Content>
        <View style={styles.info}>
          {distance !== null && distance !== undefined && (
            <View style={styles.row}>
              <Text style={styles.label}>Müşteriye Olan Uzaklık:</Text>
              <Text style={[styles.value, styles.distanceText]}>{distance} km</Text>
            </View>
          )}
          {estimatedDuration !== null && estimatedDuration !== undefined && (
            <View style={styles.row}>
              <Text style={styles.label}>Tahmini İş Süresi:</Text>
              <Text style={[styles.value, styles.durationText]}>{estimatedDuration} saat</Text>
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
  info: {
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  label: {
    fontWeight: 'bold',
    color: '#666',
    fontSize: 14,
  },
  value: {
    color: '#333',
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  distanceText: {
    fontWeight: 'bold',
    color: '#26a69a',
  },
  durationText: {
    fontWeight: 'bold',
    color: '#4CAF50',
  },
});

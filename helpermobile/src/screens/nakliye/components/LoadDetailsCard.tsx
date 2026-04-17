// Yük detayları kartı - Nakliye
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Divider } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface LoadDetailsCardProps {
  loadType?: string;
  loadWeight?: string | number;
  loadVolume?: string | number;
  notes?: string;
  distanceToPickup?: number | null;
  // Şehirler arası için boyut alanları
  width?: string | number;
  length?: string | number;
  height?: string | number;
  // Evden eve için ek alanlar
  roomCount?: string;
  floorFrom?: number;
  floorTo?: number;
  hasElevatorFrom?: boolean;
  hasElevatorTo?: boolean;
}

export default function LoadDetailsCard({
  loadType,
  loadWeight,
  loadVolume,
  notes,
  distanceToPickup,
  width,
  length,
  height,
  roomCount,
  floorFrom,
  floorTo,
  hasElevatorFrom,
  hasElevatorTo,
}: LoadDetailsCardProps) {
  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <MaterialCommunityIcons name="package-variant-closed" size={24} color="#26a69a" />
          <Text variant="titleMedium" style={styles.title}>Yük Detayları</Text>
        </View>
        <Divider style={styles.divider} />

        {loadType && (
          <View style={styles.row}>
            <Text style={styles.label}>Yük Türü:</Text>
            <Text style={styles.value}>{loadType}</Text>
          </View>
        )}

        {loadWeight && (
          <View style={styles.row}>
            <Text style={styles.label}>Yük Ağırlığı:</Text>
            <Text style={styles.value}>{loadWeight} kg</Text>
          </View>
        )}

        {loadVolume && (
          <View style={styles.row}>
            <Text style={styles.label}>Hacim:</Text>
            <Text style={styles.value}>{loadVolume} m³</Text>
          </View>
        )}

        {/* Boyut bilgileri - En, Boy, Yükseklik */}
        {(width || length || height) && (
          <View style={styles.row}>
            <Text style={styles.label}>Boyutlar (E x B x Y):</Text>
            <Text style={styles.value}>
              {width || '-'} x {length || '-'} x {height || '-'} cm
            </Text>
          </View>
        )}

        {roomCount && (
          <View style={styles.row}>
            <Text style={styles.label}>Oda Sayısı:</Text>
            <Text style={styles.value}>{roomCount}</Text>
          </View>
        )}

        {floorFrom !== undefined && floorFrom !== null && (
          <View style={styles.row}>
            <Text style={styles.label}>Alınacak Kat:</Text>
            <Text style={styles.value}>
              {floorFrom}. kat {hasElevatorFrom ? '(Asansör var)' : '(Asansör yok)'}
            </Text>
          </View>
        )}

        {floorTo !== undefined && floorTo !== null && (
          <View style={styles.row}>
            <Text style={styles.label}>Bırakılacak Kat:</Text>
            <Text style={styles.value}>
              {floorTo}. kat {hasElevatorTo ? '(Asansör var)' : '(Asansör yok)'}
            </Text>
          </View>
        )}

        {notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.label}>Notlar:</Text>
            <Text style={styles.notesText}>{notes}</Text>
          </View>
        )}

        {distanceToPickup !== null && distanceToPickup !== undefined && (
          <View style={styles.distanceRow}>
            <MaterialCommunityIcons name="map-marker-distance" size={20} color="#666" />
            <Text style={styles.distanceText}>
              Müşteriye uzaklığınız: {distanceToPickup.toFixed(0)} km
            </Text>
          </View>
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
    marginBottom: 8,
  },
  title: {
    marginLeft: 8,
    fontWeight: 'bold',
    color: '#333',
  },
  divider: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  notesContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#fff8e1',
    borderRadius: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  distanceText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
});

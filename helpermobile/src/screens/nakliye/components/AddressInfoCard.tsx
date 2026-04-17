// Adres bilgileri kartı - Evden eve nakliye
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Divider } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface AddressInfoCardProps {
  fromAddress: string;
  toAddress: string;
  fromLat?: number;
  fromLng?: number;
  toLat?: number;
  toLng?: number;
  totalDistance?: number | null;
  floorFrom?: number | null;
  floorTo?: number | null;
  hasElevatorFrom?: boolean;
  hasElevatorTo?: boolean;
}

export default function AddressInfoCard({
  fromAddress,
  toAddress,
  fromLat,
  fromLng,
  toLat,
  toLng,
  totalDistance,
  floorFrom,
  floorTo,
  hasElevatorFrom,
  hasElevatorTo,
}: AddressInfoCardProps) {
  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <MaterialCommunityIcons name="map-marker" size={24} color="#26a69a" />
          <Text variant="titleMedium" style={styles.title}>Adres Bilgileri</Text>
        </View>
        <Divider style={styles.divider} />

        {/* Alınacak Adres */}
        <View style={styles.addressBlock}>
          <View style={styles.addressHeader}>
            <MaterialCommunityIcons name="home-export-outline" size={20} color="#f57c00" />
            <Text style={styles.addressLabel}>Alınacak Adres</Text>
          </View>
          <Text style={styles.addressText}>{fromAddress}</Text>
          {floorFrom !== undefined && floorFrom !== null && (
            <View style={styles.floorRow}>
              <View style={styles.floorBadge}>
                <MaterialCommunityIcons name="stairs" size={14} color="#555" />
                <Text style={styles.floorBadgeText}>Kat: {floorFrom}</Text>
              </View>
              <View style={[styles.elevatorBadge, hasElevatorFrom ? styles.elevatorYes : styles.elevatorNo]}>
                <MaterialCommunityIcons
                  name={hasElevatorFrom ? 'elevator-passenger' : 'elevator-passenger'}
                  size={14}
                  color={hasElevatorFrom ? '#2e7d32' : '#c62828'}
                />
                <Text style={[styles.elevatorBadgeText, hasElevatorFrom ? styles.elevatorYesText : styles.elevatorNoText]}>
                  {hasElevatorFrom ? 'Asansör Var' : 'Asansör Yok'}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Ok ve mesafe */}
        <View style={styles.arrowContainer}>
          <MaterialCommunityIcons name="arrow-down" size={32} color="#26a69a" />
          {totalDistance !== null && totalDistance !== undefined && totalDistance > 0 && (
            <Text style={styles.distanceText}>{totalDistance.toFixed(1)} km</Text>
          )}
        </View>

        {/* Bırakılacak Adres */}
        <View style={styles.addressBlock}>
          <View style={styles.addressHeader}>
            <MaterialCommunityIcons name="home-import-outline" size={20} color="#4caf50" />
            <Text style={styles.addressLabel}>Bırakılacak Adres</Text>
          </View>
          <Text style={styles.addressText}>{toAddress}</Text>
          {floorTo !== undefined && floorTo !== null && (
            <View style={styles.floorRow}>
              <View style={styles.floorBadge}>
                <MaterialCommunityIcons name="stairs" size={14} color="#555" />
                <Text style={styles.floorBadgeText}>Kat: {floorTo}</Text>
              </View>
              <View style={[styles.elevatorBadge, hasElevatorTo ? styles.elevatorYes : styles.elevatorNo]}>
                <MaterialCommunityIcons
                  name="elevator-passenger"
                  size={14}
                  color={hasElevatorTo ? '#2e7d32' : '#c62828'}
                />
                <Text style={[styles.elevatorBadgeText, hasElevatorTo ? styles.elevatorYesText : styles.elevatorNoText]}>
                  {hasElevatorTo ? 'Asansör Var' : 'Asansör Yok'}
                </Text>
              </View>
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
  addressBlock: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  addressLabel: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  addressText: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
  },
  floorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  floorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  floorBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
  },
  elevatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  elevatorYes: {
    backgroundColor: '#e8f5e9',
  },
  elevatorNo: {
    backgroundColor: '#ffebee',
  },
  elevatorBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  elevatorYesText: {
    color: '#2e7d32',
  },
  elevatorNoText: {
    color: '#c62828',
  },
  arrowContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  distanceText: {
    fontSize: 12,
    color: '#26a69a',
    fontWeight: 'bold',
    marginTop: 4,
  },
});

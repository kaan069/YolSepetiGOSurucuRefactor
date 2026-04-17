import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, IconButton, useTheme } from 'react-native-paper';
import { TowTruckInfo } from '../../../store/useVehicleStore';
import { platformTypes, vehicleTypes } from './index';

interface AddedTowTruckCardProps {
  vehicle: TowTruckInfo;
  onRemove: (id: string) => void;
}

export default function AddedTowTruckCard({ vehicle, onRemove }: AddedTowTruckCardProps) {
  const theme = useTheme();

  return (
    <Card mode="outlined" style={styles.vehicleCard}>
      <Card.Content>
        <View style={styles.vehicleHeader}>
          <View style={styles.vehicleInfo}>
            <Text variant="titleMedium" style={styles.vehiclePlate}>
              {vehicle.plate}
            </Text>
            <Text variant="bodyMedium" style={styles.vehicleDetails}>
              {vehicle.brand} {vehicle.model} - {vehicle.year}
            </Text>
            <Text variant="bodySmall" style={styles.vehicleSpecs}>
              {platformTypes.find(p => p.value === vehicle.platformType)?.label}
            </Text>
            <Text variant="bodySmall" style={styles.supportedTypes}>
              Cekebilir: {vehicle.supportedVehicleTypes && vehicle.supportedVehicleTypes.length > 0
                ? vehicle.supportedVehicleTypes.map(type =>
                    vehicleTypes.find(vt => vt.value === type)?.icon || ''
                  ).join(' ')
                : 'Belirtilmemis'
              } ({vehicle.supportedVehicleTypes?.length || 0} tur)
            </Text>
          </View>
          <IconButton
            icon="delete"
            size={20}
            onPress={() => onRemove(vehicle.id)}
            iconColor={theme.colors.error}
          />
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  vehicleCard: {
    marginBottom: 12,
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  vehicleInfo: {
    flex: 1,
  },
  vehiclePlate: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  vehicleDetails: {
    color: '#666',
    marginTop: 4,
  },
  vehicleSpecs: {
    color: '#666',
    marginTop: 2,
  },
  supportedTypes: {
    color: '#26a69a',
    marginTop: 4,
    fontSize: 12,
    fontWeight: '500',
  },
});

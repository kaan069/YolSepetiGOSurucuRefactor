import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, IconButton, useTheme } from 'react-native-paper';
import { TowTruckInfo } from '../../../store/useVehicleStore';
import { platformTypes, vehicleTypes } from './index';
import { FkCard } from '../../../components/fk';
import { colors } from '../../../theme/design';

interface AddedTowTruckCardProps {
  vehicle: TowTruckInfo;
  onRemove: (id: string) => void;
}

export default function AddedTowTruckCard({ vehicle, onRemove }: AddedTowTruckCardProps) {
  const theme = useTheme();

  return (
    <FkCard variant="outlined" style={styles.vehicleCard}>
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
      
    </FkCard>
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
    color: colors.neutral[500],
    marginTop: 4,
  },
  vehicleSpecs: {
    color: colors.neutral[500],
    marginTop: 2,
  },
  supportedTypes: {
    color: colors.primary[500],
    marginTop: 4,
    fontSize: 12,
    fontWeight: '500',
  },
});

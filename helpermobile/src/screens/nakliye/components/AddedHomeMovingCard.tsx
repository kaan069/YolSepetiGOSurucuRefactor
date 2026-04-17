import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Chip, IconButton, useTheme } from 'react-native-paper';
import { HomeMovingInfo } from '../../../store/useVehicleStore';
import { homeMovingVehicleTypes } from './HomeMovingVehicleTypeSection';

interface AddedHomeMovingCardProps {
  vehicle: HomeMovingInfo;
  onRemove: (id: string) => void;
}

export default function AddedHomeMovingCard({ vehicle, onRemove }: AddedHomeMovingCardProps) {
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
              {homeMovingVehicleTypes.find(v => v.value === vehicle.vehicleType)?.icon} {vehicle.brand} {vehicle.model} - {vehicle.capacity} ton
            </Text>
            <Text variant="bodySmall" style={styles.vehicleSpecs}>
              {vehicle.volume}m³ - {vehicle.pricePerKm} TL/km
            </Text>
          </View>
          <IconButton
            icon="delete"
            size={20}
            onPress={() => onRemove(vehicle.id)}
            iconColor={theme.colors.error}
          />
        </View>

        {vehicle.equipment.length > 0 && (
          <View style={styles.equipmentTags}>
            {vehicle.equipment.slice(0, 3).map((eq, index) => (
              <Chip key={index} compact style={styles.equipmentTag}>
                {eq}
              </Chip>
            ))}
            {vehicle.equipment.length > 3 && (
              <Text variant="bodySmall" style={styles.moreText}>
                +{vehicle.equipment.length - 3} daha
              </Text>
            )}
          </View>
        )}
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
  equipmentTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 12,
    alignItems: 'center',
  },
  equipmentTag: {
    backgroundColor: '#e3f2fd',
  },
  moreText: {
    color: '#666',
    fontStyle: 'italic',
    marginLeft: 8,
  },
});

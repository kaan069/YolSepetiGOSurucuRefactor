import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Chip, IconButton, useTheme } from 'react-native-paper';
import { TransportInfo } from '../../../store/useVehicleStore';
import { vehicleTypes } from './VehicleTypeSection';

interface AddedTransportCardProps {
  transport: TransportInfo;
  onRemove: (id: string) => void;
}

export default function AddedTransportCard({ transport, onRemove }: AddedTransportCardProps) {
  const theme = useTheme();

  return (
    <Card mode="outlined" style={styles.transportCard}>
      <Card.Content>
        <View style={styles.transportHeader}>
          <View style={styles.transportInfo}>
            <Text variant="titleMedium" style={styles.transportPlate}>
              {transport.plate}
            </Text>
            <Text variant="bodyMedium" style={styles.transportDetails}>
              {vehicleTypes.find(v => v.value === transport.vehicleType)?.icon} {transport.brand} {transport.model} • {transport.capacity} ton
            </Text>
            <Text variant="bodySmall" style={styles.transportSpecs}>
              {transport.volume}m³ • {transport.pricePerKm} TL/km
            </Text>
          </View>
          <IconButton
            icon="delete"
            size={20}
            onPress={() => onRemove(transport.id)}
            iconColor={theme.colors.error}
          />
        </View>

        <View style={styles.transportServices}>
          <Text variant="bodySmall" style={styles.servicesLabel}>
            Hizmetler:
          </Text>
          <View style={styles.servicesTags}>
            {transport.services.slice(0, 3).map((service, index) => (
              <Chip key={index} compact style={styles.servicesTag}>
                {service}
              </Chip>
            ))}
            {transport.services.length > 3 && (
              <Text variant="bodySmall" style={styles.moreText}>
                +{transport.services.length - 3} daha
              </Text>
            )}
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  transportCard: {
    marginBottom: 12,
  },
  transportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  transportInfo: {
    flex: 1,
  },
  transportPlate: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  transportDetails: {
    color: '#666',
    marginTop: 4,
  },
  transportSpecs: {
    color: '#666',
    marginTop: 2,
  },
  transportServices: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  servicesLabel: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#666',
  },
  servicesTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    alignItems: 'center',
  },
  servicesTag: {
    backgroundColor: '#e3f2fd',
  },
  moreText: {
    color: '#666',
    fontStyle: 'italic',
    marginLeft: 8,
  },
});

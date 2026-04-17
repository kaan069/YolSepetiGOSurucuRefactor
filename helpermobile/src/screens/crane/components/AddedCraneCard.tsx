import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, IconButton, useTheme } from 'react-native-paper';
import { CraneInfo } from '../../../store/useVehicleStore';

interface AddedCraneCardProps {
  crane: CraneInfo;
  onRemove: (id: string) => void;
}

export default function AddedCraneCard({ crane, onRemove }: AddedCraneCardProps) {
  const theme = useTheme();

  return (
    <Card mode="outlined" style={styles.craneCard}>
      <Card.Content>
        <View style={styles.craneHeader}>
          <View style={styles.craneInfo}>
            <Text variant="titleMedium" style={styles.cranePlate}>
              {crane.plate}
            </Text>
            <Text variant="bodyMedium" style={styles.craneDetails}>
              {crane.brand} {crane.model} • {crane.year}
            </Text>
            <Text variant="bodySmall" style={styles.craneSpecs}>
              Max: {crane.maxHeight}m yükseklik
            </Text>
          </View>
          <IconButton
            icon="delete"
            size={20}
            onPress={() => onRemove(crane.id)}
            iconColor={theme.colors.error}
          />
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  craneCard: {
    marginBottom: 12,
  },
  craneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  craneInfo: {
    flex: 1,
  },
  cranePlate: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  craneDetails: {
    color: '#666',
    marginTop: 4,
  },
  craneSpecs: {
    color: '#666',
    marginTop: 2,
  },
});

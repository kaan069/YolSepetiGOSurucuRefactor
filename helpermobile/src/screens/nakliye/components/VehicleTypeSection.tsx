import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, Menu } from 'react-native-paper';

// Araç türleri - Vehicle types
export const vehicleTypes = [
  { value: 'van', label: 'Kamyonet', icon: '🚐', description: 'Küçük yükler için ideal (1-3m³)' },
  { value: 'small-truck', label: 'Küçük Kamyon', icon: '🚚', description: 'Orta boy yükler için (8-15m³)' },
  { value: 'truck', label: 'Kamyon', icon: '🚛', description: 'Büyük yükler için (20-40m³)' },
  { value: 'large-truck', label: 'Büyük Kamyon (TIR)', icon: '🚛', description: 'Çok büyük yükler için (50+m³)' },
];

interface VehicleTypeSectionProps {
  vehicleType: string;
  onVehicleTypeChange: (value: string) => void;
}

export default function VehicleTypeSection({
  vehicleType,
  onVehicleTypeChange,
}: VehicleTypeSectionProps) {
  const [showVehicleTypeMenu, setShowVehicleTypeMenu] = useState(false);
  const selectedVehicleType = vehicleTypes.find(v => v.value === vehicleType);

  return (
    <View style={styles.formSection}>
      <Text variant="titleSmall" style={styles.subsectionTitle}>Araç Türü</Text>

      <Menu
        visible={showVehicleTypeMenu}
        onDismiss={() => setShowVehicleTypeMenu(false)}
        anchor={
          <TextInput
            label="Araç Türü"
            value={selectedVehicleType?.label || ''}
            onFocus={() => setShowVehicleTypeMenu(true)}
            style={styles.input}
            right={<TextInput.Icon icon="chevron-down" onPress={() => setShowVehicleTypeMenu(true)} />}
            editable={false}
          />
        }
      >
        {vehicleTypes.map((type) => (
          <Menu.Item
            key={type.value}
            title={`${type.icon} ${type.label}`}
            onPress={() => {
              onVehicleTypeChange(type.value);
              setShowVehicleTypeMenu(false);
            }}
          />
        ))}
      </Menu>

      {selectedVehicleType && (
        <Text variant="bodySmall" style={styles.helperText}>
          {selectedVehicleType.description}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  formSection: {
    marginBottom: 24,
  },
  subsectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#666',
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'white',
  },
  helperText: {
    color: '#666',
    marginBottom: 12,
  },
});

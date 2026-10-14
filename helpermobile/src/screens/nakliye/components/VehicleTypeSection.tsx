import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Menu } from 'react-native-paper';
import { FkTextInput, FkInputIconButton } from '../../../components/fk';

// Araç türleri - Vehicle types
export const vehicleTypes = [
  { value: 'van', label: 'Kamyonet', icon: 'van-utility', description: 'Küçük yükler için ideal (1-3m³)' },
  { value: 'small-truck', label: 'Küçük Kamyon', icon: 'truck-outline', description: 'Orta boy yükler için (8-15m³)' },
  { value: 'truck', label: 'Kamyon', icon: 'truck', description: 'Büyük yükler için (20-40m³)' },
  { value: 'large-truck', label: 'Büyük Kamyon (TIR)', icon: 'truck-trailer', description: 'Çok büyük yükler için (50+m³)' },
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
          <FkTextInput
            label="Araç Türü"
            value={selectedVehicleType?.label || ''}
            onFocus={() => setShowVehicleTypeMenu(true)}
            containerStyle={styles.input}
            rightIcon={<FkInputIconButton icon="chevron-down" onPress={() => setShowVehicleTypeMenu(true)} />}
            editable={false}
            onPress={() => setShowVehicleTypeMenu(true)}
            onChange={() => {}}
          />
        }
      >
        {vehicleTypes.map((type) => (
          <Menu.Item
            key={type.value}
            title={type.label}
            leadingIcon={type.icon}
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
  },
  helperText: {
    color: '#666',
    marginBottom: 12,
  },
});

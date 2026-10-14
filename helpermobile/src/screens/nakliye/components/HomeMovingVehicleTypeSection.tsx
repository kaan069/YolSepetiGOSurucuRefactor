import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Menu } from 'react-native-paper';
import { FkTextInput, FkInputIconButton } from '../../../components/fk';
import { colors } from '../../../theme/design';

// Araç türleri
export const homeMovingVehicleTypes = [
  { value: 'van', label: 'Kamyonet', icon: 'van-utility', description: 'Küçük taşımalar için (1-3m³)' },
  { value: 'small-truck', label: 'Küçük Kamyon', icon: 'truck-outline', description: 'Orta boy taşımalar için (8-15m³)' },
  { value: 'truck', label: 'Kamyon', icon: 'truck', description: 'Büyük taşımalar için (20-40m³)' },
  { value: 'large-truck', label: 'Büyük Kamyon', icon: 'truck-trailer', description: 'Çok büyük taşımalar için (50+m³)' },
];

interface HomeMovingVehicleTypeSectionProps {
  vehicleType: string;
  onVehicleTypeChange: (value: string) => void;
}

export default function HomeMovingVehicleTypeSection({
  vehicleType,
  onVehicleTypeChange,
}: HomeMovingVehicleTypeSectionProps) {
  const [showVehicleTypeMenu, setShowVehicleTypeMenu] = useState(false);
  const selectedVehicleType = homeMovingVehicleTypes.find(v => v.value === vehicleType);

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
        {homeMovingVehicleTypes.map((type) => (
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
    color: colors.neutral[500],
  },
  input: {
    marginBottom: 16,
  },
  helperText: {
    color: colors.neutral[500],
    marginBottom: 12,
  },
});

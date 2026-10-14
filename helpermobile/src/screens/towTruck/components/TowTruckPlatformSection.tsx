import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Menu } from 'react-native-paper';
import { FkTextInput, FkInputIconButton } from '../../../components/fk';
import { colors } from '../../../theme/design';

export const platformTypes = [
  { value: 'open', label: 'Acik Platform', icon: '' },
  { value: 'closed', label: 'Kapali Kasa', icon: '' },
  { value: 'flatbed', label: 'Duz Platform', icon: '' },
];

interface TowTruckPlatformSectionProps {
  platformType: string;
  onPlatformTypeChange: (value: string) => void;
}

export default function TowTruckPlatformSection({
  platformType,
  onPlatformTypeChange,
}: TowTruckPlatformSectionProps) {
  const [showPlatformMenu, setShowPlatformMenu] = useState(false);

  return (
    <View style={styles.formSection}>
      <Text variant="titleSmall" style={styles.subsectionTitle}>
        Teknik Ozellikler
      </Text>

      <Menu
        visible={showPlatformMenu}
        onDismiss={() => setShowPlatformMenu(false)}
        anchor={
          <FkTextInput
            label="Platform Turu *"
            value={platformTypes.find(p => p.value === platformType)?.label || ''}
            onFocus={() => setShowPlatformMenu(true)}
            containerStyle={styles.input}
            rightIcon={<FkInputIconButton icon="chevron-down" onPress={() => setShowPlatformMenu(true)} />}
            editable={false}
            onPress={() => setShowPlatformMenu(true)}
            onChange={() => {}}
          />
        }
      >
        {platformTypes.map((type) => (
          <Menu.Item
            key={type.value}
            title={`${type.icon} ${type.label}`}
            onPress={() => {
              onPlatformTypeChange(type.value);
              setShowPlatformMenu(false);
            }}
          />
        ))}
      </Menu>
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
});

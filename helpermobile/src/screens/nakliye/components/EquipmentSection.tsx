import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Chip } from 'react-native-paper';

// Nakliye donanımları - Transport equipment
export const equipmentOptions = [
  'Ambalaj Malzemesi',
  'Koruma Örtüsü',
  'Taşıma Askısı',
  'Dolly (Tekerli Taşıma)',
  'Kaldırma Kemeri',
  'Bubble Wrap',
  'Karton Kutular',
  'Bantlar ve İpler',
  'Emniyet Kilitleri',
  'Ölçü Aleti',
  'El Arabası',
  'Merdiven',
];

interface EquipmentSectionProps {
  selectedEquipment: string[];
  onToggleEquipment: (equipment: string) => void;
}

export default function EquipmentSection({
  selectedEquipment,
  onToggleEquipment,
}: EquipmentSectionProps) {
  return (
    <View style={styles.formSection}>
      <Text variant="titleSmall" style={styles.subsectionTitle}>Donanımlar</Text>
      <Text variant="bodySmall" style={styles.helperText}>
        Aracınızda bulunan özel donanımları seçin
      </Text>

      <View style={styles.chipContainer}>
        {equipmentOptions.map((equipment) => (
          <Chip
            key={equipment}
            selected={selectedEquipment.includes(equipment)}
            onPress={() => onToggleEquipment(equipment)}
            style={styles.equipmentChip}
            mode={selectedEquipment.includes(equipment) ? 'flat' : 'outlined'}
          >
            {equipment}
          </Chip>
        ))}
      </View>
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
  helperText: {
    color: '#666',
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  equipmentChip: {
    marginBottom: 4,
    backgroundColor: '#e8f5e8',
  },
});

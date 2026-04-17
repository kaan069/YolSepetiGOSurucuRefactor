import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Chip } from 'react-native-paper';

// Çalışma alanları - Working areas
export const workingAreaOptions = [
  'Şehir İçi',
  'Şehirler Arası',
  'Avrupa',
  'Asya',
  'Tüm Türkiye',
  'Balkanlar',
  'Orta Doğu',
];

interface TransportWorkingAreasSectionProps {
  selectedAreas: string[];
  onToggleArea: (area: string) => void;
}

export default function TransportWorkingAreasSection({
  selectedAreas,
  onToggleArea,
}: TransportWorkingAreasSectionProps) {
  return (
    <View style={styles.formSection}>
      <Text variant="titleSmall" style={styles.subsectionTitle}>Çalışma Bölgeleri</Text>
      <Text variant="bodySmall" style={styles.helperText}>
        Hizmet verdiğiniz bölgeleri seçin
      </Text>

      <View style={styles.chipContainer}>
        {workingAreaOptions.map((area) => (
          <Chip
            key={area}
            selected={selectedAreas.includes(area)}
            onPress={() => onToggleArea(area)}
            style={styles.areaChip}
            mode={selectedAreas.includes(area) ? 'flat' : 'outlined'}
          >
            {area}
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
  areaChip: {
    marginBottom: 4,
    backgroundColor: '#fff3e0',
  },
});

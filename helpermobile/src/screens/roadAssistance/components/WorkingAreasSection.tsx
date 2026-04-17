import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Chip } from 'react-native-paper';

// Çalışma bölgeleri
export const workingAreaOptions = [
  'Şehir İçi',
  'Şehirler Arası',
  'Tüm Türkiye',
];

interface WorkingAreasSectionProps {
  selectedAreas: string[];
  onToggleArea: (area: string) => void;
  error?: string;
}

export default function WorkingAreasSection({
  selectedAreas,
  onToggleArea,
  error,
}: WorkingAreasSectionProps) {
  return (
    <View style={styles.formSection}>
      <Text variant="titleSmall" style={styles.subsectionTitle}>Çalışma Bölgeleri</Text>
      {error && <Text style={styles.errorText}>{error}</Text>}

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
  errorText: {
    color: '#d32f2f',
    fontSize: 12,
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  areaChip: {
    marginBottom: 4,
    backgroundColor: '#e3f2fd',
  },
});

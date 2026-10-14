import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Chip } from 'react-native-paper';
import { FkTextInput } from '../../../components/fk';

interface HelperStaffSectionProps {
  hasHelper: boolean;
  helperCount: string;
  onHasHelperChange: (value: boolean) => void;
  onHelperCountChange: (value: string) => void;
}

export default function HelperStaffSection({
  hasHelper,
  helperCount,
  onHasHelperChange,
  onHelperCountChange,
}: HelperStaffSectionProps) {
  return (
    <View style={styles.formSection}>
      <Text variant="titleSmall" style={styles.subsectionTitle}>Yardımcı Personel</Text>

      <View style={styles.checkboxRow}>
        <Chip
          selected={hasHelper}
          onPress={() => onHasHelperChange(!hasHelper)}
          icon={hasHelper ? 'check' : 'plus'}
          mode={hasHelper ? 'flat' : 'outlined'}
          style={styles.featureChip}
        >
          Yardımcı Personel Dahil
        </Chip>
      </View>

      {hasHelper && (
        <FkTextInput
          label="Yardımcı Personel Sayısı"
          value={helperCount}
          onChange={onHelperCountChange}
          keyboardType="numeric"
          containerStyle={styles.input}
          placeholder="2"
        />
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
  checkboxRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  featureChip: {
    marginBottom: 4,
  },
});

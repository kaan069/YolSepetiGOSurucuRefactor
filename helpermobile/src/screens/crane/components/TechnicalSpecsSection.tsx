import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { FkTextInput } from '../../../components/fk';

interface TechnicalSpecsSectionProps {
  maxHeight: string;
  onMaxHeightChange: (value: string) => void;
  errors: Record<string, string>;
}

export default function TechnicalSpecsSection({
  maxHeight,
  onMaxHeightChange,
  errors,
}: TechnicalSpecsSectionProps) {
  return (
    <View style={styles.formSection}>
      <Text variant="titleSmall" style={styles.subsectionTitle}>
        Teknik Özellikler
      </Text>

      <FkTextInput
        label="Maksimum Yükseklik (m) *"
        value={maxHeight}
        onChange={onMaxHeightChange}
        containerStyle={styles.input}
        invalid={!!(!!errors.maxHeight)}
        keyboardType="numeric"
        placeholder="40"
      />
      {errors.maxHeight && <Text style={styles.errorText}>{errors.maxHeight}</Text>}
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
  errorText: {
    color: '#d32f2f',
    fontSize: 12,
    marginTop: -12,
    marginBottom: 12,
  },
});

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput } from 'react-native-paper';

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
        ⚙️ Teknik Özellikler
      </Text>

      <TextInput
        label="Maksimum Yükseklik (m) *"
        value={maxHeight}
        onChangeText={onMaxHeightChange}
        style={styles.input}
        error={!!errors.maxHeight}
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
    backgroundColor: 'white',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 12,
    marginTop: -12,
    marginBottom: 12,
  },
});

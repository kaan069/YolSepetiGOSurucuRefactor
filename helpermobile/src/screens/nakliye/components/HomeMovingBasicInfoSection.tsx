import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput } from 'react-native-paper';

interface HomeMovingBasicInfoSectionProps {
  plate: string;
  brand: string;
  model: string;
  year: string;
  onPlateChange: (value: string) => void;
  onBrandChange: (value: string) => void;
  onModelChange: (value: string) => void;
  onYearChange: (value: string) => void;
  errors: Record<string, string>;
}

export default function HomeMovingBasicInfoSection({
  plate,
  brand,
  model,
  year,
  onPlateChange,
  onBrandChange,
  onModelChange,
  onYearChange,
  errors,
}: HomeMovingBasicInfoSectionProps) {
  return (
    <View style={styles.formSection}>
      <Text variant="titleSmall" style={styles.subsectionTitle}>Temel Bilgiler</Text>

      <TextInput
        label="Plaka *"
        value={plate}
        onChangeText={onPlateChange}
        style={styles.input}
        error={!!errors.plate}
        autoCapitalize="characters"
        placeholder="34 ABC 1234"
      />

      <View style={styles.row}>
        <TextInput
          label="Marka *"
          value={brand}
          onChangeText={onBrandChange}
          style={[styles.halfInput, styles.inputLeft]}
          error={!!errors.brand}
        />
        <TextInput
          label="Model *"
          value={model}
          onChangeText={onModelChange}
          style={[styles.halfInput, styles.inputRight]}
          error={!!errors.model}
        />
      </View>

      <TextInput
        label="Yıl"
        value={year}
        onChangeText={onYearChange}
        keyboardType="numeric"
        maxLength={4}
        style={styles.input}
        placeholder="2020"
      />
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
    marginBottom: 16,
    backgroundColor: 'white',
  },
  inputLeft: {
    marginRight: 6,
  },
  inputRight: {
    marginLeft: 6,
  },
});

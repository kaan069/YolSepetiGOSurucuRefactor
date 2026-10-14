import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { SelectDropdown } from '../../../components/common';
import { getVehicleYears } from '../../../data/vehicleData';
import { FkTextInput } from '../../../components/fk';

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
  const yearOptions = getVehicleYears().map((y) => ({ value: y.toString(), label: y.toString() }));

  return (
    <View style={styles.formSection}>
      <Text variant="titleSmall" style={styles.subsectionTitle}>Temel Bilgiler</Text>

      <FkTextInput
        label="Plaka *"
        value={plate}
        onChange={onPlateChange}
        containerStyle={styles.input}
        invalid={!!(!!errors.plate)}
        autoCapitalize="characters"
        placeholder="34 ABC 1234"
      />

      <View style={styles.row}>
        <FkTextInput
          label="Marka *"
          value={brand}
          onChange={onBrandChange}
          containerStyle={[styles.halfInput, styles.inputLeft]}
          invalid={!!(!!errors.brand)}
        />
        <FkTextInput
          label="Model *"
          value={model}
          onChange={onModelChange}
          containerStyle={[styles.halfInput, styles.inputRight]}
          invalid={!!(!!errors.model)}
        />
      </View>

      <SelectDropdown
        label="Yıl"
        value={year}
        options={yearOptions}
        onChange={onYearChange}
        placeholder="Yıl seçiniz"
        error={errors.year}
        searchable
        searchPlaceholder="Yıl ara..."
        primaryColor="#1565c0"
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
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
    marginBottom: 16,
  },
  inputLeft: {
    marginRight: 6,
  },
  inputRight: {
    marginLeft: 6,
  },
});

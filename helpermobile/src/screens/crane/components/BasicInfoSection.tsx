import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { SelectDropdown } from '../../../components/common';
import { FkTextInput } from '../../../components/fk';
import { colors } from '../../../theme/design';

interface BasicInfoSectionProps {
  plate: string;
  brand: string;
  model: string;
  year: string;
  brandOptions: { value: string; label: string }[];
  modelOptions: { value: string; label: string }[];
  yearOptions: { value: string; label: string }[];
  onPlateChange: (value: string) => void;
  onBrandChange: (value: string) => void;
  onModelChange: (value: string) => void;
  onYearChange: (value: string) => void;
  errors: Record<string, string>;
}

export default function BasicInfoSection({
  plate,
  brand,
  model,
  year,
  brandOptions,
  modelOptions,
  yearOptions,
  onPlateChange,
  onBrandChange,
  onModelChange,
  onYearChange,
  errors,
}: BasicInfoSectionProps) {
  return (
    <View style={styles.formSection}>
      <Text variant="titleSmall" style={styles.subsectionTitle}>
        Temel Bilgiler
      </Text>

      <FkTextInput
        label="Plaka *"
        value={plate}
        onChange={onPlateChange}
        containerStyle={styles.input}
        invalid={!!(!!errors.plate)}
        autoCapitalize="characters"
        placeholder="34 ABC 1234"
      />
      {errors.plate && <Text style={styles.errorText}>{errors.plate}</Text>}

      <SelectDropdown
        label="Marka"
        value={brand}
        options={brandOptions}
        onChange={onBrandChange}
        placeholder="Marka seciniz"
        error={errors.brand}
        searchable={true}
        searchPlaceholder="Marka ara..."
        required
        primaryColor={colors.primary[500]}
      />

      <SelectDropdown
        label="Model"
        value={model}
        options={modelOptions}
        onChange={onModelChange}
        placeholder={brand ? 'Model seciniz' : 'Once marka seciniz'}
        disabled={!brand}
        error={errors.model}
        searchable={true}
        searchPlaceholder="Model ara..."
        required
        primaryColor={colors.primary[500]}
      />

      <SelectDropdown
        label="Yil"
        value={year}
        options={yearOptions}
        onChange={onYearChange}
        placeholder="Yil seciniz"
        error={errors.year}
        searchable={true}
        searchPlaceholder="Yil ara..."
        required
        primaryColor={colors.primary[500]}
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
    color: colors.neutral[500],
  },
  input: {
    marginBottom: 16,
  },
  errorText: {
    color: colors.danger[600],
    fontSize: 12,
    marginTop: -12,
    marginBottom: 12,
  },
});

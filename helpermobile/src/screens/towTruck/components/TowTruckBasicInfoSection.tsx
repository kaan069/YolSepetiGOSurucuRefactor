import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { SelectDropdown } from '../../../components/common';
import { TOW_TRUCK_BRANDS, getVehicleYears, getModelsByBrand } from '../../../data/vehicleData';

interface TowTruckBasicInfoSectionProps {
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

export default function TowTruckBasicInfoSection({
  plate,
  brand,
  model,
  year,
  onPlateChange,
  onBrandChange,
  onModelChange,
  onYearChange,
  errors,
}: TowTruckBasicInfoSectionProps) {
  const vehicleYears = getVehicleYears();
  const availableModels = brand ? getModelsByBrand(brand, 'tow_truck') : [];

  const brandOptions = TOW_TRUCK_BRANDS.map(b => ({ value: b.value, label: b.label }));
  const modelOptions = availableModels.map(m => ({ value: m, label: m }));
  const yearOptions = vehicleYears.map(y => ({ value: y.toString(), label: y.toString() }));

  const handleBrandChange = (brandValue: string) => {
    onBrandChange(brandValue);
  };

  return (
    <View style={styles.formSection}>
      <Text variant="titleSmall" style={styles.subsectionTitle}>
        Temel Bilgiler
      </Text>

      <TextInput
        label="Plaka *"
        value={plate}
        onChangeText={onPlateChange}
        style={styles.input}
        error={!!errors.plate}
        autoCapitalize="characters"
        placeholder="34 ABC 1234"
      />

      <SelectDropdown
        label="Marka"
        value={brand}
        options={brandOptions}
        onChange={handleBrandChange}
        placeholder="Marka seciniz"
        error={errors.brand}
        searchable={true}
        searchPlaceholder="Marka ara..."
        required
        primaryColor="#26a69a"
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
        primaryColor="#26a69a"
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
        primaryColor="#26a69a"
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
});

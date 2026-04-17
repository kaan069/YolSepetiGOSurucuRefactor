import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput } from 'react-native-paper';

interface TransportPricingSectionProps {
  pricePerKm: string;
  pricePerHour: string;
  minPrice: string;
  onPricePerKmChange: (value: string) => void;
  onPricePerHourChange: (value: string) => void;
  onMinPriceChange: (value: string) => void;
  errors: Record<string, string>;
}

export default function TransportPricingSection({
  pricePerKm,
  pricePerHour,
  minPrice,
  onPricePerKmChange,
  onPricePerHourChange,
  onMinPriceChange,
  errors,
}: TransportPricingSectionProps) {
  return (
    <View style={styles.formSection}>
      <Text variant="titleSmall" style={styles.subsectionTitle}>Ücretlendirme</Text>

      <View style={styles.row}>
        <TextInput
          label="Km Başına Ücret (TL) *"
          value={pricePerKm}
          onChangeText={onPricePerKmChange}
          keyboardType="numeric"
          style={[styles.halfInput, styles.inputLeft]}
          error={!!errors.pricePerKm}
          placeholder="8"
        />
        <TextInput
          label="Saatlik Ücret (TL)"
          value={pricePerHour}
          onChangeText={onPricePerHourChange}
          keyboardType="numeric"
          style={[styles.halfInput, styles.inputRight]}
          placeholder="150"
        />
      </View>

      <TextInput
        label="Minimum Ücret (TL)"
        value={minPrice}
        onChangeText={onMinPriceChange}
        keyboardType="numeric"
        style={styles.input}
        placeholder="200"
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'white',
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

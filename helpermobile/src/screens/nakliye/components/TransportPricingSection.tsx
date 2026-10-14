import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { FkTextInput } from '../../../components/fk';

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
        <FkTextInput
          label="Km Başına Ücret (TL) *"
          value={pricePerKm}
          onChange={onPricePerKmChange}
          keyboardType="numeric"
          containerStyle={[styles.halfInput, styles.inputLeft]}
          invalid={!!(!!errors.pricePerKm)}
          placeholder="8"
        />
        <FkTextInput
          label="Saatlik Ücret (TL)"
          value={pricePerHour}
          onChange={onPricePerHourChange}
          keyboardType="numeric"
          containerStyle={[styles.halfInput, styles.inputRight]}
          placeholder="150"
        />
      </View>

      <FkTextInput
        label="Minimum Ücret (TL)"
        value={minPrice}
        onChange={onMinPriceChange}
        keyboardType="numeric"
        containerStyle={styles.input}
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

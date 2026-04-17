import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { useAppTheme } from '../../../hooks/useAppTheme';

interface PricingSectionProps {
  pricePerService: string;
  pricePerKm: string;
  onPricePerServiceChange: (value: string) => void;
  onPricePerKmChange: (value: string) => void;
  pricePerServiceError?: boolean;
  pricePerKmError?: boolean;
}

export default function PricingSection({
  pricePerService,
  pricePerKm,
  onPricePerServiceChange,
  onPricePerKmChange,
  pricePerServiceError,
  pricePerKmError,
}: PricingSectionProps) {
  const { appColors, cardBg } = useAppTheme();

  return (
    <View style={styles.formSection}>
      <Text variant="titleSmall" style={[styles.subsectionTitle, { color: appColors.text.secondary }]}>Ücretlendirme</Text>
      <Text variant="bodySmall" style={[styles.helperText, { color: appColors.text.secondary }]}>
        Manuel teklif sisteminde bu değerler referans olarak kullanılacak
      </Text>

      <View style={styles.row}>
        <TextInput
          label="Ortalama Hizmet Ücreti (TL) *"
          value={pricePerService}
          onChangeText={onPricePerServiceChange}
          keyboardType="numeric"
          style={[styles.halfInput, styles.inputLeft, { backgroundColor: cardBg }]}
          error={pricePerServiceError}
          placeholder="150"
        />
        <TextInput
          label="Km Başına Ücret (TL) *"
          value={pricePerKm}
          onChangeText={onPricePerKmChange}
          keyboardType="numeric"
          style={[styles.halfInput, styles.inputRight, { backgroundColor: cardBg }]}
          error={pricePerKmError}
          placeholder="5"
        />
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
  },
  helperText: {
    marginBottom: 12,
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

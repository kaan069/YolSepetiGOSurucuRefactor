import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { FkTextInput } from '../../../components/fk';

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
        <FkTextInput
          label="Ortalama Hizmet Ücreti (TL) *"
          value={pricePerService}
          onChange={onPricePerServiceChange}
          keyboardType="numeric"
          containerStyle={[styles.halfInput, styles.inputLeft, { backgroundColor: cardBg }]}
          invalid={!!(pricePerServiceError)}
          placeholder="150"
        />
        <FkTextInput
          label="Km Başına Ücret (TL) *"
          value={pricePerKm}
          onChange={onPricePerKmChange}
          keyboardType="numeric"
          containerStyle={[styles.halfInput, styles.inputRight, { backgroundColor: cardBg }]}
          invalid={!!(pricePerKmError)}
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

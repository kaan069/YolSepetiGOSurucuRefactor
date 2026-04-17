// Fiyat teklifi kartı
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, TextInput } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { formatNumber } from '../constants';
import { useAppTheme } from '../../../hooks/useAppTheme';

interface PriceOfferCardProps {
  price: string;
  onPriceChange: (value: string) => void;
  error?: string;
}

// Binlik ayracı ile formatlama (Türk formatı: 1.234.567)
const formatWithThousandsSeparator = (value: string): string => {
  if (!value) return '';
  const num = value.replace(/[^0-9]/g, '');
  if (!num) return '';
  return parseInt(num, 10).toLocaleString('tr-TR');
};

export default function PriceOfferCard({ price, onPriceChange, error }: PriceOfferCardProps) {
  const { isDarkMode, appColors, cardBg } = useAppTheme();

  const handleChange = (text: string) => {
    // Sadece rakam kabul et
    const numericText = text.replace(/[^0-9]/g, '');
    onPriceChange(numericText);
  };

  const showPreview = price && price.length > 0 && parseInt(price) > 0;

  const commissionNoteBg = isDarkMode ? '#2a1f0e' : '#FFF3E0';
  const commissionNoteTextColor = isDarkMode ? '#FFB74D' : '#e65100';
  const previewBg = isDarkMode ? '#1a2e1a' : '#E8F5E9';

  return (
    <Card style={styles.card}>
      <Card.Title
        title="Fiyat Teklifiniz"
        subtitle="Bu iş için teklif edeceğiniz tutarı girin"
        left={() => <MaterialCommunityIcons name="currency-try" size={24} color="#26a69a" />}
      />
      <Card.Content>
        <Text style={[styles.hint, { color: appColors.text.secondary }]}>
          Yol yardım hizmeti için teklif edeceğiniz fiyatı girin. Müşteri teklifinizi değerlendirecektir.
        </Text>

        <View style={[styles.commissionNote, { backgroundColor: commissionNoteBg }]}>
          <MaterialCommunityIcons name="information" size={18} color="#e65100" />
          <Text style={[styles.commissionNoteText, { color: commissionNoteTextColor }]}>
            Vereceğiniz teklif içinde platform komisyonu dahildir, bunu göz önünde bulundurarak teklif verin.
          </Text>
        </View>

        <TextInput
          label="Teklif Tutarı (TL)"
          value={formatWithThousandsSeparator(price)}
          onChangeText={handleChange}
          keyboardType="numeric"
          mode="outlined"
          style={[styles.input, { backgroundColor: cardBg }]}
          error={!!error}
          right={<TextInput.Affix text="TL" />}
          placeholder="Örn: 500"
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {showPreview && (
          <View style={[styles.preview, { backgroundColor: previewBg }]}>
            <Text style={styles.previewLabel}>Teklifiniz:</Text>
            <Text style={styles.previewValue}>{formatNumber(parseInt(price))} TL</Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  hint: {
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18,
  },
  commissionNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  commissionNoteText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  input: {},
  errorText: {
    color: '#f44336',
    fontSize: 12,
    marginTop: 4,
  },
  preview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  previewLabel: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
  },
  previewValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
});

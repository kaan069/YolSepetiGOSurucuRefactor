// Fiyat teklifi kartı - Nakliye
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, TextInput, Divider } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { formatNumber } from '../constants';

interface PriceOfferCardProps {
  price: string;
  onPriceChange: (value: string) => void;
  error?: string;
  hint?: string;
  placeholder?: string;
}

// Binlik ayracı ile formatlama (Türk formatı: 1.234.567)
const formatWithThousandsSeparator = (value: string): string => {
  if (!value) return '';
  const num = value.replace(/[^0-9]/g, '');
  if (!num) return '';
  return parseInt(num, 10).toLocaleString('tr-TR');
};

export default function PriceOfferCard({
  price,
  onPriceChange,
  error,
  hint = 'Nakliye için teklif edeceğiniz fiyatı girin. Müşteri teklifinizi değerlendirecektir.',
  placeholder = 'Örn: 5.000',
}: PriceOfferCardProps) {
  const handleChange = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    onPriceChange(numericValue);
  };

  const showPreview = price && price.length > 0 && parseInt(price) > 0;

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <MaterialCommunityIcons name="currency-try" size={24} color="#26a69a" />
          <Text variant="titleMedium" style={styles.title}>Fiyat Teklifiniz</Text>
        </View>
        <Divider style={styles.divider} />

        <Text style={styles.hint}>{hint}</Text>

        <View style={styles.commissionNote}>
          <MaterialCommunityIcons name="information" size={18} color="#e65100" />
          <Text style={styles.commissionNoteText}>
            Vereceğiniz teklif içinde platform komisyonu dahildir, bunu göz önünde bulundurarak teklif verin.
          </Text>
        </View>

        <TextInput
          label="Teklif Tutarı (TL)"
          value={formatWithThousandsSeparator(price)}
          onChangeText={handleChange}
          keyboardType="numeric"
          mode="outlined"
          style={styles.input}
          error={!!error}
          right={<TextInput.Affix text="TL" />}
          placeholder={placeholder}
        />
        {error && <Text style={styles.errorText}>{error}</Text>}

        {showPreview && (
          <View style={styles.preview}>
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
    borderRadius: 12,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    marginLeft: 8,
    fontWeight: 'bold',
    color: '#333',
  },
  divider: {
    marginBottom: 12,
  },
  hint: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    lineHeight: 18,
  },
  commissionNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  commissionNoteText: {
    flex: 1,
    fontSize: 13,
    color: '#e65100',
    lineHeight: 18,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#fff',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 12,
    marginTop: 4,
  },
  preview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
  },
  previewLabel: {
    fontSize: 14,
    color: '#333',
  },
  previewValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#26a69a',
  },
});

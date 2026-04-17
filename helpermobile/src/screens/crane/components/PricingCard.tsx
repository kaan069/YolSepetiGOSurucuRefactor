// Fiyat teklif kartı - Vinç (Manuel teklif girişi)
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, TextInput } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface PricingCardProps {
  offerPrice: string;
  onOfferPriceChange: (value: string) => void;
  distance: number | null;
  estimatedDuration: number | null;
}

// Binlik ayracı ile formatlama (Türk formatı: 1.234.567)
const formatWithThousandsSeparator = (value: string): string => {
  if (!value) return '';
  const num = value.replace(/[^0-9]/g, '');
  if (!num) return '';
  return parseInt(num, 10).toLocaleString('tr-TR');
};

export default function PricingCard({
  offerPrice,
  onOfferPriceChange,
  distance,
  estimatedDuration
}: PricingCardProps) {

  const handlePriceChange = (text: string) => {
    // Sadece rakamları al (binlik ayraçları ve diğer karakterleri kaldır)
    const numericValue = text.replace(/[^0-9]/g, '');
    onOfferPriceChange(numericValue);
  };

  return (
    <Card style={styles.card}>
      <Card.Title title="💰 Fiyat Teklifi" />
      <Card.Content>
        <View style={styles.infoBox}>
          {distance !== null && (
            <View style={styles.row}>
              <Text style={styles.label}>Mesafe:</Text>
              <Text style={styles.value}>{distance.toFixed(1)} km</Text>
            </View>
          )}
          {estimatedDuration !== null && (
            <View style={styles.row}>
              <Text style={styles.label}>Tahmini Süre:</Text>
              <Text style={styles.value}>{estimatedDuration} saat</Text>
            </View>
          )}
        </View>

        <View style={styles.commissionNote}>
          <MaterialCommunityIcons name="information" size={18} color="#e65100" />
          <Text style={styles.commissionNoteText}>
            Vereceğiniz teklif içinde platform komisyonu dahildir, bunu göz önünde bulundurarak teklif verin.
          </Text>
        </View>

        <TextInput
          label="Fiyat Teklifiniz (₺) *"
          value={formatWithThousandsSeparator(offerPrice)}
          onChangeText={handlePriceChange}
          keyboardType="numeric"
          style={styles.input}
          placeholder="Örn: 2.500"
          left={<TextInput.Icon icon="currency-try" />}
        />

        <Text style={styles.helperText}>
          Müşteriye gösterilecek toplam fiyatı girin. Platform komisyonu düşüldükten sonra kalan tutar size ödenecektir.
        </Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  infoBox: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
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
    backgroundColor: 'white',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

// Teklif gereksinimleri kartı - Vinç (eksik bilgi uyarısı)
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';

interface RequirementsCardProps {
  selectedCraneId: number | null;
  distance: number | null;
  offerPrice: string;
}

export default function RequirementsCard({
  selectedCraneId,
  distance,
  offerPrice,
}: RequirementsCardProps) {
  const hasValidPrice = offerPrice.trim() !== '' && parseFloat(offerPrice) > 0;

  // Tüm şartlar sağlandıysa gösterme
  if (selectedCraneId && distance && hasValidPrice) return null;

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.title}>⚠️ Teklif Göndermek İçin:</Text>
        <View style={styles.list}>
          <Text style={styles.item}>
            {selectedCraneId ? '✅' : '❌'} Vinç Seçimi:{' '}
            {selectedCraneId ? `Seçildi (ID: ${selectedCraneId})` : 'Lütfen yukarıdan bir vinç seçin'}
          </Text>
          <Text style={styles.item}>
            {distance ? '✅' : '❌'} Mesafe:{' '}
            {distance ? `${distance.toFixed(1)} km` : 'GPS izni verdiğinizden emin olun'}
          </Text>
          <Text style={styles.item}>
            {hasValidPrice ? '✅' : '❌'} Fiyat Teklifi:{' '}
            {hasValidPrice ? `${offerPrice} TL` : 'Lütfen bir fiyat teklifi girin'}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    backgroundColor: '#FFF3E0',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#E65100',
  },
  list: {
    marginLeft: 12,
  },
  item: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
});

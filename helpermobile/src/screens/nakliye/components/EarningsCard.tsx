// Kazanç kartı - Nakliye iş detayı
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { useAppTheme } from '../../../hooks/useAppTheme';

interface EarningsCardProps {
  finalPrice: number;
  status: 'awaiting_approval' | 'in_progress' | 'completed';
}

export default function EarningsCard({ finalPrice, status }: EarningsCardProps) {
  const { isDarkMode, appColors } = useAppTheme();

  if (!finalPrice) return null;

  const getLabel = () => {
    switch (status) {
      case 'completed':
        return 'Bu İşten Kazancınız';
      case 'awaiting_approval':
        return 'Teklif Tutarı';
      default:
        return 'Tahmini Kazancınız';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'completed':
        return 'İş tamamlandı';
      case 'awaiting_approval':
        return 'Onay bekleniyor';
      default:
        return 'İş devam ediyor';
    }
  };

  const containerBg = isDarkMode ? '#2a1f0e' : '#FFF3E0';
  const accentColor = isDarkMode ? '#FFB74D' : '#E65100';

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={[styles.container, { backgroundColor: containerBg }]}>
          <Text style={[styles.label, { color: accentColor }]}>{getLabel()}</Text>
          <Text style={[styles.value, { color: accentColor }]}>{finalPrice} TL</Text>
          <Text style={[styles.status, { color: appColors.text.secondary }]}>{getStatusText()}</Text>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  container: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  value: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  status: {
    fontSize: 12,
    marginTop: 4,
  },
});

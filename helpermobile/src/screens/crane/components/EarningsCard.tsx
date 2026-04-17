// Kazanç kartı - Vinç
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { useAppTheme } from '../../../hooks/useAppTheme';

interface EarningsCardProps {
  amount: number | string;
  status: 'awaiting_approval' | 'in_progress' | 'completed';
}

export default function EarningsCard({ amount, status }: EarningsCardProps) {
  const { isDarkMode, appColors } = useAppTheme();

  const getLabel = () => {
    switch (status) {
      case 'completed': return 'Bu İşten Kazancınız';
      case 'awaiting_approval': return 'Teklif Tutarı';
      default: return 'Tahmini Kazancınız';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'completed': return '✅ İş tamamlandı';
      case 'awaiting_approval': return '⏰ Onay bekleniyor';
      default: return '⏳ İş devam ediyor';
    }
  };

  const containerBg = isDarkMode ? '#1a2e1a' : '#E8F5E9';

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={[styles.container, { backgroundColor: containerBg }]}>
          <Text style={styles.label}>💰 {getLabel()}</Text>
          <Text style={styles.amount}>{amount} ₺</Text>
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
    color: '#2E7D32',
    marginBottom: 8,
  },
  amount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  status: {
    fontSize: 12,
    marginTop: 4,
  },
});

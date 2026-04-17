// Tahmini iş süresi kartı - Vinç
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { useAppTheme } from '../../../hooks/useAppTheme';

interface DurationCardProps {
  hours: number;
}

export default function DurationCard({ hours }: DurationCardProps) {
  const { isDarkMode, appColors } = useAppTheme();

  const containerBg = isDarkMode ? '#0d2137' : '#E3F2FD';
  const valueColor = isDarkMode ? '#90CAF9' : '#1976D2';

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={[styles.container, { backgroundColor: containerBg }]}>
          <Text style={[styles.label, { color: appColors.text.secondary }]}>⏱️ Tahmini İş Süresi</Text>
          <Text style={[styles.value, { color: valueColor }]}>{hours} saat</Text>
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
    padding: 16,
    borderRadius: 12,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
  },
  value: {
    fontSize: 20,
    fontWeight: '600',
  },
});

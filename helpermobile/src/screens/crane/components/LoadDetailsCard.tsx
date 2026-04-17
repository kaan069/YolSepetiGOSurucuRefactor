// Yük ve vinç detayları kartı
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { useAppTheme } from '../../../hooks/useAppTheme';

interface LoadDetailsCardProps {
  loadType?: string;
  loadWeight?: string;
  liftHeight?: string;
  floor?: string;
  hasObstacles?: boolean;
  obstacleNote?: string;
}

export default function LoadDetailsCard({
  loadType,
  loadWeight,
  liftHeight,
  floor,
  hasObstacles,
  obstacleNote,
}: LoadDetailsCardProps) {
  const { isDarkMode, appColors } = useAppTheme();

  const detailsBg = isDarkMode ? '#1a2e1a' : '#E8F5E9';
  const noteBg = isDarkMode ? '#2a1f0e' : '#FFF3E0';

  return (
    <Card style={styles.card}>
      <Card.Title title="🏗️ Yük ve Vinç Detayları" titleStyle={styles.title} />
      <Card.Content>
        <View style={[styles.detailsContainer, { backgroundColor: detailsBg }]}>
          <View style={styles.row}>
            <Text style={[styles.label, { color: appColors.text.secondary }]}>Yük Tipi:</Text>
            <Text style={[styles.value, { color: appColors.text.primary }]}>{loadType || 'Belirtilmemiş'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: appColors.text.secondary }]}>Yük Ağırlığı:</Text>
            <Text style={[styles.value, { color: appColors.text.primary }]}>{loadWeight || '?'} kg</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: appColors.text.secondary }]}>Kaldırma Yüksekliği:</Text>
            <Text style={[styles.value, { color: appColors.text.primary }]}>{liftHeight || '?'} m</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: appColors.text.secondary }]}>Kat Bilgisi:</Text>
            <Text style={[styles.value, { color: appColors.text.primary }]}>{floor || '?'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: appColors.text.secondary }]}>Engel Durumu:</Text>
            <Text style={[styles.value, { color: hasObstacles ? '#FF5722' : '#4CAF50' }]}>
              {hasObstacles ? '⚠️ Engel var' : '✅ Engel yok'}
            </Text>
          </View>
        </View>

        {obstacleNote && (
          <View style={[styles.noteContainer, { backgroundColor: noteBg }]}>
            <Text style={[styles.noteTitle, { color: appColors.text.secondary }]}>📝 Engel Notu:</Text>
            <Text style={[styles.noteText, { color: appColors.text.secondary }]}>{obstacleNote}</Text>
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
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  detailsContainer: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
  },
  noteContainer: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  noteText: {
    fontSize: 14,
  },
});

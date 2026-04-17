// İş detayları kartı - Vinç
import React from 'react';
import { StyleSheet } from 'react-native';
import { Card, Text, Divider } from 'react-native-paper';

interface JobDetailsCardProps {
  orderId: string;
  loadType?: string;
  loadWeight?: string;
  liftHeight?: string;
  floor?: string;
  hasObstacles?: boolean;
  obstacleNote?: string;
}

export default function JobDetailsCard({
  orderId,
  loadType,
  loadWeight,
  liftHeight,
  floor,
  hasObstacles,
  obstacleNote,
}: JobDetailsCardProps) {
  return (
    <Card style={styles.card}>
      <Card.Title
        title="Vinç Talebi Detayları"
        subtitle={`Talep #${orderId.slice(0, 6)}`}
      />
      <Card.Content>
        <Text style={styles.label}>Yük Tipi:</Text>
        <Text>{loadType || 'Belirtilmemiş'}</Text>
        <Divider style={styles.divider} />

        <Text style={styles.label}>Yük Ağırlığı:</Text>
        <Text>{loadWeight ? `${loadWeight} kg` : 'Belirtilmemiş'}</Text>
        <Divider style={styles.divider} />

        <Text style={styles.label}>Kaldırma Yüksekliği:</Text>
        <Text>{liftHeight ? `${liftHeight} m` : 'Belirtilmemiş'}</Text>
        <Divider style={styles.divider} />

        <Text style={styles.label}>Kat Bilgisi:</Text>
        <Text>{floor || 'Belirtilmemiş'}</Text>
        <Divider style={styles.divider} />

        {hasObstacles && (
          <>
            <Text style={styles.label}>Engeller:</Text>
            <Text style={styles.warningText}>⚠️ Engel var</Text>
            {obstacleNote && (
              <Text style={styles.noteText}>{obstacleNote}</Text>
            )}
          </>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  label: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  divider: {
    marginVertical: 8,
  },
  warningText: {
    color: '#ff9800',
    fontWeight: 'bold',
  },
  noteText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});

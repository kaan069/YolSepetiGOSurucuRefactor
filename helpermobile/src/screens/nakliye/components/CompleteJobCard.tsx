// İşi tamamla kartı - Nakliye iş detayı
import React from 'react';
import { StyleSheet, Alert } from 'react-native';
import { Card, Button } from 'react-native-paper';

interface CompleteJobCardProps {
  visible: boolean;
}

export default function CompleteJobCard({ visible }: CompleteJobCardProps) {
  if (!visible) return null;

  const handleComplete = () => {
    Alert.alert(
      'Bilgilendirme',
      'İşi bitirebilmeniz için müşterinin takip linkinden onay vermesi gerekmektedir.',
      [{ text: 'Tamam' }]
    );
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Button
          icon="check-circle"
          mode="contained"
          buttonColor="#FF9800"
          contentStyle={styles.buttonContent}
          onPress={handleComplete}
        >
          İşi Tamamla
        </Button>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Button } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../../hooks/useAppTheme';

interface CompleteJobCardProps {
  visible: boolean;
  onComplete: () => void;
}

export default function CompleteJobCard({ visible, onComplete }: CompleteJobCardProps) {
  const { isDarkMode } = useAppTheme();

  if (!visible) return null;

  const noticeBg = isDarkMode ? '#0d2137' : '#E3F2FD';
  const noticeText = isDarkMode ? '#90CAF9' : '#1565C0';

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={[styles.legalNoticeContainer, { backgroundColor: noticeBg }]}>
          <MaterialCommunityIcons name="information" size={20} color="#1976D2" />
          <Text style={[styles.legalNoticeText, { color: noticeText }]}>
            İş tamamlanması için müşterinin takip sayfasından onay vermesi gerekmektedir.
            Müşteri, size gönderilen takip linkinden "Aracım Teslim Noktasına Bırakıldı" butonuna
            bastığında iş otomatik olarak tamamlanacaktır. Lütfen aracı teslim ettikten sonra
            müşteriye takip linkini hatırlatın ve onay vermesini bekleyin.
          </Text>
        </View>
        <Button
          icon="check-circle"
          mode="contained"
          buttonColor="#4CAF50"
          contentStyle={{ paddingVertical: 8 }}
          onPress={onComplete}
          style={{ marginTop: 12 }}
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
  legalNoticeContainer: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#1976D2',
    gap: 12,
  },
  legalNoticeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
});

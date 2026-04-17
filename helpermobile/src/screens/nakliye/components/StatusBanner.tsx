// Onay bekliyor banner - Nakliye iş detayı
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../../hooks/useAppTheme';

interface StatusBannerProps {
  visible: boolean;
}

export default function StatusBanner({ visible }: StatusBannerProps) {
  const { isDarkMode, appColors } = useAppTheme();

  if (!visible) return null;

  const cardBg = isDarkMode ? '#2a2200' : '#FFF9C4';
  const titleColor = isDarkMode ? '#FFB74D' : '#E65100';

  return (
    <Card style={[styles.card, { backgroundColor: cardBg }]}>
      <Card.Content>
        <View style={styles.content}>
          <MaterialCommunityIcons name="clock-alert-outline" size={48} color="#F57C00" />
          <Text style={[styles.title, { color: titleColor }]}>Müşteri Onayı Bekleniyor</Text>
          <Text style={[styles.text, { color: appColors.text.secondary }]}>
            Teklifiniz müşteriye iletildi. Müşteri teklifi onayladığında iş başlayacak.
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  content: {
    padding: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
    textAlign: 'center',
  },
  text: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});

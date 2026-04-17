// Status banner - Onay bekliyor durumu için
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../../hooks/useAppTheme';

interface StatusBannerProps {
  type: 'awaiting_approval';
}

export default function StatusBanner({ type }: StatusBannerProps) {
  const { isDarkMode, appColors } = useAppTheme();

  const cardBg = isDarkMode ? '#2a2200' : '#FFF9C4';
  const titleColor = isDarkMode ? '#FFB74D' : '#E65100';
  const infoBoxBg = isDarkMode ? '#3d3200' : '#FFE082';

  if (type === 'awaiting_approval') {
    return (
      <Card style={[styles.card, { backgroundColor: cardBg }]}>
        <Card.Content>
          <View style={styles.content}>
            <MaterialCommunityIcons name="clock-alert-outline" size={48} color="#F57C00" />
            <Text style={[styles.title, { color: titleColor }]}>Müşteri Onayı Bekleniyor</Text>
            <Text style={[styles.text, { color: appColors.text.secondary }]}>
              Teklifiniz müşteriye iletildi. Müşteri teklifi onayladığında iş başlayacak ve siz bilgilendirileceksiniz.
            </Text>
            <View style={[styles.infoBox, { backgroundColor: infoBoxBg }]}>
              <MaterialCommunityIcons name="information" size={20} color="#F57C00" />
              <Text style={[styles.infoText, { color: titleColor }]}>
                Müşteri onayını tracking linki üzerinden verecektir
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  }

  return null;
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
});

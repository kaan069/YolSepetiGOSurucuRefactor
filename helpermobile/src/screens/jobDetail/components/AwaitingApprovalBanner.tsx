import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../../hooks/useAppTheme';

interface AwaitingApprovalBannerProps {
  visible: boolean;
}

export default function AwaitingApprovalBanner({ visible }: AwaitingApprovalBannerProps) {
  const { isDarkMode, appColors } = useAppTheme();

  if (!visible) return null;

  const cardBg = isDarkMode ? '#2a2200' : '#FFF9C4';
  const titleColor = isDarkMode ? '#FFB74D' : '#E65100';
  const infoBoxBg = isDarkMode ? '#3d3200' : '#FFE082';

  return (
    <Card style={[styles.card, { backgroundColor: cardBg }]}>
      <Card.Content>
        <View style={styles.container}>
          <MaterialCommunityIcons name="clock-alert-outline" size={48} color="#F57C00" />
          <Text style={[styles.title, { color: titleColor }]}>Müşteri Onayı Bekleniyor</Text>
          <Text style={[styles.subtitle, { color: appColors.text.secondary }]}>
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

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  container: {
    padding: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
    textAlign: 'center',
  },
  subtitle: {
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

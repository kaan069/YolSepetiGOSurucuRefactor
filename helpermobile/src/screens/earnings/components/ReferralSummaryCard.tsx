import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { formatMoney } from '../constants';
import { useAppTheme } from '../../../hooks/useAppTheme';

interface Props {
  total: string;
  onPress: () => void;
}

export default function ReferralSummaryCard({ total, onPress }: Props) {
  const { isDarkMode, appColors, cardBg } = useAppTheme();
  const amount = parseFloat(total) || 0;
  const labelColor = appColors.primary[400];
  const amountColor = isDarkMode ? appColors.primary[300] : '#004d40';

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.container, { backgroundColor: cardBg, borderColor: appColors.primary[50] }]}
      activeOpacity={0.7}
    >
      <View style={[styles.iconWrap, { backgroundColor: appColors.primary[50] }]}>
        <MaterialCommunityIcons name="gift-outline" size={20} color={labelColor} />
      </View>
      <View style={styles.textWrap}>
        <Text style={[styles.label, { color: labelColor }]}>Referans Kazançlarım</Text>
        <Text style={[styles.subtitle, { color: appColors.text.secondary }]}>Detayları gör</Text>
      </View>
      <Text style={[styles.amount, { color: amountColor }]}>{formatMoney(amount)} ₺</Text>
      <MaterialCommunityIcons name="chevron-right" size={20} color={appColors.text.secondary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  amount: {
    fontSize: 18,
    fontWeight: '800',
  },
});

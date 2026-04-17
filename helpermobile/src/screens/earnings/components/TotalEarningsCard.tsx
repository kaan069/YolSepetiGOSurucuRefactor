import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { EarningsValueShimmer } from '../../../components/common/ShimmerPlaceholder';
import { formatMoney } from '../constants';
import { useAppTheme } from '../../../hooks/useAppTheme';

interface Props {
  totalEarnings: number;
  loading: boolean;
}

export default function TotalEarningsCard({ totalEarnings, loading }: Props) {
  const { isDarkMode, appColors, cardBg } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: cardBg, shadowColor: isDarkMode ? '#000' : '#00897b' }]}>
      <View style={styles.topBar} />
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: appColors.primary[50] }]}>
          <Text style={styles.icon}>💰</Text>
        </View>
        <Text style={[styles.label, { color: appColors.primary[400] }]}>TOPLAM KAZANCINIZ</Text>
        {loading ? (
          <EarningsValueShimmer />
        ) : (
          <Text style={[styles.amount, { color: isDarkMode ? appColors.primary[300] : '#004d40' }]}>
            {formatMoney(totalEarnings)} ₺
          </Text>
        )}
        <View style={styles.divider} />
        <Text style={[styles.subtitle, { color: appColors.text.secondary }]}>Tüm tamamlanan işlerden</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  topBar: {
    height: 6,
    backgroundColor: '#00897b',
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  icon: { fontSize: 28 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  amount: {
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1,
  },
  divider: {
    width: 40,
    height: 3,
    backgroundColor: '#26a69a',
    borderRadius: 2,
    marginVertical: 12,
  },
  subtitle: {
    fontSize: 12,
  },
});

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { EarningsValueShimmer } from '../../../components/common/ShimmerPlaceholder';
import { formatMoney } from '../constants';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { FkCard, FkIconChip } from '../../../components/fk';
import { colors, spacing } from '../../../theme/design';

interface Props {
  totalEarnings: number;
  loading: boolean;
}

/** Toplam kazanç — vurgulu kart, büyük tutar. */
export default function TotalEarningsCard({ totalEarnings, loading }: Props) {
  const { isDarkMode, appColors } = useAppTheme();

  return (
    <FkCard variant="highlighted" rounded="xl" padding={spacing.lg} style={styles.card}>
      <View style={styles.content}>
        <FkIconChip icon="wallet-outline" size={52} shape="circle" variant="solid" />
        <Text style={[styles.label, { color: isDarkMode ? appColors.text.secondary : colors.primary[700] }]}>
          Toplam Kazancınız
        </Text>
        {loading ? (
          <EarningsValueShimmer />
        ) : (
          <Text style={[styles.amount, { color: isDarkMode ? colors.primary[300] : colors.primary[800] }]}>
            {formatMoney(totalEarnings)} ₺
          </Text>
        )}
        <Text style={[styles.subtitle, { color: appColors.text.secondary }]}>Tüm tamamlanan işlerden</Text>
      </View>
    </FkCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  content: {
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: spacing.sm + 4,
  },
  amount: {
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -1,
    marginTop: spacing.xs,
  },
  subtitle: {
    fontSize: 12,
    marginTop: spacing.xs,
  },
});

/**
 * Ana ekranda kazanç özeti: bugün ve son 7 gün (net kazanç + tamamlanan iş). Basınca Kazançlar.
 */
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { FkIconChip } from '../fk';
import { useFkTokens } from '../../hooks/useFkTokens';
import type { PeriodEarningsResponse } from '../../api/types';
import type { HomeEarningsStatus } from '../../hooks/useHomeEarnings';
import { colors, radius, shadows, spacing, text } from '../../theme/design';

interface Props {
  today: PeriodEarningsResponse | null;
  week: PeriodEarningsResponse | null;
  status: HomeEarningsStatus;
  onPress: () => void;
}

function formatAmount(value: string | undefined): string {
  const amount = parseFloat(value ?? '');
  if (!Number.isFinite(amount)) return '–';
  return `${amount.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ₺`;
}

export default function EarningsSummaryCard({ today, week, status, onPress }: Props) {
  const { tokens } = useFkTokens();

  const column = (data: PeriodEarningsResponse | null, fallbackLabel: string) => (
    <View style={styles.column}>
      <Text style={[styles.period, { color: tokens.colors.textSecondary }]}>{data?.period || fallbackLabel}</Text>
      <Text style={[styles.amount, { color: tokens.colors.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>
        {formatAmount(data?.total_earnings)}
      </Text>
      <Text style={[styles.jobs, { color: tokens.colors.textSecondary }]}>
        {data ? `${data.total_jobs} iş` : ' '}
      </Text>
    </View>
  );

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: tokens.colors.cardBg, borderColor: tokens.colors.border }]}
      activeOpacity={0.85}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Kazançlarım"
    >
      <View style={styles.header}>
        <FkIconChip icon="cash-multiple" color="success" size={32} />
        <Text style={[styles.title, { color: tokens.colors.textPrimary }]}>Kazançlarım</Text>
        <MaterialCommunityIcons name="chevron-right" size={20} color={tokens.colors.textSecondary} />
      </View>

      {status === 'loading' ? (
        <ActivityIndicator style={styles.loading} color={colors.primary[500]} />
      ) : status === 'error' ? (
        <Text style={[styles.error, { color: tokens.colors.textSecondary }]}>Kazanç bilgisi şu an alınamadı.</Text>
      ) : (
        <View style={styles.columns}>
          {column(today, 'Bugün')}
          <View style={[styles.divider, { backgroundColor: tokens.colors.border }]} />
          {column(week, 'Son 7 Gün')}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...text.cardTitle,
    flex: 1,
  },
  columns: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  column: {
    flex: 1,
  },
  divider: {
    width: 1,
    marginHorizontal: spacing.md,
  },
  period: {
    ...text.caption,
  },
  amount: {
    ...text.price,
    marginTop: 2,
  },
  jobs: {
    ...text.caption,
    marginTop: 2,
  },
  loading: {
    marginVertical: spacing.md,
  },
  error: {
    ...text.meta,
    marginTop: spacing.md,
  },
});

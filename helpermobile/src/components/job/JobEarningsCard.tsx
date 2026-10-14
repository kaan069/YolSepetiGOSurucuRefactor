import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { FkCard, FkStatusBadge } from '../fk';
import { useFkTokens } from '../../hooks/useFkTokens';
import { colors, spacing, text } from '../../theme/design';

export type JobEarningsStatus = 'awaiting_approval' | 'in_progress' | 'completed';

interface Props {
  amount: number | string;
  status: JobEarningsStatus;
  /** Varsayılan etiketi değiştirir */
  label?: string;
  style?: StyleProp<ViewStyle>;
}

const LABEL: Record<JobEarningsStatus, string> = {
  completed: 'Bu İşten Kazancınız',
  awaiting_approval: 'Teklif Tutarı',
  in_progress: 'Tahmini Kazancınız',
};

function formatAmount(amount: number | string): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (typeof n !== 'number' || isNaN(n)) return String(amount);
  return n.toLocaleString('tr-TR', { maximumFractionDigits: 2 });
}

/** Kazanç / teklif tutarı kartı — vurgulu kart, büyük tutar, durum rozeti. */
export default function JobEarningsCard({ amount, status, label, style }: Props) {
  const { tokens, isDarkMode } = useFkTokens();
  return (
    <FkCard variant="highlighted" padding={spacing.md + 4} style={[{ marginBottom: spacing.md }, style]}>
      <View style={styles.row}>
        <View style={styles.texts}>
          <Text style={[styles.label, { color: isDarkMode ? tokens.colors.textSecondary : colors.primary[700] }]}>
            {label ?? LABEL[status]}
          </Text>
          <Text style={[styles.amount, { color: isDarkMode ? colors.primary[300] : colors.primary[600] }]}>
            ₺{formatAmount(amount)}
          </Text>
        </View>
        <FkStatusBadge status={status} size="sm" />
      </View>
    </FkCard>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  texts: {
    flex: 1,
  },
  label: {
    ...text.label,
  },
  amount: {
    fontSize: 30,
    fontWeight: '800',
    marginTop: 4,
  },
});

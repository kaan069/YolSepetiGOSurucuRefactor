import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFkTokens } from '../../hooks/useFkTokens';
import { colors, spacing } from '../../theme/design';

interface Props {
  label: string;
  value?: React.ReactNode;
  /** MaterialCommunityIcons adı */
  icon?: string;
  valueColor?: string;
  /** Değeri vurgulu (16/700) göster */
  emphasize?: boolean;
  /** Uzun değerlerde etiketin altına yaz */
  stacked?: boolean;
  /** Satır altında ince ayırıcı çizgi */
  divider?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Etiket–değer satırı: solda ikon + etiket (13, ikincil), sağda değer (14/600). */
export default function InfoRow({
  label,
  value,
  icon,
  valueColor,
  emphasize,
  stacked,
  divider,
  style,
}: Props) {
  const { tokens } = useFkTokens();
  const valueStyle = [
    emphasize ? styles.valueEmph : styles.value,
    { color: valueColor || tokens.colors.textPrimary },
  ];

  return (
    <View
      style={[
        stacked ? styles.stacked : styles.row,
        divider ? [styles.divider, { borderBottomColor: tokens.colors.surfaceMuted }] : null,
        style,
      ]}
    >
      <View style={styles.labelWrap}>
        {icon ? <MaterialCommunityIcons name={icon} size={18} color={colors.neutral[400]} /> : null}
        <Text style={[styles.label, { color: tokens.colors.textSecondary }]}>{label}</Text>
      </View>
      {value === undefined || value === null || value === '' ? null : typeof value === 'string' ||
        typeof value === 'number' ? (
        <Text style={[valueStyle, stacked ? styles.stackedValue : styles.rightValue]}>{value}</Text>
      ) : (
        value
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  stacked: {
    paddingVertical: spacing.sm,
    gap: 4,
  },
  divider: {
    borderBottomWidth: 1,
  },
  labelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 0,
  },
  label: {
    fontSize: 13,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
  },
  valueEmph: {
    fontSize: 16,
    fontWeight: '700',
  },
  rightValue: {
    flex: 1,
    textAlign: 'right',
  },
  stackedValue: {
    lineHeight: 20,
  },
});

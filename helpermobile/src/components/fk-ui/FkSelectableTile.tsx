import React from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFkTokens } from '../../hooks/useFkTokens';
import { colors, radius, shadows, spacing } from '../../theme/design';

interface Props {
  title: string;
  description?: string;
  /** MaterialCommunityIcons adı */
  icon?: string;
  selected: boolean;
  onPress: () => void;
  /** Sağda radio göstergesi */
  showRadio?: boolean;
  disabled?: boolean;
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Seçilebilir kutu (müşteri VehicleTypeSelector / ServiceOption):
 * normalde beyaz + 2 px neutral200 kenarlık; seçiliyken primary500 kenarlık + primary50 zemin,
 * ikon kutusu dolu ana renge döner.
 */
export default function FkSelectableTile({
  title,
  description,
  icon,
  selected,
  onPress,
  showRadio = true,
  disabled,
  right,
  style,
  testID,
}: Props) {
  const { tokens } = useFkTokens();
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
      style={[
        styles.tile,
        {
          backgroundColor: selected ? colors.primary[50] : tokens.colors.cardBg,
          borderColor: selected ? colors.primary[500] : tokens.colors.border,
        },
        disabled && styles.disabled,
        style,
      ]}
    >
      {icon ? (
        <View style={[styles.iconBox, { backgroundColor: selected ? colors.primary[500] : colors.primary[50] }]}>
          <MaterialCommunityIcons name={icon} size={24} color={selected ? colors.white : colors.primary[500]} />
        </View>
      ) : null}
      <View style={styles.content}>
        <Text style={[styles.title, { color: selected ? colors.primary[700] : tokens.colors.textPrimary }]}>
          {title}
        </Text>
        {description ? (
          <Text style={[styles.description, { color: tokens.colors.textSecondary }]}>{description}</Text>
        ) : null}
      </View>
      {right}
      {showRadio ? (
        <View style={[styles.radio, { borderColor: selected ? colors.primary[500] : colors.neutral[300] }]}>
          {selected ? <View style={styles.radioDot} /> : null}
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.sm,
  },
  disabled: { opacity: 0.5 },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600' },
  description: { fontSize: 13, marginTop: 2, lineHeight: 18 },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary[500],
  },
});

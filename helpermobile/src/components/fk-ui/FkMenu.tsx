import React from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FkCard from './FkCard';
import FkSectionHeader from './FkSectionHeader';
import { useFkTokens } from '../../hooks/useFkTokens';
import { colors, radius, spacing, text } from '../../theme/design';

interface MenuGroupProps {
  /** BÜYÜK HARF bölüm etiketi */
  title?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Gruplu menü (iOS tarzı, müşteri ProfileScreen): bölüm etiketi + içinde satırlar olan kart.
 * Satırlar arasına otomatik ayırıcı çizgi eklenir.
 */
export function FkMenuGroup({ title, children, style }: MenuGroupProps) {
  const { tokens } = useFkTokens();
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={style}>
      {title ? <FkSectionHeader title={title} variant="group" /> : null}
      <FkCard padding={0} style={styles.groupCard}>
        {items.map((child, i) => (
          <React.Fragment key={i}>
            {i > 0 ? <View style={[styles.divider, { backgroundColor: tokens.colors.surfaceMuted }]} /> : null}
            {child}
          </React.Fragment>
        ))}
      </FkCard>
    </View>
  );
}

interface MenuItemProps {
  /** MaterialCommunityIcons adı */
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  danger?: boolean;
  showChevron?: boolean;
  /** Sağ tarafa rozet / switch vb. */
  right?: React.ReactNode;
  disabled?: boolean;
  testID?: string;
}

/** Menü satırı: 40 px ikon kutusu, başlık 16/500, alt başlık 13, sağda chevron. */
export function FkMenuItem({
  icon,
  title,
  subtitle,
  onPress,
  danger,
  showChevron = true,
  right,
  disabled,
  testID,
}: MenuItemProps) {
  const { tokens } = useFkTokens();
  const accent = danger ? colors.danger[500] : tokens.colors.primary;
  return (
    <TouchableOpacity
      style={[styles.item, disabled && styles.disabled]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled || !onPress}
      testID={testID}
    >
      <View style={[styles.iconBox, { backgroundColor: danger ? colors.danger[50] : colors.primary[50] }]}>
        <MaterialCommunityIcons name={icon} size={22} color={accent} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: danger ? colors.danger[600] : tokens.colors.textPrimary }]}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: tokens.colors.textSecondary }]} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
      {showChevron && !right ? (
        <MaterialCommunityIcons name="chevron-right" size={22} color={colors.neutral[400]} />
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  groupCard: {
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    marginLeft: 72,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  disabled: {
    opacity: 0.5,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
  },
  subtitle: {
    ...text.meta,
    marginTop: 2,
  },
});

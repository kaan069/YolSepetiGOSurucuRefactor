import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFkTokens } from '../../hooks/useFkTokens';
import { colors, spacing, text } from '../../theme/design';

interface Props {
  title: string;
  /** MaterialCommunityIcons adı (20 px, ana renk) */
  icon?: string;
  iconColor?: string;
  subtitle?: string;
  required?: boolean;
  /** Sağ tarafa küçük aksiyon/rozet */
  right?: React.ReactNode;
  /** 'card' = kart başlığı (16/600), 'group' = gruplu liste etiketi (BÜYÜK HARF 14/600) */
  variant?: 'card' | 'group';
  style?: StyleProp<ViewStyle>;
}

/**
 * Müşteri uygulamasındaki form bölüm başlığı: 20 px ikon + 16/600 etiket.
 * `group` varyantı profil menüsündeki BÜYÜK HARF bölüm etiketi içindir.
 */
export default function FkSectionHeader({
  title,
  icon,
  iconColor,
  subtitle,
  required,
  right,
  variant = 'card',
  style,
}: Props) {
  const { tokens } = useFkTokens();

  if (variant === 'group') {
    return (
      <Text style={[styles.group, { color: tokens.colors.textSecondary }, style as any]}>{title}</Text>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.row}>
        {icon ? (
          <MaterialCommunityIcons name={icon} size={20} color={iconColor || tokens.colors.primary} />
        ) : null}
        <Text style={[styles.title, { color: tokens.colors.textPrimary }]} numberOfLines={2}>
          {title}
          {required ? <Text style={{ color: colors.danger[500] }}> *</Text> : null}
        </Text>
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: tokens.colors.textSecondary }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm + 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...text.cardTitle,
    flex: 1,
  },
  right: {
    marginLeft: 'auto',
  },
  subtitle: {
    ...text.meta,
    marginTop: 4,
    lineHeight: 19,
  },
  group: {
    ...text.groupLabel,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
    marginLeft: 4,
  },
});

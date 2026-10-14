import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import FkIconChip from './FkIconChip';
import FkButton from './FkButton';
import { useFkTokens } from '../../hooks/useFkTokens';
import { ColorScale, spacing, text } from '../../theme/design';

interface Props {
  /** MaterialCommunityIcons adı */
  icon?: string;
  title: string;
  message?: string;
  color?: ColorScale;
  actionLabel?: string;
  onAction?: () => void;
  actionVariant?: 'primary' | 'secondary';
  style?: StyleProp<ViewStyle>;
}

/** Boş / hata durumu: ortada ikon dairesi, başlık 18/600, açıklama, isteğe bağlı buton. */
export default function FkEmptyState({
  icon = 'inbox-outline',
  title,
  message,
  color = 'primary',
  actionLabel,
  onAction,
  actionVariant = 'primary',
  style,
}: Props) {
  const { tokens } = useFkTokens();
  return (
    <View style={[styles.container, style]}>
      <FkIconChip icon={icon} color={color} size={80} shape="circle" />
      <Text style={[styles.title, { color: tokens.colors.textPrimary }]}>{title}</Text>
      {message ? <Text style={[styles.message, { color: tokens.colors.textSecondary }]}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <FkButton variant={actionVariant} onPress={onAction} style={styles.action}>
          {actionLabel}
        </FkButton>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  title: {
    ...text.header,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  message: {
    ...text.body,
    marginTop: spacing.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  action: {
    marginTop: spacing.lg,
    minWidth: 180,
  },
});

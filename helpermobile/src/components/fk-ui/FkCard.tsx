import React from 'react';
import { StyleProp, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import { useFkTokens } from '../../hooks/useFkTokens';
import { colors, radius, shadows, spacing } from '../../theme/design';

export type FkCardVariant = 'default' | 'highlighted' | 'subtle' | 'outlined';

interface Props {
  children: React.ReactNode;
  variant?: FkCardVariant;
  /** İç boşluk (varsayılan 16) */
  padding?: number;
  /** Köşe: 'lg' = 16 (liste/satır kartları), 'xl' = 24 (içerik kartları) */
  rounded?: 'lg' | 'xl';
  /** Gölge yoğunluğu */
  elevation?: 'none' | 'sm' | 'md';
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Müşteri uygulamasındaki ModernCard: beyaz yüzey, yumuşak gölge, 16/24 köşe.
 * highlighted → primary50 zemin + primary200 kenarlık, subtle → sayfa zemini,
 * outlined → beyaz + neutral200 kenarlık. onPress verilirse dokunulabilir olur.
 */
export default function FkCard({
  children,
  variant = 'default',
  padding = spacing.md,
  rounded = 'lg',
  elevation = 'sm',
  onPress,
  disabled,
  style,
  testID,
}: Props) {
  const { tokens, isDarkMode } = useFkTokens();

  const variantStyle: ViewStyle =
    variant === 'highlighted'
      ? {
          backgroundColor: isDarkMode ? tokens.colors.cardBg : colors.primary[50],
          borderWidth: 1,
          borderColor: isDarkMode ? tokens.colors.border : colors.primary[200],
        }
      : variant === 'subtle'
      ? { backgroundColor: tokens.colors.surfaceMuted }
      : variant === 'outlined'
      ? { backgroundColor: tokens.colors.cardBg, borderWidth: 1, borderColor: tokens.colors.border }
      : { backgroundColor: tokens.colors.cardBg };

  const shadowStyle =
    elevation === 'none' || variant === 'subtle' ? null : elevation === 'md' ? shadows.md : shadows.sm;

  const cardStyle = [
    { borderRadius: rounded === 'xl' ? radius.xl : radius.lg, padding },
    variantStyle,
    shadowStyle,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        disabled={disabled}
        style={cardStyle}
        testID={testID}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyle} testID={testID}>
      {children}
    </View>
  );
}

export const fkCardStyles = StyleSheet.create({
  /** Kartlar arası standart boşluk */
  gap: { marginBottom: spacing.md },
});

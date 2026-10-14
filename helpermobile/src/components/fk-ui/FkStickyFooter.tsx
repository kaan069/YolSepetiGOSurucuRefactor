import React from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFkTokens } from '../../hooks/useFkTokens';
import { spacing } from '../../theme/design';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Alt güvenli alan payı eklensin mi (sekme çubuğu üstündeyse false) */
  safeArea?: boolean;
}

/**
 * Ekranın altında sabit aksiyon alanı (müşteri talep formundaki footer):
 * beyaz zemin, ince üst kenarlık, güvenli alan payı.
 * ScrollView'in DIŞINDA, ekran kökünün son çocuğu olarak kullanılır.
 */
export default function FkStickyFooter({ children, style, safeArea = true }: Props) {
  const { tokens } = useFkTokens();
  const insets = useSafeAreaInsets();
  const bottom = safeArea
    ? Platform.OS === 'android'
      ? Math.max(insets.bottom, 8) + spacing.sm
      : Math.max(insets.bottom, spacing.md)
    : spacing.md;

  return (
    <View
      style={[
        styles.footer,
        { backgroundColor: tokens.colors.cardBg, borderTopColor: tokens.colors.border, paddingBottom: bottom },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    gap: spacing.sm,
  },
});

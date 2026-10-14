import { StyleSheet, TextStyle, ViewStyle } from 'react-native';
import type { SemanticColors } from '../../theme/tokens';
import { colors, radius, spacing } from '../../theme/design';

/**
 * Input / select / telefon alanlarının ortak kutu görünümü (müşteri uygulaması input stili):
 * etiket üstte 14/500, neutral50 zemin, 1 px neutral200 kenarlık, köşe 16.
 * Odakta ana renk kenarlık, hatada danger400 kenarlık + açık kırmızı zemin.
 */
export function getFieldBoxStyle(
  c: SemanticColors,
  isDark: boolean,
  state: { focused?: boolean; error?: boolean; disabled?: boolean },
): ViewStyle {
  const base: ViewStyle = {
    backgroundColor: isDark ? c.surfaceMuted : colors.neutral[50],
    borderColor: isDark ? c.border : colors.neutral[200],
    borderWidth: 1,
  };
  if (state.disabled) {
    return { ...base, backgroundColor: isDark ? c.surfaceMuted : colors.neutral[100], opacity: 0.7 };
  }
  if (state.error) {
    return {
      ...base,
      borderWidth: 1.5,
      borderColor: colors.danger[400],
      backgroundColor: isDark ? base.backgroundColor : colors.danger[50],
    };
  }
  if (state.focused) {
    return { ...base, borderWidth: 1.5, borderColor: c.primary, backgroundColor: isDark ? c.cardBg : colors.white };
  }
  return base;
}

export function getFieldLabelColor(c: SemanticColors, isDark: boolean, disabled?: boolean): string {
  if (disabled) return c.textDisabled;
  return isDark ? c.textSecondary : colors.neutral[700];
}

export const FIELD_MIN_HEIGHT = 50;

export const fieldStyles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    marginLeft: 2,
  } as TextStyle,
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: FIELD_MIN_HEIGHT,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 0,
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
});

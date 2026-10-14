import { colors, darkColors } from './theme';
import { colors as d } from './design';

export type SemanticColors = ReturnType<typeof getTokens>['colors'];

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 999,
} as const;

export const typography = {
  label: { fontSize: 12, fontWeight: '500' as const },
  helper: { fontSize: 12, fontWeight: '400' as const },
  error: { fontSize: 12, fontWeight: '500' as const },
  input: { fontSize: 16, fontWeight: '400' as const },
  title: { fontSize: 16, fontWeight: '700' as const },
  subtitle: { fontSize: 14, fontWeight: '500' as const },
} as const;

export function getTokens(isDark: boolean) {
  const palette = isDark ? darkColors : colors;
  return {
    spacing,
    radius,
    typography,
    colors: {
      primary: palette.primary[400],
      primaryDark: palette.primary[500],
      primaryLight: palette.primary[100],
      success: palette.success,
      warning: palette.warning,
      error: palette.error,
      info: palette.info,
      screenBg: isDark ? '#121212' : d.neutral[50],
      cardBg: isDark ? '#1E1E1E' : d.white,
      surfaceMuted: isDark ? '#2C2C2C' : d.neutral[100],
      border: isDark ? '#444444' : d.neutral[200],
      borderStrong: isDark ? '#5a5a5a' : d.neutral[300],
      textPrimary: palette.text.primary,
      textSecondary: palette.text.secondary,
      textDisabled: palette.text.disabled,
      textHint: palette.text.hint,
      textOnPrimary: '#ffffff',
      overlay: 'rgba(0,0,0,0.5)',
      successSoft: isDark ? '#1b3a1c' : d.success[50],
      errorSoft: isDark ? '#442726' : d.danger[50],
      warningSoft: isDark ? '#3a2c12' : d.warning[50],
      infoSoft: isDark ? '#0d2137' : d.info[50],
    },
  };
}

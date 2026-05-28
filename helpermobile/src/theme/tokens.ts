import { colors, darkColors } from './theme';

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
      screenBg: isDark ? '#121212' : '#f5f5f5',
      cardBg: isDark ? '#1E1E1E' : '#ffffff',
      surfaceMuted: isDark ? '#2C2C2C' : '#f5f5f5',
      border: isDark ? '#444444' : '#e0e0e0',
      borderStrong: isDark ? '#5a5a5a' : '#cccccc',
      textPrimary: palette.text.primary,
      textSecondary: palette.text.secondary,
      textDisabled: palette.text.disabled,
      textHint: palette.text.hint,
      textOnPrimary: '#ffffff',
      overlay: 'rgba(0,0,0,0.5)',
      successSoft: isDark ? '#1b3a1c' : '#e8f5e9',
      errorSoft: isDark ? '#442726' : '#ffebee',
      warningSoft: isDark ? '#3a2c12' : '#fff3e0',
      infoSoft: isDark ? '#0d2137' : '#e3f2fd',
    },
  };
}

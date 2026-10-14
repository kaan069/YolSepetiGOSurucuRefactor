import { useTheme } from 'react-native-paper';
import { useThemeStore } from '../store/useThemeStore';
import { colors, darkColors } from '../theme/theme';
import { colors as d } from '../theme/design';

/**
 * Tema renklerini döndüren hook.
 * react-native-paper teması + özel uygulama renkleri birleşik.
 */
export function useAppTheme() {
  const paperTheme = useTheme();
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const appColors = isDarkMode ? darkColors : colors;

  return {
    paperTheme,
    isDarkMode,
    appColors,
    // Sık kullanılan renkler için kısayollar
    screenBg: isDarkMode ? '#121212' : d.neutral[50],
    cardBg: isDarkMode ? '#1E1E1E' : d.white,
    textPrimary: appColors.text.primary,
    textSecondary: appColors.text.secondary,
  };
}

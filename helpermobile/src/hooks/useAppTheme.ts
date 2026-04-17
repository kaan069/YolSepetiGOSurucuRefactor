import { useTheme } from 'react-native-paper';
import { useThemeStore } from '../store/useThemeStore';
import { colors, darkColors } from '../theme/theme';

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
    screenBg: isDarkMode ? '#121212' : '#f5f5f5',
    cardBg: isDarkMode ? '#1E1E1E' : '#fff',
    textPrimary: appColors.text.primary,
    textSecondary: appColors.text.secondary,
  };
}

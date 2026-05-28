import { useMemo } from 'react';
import { getTokens } from '../theme/tokens';
import { useThemeStore } from '../store/useThemeStore';

export function useFkTokens() {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  return useMemo(() => ({ tokens: getTokens(isDarkMode), isDarkMode }), [isDarkMode]);
}

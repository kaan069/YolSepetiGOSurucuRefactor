import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

const THEME_STORAGE_KEY = 'theme_preference';

interface ThemeState {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  loadThemePreference: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  isDarkMode: false,

  toggleDarkMode: () => {
    const newValue = !get().isDarkMode;
    set({ isDarkMode: newValue });
    AsyncStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(newValue));
  },

  loadThemePreference: async () => {
    try {
      const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (stored !== null) {
        set({ isDarkMode: JSON.parse(stored) });
      }
    } catch (error) {
      logger.error('general', 'useThemeStore.load failure');
    }
  },
}));

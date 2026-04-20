import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGuideStore } from './useGuideStore';
import { logger } from '../utils/logger';

const ONBOARDING_STORAGE_KEY = 'has_seen_onboarding';

interface OnboardingState {
  hasSeenOnboarding: boolean;
  isOnboardingLoaded: boolean;
  completeOnboarding: () => void;
  loadOnboardingStatus: () => Promise<void>;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  hasSeenOnboarding: false,
  isOnboardingLoaded: false,

  completeOnboarding: () => {
    set({ hasSeenOnboarding: true });
    AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    // Onboarding tamamlaninca rehberi baslat (kisa gecikme ile ekranin yuklenmesini bekle)
    setTimeout(() => {
      useGuideStore.getState().startGuide();
    }, 800);
  },

  loadOnboardingStatus: async () => {
    try {
      const stored = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
      set({
        hasSeenOnboarding: stored === 'true',
        isOnboardingLoaded: true,
      });
    } catch (error) {
      logger.error('general', 'useOnboardingStore.load failure');
      set({ isOnboardingLoaded: true });
    }
  },
}));

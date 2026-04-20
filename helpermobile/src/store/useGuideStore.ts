import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

const GUIDE_STORAGE_KEY = 'has_seen_guide';
const TOTAL_STEPS = 5;

interface GuideState {
  hasSeenGuide: boolean;
  isGuideActive: boolean;
  currentStep: number;
  isGuideLoaded: boolean;
  startGuide: () => void;
  nextStep: () => void;
  completeGuide: () => void;
  skipGuide: () => void;
  loadGuideStatus: () => Promise<void>;
}

export const useGuideStore = create<GuideState>((set, get) => ({
  hasSeenGuide: false,
  isGuideActive: false,
  currentStep: 0,
  isGuideLoaded: false,

  startGuide: () => {
    set({ isGuideActive: true, currentStep: 0 });
  },

  nextStep: () => {
    const { currentStep } = get();
    if (currentStep < TOTAL_STEPS - 1) {
      set({ currentStep: currentStep + 1 });
    } else {
      get().completeGuide();
    }
  },

  completeGuide: () => {
    set({ isGuideActive: false, hasSeenGuide: true, currentStep: 0 });
    AsyncStorage.setItem(GUIDE_STORAGE_KEY, 'true');
  },

  skipGuide: () => {
    set({ isGuideActive: false, hasSeenGuide: true, currentStep: 0 });
    AsyncStorage.setItem(GUIDE_STORAGE_KEY, 'true');
  },

  loadGuideStatus: async () => {
    try {
      const stored = await AsyncStorage.getItem(GUIDE_STORAGE_KEY);
      set({
        hasSeenGuide: stored === 'true',
        isGuideLoaded: true,
      });
    } catch (error) {
      logger.error('general', 'useGuideStore.load failure');
      set({ isGuideLoaded: true });
    }
  },
}));

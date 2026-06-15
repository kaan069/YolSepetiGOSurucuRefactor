import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Gizli geliştirici override'ı: ProfileMenuScreen'deki logoya arka arkaya 10
// tap ile açılır/kapanır. Açıkken teklif minimum limiti 1 TL'ye düşer.
// Persist edilir — uygulamayı kapayıp açtıktan sonra durum korunur.
interface DevOverrideState {
  minOfferOverride: boolean;
  toggleMinOfferOverride: () => void;
}

export const useDevOverrideStore = create<DevOverrideState>()(
  persist(
    (set, get) => ({
      minOfferOverride: false,
      toggleMinOfferOverride: () => set({ minOfferOverride: !get().minOfferOverride }),
    }),
    {
      name: 'dev-override-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

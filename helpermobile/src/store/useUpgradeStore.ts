import { create } from 'zustand';

/**
 * Zorunlu güncelleme bilgisi — backend'in 426 yanıt body'sinden ya da
 * `GET /app-version/` splash kontrolünden geliyor. Doluysa kullanıcı
 * UpgradeRequiredGate ile uygulamayı kullanamaz hale gelir.
 */
export interface UpgradeInfo {
  messageTr: string;
  messageEn: string;
  minVersion: string;
  currentVersion: string;
  updateUrl: string;
}

interface UpgradeStore {
  isUpgradeRequired: boolean;
  info: UpgradeInfo | null;
  setUpgradeRequired: (info: UpgradeInfo) => void;
  clear: () => void;
}

/**
 * Axios interceptor React tree dışından setUpgradeRequired'ı çağırır
 * (`useUpgradeStore.getState().setUpgradeRequired(...)`).
 * App.tsx içindeki UpgradeRequiredGate bu store'u dinler ve modal'ı açar.
 */
export const useUpgradeStore = create<UpgradeStore>((set) => ({
  isUpgradeRequired: false,
  info: null,
  setUpgradeRequired: (info) => set({ isUpgradeRequired: true, info }),
  clear: () => set({ isUpgradeRequired: false, info: null }),
}));

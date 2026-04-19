/**
 * Active Job Store - Sadece WebSocket konum paylaşımı için
 *
 * Bu store SADECE aktif işin trackingToken'ını tutar.
 * İş verileri backend'den çekilir, bellekte saklanmaz.
 *
 * AsyncStorage persist: Uygulama kapanıp açılsa bile aktif iş bilgisi korunur.
 * Background location task bu bilgiyi okuyarak WebSocket reconnect yapar.
 *
 * Kullanım:
 * - İş kabul edildiğinde: setActiveJob(jobId, trackingToken, serviceType)
 * - İş bittiğinde: clearActiveJob()
 * - Logout'ta: clearActiveJob()
 *
 * ─────────────────────────────────────────────────────────────────────────
 * ServiceType canonical migration durumu (Faz 3A tamamlandı):
 *
 *   Store state CANONICAL `ServiceType` tutar (src/constants/serviceTypes).
 *   Setter input'u da canonical `ServiceType` bekler — Orders zinciri ve
 *   detay ekranları (JobDetail / Crane / RoadAssistance) tümü canonical
 *   literal geçer. Nakliye için `useOrdersData` atomik ayrımı `movingType`
 *   üzerinden yapar ve store'a `homeToHomeMoving` veya `cityToCity` yazar.
 *
 *   Persist version 1: v0 (legacy literal persist) → v1 (canonical persist).
 *   Eski cihazlarda AsyncStorage'da kalmış legacy state'ler için migrate
 *   korunur. `'transport'` v1'de direkt karşılığı olmadığı için (ambiguous)
 *   güvenli CLEAR uygulanır — bkz. LEGACY_V0_MAP.
 *
 *   UX etkisi (yalnız ilk açılışta, bir kez): v0'da aktif nakliye işi olan
 *   sürücü, store hydrate sonrası activeJobId/trackingToken değerlerini
 *   kaybeder; İşler ekranından tekrar navigate ederek setActiveJob
 *   tetiklemesi gerekir. Bu, yanlış kanala WS bağlanmaktan daha güvenlidir.
 * ─────────────────────────────────────────────────────────────────────────
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ServiceType, isServiceType } from '../constants/serviceTypes';

/**
 * Persist v0 → v1 migration map. Yalnız AsyncStorage hydrate sırasında
 * kullanılır; runtime setter bu map'e bakmaz (setter artık canonical bekler).
 *
 * SESSİZ YANLIŞ ATAMA YAPILMAZ: `'transport'` ambiguous → `null` (activeJob
 * clear) — kullanıcı İşler ekranından tekrar navigate ederek aktif işi
 * yeniden set eder.
 */
const LEGACY_V0_MAP: Record<string, ServiceType | null> = {
  tow: 'towTruck',
  crane: 'crane',
  transfer: 'transfer',
  roadAssistance: 'roadAssistance',
  transport: null, // ambiguous → güvenli clear
};

interface ActiveJobState {
  // Aktif iş bilgisi (sadece WebSocket için gereken minimum veri)
  activeJobId: string | null;
  trackingToken: string | null;
  serviceType: ServiceType | null;

  // Actions
  setActiveJob: (
    jobId: string,
    trackingToken: string,
    serviceType: ServiceType
  ) => void;
  clearActiveJob: () => void;
}

/**
 * Persist v0 state shape (migration input). Runtime'da yalnız migrate()
 * içinde kullanılır.
 */
interface ActiveJobPersistedV0 {
  activeJobId: string | null;
  trackingToken: string | null;
  serviceType: string | null;
}

export const useActiveJobStore = create<ActiveJobState>()(
  persist(
    (set) => ({
      activeJobId: null,
      trackingToken: null,
      serviceType: null,

      setActiveJob: (jobId, trackingToken, serviceType) => {
        set({
          activeJobId: jobId,
          trackingToken,
          serviceType,
        });
      },

      clearActiveJob: () => {
        set({
          activeJobId: null,
          trackingToken: null,
          serviceType: null,
        });
      },
    }),
    {
      name: 'active-job-storage',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      migrate: (persistedState, version) => {
        // v0 → v1: legacy literal → canonical ServiceType
        if (version === 0) {
          const state = persistedState as ActiveJobPersistedV0 | null;
          if (!state) return state as unknown as ActiveJobState;

          const oldType = state.serviceType;
          if (!oldType) {
            // null/undefined — hiç aktif iş yok, no-op
            return state as unknown as ActiveJobState;
          }

          // Zaten canonical ise (race — başka bir kod path'i canonical yazmış olabilir)
          if (isServiceType(oldType)) {
            return state as unknown as ActiveJobState;
          }

          // Legacy literal — map
          const mapped = LEGACY_V0_MAP[oldType];
          if (mapped === null) {
            // Ambiguous (`'transport'`) → güvenli clear
            console.log(
              "[useActiveJobStore] v0→v1 migrate: 'transport' ambiguous, aktif iş temizleniyor."
            );
            return {
              activeJobId: null,
              trackingToken: null,
              serviceType: null,
            } as unknown as ActiveJobState;
          }
          if (mapped === undefined) {
            // Bilinmeyen legacy literal → güvenli clear
            console.warn(
              `[useActiveJobStore] v0→v1 migrate: bilinmeyen serviceType="${String(oldType)}", aktif iş temizleniyor.`
            );
            return {
              activeJobId: null,
              trackingToken: null,
              serviceType: null,
            } as unknown as ActiveJobState;
          }

          return {
            activeJobId: state.activeJobId,
            trackingToken: state.trackingToken,
            serviceType: mapped,
          } as unknown as ActiveJobState;
        }

        // Bilinmeyen gelecekten gelmiş version — olduğu gibi bırak
        return persistedState as ActiveJobState;
      },
    }
  )
);

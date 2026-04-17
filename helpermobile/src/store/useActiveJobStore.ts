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
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ServiceType = 'tow' | 'crane' | 'transport' | 'transfer' | 'roadAssistance';

interface ActiveJobState {
  // Aktif iş bilgisi (sadece WebSocket için gereken minimum veri)
  activeJobId: string | null;
  trackingToken: string | null;
  serviceType: ServiceType | null;

  // Actions
  setActiveJob: (jobId: string, trackingToken: string, serviceType: ServiceType) => void;
  clearActiveJob: () => void;
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
    }
  )
);

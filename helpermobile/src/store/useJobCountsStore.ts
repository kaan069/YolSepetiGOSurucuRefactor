/**
 * Global Job Counts Store
 *
 * Tüm servis tiplerinden gelen iş sayılarını tutar.
 * Navigation'da İşler sekmesinin yanıp sönmesi için kullanılır.
 *
 * Kullanım:
 * - OrdersScreen'de jobCounts değiştiğinde: updateServiceCounts(serviceFilter, counts)
 * - Navigation'da: hasActiveJobs selector ile kontrol et
 */
import { create } from 'zustand';
import type { JobCountsResponse } from '../api/types';

interface JobCounts {
  pending: number;
  awaiting_approval: number;
  awaiting_payment: number;
  in_progress: number;
  /** Randevulu İşlerim (yola çıkılmamış randevulu işler); in_progress bunları saymaz */
  scheduled?: number;
}

interface ServiceJobCounts {
  tow: JobCounts;
  crane: JobCounts;
  nakliye: JobCounts;
  roadAssistance: JobCounts;
  transfer: JobCounts;
}

interface JobCountsState {
  // Her servis tipi için ayrı sayılar
  serviceCounts: ServiceJobCounts;
  /** Backend randevulu işleri destekliyor mu (sayaçlarda `scheduled` geldi); eski backend'de Randevu butonu gizli */
  scheduledSupported: boolean;

  // Actions
  updateServiceCounts: (serviceType: keyof ServiceJobCounts, counts: JobCounts) => void;
  incrementCount: (serviceType: keyof ServiceJobCounts, status: keyof JobCounts) => void;
  decrementCount: (serviceType: keyof ServiceJobCounts, status: keyof JobCounts) => void;
  resetAllCounts: () => void;
  /** Randevulu İşlerim listesinden hizmet başına sayı (diğer sayılara dokunmaz) */
  setScheduledCounts: (counts: Partial<Record<keyof ServiceJobCounts, number>>) => void;
  markScheduledSupported: () => void;
  /** GET /requests/all-counts/ yanıtı (backend anahtarları: tow-truck, home-moving …) → tüm hizmetler */
  applyAllServicesCounts: (allCounts: Record<string, JobCountsResponse>) => void;

  // Computed - aktif iş var mı? (awaiting_approval + awaiting_payment + in_progress > 0)
  hasActiveJobs: () => boolean;
  getTotalActiveJobCount: () => number;
}

/** Bütün hizmetlerdeki randevulu iş sayısı (Siparişler'deki Randevu butonu) */
export const selectScheduledTotal = (state: JobCountsState): number =>
  Object.values(state.serviceCounts).reduce((sum, c) => sum + (c.scheduled ?? 0), 0);

const initialCounts: JobCounts = {
  pending: 0,
  awaiting_approval: 0,
  awaiting_payment: 0,
  in_progress: 0,
};

export const useJobCountsStore = create<JobCountsState>((set, get) => ({
  serviceCounts: {
    tow: { ...initialCounts },
    crane: { ...initialCounts },
    nakliye: { ...initialCounts },
    roadAssistance: { ...initialCounts },
    transfer: { ...initialCounts },
  },
  scheduledSupported: false,

  updateServiceCounts: (serviceType, counts) => {
    set((state) => ({
      serviceCounts: {
        ...state.serviceCounts,
        // WebSocket sayaçları `scheduled` göndermeyebilir; son bilinen randevu sayısı korunur
        [serviceType]: { ...counts, scheduled: counts.scheduled ?? state.serviceCounts[serviceType].scheduled },
      },
    }));
  },

  incrementCount: (serviceType, status) => {
    set((state) => ({
      serviceCounts: {
        ...state.serviceCounts,
        [serviceType]: {
          ...state.serviceCounts[serviceType],
          [status]: (state.serviceCounts[serviceType][status] ?? 0) + 1,
        },
      },
    }));
  },

  decrementCount: (serviceType, status) => {
    set((state) => ({
      serviceCounts: {
        ...state.serviceCounts,
        [serviceType]: {
          ...state.serviceCounts[serviceType],
          [status]: Math.max(0, (state.serviceCounts[serviceType][status] ?? 0) - 1),
        },
      },
    }));
  },

  setScheduledCounts: (counts) => {
    set((state) => {
      const next = { ...state.serviceCounts };
      (Object.keys(counts) as (keyof ServiceJobCounts)[]).forEach((service) => {
        next[service] = { ...next[service], scheduled: counts[service] ?? 0 };
      });
      return { serviceCounts: next, scheduledSupported: true };
    });
  },

  markScheduledSupported: () => set({ scheduledSupported: true }),

  applyAllServicesCounts: (allCounts) => {
    const { updateServiceCounts, markScheduledSupported } = get();
    // Yeni backend sayaçlarda randevulu iş sayısını (scheduled) döner → Randevu butonu açılır
    if (Object.values(allCounts).some((c) => typeof c?.scheduled === 'number')) {
      markScheduledSupported();
    }

    updateServiceCounts('tow', allCounts['tow-truck'] || initialCounts);
    updateServiceCounts('crane', allCounts['crane'] || initialCounts);

    // Nakliye = home-moving + city-moving birleşik
    const homeCounts = allCounts['home-moving'] || initialCounts;
    const cityCounts = allCounts['city-moving'] || initialCounts;
    updateServiceCounts('nakliye', {
      pending: homeCounts.pending + cityCounts.pending,
      awaiting_approval: homeCounts.awaiting_approval + cityCounts.awaiting_approval,
      awaiting_payment: homeCounts.awaiting_payment + cityCounts.awaiting_payment,
      in_progress: homeCounts.in_progress + cityCounts.in_progress,
      scheduled: (homeCounts.scheduled ?? 0) + (cityCounts.scheduled ?? 0),
    });

    updateServiceCounts('roadAssistance', allCounts['road-assistance'] || initialCounts);
    updateServiceCounts('transfer', allCounts['transfer'] || initialCounts);
  },

  resetAllCounts: () => {
    set({
      serviceCounts: {
        tow: { ...initialCounts },
        crane: { ...initialCounts },
        nakliye: { ...initialCounts },
        roadAssistance: { ...initialCounts },
        transfer: { ...initialCounts },
      },
    });
  },

  hasActiveJobs: () => {
    const { serviceCounts } = get();
    const services = Object.values(serviceCounts);

    for (const counts of services) {
      const activeCount = counts.awaiting_approval + counts.awaiting_payment + counts.in_progress;
      if (activeCount > 0) {
        return true;
      }
    }
    return false;
  },

  getTotalActiveJobCount: () => {
    const { serviceCounts } = get();
    let total = 0;

    for (const counts of Object.values(serviceCounts)) {
      total += counts.awaiting_approval + counts.awaiting_payment + counts.in_progress;
    }

    return total;
  },
}));

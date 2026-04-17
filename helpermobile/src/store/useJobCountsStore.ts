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

interface JobCounts {
  pending: number;
  awaiting_approval: number;
  awaiting_payment: number;
  in_progress: number;
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

  // Actions
  updateServiceCounts: (serviceType: keyof ServiceJobCounts, counts: JobCounts) => void;
  incrementCount: (serviceType: keyof ServiceJobCounts, status: keyof JobCounts) => void;
  decrementCount: (serviceType: keyof ServiceJobCounts, status: keyof JobCounts) => void;
  resetAllCounts: () => void;

  // Computed - aktif iş var mı? (awaiting_approval + awaiting_payment + in_progress > 0)
  hasActiveJobs: () => boolean;
  getTotalActiveJobCount: () => number;
}

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

  updateServiceCounts: (serviceType, counts) => {
    set((state) => ({
      serviceCounts: {
        ...state.serviceCounts,
        [serviceType]: counts,
      },
    }));
  },

  incrementCount: (serviceType, status) => {
    set((state) => ({
      serviceCounts: {
        ...state.serviceCounts,
        [serviceType]: {
          ...state.serviceCounts[serviceType],
          [status]: state.serviceCounts[serviceType][status] + 1,
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
          [status]: Math.max(0, state.serviceCounts[serviceType][status] - 1),
        },
      },
    }));
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

/**
 * Job Update Event Store
 * WebSocket job_updated event'lerini iş detay ekranlarına ileten köprü store
 * Ödeme yapıldığında, status değiştiğinde vs. iş detay ekranı otomatik güncellenir
 */
import { create } from 'zustand';

interface JobUpdateEventState {
  lastUpdatedJobId: number | null;
  lastUpdatedAt: number | null;
  lastUpdatedStatus: string | null;
  setJobUpdated: (jobId: number, status?: string) => void;
  clear: () => void;
}

export const useJobUpdateEventStore = create<JobUpdateEventState>((set) => ({
  lastUpdatedJobId: null,
  lastUpdatedAt: null,
  lastUpdatedStatus: null,
  setJobUpdated: (jobId, status) => set({
    lastUpdatedJobId: jobId,
    lastUpdatedAt: Date.now(),
    lastUpdatedStatus: status || null,
  }),
  clear: () => set({
    lastUpdatedJobId: null,
    lastUpdatedAt: null,
    lastUpdatedStatus: null,
  }),
}));

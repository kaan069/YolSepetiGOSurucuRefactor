/**
 * Cancellation Event Store
 * WebSocket job_cancelled event'lerini iş detay ekranlarına ileten köprü store
 */
import { create } from 'zustand';

interface CancellationEventState {
  lastCancelledJobId: number | null;
  lastCancelledServiceType: string | null;
  lastCancelledAt: number | null;
  setCancelledJob: (jobId: number, serviceType: string) => void;
  clear: () => void;
}

export const useCancellationEventStore = create<CancellationEventState>((set) => ({
  lastCancelledJobId: null,
  lastCancelledServiceType: null,
  lastCancelledAt: null,
  setCancelledJob: (jobId, serviceType) => set({
    lastCancelledJobId: jobId,
    lastCancelledServiceType: serviceType,
    lastCancelledAt: Date.now(),
  }),
  clear: () => set({
    lastCancelledJobId: null,
    lastCancelledServiceType: null,
    lastCancelledAt: null,
  }),
}));

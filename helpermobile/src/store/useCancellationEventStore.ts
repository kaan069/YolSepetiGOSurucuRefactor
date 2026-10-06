/**
 * Cancellation Event Store
 * WebSocket job_cancelled / FCM iptal event'lerini iş detay ve ödeme ekranlarına ileten köprü store
 */
import { create } from 'zustand';

interface CancellationEventState {
  lastCancelledJobId: number | null;
  lastCancelledServiceType: string | null;
  lastCancelledAt: number | null;
  // Backend iptal sebebi: customer_cancelled | admin_cancelled | driver_cancelled | payment_timeout | expired | reassigned
  lastCancelledReason: string | null;
  setCancelledJob: (jobId: number, serviceType: string, reason?: string | null) => void;
  clear: () => void;
}

export const useCancellationEventStore = create<CancellationEventState>((set) => ({
  lastCancelledJobId: null,
  lastCancelledServiceType: null,
  lastCancelledAt: null,
  lastCancelledReason: null,
  setCancelledJob: (jobId, serviceType, reason = null) => set({
    lastCancelledJobId: jobId,
    lastCancelledServiceType: serviceType,
    lastCancelledAt: Date.now(),
    lastCancelledReason: reason,
  }),
  clear: () => set({
    lastCancelledJobId: null,
    lastCancelledServiceType: null,
    lastCancelledAt: null,
    lastCancelledReason: null,
  }),
}));

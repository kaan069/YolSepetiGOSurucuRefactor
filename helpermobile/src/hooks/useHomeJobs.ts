/**
 * Ana ekrandaki iş kısayolunun verisi. Ekran odaklanınca, uygulama ön plana gelince ve
 * canlı iş olaylarında (teklif kabul / ödeme / durum değişikliği / iptal) yenilenir.
 * Canlı olaylar İşler ekranının WebSocket'inden köprü store'larla gelir (İşler sekmesi
 * açılışta yüklenir, bkz. navigation lazy: false).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { fetchHomeJobs, HomeJob } from '../services/homeJobs';
import { useJobUpdateEventStore } from '../store/useJobUpdateEventStore';
import { useCancellationEventStore } from '../store/useCancellationEventStore';
import { useAuthStore } from '../store/authStore';
import { logger } from '../utils/logger';

/** Ön plana gelişte bundan sık istek atılmaz */
const FOREGROUND_MIN_GAP_MS = 15 * 1000;
/** Ekrana dönüşte (ör. teklif verip gelince) neredeyse her zaman yenilenir; çift tetiklenmeye karşı */
const FOCUS_MIN_GAP_MS = 2 * 1000;
/** Art arda gelen canlı olaylar tek yenilemede birleşir */
const EVENT_DEBOUNCE_MS = 800;

export type HomeJobsStatus = 'loading' | 'ready' | 'error';

export function useHomeJobs() {
  const [jobs, setJobs] = useState<HomeJob[]>([]);
  const [status, setStatus] = useState<HomeJobsStatus>('loading');
  const lastFetchAt = useRef(0);
  const inFlight = useRef<Promise<void> | null>(null);
  // Yenileme sürerken gelen olay: istek olaydan önce başlamış olabilir, bitince bir kez daha
  const rerun = useRef(false);

  const refresh = useCallback((force: boolean | number = false): Promise<void> => {
    if (inFlight.current) {
      if (force === true) rerun.current = true;
      return inFlight.current;
    }
    const minGap = force === true ? 0 : typeof force === 'number' ? force : FOREGROUND_MIN_GAP_MS;
    if (Date.now() - lastFetchAt.current < minGap) return Promise.resolve();

    inFlight.current = (async () => {
      try {
        setJobs(await fetchHomeJobs(useAuthStore.getState().currentUser?.user_type ?? []));
        setStatus('ready');
        lastFetchAt.current = Date.now();
      } catch (error: any) {
        logger.warn('orders', 'homeJobs.refresh failed', { status: error?.response?.status });
        // Daha önce liste geldiyse o kalır
        setStatus((prev) => (prev === 'ready' ? prev : 'error'));
      } finally {
        inFlight.current = null;
        if (rerun.current) {
          rerun.current = false;
          refreshRef.current(true);
        }
      }
    })();
    return inFlight.current;
  }, []);
  const refreshRef = useRef(refresh);

  useFocusEffect(
    useCallback(() => {
      refresh(FOCUS_MIN_GAP_MS);
    }, [refresh]),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  // Canlı olay: yeni talep, teklif kabul / ödeme / durum değişikliği ya da iptal → hemen yenile
  const lastJobUpdateAt = useJobUpdateEventStore((s) => s.lastUpdatedAt);
  const lastNewJobAt = useJobUpdateEventStore((s) => s.lastNewJobAt);
  const lastCancelledAt = useCancellationEventStore((s) => s.lastCancelledAt);
  useEffect(() => {
    if (!lastJobUpdateAt && !lastNewJobAt && !lastCancelledAt) return;
    const timer = setTimeout(() => refresh(true), EVENT_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [lastJobUpdateAt, lastNewJobAt, lastCancelledAt, refresh]);

  return { jobs, status, refresh };
}

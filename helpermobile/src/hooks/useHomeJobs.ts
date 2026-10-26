/**
 * Ana ekrandaki iş kısayolunun verisi. Ekran odaklanınca, uygulama ön plana gelince ve
 * WebSocket iş güncellemesinde (ödeme, durum değişikliği) yenilenir.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { fetchHomeJobs, HomeJob } from '../services/homeJobs';
import { useJobUpdateEventStore } from '../store/useJobUpdateEventStore';
import { logger } from '../utils/logger';

/** Odak / ön plan geçişlerinde bundan sık istek atılmaz (iş güncellemesi beklemez) */
const REFRESH_MIN_GAP_MS = 15 * 1000;

export type HomeJobsStatus = 'loading' | 'ready' | 'error';

export function useHomeJobs() {
  const [jobs, setJobs] = useState<HomeJob[]>([]);
  const [status, setStatus] = useState<HomeJobsStatus>('loading');
  const lastFetchAt = useRef(0);
  const inFlight = useRef<Promise<void> | null>(null);

  const refresh = useCallback((force = false): Promise<void> => {
    if (inFlight.current) return inFlight.current;
    if (!force && Date.now() - lastFetchAt.current < REFRESH_MIN_GAP_MS) return Promise.resolve();

    inFlight.current = (async () => {
      try {
        setJobs(await fetchHomeJobs());
        setStatus('ready');
        lastFetchAt.current = Date.now();
      } catch (error: any) {
        logger.warn('orders', 'homeJobs.refresh failed', { status: error?.response?.status });
        // Daha önce liste geldiyse o kalır
        setStatus((prev) => (prev === 'ready' ? prev : 'error'));
      } finally {
        inFlight.current = null;
      }
    })();
    return inFlight.current;
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  const lastJobUpdateAt = useJobUpdateEventStore((s) => s.lastUpdatedAt);
  useEffect(() => {
    if (lastJobUpdateAt) refresh(true);
  }, [lastJobUpdateAt, refresh]);

  return { jobs, status, refresh };
}

/**
 * Ana ekrandaki kazanç kartının verisi: bugün ve son 7 gün (GET /summary/earnings/period/).
 * Ekran odaklanınca, ön plana gelişte ve iş güncellemesinde (ör. iş tamamlandı) yenilenir.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { requestsAPI } from '../api';
import type { PeriodEarningsResponse } from '../api/types';
import { useJobUpdateEventStore } from '../store/useJobUpdateEventStore';
import { logger } from '../utils/logger';

/** Odak / ön plan geçişlerinde bundan sık istek atılmaz */
const REFRESH_MIN_GAP_MS = 60 * 1000;

export type HomeEarningsStatus = 'loading' | 'ready' | 'error';

export function useHomeEarnings() {
  const [today, setToday] = useState<PeriodEarningsResponse | null>(null);
  const [week, setWeek] = useState<PeriodEarningsResponse | null>(null);
  const [status, setStatus] = useState<HomeEarningsStatus>('loading');
  const lastFetchAt = useRef(0);
  const inFlight = useRef<Promise<void> | null>(null);

  const refresh = useCallback((force = false): Promise<void> => {
    if (inFlight.current) return inFlight.current;
    if (!force && Date.now() - lastFetchAt.current < REFRESH_MIN_GAP_MS) return Promise.resolve();

    inFlight.current = (async () => {
      try {
        const [todayResult, weekResult] = await Promise.all([
          requestsAPI.getPeriodEarnings('today'),
          requestsAPI.getPeriodEarnings('week'),
        ]);
        setToday(todayResult);
        setWeek(weekResult);
        setStatus('ready');
        lastFetchAt.current = Date.now();
      } catch (error: any) {
        logger.warn('orders', 'homeEarnings.refresh failed', { status: error?.response?.status });
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

  return { today, week, status, refresh };
}

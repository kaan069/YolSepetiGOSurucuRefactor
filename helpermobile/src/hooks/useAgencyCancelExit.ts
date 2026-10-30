/**
 * Acente, kabul edilmiş işi panelinden iptal ederse (job_cancelled / request_cancelled,
 * reason: agency_cancelled) açık iş ekranı kapanır ve Siparişler sekmesine dönülür.
 * WebSocket ve push ikisi de gelebilir; ekran başına bir kez çalışır.
 */
import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useCancellationEventStore } from '../store/useCancellationEventStore';

export function useAgencyCancelExit(jobId: string | number | null | undefined) {
  const navigation = useNavigation<any>();
  const lastCancelledAt = useCancellationEventStore((s) => s.lastCancelledAt);
  const mountedAt = useRef(Date.now());
  const handled = useRef(false);

  useEffect(() => {
    const { lastCancelledJobId, lastCancelledReason } = useCancellationEventStore.getState();
    if (handled.current || !lastCancelledAt || lastCancelledAt < mountedAt.current) return;
    if (lastCancelledReason !== 'agency_cancelled' || String(lastCancelledJobId) !== String(jobId)) return;
    handled.current = true;
    // popTo: navigate v7'de geri dönmez, iptal olan iş ekranı yığında kalırdı
    navigation.popTo('Tabs', { screen: 'OrdersTab' });
    Alert.alert('İş İptal Edildi', 'Acente işi iptal etti.');
  }, [lastCancelledAt, jobId, navigation]);
}

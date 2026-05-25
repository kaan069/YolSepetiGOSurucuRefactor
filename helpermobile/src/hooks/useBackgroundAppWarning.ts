// Aktif iş başladığında bir kez "uygulamayı arka planda açık tut" uyarısı göster.
// Per-job AsyncStorage tracking ile aynı iş için tekrar gösterilmez; her yeni iş için
// bir kez tetiklenir.
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_PREFIX = 'bg_warning_shown_';

export function useBackgroundAppWarning(
  requestId: string | number | null | undefined,
  shouldTrigger: boolean
) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!shouldTrigger || requestId == null || requestId === '') return;

    let cancelled = false;
    const key = `${STORAGE_PREFIX}${requestId}`;

    (async () => {
      try {
        const seen = await AsyncStorage.getItem(key);
        if (cancelled || seen) return;
        await AsyncStorage.setItem(key, '1');
        if (!cancelled) setVisible(true);
      } catch {
        // AsyncStorage hatası — sessizce yoksay, uyarı atlanır
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [requestId, shouldTrigger]);

  return {
    visible,
    dismiss: () => setVisible(false),
  };
}

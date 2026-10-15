/**
 * Uygulama konum bildirimi (app-ping) tetikleyicileri. App.tsx'te global olarak çalışır.
 * - app_open:   giriş yapılmışken uygulama açılınca
 * - foreground: ön plana gelince, son gönderimden 5 dk geçtiyse
 * - periodic:   uygulama açık ve sürücü çevrimiçiyken 30 dk'da bir
 * - online:     driverStore.updateOnlineStatus başarılı olunca (orada tetiklenir)
 * Çıkış yapılınca dinleyici ve zamanlayıcı durur.
 */
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useDriverStore } from '../store/driverStore';
import {
  FOREGROUND_MIN_GAP_MS,
  PERIODIC_INTERVAL_MS,
  msSinceLastPing,
  resetAppPing,
  sendAppPing,
} from '../services/appLocationPing';

/** 30 dk dolunca en geç bu kadar gecikmeyle gönderilir */
const PERIODIC_CHECK_MS = 60 * 1000;

export function useAppLocationPing() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isOnline = useDriverStore((s) => s.isAvailable);

  // Çevrimiçi durumu normalde Ana sayfa yükler; uygulama başka sekmede açılırsa da bilinsin
  useEffect(() => {
    if (isAuthenticated) useDriverStore.getState().loadOnlineStatus();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      resetAppPing();
      return;
    }

    sendAppPing('app_open');
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && msSinceLastPing() > FOREGROUND_MIN_GAP_MS) sendAppPing('foreground');
    });
    return () => sub.remove();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !isOnline) return;
    const timer = setInterval(() => {
      if (AppState.currentState === 'active' && msSinceLastPing() >= PERIODIC_INTERVAL_MS) {
        sendAppPing('periodic');
      }
    }, PERIODIC_CHECK_MS);
    return () => clearInterval(timer);
  }, [isAuthenticated, isOnline]);
}

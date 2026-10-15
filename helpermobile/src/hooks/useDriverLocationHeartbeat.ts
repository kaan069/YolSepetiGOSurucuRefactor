/**
 * Boştaki çevrimiçi sürücünün konum bildirimi (heartbeat).
 *
 * Acente haritası sürücünün son 30 dakikadaki konumunu "canlı" sayar, daha eskiyse
 * iş adresini kullanır. Bu hook çevrimiçiyken birkaç dakikada bir konum gönderir.
 * - Çevrimdışı, çıkış yapılmış, konum izni yok ya da aktif iş varsa göndermez
 *   (aktif işte konum zaten iş kanalından gidiyor).
 * - Sadece uygulama ön plandayken çalışır; ön plana dönüşte süre dolduysa hemen gönderir.
 * - Hatalar sessizce yutulur, kuyruk yok: bir sonraki turu bekler.
 *
 * App.tsx'te global olarak çalışır.
 */
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import * as Location from 'expo-location';
import agencyAssignmentsAPI from '../api/agencyAssignments';
import { useAuthStore } from '../store/authStore';
import { useDriverStore } from '../store/driverStore';
import { useActiveJobStore } from '../store/useActiveJobStore';
import { useNakliyeLocationStore } from '../store/useNakliyeLocationStore';
import { logger } from '../utils/logger';

/** Backend sınırı dakikada 12; doküman 3-5 dakikada bir öneriyor */
const HEARTBEAT_INTERVAL_MS = 4 * 60 * 1000;
/** Zamanlayıcı kayması yüzünden turun atlanmaması için pay */
const DUE_TOLERANCE_MS = 15 * 1000;
/** Bundan taze bilinen konum yeniden ölçülmeden kullanılır */
const LAST_KNOWN_MAX_AGE_MS = 2 * 60 * 1000;

async function readPosition(): Promise<{ latitude: number; longitude: number } | null> {
  const { status } = await Location.getForegroundPermissionsAsync();
  if (status !== 'granted') return null;

  const lastKnown = await Location.getLastKnownPositionAsync({ maxAge: LAST_KNOWN_MAX_AGE_MS });
  const position =
    lastKnown ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
  return position ? { latitude: position.coords.latitude, longitude: position.coords.longitude } : null;
}

export function useDriverLocationHeartbeat() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isOnline = useDriverStore((s) => s.isAvailable);
  const activeJobId = useActiveJobStore((s) => s.activeJobId);
  const isNakliyeSharing = useNakliyeLocationStore((s) => s.isLocationSharing);

  const enabled = isAuthenticated && isOnline && !activeJobId && !isNakliyeSharing;
  const lastSentAt = useRef(0);
  const sending = useRef(false);

  // Çevrimiçi durumu normalde Ana sayfa yükler; uygulama başka sekmede açılırsa da bilinsin
  useEffect(() => {
    if (isAuthenticated) useDriverStore.getState().loadOnlineStatus();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!enabled) return;

    const send = async () => {
      if (sending.current || AppState.currentState !== 'active') return;
      sending.current = true;
      try {
        const coords = await readPosition();
        if (!coords) return;
        await agencyAssignmentsAPI.heartbeat(coords.latitude, coords.longitude);
        lastSentAt.current = Date.now();
      } catch (error: any) {
        // 403: sürücü olmayan hesap; 400: geçersiz koordinat; 429 / ağ: sonraki tur
        logger.debug('location', 'heartbeat failed', { status: error?.response?.status });
      } finally {
        sending.current = false;
      }
    };

    const sendIfDue = () => {
      if (Date.now() - lastSentAt.current >= HEARTBEAT_INTERVAL_MS - DUE_TOLERANCE_MS) send();
    };

    sendIfDue();
    const timer = setInterval(sendIfDue, HEARTBEAT_INTERVAL_MS);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') sendIfDue();
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [enabled]);
}

/**
 * UYGULAMA KONUM BİLDİRİMİ (APP-PING)
 *
 * Acente panelinde sürücü canlı konumu yerine iş adresiyle görünmesin diye uygulama
 * konumu belirli anlarda backend'e bildirir (aktif işteki canlı konumdan ayrı):
 * - app_open:   giriş yapılmışken uygulama açılınca
 * - foreground: ön plana gelince, son gönderimden 5 dk geçtiyse
 * - online:     sürücü çevrimiçi olunca
 * - periodic:   uygulama açık ve sürücü çevrimiçiyken 30 dk'da bir
 * Uygulama arka plandayken: services/presenceLocation (trigger: background).
 *
 * Konum izni yoksa hiçbir şey gönderilmez (izin istenmez). Hatalar sessizce yutulur;
 * bir sonraki tetiklemede tekrar denenir, kuyruk yok.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { LocationObject } from 'expo-location';
import locationAPI, { AppPingTrigger } from '../api/location';
import { logger } from '../utils/logger';

export const FOREGROUND_MIN_GAP_MS = 5 * 60 * 1000;
/** Son başarılı ping zamanı (AsyncStorage): arka plan görevi ön plan ping'inin hemen ardından göndermesin */
export const LAST_PING_AT_KEY = 'app-ping-last-at';
export const PERIODIC_INTERVAL_MS = 30 * 60 * 1000;

/** Konum ölçümü zaman aşımı; aşılırsa son bilinen konum kullanılır */
const POSITION_TIMEOUT_MS = 10 * 1000;
/** Uygulamanın başka yerde (Ana sayfa vb.) aldığı konum bu kadar tazeyse yeniden ölçülmez */
const REUSE_POSITION_MS = 60 * 1000;

// Son deneme (başarılı ya da değil): tetikleyici aralıkları buna göre — uç hata verirken
// (ör. henüz yayında değilken) istek yağmuru olmasın
let lastAttemptAt = 0;
let rememberedPosition: LocationObject | null = null;
let positionInFlight: Promise<LocationObject | null> | null = null;
let sendInFlight: Promise<void> | null = null;

/** Başka yerde alınan konumu paylaşır; aynı anda iki konum isteği yapılmaz. */
export function rememberPosition(position: LocationObject): void {
  rememberedPosition = position;
}

/** Son gönderim denemesinden bu yana geçen süre (hiç denenmediyse Infinity). */
export function msSinceLastPing(): number {
  return lastAttemptAt ? Date.now() - lastAttemptAt : Infinity;
}

/**
 * Konum: Balanced doğruluk, ~10 sn zaman aşımı, aşılırsa son bilinen konum.
 * Eşzamanlı çağrılar tek ölçümü paylaşır (açılışta harita ile app-ping aynı konumu kullanır).
 * İzin istemez; çağıran izin durumunu bilir.
 */
export async function getSharedPosition(): Promise<LocationObject | null> {
  if (rememberedPosition && Date.now() - rememberedPosition.timestamp < REUSE_POSITION_MS) {
    return rememberedPosition;
  }
  if (positionInFlight) return positionInFlight;

  positionInFlight = (async () => {
    try {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const timeout = new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), POSITION_TIMEOUT_MS);
      });
      const current = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).catch(() => null),
        timeout,
      ]);
      clearTimeout(timer);
      const position = current ?? (await Location.getLastKnownPositionAsync().catch(() => null));
      if (position) rememberedPosition = position;
      return position;
    } finally {
      positionInFlight = null;
    }
  })();
  return positionInFlight;
}

/** Konumu gönderir. Gönderim sürüyorsa yeni tetikleme atlanır (aynı konum zaten gidiyor). */
export function sendAppPing(trigger: AppPingTrigger): Promise<void> {
  if (sendInFlight) return sendInFlight;
  sendInFlight = (async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const position = await getSharedPosition();
      if (!position) return;

      const { latitude, longitude, accuracy } = position.coords;
      lastAttemptAt = Date.now();
      await locationAPI.appPing(latitude, longitude, trigger, accuracy ?? undefined);
      await AsyncStorage.setItem(LAST_PING_AT_KEY, String(Date.now())).catch(() => {});
    } catch (error: any) {
      logger.debug('location', 'appPing failed', { trigger, status: error?.response?.status });
    } finally {
      sendInFlight = null;
    }
  })();
  return sendInFlight;
}

/** Çıkışta sıfırla: sonraki oturumun ilk ön plana gelişi beklemesin, eski konum taşınmasın. */
export function resetAppPing(): void {
  lastAttemptAt = 0;
  rememberedPosition = null;
}

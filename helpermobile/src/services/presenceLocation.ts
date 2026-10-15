/**
 * ÇEVRİMİÇİ SÜRÜCÜ KONUMU (ARKA PLAN)
 *
 * Backend son konumu 45 dakikadan eski sürücüyü acente tarafında çevrimdışı sayar ve
 * haritada iş adresinde gösterir. Uygulama arka plandayken de konum gitsin diye sürücü
 * çevrimiçiyken düşük güçlü bir konum görevi çalışır (aktif iş görevinden ayrı):
 * - Android: zamana bağlı, ~30 dk'da bir; kalıcı bildirim yok (ön plan servisi kullanılmaz).
 * - iOS: zamanlı arka plan çalışması yok; konum sürücü hareket ettikçe gelir ("önemli konum
 *   değişikliği" uygulamayı kapalıyken de uyandırır). Hareketsiz sürücü için backend sessiz
 *   bildirim (type: location_request) yollar → handleLocationRequestPush.
 *
 * Görev ve bildirim ayrı JS bağlamında (headless) çalışabildiği için durum AsyncStorage'da:
 * çevrimiçi bayrağı, aktif iş ve son ping zamanı oradan okunur.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { Platform } from 'react-native';
import locationAPI from '../api/location';
import { LAST_PING_AT_KEY } from './appLocationPing';
import { logger } from '../utils/logger';

export const PRESENCE_LOCATION_TASK = 'driver-presence-location';

/** Android arka plan konum aralığı (backend 45 dk sessizlikte çevrimdışı sayıyor) */
const PRESENCE_INTERVAL_MS = 30 * 60 * 1000;
/** Konum görevi: son ping'ten bu kadar geçmeden tekrar gönderme (30 dk aralığa pay) */
export const TASK_MIN_GAP_MS = 25 * 60 * 1000;
/** Sessiz bildirim: backend zaten konumu bayat sürücüye yolluyor; sadece art arda gelirse kısıt */
const PUSH_MIN_GAP_MS = 2 * 60 * 1000;
/** Bildirimde bundan taze bilinen konum yeniden ölçülmez */
const PUSH_POSITION_MAX_AGE_MS = 10 * 60 * 1000;
/** iOS sessiz bildirimde ~30 sn tanır; ölçüm bundan kısa tutulur */
const PUSH_POSITION_TIMEOUT_MS = 15 * 1000;

const PRESENCE_ENABLED_KEY = 'driver-presence-enabled';
/** useActiveJobStore persist anahtarı (aktif işte konum iş kanalından gider) */
const ACTIVE_JOB_KEY = 'active-job-storage';

const TASK_OPTIONS: Location.LocationTaskOptions = {
  // Android: dengeli güç (Wi-Fi/baz); iOS: ~1 km, GPS kullanılmaz
  accuracy: Location.Accuracy.Low,
  // Android: ~30 dk'da bir; iOS bu ayarı yok sayar
  timeInterval: PRESENCE_INTERVAL_MS,
  // iOS: ~1 km hareket edince; Android: mesafeden bağımsız, zamana bağlı
  distanceInterval: Platform.OS === 'ios' ? 1000 : 0,
  // iOS: durunca normal güncelleme durur, önemli konum değişikliği izlemesi sürer
  pausesUpdatesAutomatically: true,
  activityType: Location.ActivityType.AutomotiveNavigation,
  showsBackgroundLocationIndicator: false,
  // foregroundService verilmez: Android'de kalıcı bildirim olmaz
};

let startInFlight: Promise<void> | null = null;

/**
 * Çevrimiçi ve giriş yapılmışken çağrılır (idempotent). Arka plan konum izni yoksa başlamaz;
 * izin sonradan verilirse bir sonraki çağrıda (ön plana geliş) başlar.
 */
export function startPresence(): Promise<void> {
  if (startInFlight) return startInFlight;
  startInFlight = (async () => {
    try {
      const [fg, bg] = await Promise.all([
        Location.getForegroundPermissionsAsync(),
        Location.getBackgroundPermissionsAsync(),
      ]);
      if (fg.status !== 'granted' || bg.status !== 'granted') return;

      await AsyncStorage.setItem(PRESENCE_ENABLED_KEY, '1');
      if (await Location.hasStartedLocationUpdatesAsync(PRESENCE_LOCATION_TASK)) return;
      await Location.startLocationUpdatesAsync(PRESENCE_LOCATION_TASK, TASK_OPTIONS);
      logger.debug('location', 'presence.start success');
    } catch (error: any) {
      logger.warn('location', 'presence.start failure', { message: error?.message });
    } finally {
      startInFlight = null;
    }
  })();
  return startInFlight;
}

/** Çevrimdışı olunca / çıkışta. */
export async function stopPresence(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PRESENCE_ENABLED_KEY);
    if (await Location.hasStartedLocationUpdatesAsync(PRESENCE_LOCATION_TASK)) {
      await Location.stopLocationUpdatesAsync(PRESENCE_LOCATION_TASK);
      logger.debug('location', 'presence.stop success');
    }
  } catch (error: any) {
    logger.warn('location', 'presence.stop failure', { message: error?.message });
  }
}

export type BackgroundPingResult = 'sent' | 'skipped' | 'disabled' | 'failed';

/**
 * Arka planda (headless) konum bildirir. Çevrimiçi bayrağı yoksa 'disabled', aktif iş varsa
 * ya da son ping'ten minGapMs geçmediyse 'skipped' döner. Deneme zamanı gönderimden önce
 * yazılır: hata durumunda da (ör. ağ yok) bir sonraki tura kadar beklenir, istek yağmuru olmaz.
 */
export async function pingFromBackground(
  coords: { latitude: number; longitude: number; accuracy?: number | null },
  minGapMs: number,
): Promise<BackgroundPingResult> {
  try {
    const entries = Object.fromEntries(
      await AsyncStorage.multiGet([PRESENCE_ENABLED_KEY, ACTIVE_JOB_KEY, LAST_PING_AT_KEY]),
    );
    if (entries[PRESENCE_ENABLED_KEY] !== '1') return 'disabled';

    const activeJob = entries[ACTIVE_JOB_KEY] ? JSON.parse(entries[ACTIVE_JOB_KEY] as string) : null;
    if (activeJob?.state?.trackingToken) return 'skipped';

    const lastPingAt = Number(entries[LAST_PING_AT_KEY]) || 0;
    if (Date.now() - lastPingAt < minGapMs) return 'skipped';

    await AsyncStorage.setItem(LAST_PING_AT_KEY, String(Date.now()));
    await locationAPI.appPing(coords.latitude, coords.longitude, 'background', coords.accuracy ?? undefined);
    return 'sent';
  } catch (error: any) {
    // 401 (çıkış), 403 (sürücü değil), 429, ağ: sessizce sonraki tur
    logger.debug('location', 'presence.ping failed', { status: error?.response?.status });
    return 'failed';
  }
}

async function readPushPosition(): Promise<Location.LocationObject | null> {
  const lastKnown = await Location.getLastKnownPositionAsync({ maxAge: PUSH_POSITION_MAX_AGE_MS }).catch(
    () => null,
  );
  if (lastKnown) return lastKnown;

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), PUSH_POSITION_TIMEOUT_MS);
  });
  const current = await Promise.race([
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).catch(() => null),
    timeout,
  ]);
  clearTimeout(timer);
  return current;
}

/**
 * Backend'in sessiz bildirimi (data-only, type: location_request) arka planda geldiğinde.
 * Konumu bayatlayan çevrimiçi sürücüyü (özellikle hareketsiz iOS) uyandırıp konum aldırır.
 */
export async function handleLocationRequestPush(): Promise<void> {
  try {
    const { status } = await Location.getBackgroundPermissionsAsync();
    if (status !== 'granted') return;
    const position = await readPushPosition();
    if (!position) return;
    await pingFromBackground(position.coords, PUSH_MIN_GAP_MS);
  } catch (error: any) {
    logger.debug('location', 'presence.push failed', { message: error?.message });
  }
}

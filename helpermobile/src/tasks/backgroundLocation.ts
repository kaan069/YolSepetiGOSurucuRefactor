/**
 * ARKA PLAN KONUM TASK TANIMI
 *
 * Akis:
 * 1. WebSocket bagliysa → direkt gonder (hizli yol)
 * 2. WebSocket bagli degilse → HTTP fallback ile gonder
 * 3. HTTP de basarisizsa → local queue'ya ekle (sonra toplu gonderilir)
 * 4. Aktif is yoksa → task'i durdur
 */
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { locationWebSocket } from '../services/locationWebSocket';
import axiosInstance from '../api/axiosConfig';

export const BACKGROUND_LOCATION_TASK = 'background-location-task';

const RECONNECT_FAIL_KEY = 'bg-location-reconnect-fails';
const LOCATION_QUEUE_KEY = 'bg-location-queue';
const MAX_RECONNECT_FAILS = 10;
const MAX_QUEUE_SIZE = 50;

// HTTP fallback ile konum gonder
async function sendLocationHTTP(trackingToken: string, latitude: number, longitude: number): Promise<boolean> {
  try {
    await axiosInstance.post(`/vehicles/location/${trackingToken}/http-update/`, {
      latitude,
      longitude,
    });
    return true;
  } catch (err) {
    console.warn('⚠️ [BackgroundLocation] HTTP fallback basarisiz');
    return false;
  }
}

// Queue'ya konum ekle
async function addToQueue(latitude: number, longitude: number): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(LOCATION_QUEUE_KEY);
    const queue: Array<{ latitude: number; longitude: number; timestamp: string }> = raw ? JSON.parse(raw) : [];

    queue.push({ latitude, longitude, timestamp: new Date().toISOString() });

    // Max boyutu asarsa en eskileri at
    while (queue.length > MAX_QUEUE_SIZE) queue.shift();

    await AsyncStorage.setItem(LOCATION_QUEUE_KEY, JSON.stringify(queue));
  } catch {}
}

// Queue'yu toplu HTTP ile gonder
export async function flushLocationQueue(trackingToken: string): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(LOCATION_QUEUE_KEY);
    const queue = raw ? JSON.parse(raw) : [];
    if (queue.length === 0) return;

    console.log(`📤 [BackgroundLocation] Queue flush: ${queue.length} konum gonderiliyor...`);
    await axiosInstance.post(`/vehicles/location/${trackingToken}/http-update/`, {
      locations: queue,
    });

    await AsyncStorage.removeItem(LOCATION_QUEUE_KEY);
    console.log(`✅ [BackgroundLocation] Queue flush basarili: ${queue.length} konum gonderildi`);
  } catch (err) {
    console.warn('⚠️ [BackgroundLocation] Queue flush basarisiz, sonra tekrar denenecek');
  }
}

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error('❌ [BackgroundLocation] Task hatasi:', error.message);
    return;
  }

  if (!data) return;

  const { locations } = data as {
    locations: Array<{ coords: { latitude: number; longitude: number } }>;
  };

  if (!locations || locations.length === 0) return;

  const latestLocation = locations[locations.length - 1];
  const { latitude, longitude } = latestLocation.coords;

  // 1. WebSocket bagliysa direkt gonder (hizli yol)
  if (locationWebSocket.isConnected()) {
    await AsyncStorage.removeItem(RECONNECT_FAIL_KEY).catch(() => {});
    locationWebSocket.sendLocation({ latitude, longitude });
    return;
  }

  // 2. WebSocket bagli degil - aktif is bilgisini oku
  try {
    const activeJobData = await AsyncStorage.getItem('active-job-storage');
    const parsed = activeJobData ? JSON.parse(activeJobData) : null;
    const trackingToken = parsed?.state?.trackingToken;

    if (!trackingToken) {
      console.log('🔴 [BackgroundLocation] Aktif is yok, task durduruluyor...');
      await AsyncStorage.removeItem(RECONNECT_FAIL_KEY).catch(() => {});
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      return;
    }

    // Reconnect fail sayisini kontrol et
    const failCountStr = await AsyncStorage.getItem(RECONNECT_FAIL_KEY);
    const failCount = failCountStr ? parseInt(failCountStr) : 0;

    if (failCount >= MAX_RECONNECT_FAILS) {
      console.log(`🔴 [BackgroundLocation] ${MAX_RECONNECT_FAILS} basarisiz deneme, task durduruluyor...`);
      await AsyncStorage.removeItem(RECONNECT_FAIL_KEY).catch(() => {});
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      return;
    }

    // 3. Once HTTP fallback dene (WebSocket reconnect'ten daha hizli ve guvenilir)
    const httpSuccess = await sendLocationHTTP(trackingToken, latitude, longitude);

    if (httpSuccess) {
      console.log('✅ [BackgroundLocation] HTTP fallback ile konum gonderildi');
      // HTTP basarili - fail counter'i sifirla
      await AsyncStorage.removeItem(RECONNECT_FAIL_KEY).catch(() => {});
      return;
    }

    // 4. HTTP de basarisiz - WebSocket reconnect dene
    console.log('🔄 [BackgroundLocation] WebSocket reconnect deneniyor...');
    const reconnected = await new Promise<boolean>((resolve) => {
      const timeout = setTimeout(() => {
        resolve(false);
      }, 5000);

      locationWebSocket.connect({
        trackingToken,
        onConnected: () => {
          clearTimeout(timeout);
          locationWebSocket.sendLocation({ latitude, longitude });
          resolve(true);
        },
        onError: () => {
          clearTimeout(timeout);
          resolve(false);
        },
      });
    });

    if (reconnected) {
      await AsyncStorage.removeItem(RECONNECT_FAIL_KEY).catch(() => {});
      console.log('✅ [BackgroundLocation] Reconnect basarili, konum gonderildi');
    } else {
      // 5. Her sey basarisiz - queue'ya ekle
      await AsyncStorage.setItem(RECONNECT_FAIL_KEY, String(failCount + 1)).catch(() => {});
      await addToQueue(latitude, longitude);
      console.log('📦 [BackgroundLocation] Konum queue\'ya eklendi (sonra gonderilecek)');
    }
  } catch (err) {
    console.error('❌ [BackgroundLocation] Task hatasi:', err);
    await addToQueue(latitude, longitude);
  }
});

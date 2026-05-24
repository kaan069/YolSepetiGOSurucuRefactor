/**
 * ARKA PLAN KONUM TASK TANIMI
 *
 * Akis:
 * 1. WebSocket bagliysa → direkt gonder (hizli yol — foreground / Android bg)
 * 2. WebSocket bagli degilse → HTTP fallback ile gonder
 *    - HTTP basariliysa → bekleyen queue'yu da flush et
 * 3. HTTP de basarisizsa → local queue'ya ekle (sonra flush edilir)
 * 4. Aktif is yoksa → task'i durdur
 *
 * NOT: bg task'tan WebSocket reconnect denemiyoruz — headless context'te
 * acilan ws baglantisi task callback return olunca OS tarafindan kapatilir.
 * Reconnect mantigi locationWebSocket servisi + useLocationWebSocket hook'unda.
 */
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { locationWebSocket } from '../services/locationWebSocket';
import axiosInstance from '../api/axiosConfig';
import { logger } from '../utils/logger';

export const BACKGROUND_LOCATION_TASK = 'background-location-task';

const LOCATION_QUEUE_KEY = 'bg-location-queue';
const MAX_QUEUE_SIZE = 200;

// HTTP fallback ile konum gonder
async function sendLocationHTTP(trackingToken: string, latitude: number, longitude: number): Promise<boolean> {
  try {
    await axiosInstance.post(`/vehicles/location/${trackingToken}/http-update/`, {
      latitude,
      longitude,
    });
    return true;
  } catch (err) {
    logger.warn('location', 'backgroundLocation.httpFallback failed');
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

    await axiosInstance.post(`/vehicles/location/${trackingToken}/http-update/`, {
      locations: queue,
    });

    await AsyncStorage.removeItem(LOCATION_QUEUE_KEY);
    logger.debug('location', 'backgroundLocation.queueFlush success', { count: queue.length });
  } catch (err) {
    logger.warn('location', 'backgroundLocation.queueFlush failed');
  }
}

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    logger.error('location', 'backgroundLocation.task error', { message: error.message });
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
    locationWebSocket.sendLocation({ latitude, longitude });
    return;
  }

  // 2. WebSocket bagli degil - aktif is bilgisini oku
  try {
    const activeJobData = await AsyncStorage.getItem('active-job-storage');
    const parsed = activeJobData ? JSON.parse(activeJobData) : null;
    const trackingToken = parsed?.state?.trackingToken;

    if (!trackingToken) {
      logger.debug('location', 'backgroundLocation.task - no active job, stopping');
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      return;
    }

    // 3. HTTP fallback dene
    const httpSuccess = await sendLocationHTTP(trackingToken, latitude, longitude);

    if (httpSuccess) {
      logger.debug('location', 'backgroundLocation.task - http fallback ok');
      // Birikmis queue varsa flush et
      await flushLocationQueue(trackingToken);
      return;
    }

    // 4. HTTP basarisiz - queue'ya ekle
    await addToQueue(latitude, longitude);
    logger.debug('location', 'backgroundLocation.task - queued for later');
  } catch (err) {
    logger.error('location', 'backgroundLocation.task failure');
    await addToQueue(latitude, longitude);
  }
});

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
 * HTTP fallback hata kodlari:
 * - 404: tracking_token yok / gecersiz → is unutulmali
 * - 410: is completed/cancelled → is unutulmali
 * Bu iki durumda queue + activeJob store + bg task tamamen temizlenir
 * (sonsuz retry + batarya kaybi onlemek icin).
 *
 * NOT: bg task'tan WebSocket reconnect denemiyoruz — headless context'te
 * acilan ws baglantisi task callback return olunca OS tarafindan kapatilir.
 * Reconnect mantigi locationWebSocket servisi + useLocationWebSocket hook'unda.
 */
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { locationWebSocket } from '../services/locationWebSocket';
import { backgroundLocationService } from '../services/backgroundLocationService';
import { useActiveJobStore } from '../store/useActiveJobStore';
import axiosInstance from '../api/axiosConfig';
import { logger } from '../utils/logger';

export const BACKGROUND_LOCATION_TASK = 'background-location-task';

const LOCATION_QUEUE_KEY = 'bg-location-queue';
const MAX_QUEUE_SIZE = 200;

type HttpResult = 'success' | 'job_closed' | 'retry';

// Aktif is kapandi (404/410) — queue + store + bg task tamamen temizle
async function handleJobClosed(httpStatus: number): Promise<void> {
  try {
    await AsyncStorage.removeItem(LOCATION_QUEUE_KEY);
  } catch {}
  try {
    useActiveJobStore.getState().clearActiveJob();
  } catch {}
  try {
    await backgroundLocationService.forceStop();
  } catch {}
  logger.info('location', `backgroundLocation.jobClosed HTTP ${httpStatus} - tracking durduruldu, queue temizlendi`);
}

// HTTP fallback ile konum gonder (tekli)
async function sendLocationHTTP(trackingToken: string, latitude: number, longitude: number): Promise<HttpResult> {
  try {
    await axiosInstance.post(`/vehicles/location/${trackingToken}/http-update/`, {
      latitude,
      longitude,
    });
    return 'success';
  } catch (err: any) {
    const status = err?.response?.status;
    if (status === 404 || status === 410) {
      await handleJobClosed(status);
      return 'job_closed';
    }
    logger.warn('location', `backgroundLocation.httpFallback failed status=${status ?? 'network'}`);
    return 'retry';
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
  } catch (err: any) {
    const status = err?.response?.status;
    if (status === 404 || status === 410) {
      await handleJobClosed(status);
      return;
    }
    logger.warn('location', `backgroundLocation.queueFlush failed status=${status ?? 'network'}`);
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
    const result = await sendLocationHTTP(trackingToken, latitude, longitude);

    if (result === 'success') {
      logger.debug('location', 'backgroundLocation.task - http fallback ok');
      // Birikmis queue varsa flush et
      await flushLocationQueue(trackingToken);
      return;
    }

    if (result === 'job_closed') {
      // handleJobClosed icinde her sey temizlendi, queue'ya ekleme yok
      return;
    }

    // 4. HTTP retry-able hata - queue'ya ekle
    await addToQueue(latitude, longitude);
    logger.debug('location', 'backgroundLocation.task - queued for later');
  } catch (err) {
    logger.error('location', 'backgroundLocation.task failure');
    await addToQueue(latitude, longitude);
  }
});

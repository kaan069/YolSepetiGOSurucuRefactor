/**
 * ÇEVRİMİÇİ SÜRÜCÜ KONUM TASK TANIMI
 *
 * Sürücü çevrimiçiyken düşük güçlü konum güncellemeleri buraya düşer (aktif iş
 * görevinden ayrı; bkz. services/presenceLocation). Uygulama kapalıyken de headless
 * çalışabilir. Çevrimiçi bayrağı yoksa (çevrimdışı / çıkış) görev kendini durdurur.
 */
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { PRESENCE_LOCATION_TASK, TASK_MIN_GAP_MS, pingFromBackground } from '../services/presenceLocation';
import { logger } from '../utils/logger';

TaskManager.defineTask(PRESENCE_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    logger.debug('location', 'presence.task error', { message: error.message });
    return;
  }

  const locations = (data as { locations?: Location.LocationObject[] } | undefined)?.locations;
  const latest = locations?.[locations.length - 1];
  if (!latest) return;

  const result = await pingFromBackground(latest.coords, TASK_MIN_GAP_MS);
  if (result === 'disabled') {
    // Yetim görev (çevrimdışı / çıkış sonrası kalan): durdur
    await Location.stopLocationUpdatesAsync(PRESENCE_LOCATION_TASK).catch(() => {});
  }
});

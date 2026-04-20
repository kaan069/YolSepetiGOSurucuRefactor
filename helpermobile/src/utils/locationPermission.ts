/**
 * Merkezi Konum İzni Yöneticisi
 *
 * ExpoLocation native tarafında race condition (EXC_BAD_ACCESS) oluşmaması için
 * tüm konum izni istekleri bu modül üzerinden yapılmalıdır.
 * Aynı anda birden fazla requestPermission çağrısı yapılmasını engeller.
 */
import * as Location from 'expo-location';
import { logger } from './logger';

let permissionPromise: Promise<boolean> | null = null;

/**
 * Foreground + Background konum izni iste (singleton mutex)
 * Aynı anda sadece bir izin isteği çalışır, diğerleri aynı promise'i bekler
 */
export async function requestLocationPermissions(): Promise<boolean> {
  if (permissionPromise) return permissionPromise;

  permissionPromise = (async () => {
    try {
      const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
      if (fgStatus !== 'granted') {
        logger.warn('location', 'locationPermission.foreground denied');
        return false;
      }

      const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
      if (bgStatus !== 'granted') {
        logger.warn('location', 'locationPermission.background denied');
      }

      return true;
    } catch (error) {
      logger.error('location', 'locationPermission.request failure');
      return false;
    } finally {
      permissionPromise = null;
    }
  })();

  return permissionPromise;
}

/**
 * Foreground izni kontrol et, yoksa iste
 * Ekranlarda konum almadan önce kullanılır
 */
export async function ensureForegroundPermission(): Promise<boolean> {
  const { status } = await Location.getForegroundPermissionsAsync();
  if (status === 'granted') return true;
  return requestLocationPermissions();
}

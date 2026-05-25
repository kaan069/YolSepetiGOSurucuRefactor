/**
 * ARKA PLAN KONUM SERVİSİ
 *
 * Background location updates başlatma/durdurma işlemlerini yönetir
 * Ref-counting ile birden fazla WebSocket instance'ı destekler
 * (aktif iş + nakliye aynı anda çalışabilir)
 *
 * Kullanım:
 * - useLocationWebSocket connect olunca: requestStart()
 * - useLocationWebSocket disconnect olunca: requestStop()
 * - Logout: forceStop()
 */
import * as Location from 'expo-location';
import { BACKGROUND_LOCATION_TASK } from '../tasks/backgroundLocation';
import { logger } from '../utils/logger';

class BackgroundLocationService {
  private activeConsumerCount = 0;

  /**
   * Bir consumer (WebSocket instance) arka plan konum paylaşımı istiyor
   * İlk consumer'da başlatır, sonrakilerde sadece sayacı artırır
   */
  async requestStart(): Promise<void> {
    this.activeConsumerCount++;
    logger.debug('location', 'background.requestStart', { consumers: this.activeConsumerCount });

    if (this.activeConsumerCount > 1) {
      return;
    }

    await this.startBackgroundLocation();
  }

  /**
   * Bir consumer artık arka plan konumuna ihtiyaç duymuyor
   * Son consumer çıkarsa durdurur
   */
  async requestStop(): Promise<void> {
    this.activeConsumerCount = Math.max(0, this.activeConsumerCount - 1);
    logger.debug('location', 'background.requestStop', { consumers: this.activeConsumerCount });

    if (this.activeConsumerCount > 0) {
      return;
    }

    await this.stopBackgroundLocation();
  }

  /**
   * Uygulama başlatıldığında önceki oturumdan kalan orphaned task'i temizle
   * Consumer count sıfır (yeni başlatma) ama eski task hala çalışıyor olabilir
   */
  async cleanupOrphanedTask(): Promise<void> {
    try {
      const isStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      if (isStarted && this.activeConsumerCount === 0) {
        logger.debug('location', 'background.cleanupOrphanedTask - cleaning');
        await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      }
    } catch (error) {
      logger.error('location', 'background.cleanupOrphanedTask failure');
    }
  }

  /**
   * Zorla durdur (logout gibi durumlar için)
   */
  async forceStop(): Promise<void> {
    logger.debug('location', 'background.forceStop');
    this.activeConsumerCount = 0;
    await this.stopBackgroundLocation();
  }

  /**
   * Arka plan konum güncelleme task'ini başlatır
   */
  private async startBackgroundLocation(): Promise<void> {
    try {
      // Zaten çalışıyor mu kontrol et
      const isStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      if (isStarted) {
        return;
      }

      // Background permission kontrolü
      const { status } = await Location.getBackgroundPermissionsAsync();
      if (status !== 'granted') {
        logger.warn('location', 'background.start skipped - permission not granted');
        return;
      }

      await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
        accuracy: Location.Accuracy.BestForNavigation,
        distanceInterval: 10,
        deferredUpdatesInterval: 5000,
        showsBackgroundLocationIndicator: true,
        pausesUpdatesAutomatically: false,
        activityType: Location.ActivityType.AutomotiveNavigation,
        foregroundService: {
          notificationTitle: 'Yol SepetiGo - Konum Paylaşılıyor',
          notificationBody: 'Konumunuz müşteri ile paylaşılmaktadır',
          notificationColor: '#FF6B00',
          killServiceOnDestroy: false,
        },
      });

      logger.debug('location', 'background.start success');
    } catch (error) {
      logger.error('location', 'background.start failure');
    }
  }

  /**
   * Arka plan konum güncelleme task'ini durdurur
   */
  private async stopBackgroundLocation(): Promise<void> {
    try {
      const isStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      if (!isStarted) {
        return;
      }

      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      logger.debug('location', 'background.stop success');
    } catch (error) {
      logger.error('location', 'background.stop failure');
    }
  }
}

export const backgroundLocationService = new BackgroundLocationService();

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

class BackgroundLocationService {
  private activeConsumerCount = 0;

  /**
   * Bir consumer (WebSocket instance) arka plan konum paylaşımı istiyor
   * İlk consumer'da başlatır, sonrakilerde sadece sayacı artırır
   */
  async requestStart(): Promise<void> {
    this.activeConsumerCount++;
    console.log(`📍 [BackgroundLocation] requestStart - consumer: ${this.activeConsumerCount}`);

    if (this.activeConsumerCount > 1) {
      console.log('📍 [BackgroundLocation] Zaten çalışıyor, sadece consumer eklendi');
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
    console.log(`📍 [BackgroundLocation] requestStop - consumer: ${this.activeConsumerCount}`);

    if (this.activeConsumerCount > 0) {
      console.log('📍 [BackgroundLocation] Hala aktif consumer var, durdurmuyorum');
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
        console.log('🧹 [BackgroundLocation] Orphaned task bulundu, temizleniyor...');
        await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
        console.log('✅ [BackgroundLocation] Orphaned task temizlendi');
      }
    } catch (error) {
      console.error('❌ [BackgroundLocation] Orphaned task temizleme hatası:', error);
    }
  }

  /**
   * Zorla durdur (logout gibi durumlar için)
   */
  async forceStop(): Promise<void> {
    console.log('📍 [BackgroundLocation] forceStop çağrıldı');
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
        console.log('📍 [BackgroundLocation] Task zaten çalışıyor');
        return;
      }

      // Background permission kontrolü
      const { status } = await Location.getBackgroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('⚠️ [BackgroundLocation] Background konum izni yok, task başlatılamadı');
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

      console.log('✅ [BackgroundLocation] Arka plan konum takibi başlatıldı');
    } catch (error) {
      console.error('❌ [BackgroundLocation] Başlatma hatası:', error);
    }
  }

  /**
   * Arka plan konum güncelleme task'ini durdurur
   */
  private async stopBackgroundLocation(): Promise<void> {
    try {
      const isStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      if (!isStarted) {
        console.log('📍 [BackgroundLocation] Task zaten durmuş');
        return;
      }

      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      console.log('✅ [BackgroundLocation] Arka plan konum takibi durduruldu');
    } catch (error) {
      console.error('❌ [BackgroundLocation] Durdurma hatası:', error);
    }
  }
}

export const backgroundLocationService = new BackgroundLocationService();
